import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ConcurrencyLab from './ConcurrencyLab'; // Importing your new lab
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'concurrency', or 'recovery'

  // Dashboard States
  const [account, setAccount] = useState(null);
  const [transferData, setTransferData] = useState({ toAccount: '', amount: '' });
  const [status, setStatus] = useState({ message: '', type: '' });

  // Recovery Lab States
  const [crashStatus, setCrashStatus] = useState('Idle. Ready for test.');
  const [countdown, setCountdown] = useState(0);
  const [ramData, setRamData] = useState(null);
  const timerRef = useRef(null);

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
    setStatus({ message: 'Processing transaction...', type: 'pending' });
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

  // --- RECOVERY LAB FUNCTIONS ---
  const fetchRamData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/crash-lab/monitor');
      setRamData(res.data);
    } catch (error) {
      setRamData(null);
    }
  };

  const startSlowTransaction = async () => {
    setCrashStatus('Transaction floating in RAM (Uncommitted)');
    setCountdown(15);
    setRamData(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) clearInterval(timerRef.current);
        return prev - 1;
      });
    }, 1000);

    try {
      axios.post('http://localhost:5000/api/crash-lab/start-transfer');
      setTimeout(fetchRamData, 1000);
    } catch (error) {
      setCrashStatus('Error: Docker DB offline.');
    }
  };

  const executeKill = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
    setCrashStatus('TRANSMITTING KILL COMMAND...');
    try {
      const res = await axios.post('http://localhost:5000/api/crash-lab/kill');
      setCrashStatus(res.data.message);
      setRamData(null);
    } catch (error) {
      setCrashStatus('Error: Failed to kill container.');
    }
  };

  const executeRecover = async () => {
    setCrashStatus('Rebooting Database...');
    try {
      const res = await axios.post('http://localhost:5000/api/crash-lab/recover');
      setCrashStatus(res.data.message);
      fetchRamData();
    } catch (error) {
      setCrashStatus('Error: Failed to reboot database.');
    }
  };

  // --- CHART CONFIG ---
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Transaction Volume',
      data: [1200, 1900, 800, 1500, 2000, 500],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 6,
      borderWidth: 0,
      barThickness: 24,
    }]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } } };

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="app-header">
        <div>
          <h1 className="logo-title">ACID Banking Core</h1>
          <p className="logo-subtitle">Transaction Management Engine</p>
        </div>
        <nav className="nav-links">
          <span
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            Dashboard
          </span>
          <span
            className={`nav-link ${activeTab === 'concurrency' ? 'active' : ''}`}
            onClick={() => setActiveTab('concurrency')}
            style={{ cursor: 'pointer', color: activeTab === 'concurrency' ? '#3b82f6' : '' }}
          >
            Concurrency Lab
          </span>
          <span
            className={`nav-link ${activeTab === 'recovery' ? 'active' : ''}`}
            onClick={() => setActiveTab('recovery')}
            style={{ cursor: 'pointer', color: activeTab === 'recovery' ? '#ef4444' : '' }}
          >
            Recovery Lab
          </span>
        </nav>
      </header>

      {/* CONDITIONAL RENDERING: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="column-left">
            <div className="glass-card">
              <h2 className="card-label">Active Account</h2>
              {account ? (
                <>
                  <div className="account-header">
                    <h3 className="account-name">{account.full_name}</h3>
                    <span className="account-badge">ID: {account.account_id} | Savings</span>
                  </div>
                  <h1 className="balance-amount">${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h1>
                </>
              ) : (
                <h3 className="status-connecting">{status.message || "Connecting to Database..."}</h3>
              )}
            </div>

            <div className="glass-card">
              <h3 className="section-title">Execute Transfer</h3>
              <form onSubmit={handleTransfer} className="transfer-form">
                <div className="form-group">
                  <label>Destination Account ID</label>
                  <input type="number" className="premium-input" value={transferData.toAccount} onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })} required placeholder="e.g., 2" />
                </div>
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input type="number" step="0.01" className="premium-input" value={transferData.amount} onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })} required placeholder="0.00" />
                </div>
                <button type="submit" className="btn-primary" disabled={!account || status.type === 'pending'}>{status.type === 'pending' ? 'Executing...' : 'Commit Transaction'}</button>
              </form>
              {status.message && status.type !== 'pending' && <div className={`status-msg ${status.type === 'success' ? 'status-success' : 'status-error'}`}>{status.message}</div>}
            </div>
          </div>
          <div className="glass-card chart-container">
            <h3 className="section-title">System Telemetry</h3>
            <div className="chart-wrapper"><Bar data={chartData} options={chartOptions} /></div>
            <p className="chart-footer">* Live transaction isolation graphs will populate here during Final Evaluation.</p>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDERING: CONCURRENCY LAB */}
      {activeTab === 'concurrency' && <ConcurrencyLab />}

      {/* CONDITIONAL RENDERING: RECOVERY LAB */}
      {activeTab === 'recovery' && (
        <div className="glass-card" style={{ padding: '40px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#ef4444', fontSize: '32px', marginBottom: '10px' }}>💥 Atomicity & Crash Recovery</h2>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>Watch the $500k float in the Buffer Pool (RAM) before being committed to the Redo Log (Disk).</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '40px' }}>
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #3b82f6', textAlign: 'center' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '15px' }}>Live RAM Monitor</h3>
              {countdown > 0 && <p style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>⏳ COMMIT IN: {countdown}s</p>}
              {ramData ? (
                <div>
                  <p style={{ color: '#fff', fontSize: '18px' }}>Receiver (ID 1): <span style={{ color: '#22c55e' }}>${parseFloat(ramData.find(r => r.account_id === 1)?.balance || 0).toLocaleString()}</span></p>
                  <p style={{ color: '#fff', fontSize: '18px' }}>Sender (ID 3): <span style={{ color: '#ef4444' }}>${parseFloat(ramData.find(r => r.account_id === 3)?.balance || 0).toLocaleString()}</span></p>
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>Waiting for transaction...</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' }}>
            <button onClick={startSlowTransaction} disabled={countdown > 0} style={{ padding: '15px 25px', backgroundColor: countdown > 0 ? '#475569' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}>
              1. Start $500k Transfer
            </button>
            <button onClick={executeKill} style={{ padding: '15px 25px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(239,68,68,0.5)' }}>
              2. ⚡ PULL THE PLUG
            </button>
            <button onClick={executeRecover} style={{ padding: '15px 25px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              3. Reboot DB (Check Rollback)
            </button>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155', fontFamily: 'monospace', color: '#fff', textAlign: 'center' }}>
            <span style={{ color: '#38bdf8' }}>Status: </span>
            <span style={{ color: crashStatus.includes('DEAD') || crashStatus.includes('Error') ? '#ef4444' : '#22c55e' }}>{crashStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;