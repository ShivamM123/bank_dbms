import { useState } from 'react';
import axios from 'axios';
import './RecoveryLab.css'; // Reusing your premium styling

function ConcurrencyLab() {
  const [txAStatus, setTxAStatus] = useState('Idle');
  const [txBStatus, setTxBStatus] = useState('Idle');
  const [readBalance, setReadBalance] = useState(null);
  const [isolationLevel, setIsolationLevel] = useState('READ UNCOMMITTED');

  const executeTxA = async () => {
    setTxAStatus('Deducting $1,000... (Holding uncommitted for 5s)');
    setReadBalance(null);
    try {
      await axios.post('http://localhost:5000/api/concurrency/tx-a');
      
      // Auto-update status after the 5s backend delay finishes
      setTimeout(() => {
        setTxAStatus('Rolled Back. Data restored.');
      }, 5000);
    } catch (error) {
      setTxAStatus('Error executing Tx A');
    }
  };

  const executeTxB = async () => {
    setTxBStatus('Fetching balance...');
    try {
      const res = await axios.get(`http://localhost:5000/api/concurrency/tx-b?isolation=${isolationLevel}`);
      setReadBalance(res.data.balance);
      setTxBStatus(`Read complete at ${res.data.isolation_used}`);
    } catch (error) {
      setTxBStatus('Error fetching balance');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '40px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#3b82f6', fontSize: '32px', marginBottom: '10px' }}>🚦 Concurrency & Isolation Lab</h2>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Simulate a Dirty Read anomaly by firing simultaneous transactions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Transaction A Panel */}
        <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '15px' }}>Transaction A (The Saboteur)</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
            Subtracts $1,000 from Account 1, keeps it uncommitted in RAM for 5 seconds, then forces a ROLLBACK.
          </p>
          <button onClick={executeTxA} className="btn-primary" style={{ backgroundColor: '#f59e0b', width: '100%', marginBottom: '15px' }}>
            1. Start Tx A
          </button>
          <div style={{ color: txAStatus.includes('Rolled') ? '#ef4444' : '#38bdf8', fontFamily: 'monospace' }}>
            Status: {txAStatus}
          </div>
        </div>

        {/* Transaction B Panel */}
        <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#10b981', marginBottom: '15px' }}>Transaction B (The Reader)</h3>
          
          <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Select Isolation Level:</label>
          <select 
            className="premium-input" 
            value={isolationLevel} 
            onChange={(e) => setIsolationLevel(e.target.value)}
            style={{ width: '100%', marginBottom: '20px', padding: '10px' }}
          >
            <option value="READ UNCOMMITTED">Tier 1: READ UNCOMMITTED (Allows Dirty Read)</option>
            <option value="READ COMMITTED">Tier 2: READ COMMITTED (Prevents Dirty Read)</option>
          </select>

          <button onClick={executeTxB} className="btn-primary" style={{ backgroundColor: '#10b981', width: '100%', marginBottom: '15px' }}>
            2. Execute Tx B Read
          </button>
          
          <div style={{ color: '#fff', fontFamily: 'monospace', marginBottom: '10px' }}>
            Status: <span style={{ color: '#38bdf8' }}>{txBStatus}</span>
          </div>
          
          <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px', textAlign: 'center', border: `1px solid ${readBalance === '4000.00' ? '#ef4444' : '#334155'}` }}>
            <span style={{ color: '#94a3b8' }}>Value Read by Tx B: </span>
            <strong style={{ fontSize: '24px', color: readBalance === '4000.00' ? '#ef4444' : '#22c55e', display: 'block', marginTop: '5px' }}>
              {readBalance ? `$${readBalance}` : '---'}
            </strong>
            {readBalance === '4000.00' && <span style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginTop: '5px' }}>⚠️ FATAL: Dirty Read Detected!</span>}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ConcurrencyLab;