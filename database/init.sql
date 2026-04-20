-- 1. Initialize the Database
CREATE DATABASE IF NOT EXISTS bank_db;
USE bank_db;

-- 2. Create Users Table (The Identity Vault)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Create Accounts Table (The Ledger)
CREATE TABLE Accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_type ENUM('Savings', 'Checking', 'Business') NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Active', 'Suspended', 'Closed') DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Create Transactions Table (The Audit Trail)
CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    from_account INT, -- Can be NULL if it's an initial deposit from an external source
    to_account INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Completed', 'Failed', 'Rolled_Back') DEFAULT 'Completed',
    FOREIGN KEY (from_account) REFERENCES Accounts(account_id) ON DELETE RESTRICT,
    FOREIGN KEY (to_account) REFERENCES Accounts(account_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- B-Tree Index for quick account lookups by user
CREATE INDEX idx_user_accounts ON Accounts(user_id);

-- Composite Index to quickly pull a specific account's transactions ordered by time
-- This will look great when you demonstrate EXPLAIN ANALYZE later.
CREATE INDEX idx_account_history ON Transactions(from_account, transaction_date);

-- Insert Dummy Users
INSERT INTO Users (full_name, email) VALUES 
('Alice Smith', 'alice.smith@example.com'),
('Bob Jones', 'bob.jones@example.com'),
('System Bank', 'admin@bank.com');

-- Insert Dummy Accounts
INSERT INTO Accounts (user_id, account_type, balance) VALUES 
(1, 'Savings', 5000.00),  -- Alice's Account: ID 1
(2, 'Checking', 1500.00), -- Bob's Account: ID 2
(3, 'Business', 999999.00); -- System Account: ID 3

-- Insert a baseline transaction to show history
INSERT INTO Transactions (from_account, to_account, amount, status) VALUES 
(3, 1, 5000.00, 'Completed'),
(3, 2, 1500.00, 'Completed');

DELIMITER //

CREATE PROCEDURE ExecuteTransfer(
    IN p_from_account INT,
    IN p_to_account INT,
    IN p_amount DECIMAL(15, 2)
)
BEGIN
    -- Declare variables to hold current balance and handle errors
    DECLARE current_balance DECIMAL(15, 2);
    
    -- Custom error handler: If anything fails, trigger a ROLLBACK automatically
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        -- Log the failure (Optional but good for audit)
        INSERT INTO Transactions (from_account, to_account, amount, status) 
        VALUES (p_from_account, p_to_account, p_amount, 'Failed');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction failed. Rolled back.';
    END;

    -- 1. Start the ACID Transaction
    START TRANSACTION;

    -- 2. Check balance with a row-level lock (FOR UPDATE prevents concurrency issues early)
    SELECT balance INTO current_balance 
    FROM Accounts 
    WHERE account_id = p_from_account FOR UPDATE;

    -- 3. Business Logic: Ensure sufficient funds
    IF current_balance < p_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient funds';
    END IF;

    -- 4. Deduct from sender
    UPDATE Accounts 
    SET balance = balance - p_amount 
    WHERE account_id = p_from_account;

    -- 5. Add to receiver
    UPDATE Accounts 
    SET balance = balance + p_amount 
    WHERE account_id = p_to_account;

    -- 6. Record the transaction in the audit trail
    INSERT INTO Transactions (from_account, to_account, amount, status) 
    VALUES (p_from_account, p_to_account, p_amount, 'Completed');

    -- 7. Commit the transaction (Redo Log persists it here)
    COMMIT;
END //

DELIMITER ;