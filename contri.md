# Work Distribution

## 1. Shivam Mishra (Roll No: IIT2024215)

### Primary Ownership
- Core database architecture and schema design
- Advanced Stored Procedures and transaction logic
- Educational theory and anomaly simulation algorithms

### Main Features Covered
- ACID-compliant digital wallet transfer logic
- Concurrency Lab database anomaly simulation (Dirty, Fuzzy, and Phantom reads)
- Optimization Lab index performance logic (B-Tree vs. Full Table Scan)
- Mathematical and theoretical explanations used throughout the simulator

### Main Code Areas
- `database/init.sql` (Core schema and procedural logic)
- Stored Procedure: `ExecuteTransfer`
- Stored Procedure: `SeedMassiveData`
- SQL constraint definitions and index structures

### What This Work Does
- Enforces strict ACID properties at the lowest structural level
- Artificially creates race conditions and read anomalies by forcing specific database states
- Provides mathematical proof of execution times between linear data scans and optimized indexes
- Ensures the educational content presented in the UI aligns with accurate ANSI SQL theory

### DBMS Contribution
- Designed a normalized relational schema for `Users`, `Accounts`, and `Transactions`
- Engineered complex procedural logic utilizing `START TRANSACTION`, `COMMIT`, `ROLLBACK`, and `FOR UPDATE` row-level locking
- Explicitly configured and toggled InnoDB engine isolation variables (`READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`) to physically demonstrate engine behavior

## 2. Adabala Sridhar (Roll No: IIT2024218)

### Primary Ownership
- Node.js backend foundation and API architecture
- Database connection lifecycle and middleware
- Asynchronous race condition handling

### Main Features Covered
- RESTful API routing bridging the React frontend to MySQL
- `mysql2` connection pooling and resource management
- Concurrency timeout logic for the Saboteur and Auditor transactions
- Safe cleanup of aborted or rolled-back transactions

### Main Code Areas
- `bank-backend/index.js`
- `bank-backend/db.js`
- `bank-backend/package.json`
- API Routes: `/api/concurrency/*`, `/api/transfer`

### What This Work Does
- Acts as the secure middleman between the client and the database
- Intentionally holds database locks open for specific durations (e.g., 5 seconds) so the frontend user has time to execute colliding queries
- Ensures the Node.js server remains stable under heavy transaction simulation loads

### DBMS Contribution
- Managed the database connection pool lifecycle, ensuring efficient use of `pool.getConnection()` and `connection.release()`
- Executed complex transactional queries and isolation-level overrides from the application layer
- Prevented database connection exhaustion and memory leaks by engineering strict `try/catch/finally` blocks around highly volatile, intentionally failing asynchronous queries

## 3. Neel Ghule (Roll No: IIT2024267)

### Primary Ownership
- Frontend React logic and Full-Stack Integration
- State management and API communication
- Temporal State Enforcement (Cheat-proofing the simulator)

### Main Features Covered
- React hooks (`useState`, `useEffect`) for dynamic data flow
- Axios integration for consuming backend REST APIs
- Real-time capturing and parsing of backend telemetry
- Concurrency window locking logic

### Main Code Areas
- `bank-frontend/src/App.jsx` (Logical layers)
- `bank-frontend/src/ConcurrencyLab.jsx` (State and API calls)
- `bank-frontend/src/RecoveryLab.jsx`
- `bank-frontend/src/PerformanceLab.jsx`

### What This Work Does
- Connects the visual UI to the live backend endpoints
- Manages complex timing states (`windowOpen`, `isProcessing`) to disable buttons when a concurrency window closes, ensuring users cannot "cheat" the simulator
- Captures asynchronous backend errors and maps them to clear, educational readouts for the user

### DBMS Contribution
- Translated raw JSON database responses into dynamic UI states
- Handled advanced asynchronous database errors (such as intentional deadlocks or range lock blocks) and presented them as educational feedback
- Used temporal tagging to label database snapshot results as either "Mid-Transaction Collision" or "Stable Post-Rollback State"

## 4. Ayush Anand (Roll No: IIT2024246)

### Primary Ownership
- Student-facing UI and shared frontend architecture
- UI/UX Design and aesthetic modeling
- Data visualization and Chart.js integration

### Main Features Covered
- "Cyberpunk/Glassmorphism" design system
- Interactive scenario cards and floating pill navigation
- Live network telemetry dashboard
- Responsive layouts and reusable styled components

### Main Code Areas
- `bank-frontend/src/App.css`
- `bank-frontend/src/index.css`
- `bank-frontend/src/App.jsx` (Presentation layer)
- Component rendering in `ConcurrencyLab.jsx` and `PerformanceLab.jsx`

### What This Work Does
- Transforms a standard web interface into a high-tech "Database Command Center"
- Makes complex database theories visually accessible through glowing charts, color-coded live terminals, and intuitive interactive buttons
- Provides a seamless, engaging user experience that encourages exploration

### DBMS Contribution
- Built the visual representation of database metrics (Buffer Hit Rate, Avg Latency, Active Locks)
- Designed the UI to clearly and instantly differentiate between vulnerable database states (red/warning themes) and safe/isolated engine states (green/success themes)
- Created the "Live Terminal" component to visually mimic a direct MySQL CLI connection for the user

## 5. Bendram Anjan Shiva Reddy (Roll No: IIT2024265)

### Primary Ownership
- DevOps and Containerization
- System architecture setup and deployment
- Quality Assurance and Defensive Engineering

### Main Features Covered
- Docker and Docker Compose orchestration
- Idempotent database initialization scripts
- System-wide security patching ("Defense in Depth")
- Vulnerability testing and edge-case resolution

### Main Code Areas
- `docker-compose.yml`
- `database/init.sql` (Structural deployment and idempotency)
- `bank-frontend/src/App.jsx` (Frontend input validation)
- Backend timeout safety audits

### What This Work Does
- Ensures the entire application stack is portable, crash-resilient, and easily deployable by evaluators via a single command
- Allows the database container to be wiped and rebuilt seamlessly without throwing schema errors
- Actively blocks infinite money glitches, negative transfer exploits, and self-transfer loopholes

### DBMS Contribution
- Wrote idempotent `DROP TABLE IF EXISTS` and `DROP PROCEDURE IF EXISTS` scripts to ensure clean database environments on every boot
- Implemented "Defense in Depth" by adding strict logical constraints (`IF p_amount <= 0`) directly into the database engine
- Coordinated with the frontend to ensure database constraints were mirrored by UI input validation (`min="0.01"`), minimizing unnecessary failed database calls

## Coverage Summary

The project is fully covered by this distribution:

- **MySQL InnoDB, Schema, Stored Procedures, and Core Theory:** Shivam Mishra
- **Node.js API, Connection Pooling, and Async Transaction Logic:** Adabala Sridhar
- **React State Management, API Integration, and Cheat-Proofing Logic:** Neel Ghule
- **UI/UX Design, Glassmorphism Styling, and Chart.js Data Visualization:** Ayush Anand
- **Docker Containerization, Idempotent DB Scripts, and Defensive Security:** Bendram Anjan Shiva Reddy