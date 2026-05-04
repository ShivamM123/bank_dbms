# 🚀 ACID Core Engine & MVCC Concurrency Simulator

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL_InnoDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Infra-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

An advanced, interactive Database Management System (DBMS) simulator designed to visualize and test real-time data collisions, Multi-Version Concurrency Control (MVCC), transaction atomicity, and B-Tree query optimization.

---

## 👥 Meet the Team
Developed by Information Technology students at the **Indian Institute of Information Technology, Allahabad (IIITA)**.

| Developer | Roll Number |
| :--- | :--- |
| **Shivam Mishra** | IIT2024215 |
| **Ayush Anand** | IIT2024246 |
| **Neel Ghule** | IIT2024267 |
| **Adabala Sridhar** | IIT2024218 |
| **Bendram Anjan Shiva Reddy** | IIT2024265 |
=======
### 🎓 Academic Context
**Developers:** -Shivam Mishra (Roll No: IIT2024215)  
                -Ayush Anand (Roll No: IIT2024246)
                -Neel Ghule (Roll No: IIT2024267)
                -Adabala Sridhar (Roll No: IIT2024218)
                -Bendram Anjan Shiva Reddy (Roll No: IIT2024265)
**Program:** Information Technology  
**Institution:** Indian Institute of Information Technology, Allahabad (IIITA)

---

## 📖 Project Overview

The **ACID Core Engine** is not just a banking application; it is an educational telemetry dashboard that exposes the internal mechanics of the MySQL InnoDB storage engine. 

While most academic projects stop at CRUD operations, this project forces the database into highly volatile states (race conditions, mid-transaction mutations, heavy I/O scans) and provides a visual interface to see exactly how the engine resolves these anomalies using isolation tiers and structural optimizations.

### 🌟 Core Modules

#### 1. 🛡️ The Dashboard (Defensive Engineering)
A high-performance digital wallet that executes ACID-compliant transfers. 
* **Strict Business Logic:** Protected against infinite-money glitches (negative transfers) and self-transfer loop exploits via Database-level Stored Procedures.
* **Engine Telemetry:** Live visualization of commit rates and simulated hardware metrics.

#### 2. 🚦 The Concurrency Lab (MVCC Simulator)
A live testing environment that pits two transactions against each other to demonstrate ANSI SQL Read Anomalies and how to prevent them:
* **The Dirty Read:** Demonstrates the danger of `READ UNCOMMITTED` allowing access to volatile RAM, and how `READ COMMITTED` uses the Undo-Log for safety.
* **The Fuzzy Read:** Shows data mutating mid-transaction, and how `REPEATABLE READ` locks a consistent historical snapshot.
* **The Phantom Read:** Proves that row-level locks cannot stop `INSERT` statements, requiring the aggressive Range/Gap locks of the `SERIALIZABLE` tier.

#### 3. 💥 The Recovery Lab (Atomicity & WAL)
Demonstrates the "All-or-Nothing" principle of the ACID acronym. Simulates database crashes during mid-flight transactions to prove that the database utilizes Write-Ahead Logging (WAL) to restore data to a pristine state upon reboot.

#### 4. 🚀 The Optimization Lab (B-Tree Indexing)
An execution profiler operating on 100,000+ rows of data.
* Proves the mathematical difference between an O(N) **Full Table Scan** and an O(log N) **B-Tree Index Scan**.
* Uses Node.js `performance.now()` to measure true server latency.
* Parses and displays the MySQL engine's internal `EXPLAIN` execution strategy to the user.

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

# Access the application at http://localhost:5173
```

---

## 📚 Key SQL Concepts Demonstrated
* `START TRANSACTION`, `COMMIT`, `ROLLBACK`
* Pessimistic Locking: `SELECT ... FOR UPDATE`
* **MVCC Internals**: Read View Management, Undo-Log Reconstruction, and Gap Locking.
* Performance: `EXPLAIN ANALYZE`, B-Tree Indexing, and Query Planning.
* Database Design: BCNF Normalization, Foreign Key Integrity, and Stored Procedures.
=======
SET TRANSACTION ISOLATION LEVEL

EXPLAIN ANALYZE

Trigger and Stored Procedure creation (DELIMITER)

Foreign Key Constraints (ON DELETE RESTRICT)


