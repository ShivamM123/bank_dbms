<div align="center">
  
# 🏦 ACID Banking & Database Simulation Engine
**A Full-Stack RDBMS Mini Project Demonstrating Concurrency Control, Crash Recovery, and ACID Compliance.**

![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## 📌 Project Overview
The **ACID Banking Simulation Engine** is not just a standard CRUD application; it is an educational tool designed to visualize and test the deep mechanics of Relational Database Management Systems. Built with a Node.js/Express backend and a React dashboard, this system acts as a sandbox to interact with a highly structured, BCNF-normalized MySQL 8.0 (InnoDB) database.

### 🎓 Academic Context
**Developer:** Shivam Mishra (Roll No: IIT2024215)  
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

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Database** | MySQL 8.0 (InnoDB) | Core data storage, ACID enforcement, constraints. |
| **Backend** | Node.js, Express.js | API server, routing. |
| **Database Driver** | `mysql2` | Connection pooling, raw SQL query execution. |
| **Frontend** | React.js (Vite) | Client-side UI. |
| **Data Visualization** | Chart.js, react-chartjs-2 | Graphing concurrency timelines and system loads. |
| **Containerization**| Docker | Sandboxing the DB for the Crash Recovery simulation. |

---

## 🗄️ Database Architecture
The database follows strict **BCNF Normalization** to eliminate redundancy. 

* **`Users`**: Identity management.
* **`Accounts`**: Financial ledgers constrained by Foreign Keys.
* **`Transactions`**: Immutable audit trail of all movements.

*(Insert your ER Diagram image here)*

---

## 🚀 Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MySQL 8.0](https://dev.mysql.com/downloads/) or Docker Desktop
- Git

### 1. Database Initialization
1. Clone the repository: `git clone <your-repo-link>`
2. Open MySQL Workbench.
3. Open and execute the script located at `database/init_schema.sql` to generate the schemas, tables, and Stored Procedures.

### 2. Backend Setup
```bash
cd bank-backend
npm install

Create a .env file in the bank-backend directory:
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=bank_db
PORT=5000

Start the API Server:
npm start

3. Frontend Setup
Open a new terminal window.

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