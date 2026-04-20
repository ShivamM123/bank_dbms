import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [account, setAccount] = useState({ full_name: 'Loading...', balance: 0 });
  const [transferData, setTransferData] = useState({ toAccount: '', amount: '' });
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch Alice's Account (ID: 1) on load
  const fetchAccount = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/accounts/1');
      setAccount(response.data);
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  // Handle the Transfer Form Submission
  const handleTransfer = async (e) => {
    e.preventDefault();
    setStatusMessage('Processing...');
    
    try {
      await axios.post('http://localhost:5000/api/transfer', {
        fromAccount: 1, // Hardcoded to Alice for the demo
        toAccount: parseInt(transferData.toAccount),
        amount: parseFloat(transferData.amount)
      });
      
      setStatusMessage('Transfer Successful!');
      fetchAccount(); // Refresh balance immediately
      setTransferData({ toAccount: '', amount: '' }); // Clear form
    } catch (error) {
      setStatusMessage(error.response?.data?.error || 'Transfer Failed');
    }
  };

  // Dummy Data for the Chart Placeholder
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Spending',
      data: [1200, 1900, 800, 1500, 2000, 500],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }]
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Area */}
      <header style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>ACID Banking System Simulation</h1>
        <nav style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <strong style={{ color: '#007bff' }}>Dashboard</strong>
          <span style={{ color: '#888' }}>Concurrency Lab (Locked)</span>
          <span style={{ color: '#888' }}>Recovery Lab (Locked)</span>
        </nav>
      </header>

      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* Left Column: Account Details & Transfer Form */}
        <div style={{ flex: 1 }}>
          
          {/* Balance Card */}
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
            <h2>Welcome, {account.full_name}</h2>
            <p>Account ID: 1 | Type: Savings</p>
            <h1 style={{ color: '#28a745' }}>${parseFloat(account.balance).toFixed(2)}</h1>
          </div>

          {/* Transfer Form */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3>Transfer Funds</h3>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label>
                To Account ID:
                <input 
                  type="number" 
                  value={transferData.toAccount} 
                  onChange={(e) => setTransferData({...transferData, toAccount: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </label>
              <label>
                Amount ($):
                <input 
                  type="number" 
                  step="0.01"
                  value={transferData.amount} 
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </label>
              <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Execute ACID Transfer
              </button>
            </form>
            {statusMessage && <p style={{ marginTop: '10px', fontWeight: 'bold', color: statusMessage.includes('Failed') ? 'red' : 'green' }}>{statusMessage}</p>}
          </div>

        </div>

        {/* Right Column: Chart Placeholder */}
        <div style={{ flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Spending Overview</h3>
          <Bar data={chartData} />
          <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
            *Note: Concurrency visualization graphs will be mapped here during the final evaluation phase.
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;