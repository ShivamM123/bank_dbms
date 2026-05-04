CREATE DATABASE IF NOT EXISTS bank_db;
USE bank_db;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_type ENUM('Savings', 'Checking', 'Business') NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Active', 'Suspended', 'Closed') DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    from_account INT, 
    to_account INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Completed', 'Failed', 'Rolled_Back') DEFAULT 'Completed',
    FOREIGN KEY (from_account) REFERENCES Accounts(account_id) ON DELETE RESTRICT,
    FOREIGN KEY (to_account) REFERENCES Accounts(account_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- B-Tree Index
CREATE INDEX idx_user_accounts ON Accounts(user_id);

CREATE INDEX idx_account_history ON Transactions(from_account, transaction_date);

INSERT INTO Users (full_name, email) VALUES 
('Alice Smith', 'alice.smith@example.com'),
('Bob Jones', 'bob.jones@example.com'),
('System Bank', 'admin@bank.com');

INSERT INTO Accounts (user_id, account_type, balance) VALUES 
(1, 'Savings', 5000.00),  -- Alice's Account: ID 1
(2, 'Checking', 1500.00), -- Bob's Account: ID 2
(3, 'Business', 999999.00); -- System Account: ID 3

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
    DECLARE current_balance DECIMAL(15, 2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO Transactions (from_account, to_account, amount, status) 
        VALUES (p_from_account, p_to_account, p_amount, 'Failed');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction failed and rolled back.';
    END;

    START TRANSACTION;
    
    IF p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Exploit Blocked: Transfer amount must be greater than zero.';
    END IF;

    IF p_from_account = p_to_account THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Logic Error: Cannot transfer funds to the same account.';
    END IF;
    

    SELECT balance INTO current_balance 
    FROM Accounts 
    WHERE account_id = p_from_account FOR UPDATE;

    IF current_balance < p_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient funds.';
    END IF;

    UPDATE Accounts SET balance = balance - p_amount WHERE account_id = p_from_account;
    UPDATE Accounts SET balance = balance + p_amount WHERE account_id = p_to_account;
    
    INSERT INTO Transactions (from_account, to_account, amount, status) 
    VALUES (p_from_account, p_to_account, p_amount, 'Completed');

    COMMIT;
END //

DELIMITER ;