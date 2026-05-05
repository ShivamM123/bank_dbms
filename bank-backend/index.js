const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { exec } = require('child_process'); // REQUIRED TO CONTROL DOCKER
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route 1: Get Account Details
app.get('/api/accounts/:id', async (req, res) => {
    try {
        const accountId = req.params.id;
        const [rows] = await pool.query(
            'SELECT a.account_id, a.balance, u.full_name FROM Accounts a JOIN Users u ON a.user_id = u.user_id WHERE a.account_id = ?',
            [accountId]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Route 2: Execute a Transfer
app.post('/api/transfer', async (req, res) => {
    try {
        const { fromAccount, toAccount, amount } = req.body;
        await pool.query('CALL ExecuteTransfer(?, ?, ?)', [fromAccount, toAccount, amount]);
        res.json({ message: 'Transfer completed successfully' });
    } catch (error) {
        console.error('Transaction Error:', error.message);
        res.status(400).json({ error: 'Transfer failed or insufficient funds' });
    }
});

// RECOVERY LAB ROUTES 

// Start the slow transaction ( Docker DB on port 3307)
app.post('/api/crash-lab/start-transfer', async (req, res) => {
    try {
        const connection = await require('mysql2/promise').createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: 'password',
            database: process.env.DB_NAME || 'bank_db',
            port: 3307
        });

        await connection.query('START TRANSACTION');
        await connection.query('UPDATE Accounts SET balance = balance - 100000 WHERE account_id = 3');
        await connection.query('UPDATE Accounts SET balance = balance + 100000 WHERE account_id = 1');

        // Hold the connection open for 15 seconds
        setTimeout(async () => {
            try {
                await connection.query('COMMIT');
                await connection.end();
                console.log("Transaction committed (if not crashed).");
            } catch (err) {
                console.log("Commit failed - Server was likely killed.");
            }
        }, 15000);

        res.json({ message: 'Transaction started in RAM. Waiting 15s to commit...' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start transaction on port 3307' });
    }
});

// The Kill Switch
app.post('/api/crash-lab/kill', (req, res) => {
    exec('docker kill bank-crash-db', (error) => {
        if (error) return res.status(500).json({ error: 'Failed to kill container' });
        res.json({ message: 'DATABASE CONNECTION SEVERED. SERVER DEAD.' });
    });
});

// The Recovery Switch
app.post('/api/crash-lab/recover', (req, res) => {
    exec('docker start bank-crash-db', (error) => {
        if (error) return res.status(500).json({ error: 'Failed to start container' });
        res.json({ message: 'Database rebooted. Redo/Undo logs applied.' });
    });
});

// CONCURRENCY LAB ROUTES

// Transaction A: The Writer (Creates a Dirty state for 5 seconds)
app.post('/api/concurrency/tx-a', async (req, res) => {
    const connection = await pool.getConnection(); // Grab a dedicated line
    try {
        await connection.query('START TRANSACTION');
        // Deduct $1000 from Alice (Account 1)
        await connection.query('UPDATE Accounts SET balance = balance - 1000 WHERE account_id = 1');

        // Hold the dirty state in RAM for 5 seconds, then intentionally FAIL and rollback
        setTimeout(async () => {
            try {
                await connection.query('ROLLBACK');
                console.log("Tx A: Rolled back dirty data.");
            } catch (innerError) {
                console.error("Tx A Timeout Error:", innerError);
            } finally {

                connection.release();
            }
        }, 5000);

        res.json({ message: 'Tx A Started. Deducted $1000. Holding uncommitted state for 5s...' });
    } catch (error) {
        connection.release();
        res.status(500).json({ error: 'Tx A failed' });
    }
});

// Transaction B: The Reader
app.get('/api/concurrency/tx-b', async (req, res) => {
    const { isolation } = req.query; // dirty read
    const connection = await pool.getConnection();
    try {
        // Set the specific isolation level for this session
        await connection.query(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation}`);
        await connection.query('START TRANSACTION');

        // Attempt to read Alice's balance
        const [rows] = await connection.query('SELECT balance FROM Accounts WHERE account_id = 1');

        await connection.query('COMMIT');
        connection.release();

        res.json({ balance: rows[0].balance, isolation_used: isolation });
    } catch (error) {
        connection.release();
        res.status(500).json({ error: 'Tx B failed' });
    }
});

// PHANTOM READ & SERIALIZABLE LAB

// Phantom Tx A: The Range Auditor
app.get('/api/concurrency/phantom-tx-a', async (req, res) => {
    const { isolation } = req.query;
    const connection = await pool.getConnection();
    try {
        await connection.query(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation}`);
        await connection.query('START TRANSACTION');

        // 1. Read the number of accounts
        const [rows1] = await connection.query('SELECT COUNT(*) as total FROM Accounts');
        const count1 = rows1[0].total;

        // 2. Pause for 5 secs to give Tx B a chance to no. of rows
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 3. Read the number of accounts again
        const [rows2] = await connection.query('SELECT COUNT(*) as total FROM Accounts');
        const count2 = rows2[0].total;

        await connection.query('COMMIT');
        connection.release();

        res.json({ count1, count2, isolation_used: isolation });
    } catch (error) {
        connection.release();
        res.status(500).json({ error: 'Phantom Tx A failed' });
    }
});

// Phantom Tx B: The Phantom Inserter
app.post('/api/concurrency/phantom-tx-b', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.query('START TRANSACTION');
        // Insert a "Phantom" account into the database
        await connection.query(`INSERT INTO Accounts (user_id, account_type, balance, status) VALUES (1, 'Checking', 777, 'Active')`);
        await connection.query('COMMIT');
        connection.release();

        // Auto-cleanup: Delete the phantom row after 10 seconds so the DB stays clean
        setTimeout(async () => {
            let cleanConn;
            try {
                cleanConn = await pool.getConnection();
                await cleanConn.query(`DELETE FROM Accounts WHERE balance = 777`);
            } catch (innerError) {
                console.error("Phantom cleanup failed:", innerError);
            } finally {
                if (cleanConn) cleanConn.release(); // Securely return connection
            }
        }, 10000);

        res.json({ message: 'Phantom Row Inserted Successfully! ($777)' });
    } catch (error) {
        connection.release();
        res.status(500).json({ error: 'Tx B failed. It might have been locked!' });
    }
});

// NON-REPEATABLE READ LAB

// Repeatable Tx A: The Snapshot Reader
app.get('/api/concurrency/repeat-tx-a', async (req, res) => {
    const { isolation } = req.query;
    const connection = await pool.getConnection();
    try {
        await connection.query(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation}`);
        await connection.query('START TRANSACTION');

        // Read 1
        const [rows1] = await connection.query('SELECT balance FROM Accounts WHERE account_id = 1');
        const read1 = rows1[0].balance;

        // Pause for 5 seconds to let Tx B sneak an update in
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Read 2
        const [rows2] = await connection.query('SELECT balance FROM Accounts WHERE account_id = 1');
        const read2 = rows2[0].balance;

        await connection.query('COMMIT');
        connection.release();

        res.json({ read1, read2, isolation_used: isolation });
    } catch (error) {
        connection.release();
        res.status(500).json({ error: 'Repeatable Tx A failed' });
    }
});

// Repeatable Tx B: The Sneaky Updater
app.post('/api/concurrency/repeat-tx-b', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.query('START TRANSACTION');
        // Deduct $50 and commit IMMEDIATELY
        await connection.query('UPDATE Accounts SET balance = balance - 50 WHERE account_id = 1');
        await connection.query('COMMIT');
        connection.release();

        // Auto-cleanup: Add the $50 back after 10 seconds so the DB stays clean
        setTimeout(async () => {
            let cleanConn;
            try {
                cleanConn = await pool.getConnection();
                await cleanConn.query('UPDATE Accounts SET balance = balance + 50 WHERE account_id = 1');
            } catch (innerError) {
                console.error("Repeatable cleanup failed:", innerError);
            } finally {
                if (cleanConn) cleanConn.release(); // Securely return connection
            }
        }, 10000);

        res.json({ message: '$50 Deducted and COMMITTED!' });
    } catch (error) {
        connection.release();
        res.status(500).json({ error: 'Tx B failed' });
    }
});
// ==========================================
// 🚀 QUERY OPTIMIZATION LAB (INDEXING)
// ==========================================

// 1. Run EXPLAIN and measure actual backend execution time
app.get('/api/optimization/analyze', async (req, res) => {
    try {
        // We added a dynamic RAND() condition to defeat the RAM cache and force a heavy read
        const query = `SELECT COUNT(*) FROM Transactions WHERE status = 'Failed' AND RAND() >= 0`;

        const [explainRows] = await pool.query(`EXPLAIN ${query}`);

        const start = performance.now();
        await pool.query(query);
        const end = performance.now();

        const executionTimeMs = (end - start).toFixed(2);

        res.json({
            explain: explainRows[0],
            actualTimeMs: executionTimeMs
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze query' });
    }
});
// 2. Create the B-Tree Index
app.post('/api/optimization/add-index', async (req, res) => {
    try {
        await pool.query(`CREATE INDEX idx_status ON Transactions(status)`);
        res.json({ message: 'B-Tree Index created on Transactions(status)' });
    } catch (error) {
        // Ignore error if index already exists
        if (error.code === 'ER_DUP_KEYNAME') {
            res.json({ message: 'Index already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to create index' });
        }
    }
});

// 3. Drop the Index (Reset the lab)
app.post('/api/optimization/remove-index', async (req, res) => {
    try {
        await pool.query(`DROP INDEX idx_status ON Transactions`);
        res.json({ message: 'Index dropped. Table reverted to Full Scan mode.' });
    } catch (error) {
        res.json({ message: 'Index does not exist or already dropped.' });
    }
});
// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Bank Teller (Server) is running on port ${PORT}`);
});

// Route 4: Live RAM Monitor (Reads uncommitted data to visualize the Buffer Pool)
app.get('/api/crash-lab/monitor', async (req, res) => {
    try {
        const connection = await require('mysql2/promise').createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: 'password', // Docker password
            database: process.env.DB_NAME || 'bank_db',
            port: 3307
        });

        // This is the magic line that lets us peek at uncommitted RAM data
        await connection.query('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
        const [rows] = await connection.query('SELECT account_id, balance FROM Accounts WHERE account_id IN (1, 3)');

        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'DB Offline' });
    }
});