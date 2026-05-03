import { useState } from 'react';
import axios from 'axios';
import './RecoveryLab.css';

function ConcurrencyLab() {
    const [scenario, setScenario] = useState('dirty'); // 'dirty', 'phantom', or 'repeatable'

    // Dirty Read States
    const [txAStatus, setTxAStatus] = useState('Idle');
    const [txBStatus, setTxBStatus] = useState('Idle');
    const [readBalance, setReadBalance] = useState(null);
    const [dirtyIsolation, setDirtyIsolation] = useState('READ UNCOMMITTED');

    // Phantom Read States
    const [phantomAStatus, setPhantomAStatus] = useState('Idle');
    const [phantomBStatus, setPhantomBStatus] = useState('Idle');
    const [phantomResult, setPhantomResult] = useState(null);
    const [phantomIsolation, setPhantomIsolation] = useState('READ COMMITTED');

    // Repeatable Read States
    const [repeatAStatus, setRepeatAStatus] = useState('Idle');
    const [repeatBStatus, setRepeatBStatus] = useState('Idle');
    const [repeatResult, setRepeatResult] = useState(null);
    const [repeatIsolation, setRepeatIsolation] = useState('READ COMMITTED');

    // --- DIRTY READ FUNCTIONS ---
    const executeTxA = async () => {
        setTxAStatus('Deducting $1,000... (Holding uncommitted for 5s)');
        setReadBalance(null);
        try {
            await axios.post('http://localhost:5000/api/concurrency/tx-a');
            setTimeout(() => setTxAStatus('Rolled Back. Data restored.'), 5000);
        } catch (error) { setTxAStatus('Error executing Tx A'); }
    };

    const executeTxB = async () => {
        setTxBStatus('Fetching balance...');
        try {
            const res = await axios.get(`http://localhost:5000/api/concurrency/tx-b?isolation=${dirtyIsolation}`);
            setReadBalance(res.data.balance);
            setTxBStatus(`Read complete at ${res.data.isolation_used}`);
        } catch (error) { setTxBStatus('Error fetching balance'); }
    };

    // --- PHANTOM READ FUNCTIONS ---
    const executePhantomA = async () => {
        setPhantomAStatus('Counting rows... (Waiting 5s before counting again)');
        setPhantomResult(null);
        try {
            const res = await axios.get(`http://localhost:5000/api/concurrency/phantom-tx-a?isolation=${phantomIsolation}`);
            setPhantomResult(res.data);
            setPhantomAStatus('Audit Complete.');
        } catch (error) { setPhantomAStatus('Error executing Auditor Tx'); }
    };

    const executePhantomB = async () => {
        setPhantomBStatus('Attempting to insert Phantom row...');
        try {
            const res = await axios.post('http://localhost:5000/api/concurrency/phantom-tx-b');
            setPhantomBStatus(res.data.message);
            setTimeout(() => setPhantomBStatus('Idle (Phantom cleaned up)'), 10000);
        } catch (error) { setPhantomBStatus('Error executing Inserter Tx'); }
    };

    // --- REPEATABLE READ FUNCTIONS ---
    const executeRepeatA = async () => {
        setRepeatAStatus('Reading balance... (Waiting 5s before reading again)');
        setRepeatResult(null);
        try {
            const res = await axios.get(`http://localhost:5000/api/concurrency/repeat-tx-a?isolation=${repeatIsolation}`);
            setRepeatResult(res.data);
            setRepeatAStatus('Transaction Complete.');
        } catch (error) { setRepeatAStatus('Error executing Reader Tx'); }
    };

    const executeRepeatB = async () => {
        setRepeatBStatus('Deducting $50 and committing immediately...');
        try {
            const res = await axios.post('http://localhost:5000/api/concurrency/repeat-tx-b');
            setRepeatBStatus(res.data.message);
            setTimeout(() => setRepeatBStatus('Idle ($50 refunded via cleanup)'), 10000);
        } catch (error) { setRepeatBStatus('Error executing Updater Tx'); }
    };

    return (
        <div className="glass-card" style={{ padding: '40px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#3b82f6', fontSize: '32px', marginBottom: '10px' }}>🚦 Concurrency & Isolation Lab</h2>
                <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '20px' }}>Test MySQL isolation levels against real-time data collisions.</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button onClick={() => setScenario('dirty')} className="btn-primary" style={{ backgroundColor: scenario === 'dirty' ? '#3b82f6' : '#1e293b' }}>1. Dirty Read</button>
                    <button onClick={() => setScenario('repeatable')} className="btn-primary" style={{ backgroundColor: scenario === 'repeatable' ? '#14b8a6' : '#1e293b' }}>2. Non-Repeatable Read</button>
                    <button onClick={() => setScenario('phantom')} className="btn-primary" style={{ backgroundColor: scenario === 'phantom' ? '#8b5cf6' : '#1e293b' }}>3. Phantom Read</button>
                </div>
            </div>

            {/* SCENARIO 1: DIRTY READ */}
            {scenario === 'dirty' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#f59e0b', marginBottom: '15px' }}>Tx A (The Saboteur)</h3>
                        <button onClick={executeTxA} className="btn-primary" style={{ backgroundColor: '#f59e0b', width: '100%', marginBottom: '15px' }}>1. Start Tx A</button>
                        <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>Status: {txAStatus}</div>
                    </div>
                    <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#10b981', marginBottom: '15px' }}>Tx B (The Reader)</h3>
                        <select className="premium-input" value={dirtyIsolation} onChange={(e) => setDirtyIsolation(e.target.value)} style={{ width: '100%', marginBottom: '20px', padding: '10px' }}>
                            <option value="READ UNCOMMITTED">Tier 1: READ UNCOMMITTED (Allows Dirty Read)</option>
                            <option value="READ COMMITTED">Tier 2: READ COMMITTED (Prevents Dirty Read)</option>
                        </select>
                        <button onClick={executeTxB} className="btn-primary" style={{ backgroundColor: '#10b981', width: '100%', marginBottom: '15px' }}>2. Execute Tx B Read</button>
                        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ color: '#94a3b8' }}>Value Read: </span>
                            <strong style={{ fontSize: '24px', color: readBalance === '4000.00' ? '#ef4444' : '#22c55e', display: 'block' }}>{readBalance ? `$${readBalance}` : '---'}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* SCENARIO 2: NON-REPEATABLE READ */}
            {scenario === 'repeatable' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#14b8a6', marginBottom: '15px' }}>Tx A (The Snapshot Reader)</h3>
                        <select className="premium-input" value={repeatIsolation} onChange={(e) => setRepeatIsolation(e.target.value)} style={{ width: '100%', marginBottom: '20px', padding: '10px' }}>
                            <option value="READ COMMITTED">Tier 2: READ COMMITTED (Allows Non-Repeatable Read)</option>
                            <option value="REPEATABLE READ">Tier 3: REPEATABLE READ (Prevents Non-Repeatable Read)</option>
                        </select>
                        <button onClick={executeRepeatA} className="btn-primary" style={{ backgroundColor: '#14b8a6', width: '100%', marginBottom: '15px' }}>1. Start Reading (5s Window)</button>
                        <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>Status: {repeatAStatus}</div>

                        {repeatResult && (
                            <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px', marginTop: '15px', border: `1px solid ${repeatResult.read1 !== repeatResult.read2 ? '#ef4444' : '#22c55e'}` }}>
                                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Read 1 (Start): <span style={{ color: '#fff' }}>${parseFloat(repeatResult.read1).toLocaleString()}</span></div>
                                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Read 2 (End): <span style={{ color: repeatResult.read1 !== repeatResult.read2 ? '#ef4444' : '#fff' }}>${parseFloat(repeatResult.read2).toLocaleString()}</span></div>
                                {repeatResult.read1 !== repeatResult.read2 && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>⚠️ Non-Repeatable Read Detected!</div>}
                            </div>
                        )}
                    </div>

                    <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#f43f5e', marginBottom: '15px' }}>Tx B (The Sneaky Updater)</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Deducts $50 and strictly COMMITS the change mid-way through Tx A's execution.</p>
                        <button onClick={executeRepeatB} className="btn-primary" style={{ backgroundColor: '#f43f5e', width: '100%', marginBottom: '15px' }}>2. Update & Commit Data</button>
                        <div style={{ color: repeatBStatus.includes('COMMITTED') ? '#22c55e' : '#94a3b8', fontFamily: 'monospace' }}>Status: {repeatBStatus}</div>
                    </div>
                </div>
            )}

            {/* SCENARIO 3: PHANTOM READ */}
            {scenario === 'phantom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#8b5cf6', marginBottom: '15px' }}>Tx A (The Range Auditor)</h3>
                        <select className="premium-input" value={phantomIsolation} onChange={(e) => setPhantomIsolation(e.target.value)} style={{ width: '100%', marginBottom: '20px', padding: '10px' }}>
                            <option value="READ COMMITTED">Tier 2: READ COMMITTED (Allows Phantom)</option>
                            <option value="SERIALIZABLE">Tier 4: SERIALIZABLE (Blocks Phantom)</option>
                        </select>
                        <button onClick={executePhantomA} className="btn-primary" style={{ backgroundColor: '#8b5cf6', width: '100%', marginBottom: '15px' }}>1. Start Full Audit (5s)</button>
                        <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>Status: {phantomAStatus}</div>

                        {phantomResult && (
                            <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px', marginTop: '15px', border: `1px solid ${phantomResult.count1 !== phantomResult.count2 ? '#ef4444' : '#22c55e'}` }}>
                                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Row Count (Read 1): <span style={{ color: '#fff' }}>{phantomResult.count1}</span></div>
                                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Row Count (Read 2): <span style={{ color: phantomResult.count1 !== phantomResult.count2 ? '#ef4444' : '#fff' }}>{phantomResult.count2}</span></div>
                                {phantomResult.count1 !== phantomResult.count2 && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>⚠️ Phantom Row Detected!</div>}
                            </div>
                        )}
                    </div>

                    <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#ec4899', marginBottom: '15px' }}>Tx B (The Inserter)</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Attempts to insert a new account while the Auditor is actively counting.</p>
                        <button onClick={executePhantomB} className="btn-primary" style={{ backgroundColor: '#ec4899', width: '100%', marginBottom: '15px' }}>2. Insert Phantom Row</button>
                        <div style={{ color: phantomBStatus.includes('Inserted') ? '#22c55e' : '#94a3b8', fontFamily: 'monospace' }}>Status: {phantomBStatus}</div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ConcurrencyLab;