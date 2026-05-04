# ACID Core Engine - Setup Instructions

Welcome to the ACID Core Engine simulator! Follow these step-by-step instructions to get the project running locally from scratch.

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v16 or higher)
- **Docker** and **Docker Desktop** (Required for the Recovery/Crash Lab)
- **Git**

---

## Step 1: Clone the Repository
Open your terminal and clone the repository:
```bash
git clone <repository_url>
cd bank_dbms
```

---

## Step 2: Database Setup

The application requires MySQL. For the most authentic experience (and because the Recovery Lab relies on Docker commands to simulate server crashes), we will use Docker for the database.

### 1. Start the Crash Lab Database Container
The Node.js backend specifically looks for a Docker container named `bank-crash-db` running on port `3307`. Run this command to spin it up:
```bash
docker run --name bank-crash-db -p 3307:3306 -e MYSQL_ROOT_PASSWORD=password -d mysql:8.0
```
*(Wait about 15-20 seconds for the database to initialize internally).*

### 2. Initialize the Schema and Seed Data
Now we need to inject the tables, stored procedures, and 100,000 dummy rows into the container.
Run the following command from the root of the project:
```bash
docker exec -i bank-crash-db mysql -u root -ppassword < database/init.sql
```
*(This may take a few seconds as it recursively generates 100,000 rows for the Performance Lab).*

> **Note on Local MySQL:** If you prefer to use a natively installed local MySQL server for the main dashboard, you can. Just make sure to run `database/init.sql` against it. However, the **Recovery Lab will still require the Docker container above** to function.

---

## Step 3: Backend Setup

The backend acts as the secure middleman and handles the intentional concurrency timeouts.

1. Open a new terminal window and navigate to the backend directory:
   ```bash
   cd bank-backend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Create the Environment file:
   Create a `.env` file inside the `bank-backend` folder with the following contents. *(If you are using the Docker setup from Step 2, use port 3307 and password "password". If using local MySQL, adjust accordingly).*
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=bank_db
   PORT=5000
   ```
4. Start the backend server:
   ```bash
   node index.js
   ```
   You should see `Bank Teller (Server) is running on port 5000`.

---

## Step 4: Frontend Setup

The frontend is built with React/Vite and powers the Cyberpunk UI.

1. Open a **third** terminal window and navigate to the frontend directory:
   ```bash
   cd bank-frontend
   ```
2. Install the React dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the Application:
   Open your web browser and navigate to: **`http://localhost:5173`**

---

## Step 5: Verification

To ensure everything is working correctly:
1. Go to the **Dashboard**. You should see the balance counter animate up to $5,000.00.
2. Go to the **Optimization Lab**. Click "Run Analysis". If the database was seeded correctly, you should see "Rows Scanned: 100,000".
3. Go to the **Recovery Lab**. Click the Kill Switch. Your terminal should show the Docker container being killed, and the UI should update immediately.

**Happy Simulating!**
