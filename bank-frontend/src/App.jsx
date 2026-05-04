import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ConcurrencyLab from './ConcurrencyLab';
import RecoveryLab from './RecoveryLab';
import PerformanceLab from './PerformanceLab';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard States
  const [account, setAccount] = useState(null);
  const [transferData, setTransferData] = useState({ toAccount: '', amount: '' });
  const [status, setStatus] = useState({ message: '', type: '' });
  const [animatedBalance, setAnimatedBalance] = useState(0);
  const [activeLocks, setActiveLocks] = useState(0);
  const [txHistory, setTxHistory] = useState([
    { time: '10:00', c: 120, f: 5  },
    { time: '10:05', c: 190, f: 12 },
    { time: '10:10', c: 80,  f: 8  },
    { time: '10:15', c: 250, f: 3  },
    { time: '10:20', c: 210, f: 18 },
    { time: '10:25', c: 310, f: 7  },
    { time: '10:30', c: 280, f: 10 },
  ]);
  const animRef = useRef(null);

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

  // Animate balance counter on account load
  useEffect(() => {
    if (!account) return;
    const target = parseFloat(account.balance);
    const start = performance.now();
    const from = animatedBalance;
    const animate = (now) => {
      const p = Math.min((now - start) / 1200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimatedBalance(from + (target - from) * ease);
      if (p < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.balance]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setStatus({ message: 'Executing ACID Transaction...', type: 'pending' });
    setActiveLocks(1);
    try {
      await axios.post('http://localhost:5000/api/transfer', {
        fromAccount: 1, toAccount: parseInt(transferData.toAccount), amount: parseFloat(transferData.amount)
      });
      setStatus({ message: 'Transaction Committed Successfully', type: 'success' });
      const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      setTxHistory(prev => [...prev.slice(-6), { time: t, c: Math.floor(Math.random()*200)+100, f: Math.floor(Math.random()*15) }]);
      fetchAccount();
      setTransferData({ toAccount: '', amount: '' });
    } catch (error) {
      setStatus({ message: error.response?.data?.error || 'Transaction Failed & Rolled Back', type: 'error' });
    } finally {
      setActiveLocks(0);
    }
  };

  const chartData = {
    labels: txHistory.map(t => t.time),
    datasets: [
      {
        label: 'Commits/min',
        data: txHistory.map(t => t.c),
        borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)',
        borderWidth: 2.5, pointRadius: 3, fill: true, tension: 0.4,
        pointBackgroundColor: '#020617', pointBorderColor: '#38bdf8', pointBorderWidth: 2,
      },
      {
        label: 'Failures/min',
        data: txHistory.map(t => t.f),
        borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)',
        borderWidth: 2, pointRadius: 3, fill: true, tension: 0.4,
        pointBackgroundColor: '#020617', pointBorderColor: '#ef4444', pointBorderWidth: 2,
      },
    ]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#64748b', font: { family: 'monospace', size: 11 }, boxWidth: 10, padding: 12 } },
      tooltip: { backgroundColor: 'rgba(2,6,23,0.9)', borderColor: '#334155', borderWidth: 1, titleColor: '#f8fafc', bodyColor: '#94a3b8' },
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { family: 'monospace', size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'monospace', size: 10 } } },
    },
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
                  <h1 className="balance-amount">${animatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
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
                  {status.type === 'pending' ? '⏳ Writing to WAL...' : 'Commit Transaction'}
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
            <div className="stats-grid" style={{ marginTop: '20px' }}>
              <div className="stat-box">
                <div className="stat-label">Buffer Hit Rate</div>
                <div className="stat-value" style={{ color: '#10b981' }}>99.8%</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Avg Latency</div>
                <div className="stat-value" style={{ color: '#38bdf8' }}>1.2ms</div>
              </div>
              <div className="stat-box" style={{ border: activeLocks > 0 ? '1px solid #f59e0b40' : '1px solid #1e293b', transition: 'border-color 0.3s' }}>
                <div className="stat-label">Active Locks</div>
                <div className="stat-value" style={{ color: activeLocks > 0 ? '#f59e0b' : '#cbd5e1', transition: 'color 0.3s', textShadow: activeLocks > 0 ? '0 0 12px #f59e0b80' : 'none' }}>
                  {activeLocks}
                </div>
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