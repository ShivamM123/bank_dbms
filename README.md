# 🚀 ACID Core Engine & MVCC Concurrency Simulator

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL_InnoDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Infra-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## 📌 Project Overview
The **ACID Banking Simulation Engine** is not just a standard CRUD application; it is an educational tool designed to visualize and test the deep mechanics of Relational Database Management Systems. Built with a Node.js/Express backend and a React dashboard, this system acts as a sandbox to interact with a highly structured, BCNF-normalized MySQL 8.0 (InnoDB) database.

### 🎓 Academic Context
**Developers:** -Shivam Mishra (Roll No: IIT2024215)  
                -Ayush Anand (Roll No: IIT2024246)
                -Neel Ghule (Roll No: IIT2024267)
                -Adabala Sridhar (Roll No: IIT2024218)
                -Anjan Shivareddy (Roll No: IIT2024   )
**Program:** Information Technology  
**Institution:** Indian Institute of Information Technology, Allahabad (IIITA)

---

## ✨ Core Features & Lab Modules

### 1. 🛡️ The ACID Vault (Core Banking)
- **Atomicity & Consistency:** Utilizes MySQL **Stored Procedures** with custom exception handlers to guarantee that multi-step financial transfers either succeed entirely or roll back cleanly.
- **Isolation & Durability:** Strictly enforced via the InnoDB engine.

### 2. 🚦 Concurrency Lab (Isolation Levels)
A dedicated UI module to simulate multiple users accessing the same account simultaneously. It visualizes the anomalies prevented by MySQL's four Transaction Isolation Levels:
- **Read Uncommitted:** Visualizes Dirty Reads.
- **Read Committed:** Demonstrates prevention of Dirty Reads, but allows Non-Repeatable Reads.
- **Repeatable Read (Default):** Prevents Non-Repeatable Reads; uses Next-Key locks to minimize Phantom Reads.
- **Serializable:** Enforces strict sequential execution.

### 3. 💥 Crash Recovery Lab
- Simulates sudden server death mid-transaction using **Docker**.
- Proves InnoDB's **Redo Log** capabilities by recovering partially written data and strictly applying the Write-Ahead Logging (WAL) protocol upon container restart.

### 4. ⚡ Query Optimization Lab
- Demonstrates the performance disparity between full table scans and optimized queries.
- Utilizes **B-Tree & Composite Indexing** on transaction audit trails.
- Visualizes execution plans using `EXPLAIN ANALYZE` on a seeded dataset of 100,000+ records.

---

## ⚙️ Architecture & Defensive Engineering

This system was built with enterprise-grade safeguards:
* **Idempotent Initialization:** Docker SQL scripts utilize `DROP IF EXISTS` patterns, ensuring seamless, crash-free container reboots.
* **Connection Leak Prevention:** Backend `setTimeout` concurrency simulators are wrapped in strict `try/finally` blocks, guaranteeing `connection.release()` and preventing connection pool exhaustion.
* **Temporal State Enforcement:** Frontend UI rigorously locks transaction execution buttons during active concurrency windows, mathematically preventing "missed window" illusion reads.

---

## 🛠️ Installation & Setup

Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Node.js](https://nodejs.org/) installed on your machine.

### 1. Boot the Database
Navigate to the root directory and spin up the MySQL container:
```bash
docker-compose up -d
```

### 2. Database Schema Initialization
Open MySQL Workbench, connect to the container's port (3307), and run the initialization script:
```sql
-- Navigate to 'database' folder in your file explorer
-- Open init_schema.sql and execute all scripts.
```

### 3. Backend Setup
Open a new terminal, navigate to the backend, and install dependencies:
```bash
cd bank-backend
npm install
node index.js

# Configure environment variables
Create a .env file in bank-backend with:
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_chosen_password
DB_NAME=bank_db
PORT=5000

# Start the server
npm start
```

### 4. Frontend Setup
Open another terminal, navigate to the frontend, and start the dashboard:
```bash
cd bank-frontend
npm install
npm run dev

📖 Key SQL Concepts Demonstrated
START TRANSACTION, COMMIT, ROLLBACK

SELECT ... FOR UPDATE (Row-level locking)

SET TRANSACTION ISOLATION LEVEL

EXPLAIN ANALYZE

Trigger and Stored Procedure creation (DELIMITER)

Foreign Key Constraints (ON DELETE RESTRICT)