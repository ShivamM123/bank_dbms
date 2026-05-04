import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// Notice the Chart.js imports changed: we added LineElement, PointElement, and Filler
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ConcurrencyLab from './ConcurrencyLab';
import RecoveryLab from './RecoveryLab';
import PerformanceLab from './PerformanceLab';
import './App.css';

// Register the new Chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard States
  const [account, setAccount] = useState(null);
  const [transferData, setTransferData] = useState({ toAccount: '', amount: '' });
  const [status, setStatus] = useState({ message: '', type: '' });

  // --- DASHBOARD FUNCTIONS ---
  const fetchAccount = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/accounts/1');
      setAccount(response.data);
      setStatus({ message: '', type: '' });
    } catch (error) {
      setStatus({ message: 'Database Connection Offline', type: 'error' });
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchAccount();
  }, [activeTab]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setStatus({ message: 'Executing ACID Transaction...', type: 'pending' });
    try {
      await axios.post('http://localhost:5000/api/transfer', {
        fromAccount: 1, toAccount: parseInt(transferData.toAccount), amount: parseFloat(transferData.amount)
      });
      setStatus({ message: 'Transaction Committed Successfully', type: 'success' });
      fetchAccount();
      setTransferData({ toAccount: '', amount: '' });
    } catch (error) {
      setStatus({ message: error.response?.data?.error || 'Transaction Failed & Rolled Back', type: 'error' });
    }
  };

  // --- CYBERPUNK CHART CONFIG ---
  // Using a line chart with a gradient fill looks 10x more high-tech than a bar chart.
  const chartData = {
    labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'],
    datasets: [{
      label: 'Commits per Minute',
      data: [120, 190, 80, 250, 210, 310, 280],
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.1)', // Creates the glowing area under the line
      borderWidth: 3,
      pointBackgroundColor: '#020617',
      pointBorderColor: '#38bdf8',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: true,
      tension: 0.4 // Smooth curves
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b', font: { family: 'monospace' } } },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'monospace' } } }
    }
  };

  return (
    <div className="app-container">
      {/* Sleek Modern Header */}
      <header className="app-header">
        <div>
          <h1 className="logo-title">ACID Core Engine</h1>
          <p className="logo-subtitle">Distributed Transaction Node</p>
        </div>

        {/* Pill Navigation (Matches Concurrency Lab style) */}
        <nav className="nav-links">
          <span className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            Dashboard
          </span>
          <span className={`nav-link ${activeTab === 'concurrency' ? 'active' : ''}`} onClick={() => setActiveTab('concurrency')}>
            Concurrency Lab
          </span>
          <span className={`nav-link ${activeTab === 'recovery' ? 'active' : ''}`} onClick={() => setActiveTab('recovery')}>
            Recovery Lab
          </span>
          <span className={`nav-link ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
            Optimization Lab
          </span>
        </nav>
      </header>

      {/* ================= DASHBOARD VIEW ================= */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-grid">

          {/* Left Column: Actions */}
          <div className="column-left">

            {/* Wallet Card */}
            <div className="cyber-card wallet-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Active Node Account</h3>
                <span className="wallet-badge">● ONLINE</span>
              </div>

              {account ? (
                <>
                  <h1 className="balance-amount">${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h1>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                    <div style={{ color: '#cbd5e1' }}><strong>{account.full_name}</strong></div>
                    <div style={{ color: '#64748b', fontFamily: 'monospace' }}>ID: {account.account_id} | Type: Savings</div>
                  </div>
                </>
              ) : (
                <h3 style={{ color: '#ef4444', marginTop: '20px', fontFamily: 'monospace' }}>{status.message || "Establishing connection..."}</h3>
              )}
            </div>

            {/* Execution Form */}
            <div className="cyber-card">
              <h3 className="card-title"><span style={{ color: '#3b82f6' }}>⚡</span> Execute Transfer</h3>
              <form onSubmit={handleTransfer}>
                <div className="form-group">
                  <label>Destination Account ID</label>
                  <input type="number" className="premium-input" value={transferData.toAccount} onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })} required placeholder="e.g., 2" />
                </div>
                <div className="form-group">
                  <label>Amount (USD)</label>
                  <input type="number" step="0.01" min="0.01" className="premium-input" value={transferData.amount} onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })} required placeholder="0.00" />                </div>
                <button type="submit" className="btn-primary" disabled={!account || status.type === 'pending'}>
                  {status.type === 'pending' ? 'Writing to WAL...' : 'Commit Transaction'}
                </button>
              </form>
              {status.message && status.type !== 'pending' && (
                <div className={`status-msg ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
                  {status.message}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Telemetry */}
          <div className="cyber-card">
            <h3 className="card-title"><span style={{ color: '#8b5cf6' }}>📡</span> Engine Telemetry</h3>

            {/* The upgraded glowing line chart */}
            <div style={{ height: '280px', width: '100%' }}>
              <Line data={chartData} options={chartOptions} />
            </div>

            {/* Fake (but highly impressive) DB metric boxes */}
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">Buffer Hit Rate</div>
                <div className="stat-value" style={{ color: '#10b981' }}>99.8%</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Avg Latency</div>
                <div className="stat-value" style={{ color: '#38bdf8' }}>1.2ms</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Active Locks</div>
                <div className="stat-value" style={{ color: '#cbd5e1' }}>0</div>
              </div>
            </div>

            <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
              * Metrics simulate InnoDB engine health during standard operations.
            </p>
          </div>

        </div>
      )}

      {/* ================= COMPONENT ROUTING ================= */}
      {activeTab === 'concurrency' && <ConcurrencyLab />}
      {activeTab === 'recovery' && <RecoveryLab />}
      {activeTab === 'performance' && <PerformanceLab />}
    </div>
  );
}

export default App;