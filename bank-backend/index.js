const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to read JSON data from the frontend

// Route 1: Get Account Details (The "Read" Function)
app.get('/api/accounts/:id', async (req, res) => {
    try {
        const accountId = req.params.id;
        const [rows] = await pool.query(
            'SELECT a.account_id, a.balance, u.full_name FROM Accounts a JOIN Users u ON a.user_id = u.user_id WHERE a.account_id = ?', 
            [accountId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Route 2: Execute a Transfer (The "Write" Function)
app.post('/api/transfer', async (req, res) => {
    try {
        const { fromAccount, toAccount, amount } = req.body;

        // Call the ACID-compliant Stored Procedure created in MySQL Workbench
        await pool.query('CALL ExecuteTransfer(?, ?, ?)', [fromAccount, toAccount, amount]);
        
        res.json({ message: 'Transfer completed successfully' });
    } catch (error) {
        console.error('Transaction Error:', error.message);
        res.status(400).json({ error: 'Transfer failed or insufficient funds' });
    }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Bank Teller (Server) is running on port ${PORT}`);
});