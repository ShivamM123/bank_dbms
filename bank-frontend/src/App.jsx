import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [account, setAccount] = useState(null);
  const [transferData, setTransferData] = useState({ toAccount: '', amount: '' });
  const [status, setStatus] = useState({ message: '', type: '' });

  const fetchAccount = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/accounts/1');
      setAccount(response.data);
      setStatus({ message: '', type: '' });
    } catch (error) {
      console.error("Error fetching account:", error);
      setStatus({ message: 'Database Connection Offline', type: 'error' });
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setStatus({ message: 'Processing transaction...', type: 'pending' });
    
    try {
      await axios.post('http://localhost:5000/api/transfer', {
        fromAccount: 1, 
        toAccount: parseInt(transferData.toAccount),
        amount: parseFloat(transferData.amount)
      });
      
      setStatus({ message: 'Transaction Committed Successfully', type: 'success' });
      fetchAccount(); 
      setTransferData({ toAccount: '', amount: '' }); 
    } catch (error) {
      setStatus({ message: error.response?.data?.error || 'Transaction Failed & Rolled Back', type: 'error' });
    }
  };

  // Modern Chart configuration
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Transaction Volume',
      data: [1200, 1900, 800, 1500, 2000, 500],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      hoverBackgroundColor: 'rgba(96, 165, 250, 1)',
      borderRadius: 6,
      borderWidth: 0,
      barThickness: 24,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }, 
        ticks: { color: '#64748b', font: { family: 'Inter' } },
        border: { display: false }
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#64748b', font: { family: 'Inter' } },
        border: { display: false }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="app-container">
      
      {/* Navbar */}
      <header className="app-header">
        <div>
          <h1 className="logo-title">ACID Banking Core</h1>
          <p className="logo-subtitle">Transaction Management Engine</p>
        </div>
        <nav className="nav-links">
          <span className="nav-link active">Dashboard</span>
          <span className="nav-link disabled">Concurrency Lab 🔒</span>
          <span className="nav-link disabled">Recovery Lab 🔒</span>
        </nav>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Left Column */}
        <div className="column-left">
          
          {/* Balance Card */}
          <div className="glass-card">
            <h2 className="card-label">Active Account</h2>
            {account ? (
              <>
                <div className="account-header">
                  <h3 className="account-name">{account.full_name}</h3>
                  <span className="account-badge">ID: {account.account_id} | Savings</span>
                </div>
                <h1 className="balance-amount">
                  ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h1>
              </>
            ) : (
              <h3 className="status-connecting">{status.message || "Connecting to Database..."}</h3>
            )}
          </div>

          {/* Transfer Form */}
          <div className="glass-card">
            <h3 className="section-title">Execute Transfer</h3>
            
            <form onSubmit={handleTransfer} className="transfer-form">
              <div className="form-group">
                <label>Destination Account ID</label>
                <input 
                  type="number" 
                  className="premium-input"
                  value={transferData.toAccount} 
                  onChange={(e) => setTransferData({...transferData, toAccount: e.target.value})}
                  required 
                  placeholder="e.g., 2"
                />
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="premium-input"
                  value={transferData.amount} 
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  required 
                  placeholder="0.00"
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={!account || status.type === 'pending'}
              >
                {status.type === 'pending' ? 'Executing...' : 'Commit Transaction'}
              </button>
            </form>

            {/* Status Message Display */}
            {status.message && status.type !== 'pending' && (
              <div className={`status-msg ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
                {status.message}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Analytics */}
        <div className="glass-card chart-container">
          <h3 className="section-title">System Telemetry</h3>
          <div className="chart-wrapper">
            <Bar data={chartData} options={chartOptions} />
          </div>
          <p className="chart-footer">
            * Live transaction isolation graphs will populate here during Final Evaluation.
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;