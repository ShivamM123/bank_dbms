import { useState, useEffect } from 'react';
import axios from 'axios';
import './RecoveryLab.css';

function PerformanceLab() {
    const [telemetry, setTelemetry] = useState(null);
    const [indexStatus, setIndexStatus] = useState('Checking...');
    const [isProcessing, setIsProcessing] = useState(false);

    const runAnalysis = async () => {
        setIsProcessing(true);
        try {
            const res = await axios.get('http://localhost:5000/api/optimization/analyze');
            setTelemetry(res.data);
            setIndexStatus(res.data.explain.type !== 'ALL' ? 'ACTIVE (B-Tree Scan)' : 'OFFLINE (Full Table Scan)');
        } catch (error) {
            setIndexStatus('Error connecting to DB');
        }
        setIsProcessing(false);
    };

    useEffect(() => { runAnalysis(); }, []);

    const addIndex = async () => {
        setIsProcessing(true);
        setIndexStatus('Building Index on 100,000+ rows...');
        await axios.post('http://localhost:5000/api/optimization/add-index');
        await runAnalysis();
    };

    const removeIndex = async () => {
        setIsProcessing(true);
        setIndexStatus('Destroying Index...');
        await axios.post('http://localhost:5000/api/optimization/remove-index');
        await runAnalysis();
    };

    return (
        <div className="glass-card" style={{ padding: '40px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#a855f7', fontSize: '32px', marginBottom: '10px' }}>🚀 Query Optimization Simulator</h2>
                <p style={{ color: '#94a3b8', fontSize: '16px' }}>Understand how data structures impact massive-scale database retrieval.</p>
            </div>

            {/* EDUCATIONAL CONTROL PANEL */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>

                {/* Card 1: Drop Index */}
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ color: '#ef4444', fontSize: '18px', marginBottom: '10px' }}>1. The Baseline (O(N))</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                            Destroys the B-Tree structure. This forces the engine to read every single row in the database from top to bottom (a Linear Scan) to find the answer.
                        </p>
                    </div>
                    <button onClick={removeIndex} disabled={isProcessing} className="btn-primary" style={{ backgroundColor: '#ef4444', opacity: isProcessing ? 0.5 : 1, width: '100%' }}>
                        Drop Database Index
                    </button>
                </div>

                {/* Card 2: Ping DB */}
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ color: '#3b82f6', fontSize: '18px', marginBottom: '10px' }}>2. Execute Query</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                            Fires the query to the backend. Node.js records the exact CPU execution time, and MySQL returns its internal `EXPLAIN` execution strategy.
                        </p>
                    </div>
                    <button onClick={runAnalysis} disabled={isProcessing} className="btn-primary" style={{ backgroundColor: '#3b82f6', opacity: isProcessing ? 0.5 : 1, width: '100%' }}>
                        Ping Database Engine
                    </button>
                </div>

                {/* Card 3: Build Index */}
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ color: '#10b981', fontSize: '18px', marginBottom: '10px' }}>3. The Optimization (O(log N))</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                            Builds a Balanced Tree (B-Tree). Instead of scanning sequentially, the engine navigates the tree nodes, skipping millions of irrelevant rows instantly.
                        </p>
                    </div>
                    <button onClick={addIndex} disabled={isProcessing} className="btn-primary" style={{ backgroundColor: '#10b981', opacity: isProcessing ? 0.5 : 1, width: '100%' }}>
                        Build B-Tree Index
                    </button>
                </div>

            </div>

            {/* DASHBOARD DISPLAY */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: '#fff', margin: 0, fontFamily: 'monospace', fontSize: '16px' }}>
                        {"> SELECT COUNT(*) FROM Transactions WHERE status = 'Failed';"}
                    </h3>
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: indexStatus.includes('ACTIVE') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: indexStatus.includes('ACTIVE') ? '#10b981' : '#ef4444' }}>
                        Index: {indexStatus}
                    </span>
                </div>

                {telemetry ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '30px', gap: '30px' }}>

                        {/* Live Performance Box */}
                        <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '8px', border: `1px solid ${telemetry.explain.type === 'ALL' ? '#ef4444' : '#10b981'}` }}>
                            <h4 style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '12px', marginBottom: '20px' }}>Backend Execution Metrics</h4>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '5px' }}>ACTUAL SERVER LATENCY</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: telemetry.explain.type === 'ALL' ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
                                    {telemetry.actualTimeMs} ms
                                </div>
                            </div>

                            <div>
                                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '5px' }}>ROWS SCANNED (MYSQL ESTIMATE)</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
                                    {parseInt(telemetry.explain.rows).toLocaleString()}
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '10px' }}>
                                    {telemetry.explain.type === 'ALL' ? "⚠️ Engine is forced to read the entire table linearly." : "✅ Engine used the B-Tree to instantly filter results."}
                                </p>
                            </div>
                        </div>

                        {/* Raw Explain Data Box */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h4 style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '12px', marginBottom: '5px' }}>MySQL EXPLAIN Plan</h4>

                            <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #334155' }}>
                                <span style={{ color: '#94a3b8', fontSize: '13px' }}>type (Scan Method):</span>
                                <span style={{ color: telemetry.explain.type === 'ALL' ? '#ef4444' : '#10b981', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{telemetry.explain.type}</span>
                            </div>

                            <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #334155' }}>
                                <span style={{ color: '#94a3b8', fontSize: '13px' }}>key (Index Chosen):</span>
                                <span style={{ color: telemetry.explain.key ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{telemetry.explain.key || 'NULL'}</span>
                            </div>

                            <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #334155' }}>
                                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Extra (Engine Notes):</span>
                                <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', maxWidth: '50%' }}>{telemetry.explain.Extra || 'None'}</span>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Awaiting Database Connection...</div>
                )}
            </div>
        </div>
    );
}

export default PerformanceLab;