import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [account, setAccount] = useState(null); // Changed to null to check loading state
  const [transferData, setTransferData] = useState({ toAccount: '', amount: '' });
  const [status, setStatus] = useState({ message: '', type: '' });

  const fetchAccount = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/accounts/1');
      setAccount(response.data);
      setStatus({ message: '', type: '' }); // clear errors on success
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

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Transaction Volume',
      data: [1200, 1900, 800, 1500, 2000, 500],
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>ACID Banking Core</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '5px 0 0 0' }}>Transaction Management Engine</p>
        </div>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <span style={{ color: '#3b82f6', fontWeight: '600', cursor: 'pointer' }}>Dashboard</span>
          <span style={{ color: '#64748b', cursor: 'not-allowed' }}>Concurrency Lab 🔒</span>
          <span style={{ color: '#64748b', cursor: 'not-allowed' }}>Recovery Lab 🔒</span>
        </nav>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Balance Card */}
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Active Account
            </h2>
            {account ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '22px', color: '#fff', margin: 0 }}>{account.full_name}</h3>
                  <span style={{ backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#38bdf8' }}>
                    ID: {account.account_id} | Savings
                  </span>
                </div>
                <h1 style={{ fontSize: '48px', color: '#22c55e', margin: '15px 0 0 0', fontWeight: 'bold' }}>
                  ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h1>
              </>
            ) : (
              <h3 style={{ color: '#ef4444' }}>{status.message || "Connecting to Database..."}</h3>
            )}
          </div>

          {/* Transfer Form */}
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Execute Transfer</h3>
            
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Destination Account ID</label>
                <input 
                  type="number" 
                  value={transferData.toAccount} 
                  onChange={(e) => setTransferData({...transferData, toAccount: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={transferData.amount} 
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                  placeholder="0.00"
                />
              </div>
              <button 
                type="submit" 
                disabled={!account || status.type === 'pending'}
                style={{ 
                  marginTop: '10px', padding: '14px', 
                  backgroundColor: (!account || status.type === 'pending') ? '#334155' : '#3b82f6', 
                  color: 'white', border: 'none', borderRadius: '6px', 
                  fontSize: '16px', fontWeight: 'bold', cursor: (!account || status.type === 'pending') ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}>
                {status.type === 'pending' ? 'Executing...' : 'Commit Transaction'}
              </button>
            </form>

            {/* Status Message Display */}
            {status.message && status.type !== 'pending' && (
              <div style={{ 
                marginTop: '20px', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '14px', fontWeight: '600',
                backgroundColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: status.type === 'success' ? '#22c55e' : '#ef4444',
                border: `1px solid ${status.type === 'success' ? '#22c55e' : '#ef4444'}`
              }}>
                {status.message}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Analytics */}
        <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>System Telemetry</h3>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
          <p style={{ marginTop: '20px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
            * Live transaction isolation graphs will populate here during Final Evaluation.
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;