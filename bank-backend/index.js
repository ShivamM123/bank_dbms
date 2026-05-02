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

// ==========================================
// 💥 RECOVERY LAB ROUTES (DOCKER CONTROL)
// ==========================================

// Start the slow transaction (Requires Docker DB on port 3307)
app.post('/api/crash-lab/start-transfer', async (req, res) => {
    try {
        const connection = await require('mysql2/promise').createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: 'password', // Hardcoded for the Docker container
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

// ==========================================
// 🚦 CONCURRENCY LAB ROUTES
// ==========================================

// Transaction A: The Saboteur (Creates a Dirty state for 5 seconds)
app.post('/api/concurrency/tx-a', async (req, res) => {
    const connection = await pool.getConnection(); // Grab a dedicated line
    try {
        await connection.query('START TRANSACTION');
        // Deduct $1000 from Alice (Account 1)
        await connection.query('UPDATE Accounts SET balance = balance - 1000 WHERE account_id = 1');

        // Hold the dirty state in RAM for 5 seconds, then intentionally FAIL and rollback
        setTimeout(async () => {
            await connection.query('ROLLBACK');
            connection.release();
            console.log("Tx A: Rolled back dirty data.");
        }, 5000);

        res.json({ message: 'Tx A Started. Deducted $1000. Holding uncommitted state for 5s...' });
    } catch (error) {
        connection.release();
        res.status(500).json({ error: 'Tx A failed' });
    }
});

// Transaction B: The Reader
app.get('/api/concurrency/tx-b', async (req, res) => {
    const { isolation } = req.query; // e.g., 'READ UNCOMMITTED' or 'READ COMMITTED'
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