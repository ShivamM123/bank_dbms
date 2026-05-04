import { useState } from 'react';
import axios from 'axios';

function ConcurrencyLab() {
    const [scenario, setScenario] = useState('dirty');
    const [isProcessing, setIsProcessing] = useState(false);

    // Dirty Read States
    const [txAStatus, setTxAStatus] = useState('Awaiting execution...');
    const [txBStatus, setTxBStatus] = useState('Awaiting execution...');
    const [dirtyResult, setDirtyResult] = useState(null);
    const [dirtyIsolation, setDirtyIsolation] = useState('READ UNCOMMITTED');

    // Repeatable Read States
    const [repeatAStatus, setRepeatAStatus] = useState('Awaiting execution...');
    const [repeatBStatus, setRepeatBStatus] = useState('Awaiting execution...');
    const [repeatResult, setRepeatResult] = useState(null);
    const [repeatIsolation, setRepeatIsolation] = useState('READ COMMITTED');

    // Phantom Read States
    const [phantomAStatus, setPhantomAStatus] = useState('Awaiting execution...');
    const [phantomBStatus, setPhantomBStatus] = useState('Awaiting execution...');
    const [phantomResult, setPhantomResult] = useState(null);
    const [phantomIsolation, setPhantomIsolation] = useState('READ COMMITTED');

    // --- API LOGIC ---
    const executeTxA = async () => {
        setIsProcessing(true); setTxAStatus('⏳ Holding lock in RAM for 5s...'); setDirtyResult(null);
        try { await axios.post('http://localhost:5000/api/concurrency/tx-a'); setTimeout(() => { setTxAStatus('🛑 Rolled Back.'); setIsProcessing(false); }, 5000); }
        catch (error) { setTxAStatus('🛑 Error communicating with DB'); setIsProcessing(false); }
    };
    const executeTxB = async () => {
        setTxBStatus('⏳ Fetching...');
        try {
            const res = await axios.get(`http://localhost:5000/api/concurrency/tx-b?isolation=${dirtyIsolation}`);
            setDirtyResult({ balance: res.data.balance, isolation: dirtyIsolation }); setTxBStatus(`✅ Read complete`);
        } catch (error) { setTxBStatus('🛑 Error fetching balance'); }
    };

    const executeRepeatA = async () => {
        setIsProcessing(true); setRepeatAStatus('⏳ Auditing... (Holding 5s)'); setRepeatResult(null);
        try {
            const res = await axios.get(`http://localhost:5000/api/concurrency/repeat-tx-a?isolation=${repeatIsolation}`);
            setRepeatResult({ ...res.data, isolation: repeatIsolation }); setRepeatAStatus('✅ Audit Complete.'); setIsProcessing(false);
        } catch (error) { setRepeatAStatus('🛑 Error executing Reader Tx'); setIsProcessing(false); }
    };
    const executeRepeatB = async () => {
        setRepeatBStatus('⏳ Updating database...');
        try { await axios.post('http://localhost:5000/api/concurrency/repeat-tx-b'); setRepeatBStatus(`✅ Committed to Disk`); setTimeout(() => setRepeatBStatus('Awaiting execution...'), 10000); }
        catch (error) { setRepeatBStatus('🛑 Error executing Updater'); }
    };

    const executePhantomA = async () => {
        setIsProcessing(true); setPhantomAStatus('⏳ Counting rows... (Holding 5s)'); setPhantomResult(null);
        try {
            const res = await axios.get(`http://localhost:5000/api/concurrency/phantom-tx-a?isolation=${phantomIsolation}`);
            setPhantomResult({ ...res.data, isolation: phantomIsolation }); setPhantomAStatus('✅ Audit Complete.'); setIsProcessing(false);
        } catch (error) { setPhantomAStatus('🛑 Error executing Auditor'); setIsProcessing(false); }
    };
    const executePhantomB = async () => {
        setPhantomBStatus('⏳ Inserting row...');
        try { await axios.post('http://localhost:5000/api/concurrency/phantom-tx-b'); setPhantomBStatus(`✅ Row Inserted Successfully`); setTimeout(() => setPhantomBStatus('Awaiting execution...'), 10000); }
        catch (error) { setPhantomBStatus('🛑 Blocked by Range Lock!'); }
    };

    // --- REUSABLE UI COMPONENTS ---
    const NavButton = ({ id, label, activeColor }) => {
        const isActive = scenario === id;
        return (
            <button onClick={() => setScenario(id)} style={{ backgroundColor: isActive ? activeColor : 'transparent', color: isActive ? '#fff' : '#64748b', border: 'none', padding: '10px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: isActive ? `0 4px 15px ${activeColor}40` : 'none' }}>
                {label}
            </button>
        );
    };

    const ActionButton = ({ onClick, disabled, label, colorHex, icon }) => (
        <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: disabled ? 'not-allowed' : 'pointer', backgroundColor: disabled ? `${colorHex}10` : `${colorHex}15`, color: colorHex, border: `1px solid ${disabled ? `${colorHex}30` : `${colorHex}60`}`, transition: 'all 0.2s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: disabled ? 'none' : `0 4px 20px ${colorHex}15` }}>
            {icon} {label}
        </button>
    );

    const TheoryBanner = ({ color, title, text }) => (
        <div style={{ background: `linear-gradient(90deg, ${color}15, transparent)`, borderLeft: `4px solid ${color}`, padding: '16px 20px', borderRadius: '0 8px 8px 0', marginBottom: '25px' }}>
            <strong style={{ color: color, display: 'block', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '12px' }}>{title}</strong>
            <span style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>{text}</span>
        </div>
    );

    const LiveTerminal = ({ status }) => {
        let textColor = '#38bdf8'; // Blue Default
        if (status.includes('🛑') || status.includes('Error')) textColor = '#ef4444';
        else if (status.includes('✅')) textColor = '#10b981';
        else if (status.includes('⏳')) textColor = '#f59e0b';

        return (
            <div style={{ marginTop: '15px', background: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', textAlign: 'left' }}>
                <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px' }}>Live Connection Output</div>
                <div style={{ color: textColor, fontSize: '13px', fontFamily: 'monospace' }}>&gt; {status}</div>
            </div>
        );
    };

    const EngineAnalysis = ({ type, title, explanation }) => (
        <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', border: `1px solid ${type === 'danger' ? '#ef444450' : '#10b98150'}`, background: type === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', textAlign: 'left' }}>
            <h4 style={{ color: type === 'danger' ? '#fca5a5' : '#86efac', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {type === 'danger' ? '⚠️ ANOMALY EXPLANATION' : '🛡️ ISOLATION MECHANICS'}
            </h4>
            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                <strong>{title}:</strong> {explanation}
            </p>
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>

            {/* HEADER SECTION */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ color: '#f8fafc', fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    MVCC Concurrency Engine
                </h2>
                <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto 30px' }}>
                    Select an isolation tier and execute transactions to see how the database engine resolves memory and locking conflicts.
                </p>

                <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.6)', padding: '6px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                    <NavButton id="dirty" label="1. Dirty Read" activeColor="#3b82f6" />
                    <NavButton id="repeatable" label="2. Fuzzy Read" activeColor="#14b8a6" />
                    <NavButton id="phantom" label="3. Phantom Read" activeColor="#8b5cf6" />
                </div>
            </div>

            <div style={{ background: 'linear-gradient(180deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.6) 100%)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '30px', backdropFilter: 'blur(12px)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>

                {/* ================= SCENARIO 1: DIRTY READ ================= */}
                {scenario === 'dirty' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <TheoryBanner color="#3b82f6" title="Scenario 1: The Dirty Read" text="A Dirty Read occurs when Transaction B is allowed to read uncommitted data from Transaction A's RAM. If Transaction A crashes or rolls back, Transaction B has just made a decision based on fake data." />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                            <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(51,65,85,0.6)', padding: '25px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />
                                <h3 style={{ color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ color: '#f59e0b' }}>⚠️</span> Transaction A (Saboteur)
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '25px', minHeight: '60px' }}>
                                    Deducts $1,000 and intentionally holds the uncommitted state in RAM for 5 seconds before forcing a rollback.
                                </p>
                                <ActionButton onClick={executeTxA} disabled={isProcessing} label="Initialize Sabotage" colorHex="#f59e0b" icon="⚡" />
                                <LiveTerminal status={txAStatus} />
                            </div>

                            <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(51,65,85,0.6)', padding: '25px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />
                                <h3 style={{ color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ color: '#3b82f6' }}>🔍</span> Transaction B (Reader)
                                </h3>
                                <div style={{ marginBottom: '18px', minHeight: '60px' }}>
                                    <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'block' }}>Engine Isolation Policy:</label>
                                    <select value={dirtyIsolation} onChange={(e) => setDirtyIsolation(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: dirtyIsolation === 'READ UNCOMMITTED' ? '#ef4444' : '#10b981', border: `1px solid ${dirtyIsolation === 'READ UNCOMMITTED' ? '#ef444450' : '#10b98150'}`, outline: 'none', fontWeight: '600' }}>
                                        <option value="READ UNCOMMITTED">Tier 1: READ UNCOMMITTED (Vulnerable)</option>
                                        <option value="READ COMMITTED">Tier 2: READ COMMITTED (Protected)</option>
                                    </select>
                                </div>
                                <ActionButton onClick={executeTxB} label="Fetch Live Balance" colorHex="#3b82f6" icon="📡" />
                                <LiveTerminal status={txBStatus} />
                            </div>
                        </div>

                        <div style={{ background: '#020617', borderRadius: '16px', border: `1px solid ${dirtyResult?.balance === '4000.00' ? '#ef444450' : dirtyResult?.balance === '5000.00' ? '#10b98150' : '#1e293b'}`, padding: '25px', textAlign: 'center' }}>
                            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>Memory Snapshot Retrieved</span>
                            <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'monospace', margin: '10px 0', color: dirtyResult?.balance === '4000.00' ? '#ef4444' : dirtyResult?.balance === '5000.00' ? '#10b981' : '#334155' }}>
                                {dirtyResult ? `$${dirtyResult.balance}` : 'WAITING FOR DATA'}
                            </div>

                            {dirtyResult?.isolation === 'READ UNCOMMITTED' && (
                                <EngineAnalysis type="danger" title="Direct Buffer Pool Access" explanation="Because you selected READ UNCOMMITTED, the database engine bypassed all safety locks. It read directly from the volatile Buffer Pool (RAM), retrieving Tx A's uncommitted math. Since Tx A rolled back, Tx B just made a decision based on data that mathematically never existed." />
                            )}
                            {dirtyResult?.isolation === 'READ COMMITTED' && (
                                <EngineAnalysis type="success" title="Undo-Log Reconstruction" explanation="Because you selected READ COMMITTED, the Multi-Version Concurrency Control (MVCC) engine detected Tx A's exclusive lock. Instead of forcing you to wait, it intelligently routed your query to the Undo-Log to seamlessly reconstruct the last pristine, committed snapshot of the data." />
                            )}
                        </div>
                    </div>
                )}

                {/* ================= SCENARIO 2: FUZZY READ ================= */}
                {scenario === 'repeatable' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <TheoryBanner color="#14b8a6" title="Scenario 2: The Fuzzy Read" text="A Fuzzy (Non-Repeatable) Read happens when Transaction A reads a row, but before it finishes its work, Transaction B alters that row and permanently commits it. When A reads the row a second time, the data has mutated mid-transaction." />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                            <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(51,65,85,0.6)', padding: '25px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #14b8a6, transparent)' }} />
                                <h3 style={{ color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ color: '#14b8a6' }}>🛡️</span> Transaction A (Auditor)
                                </h3>
                                <div style={{ marginBottom: '18px', minHeight: '60px' }}>
                                    <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'block' }}>Engine Isolation Policy:</label>
                                    <select value={repeatIsolation} onChange={(e) => setRepeatIsolation(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: repeatIsolation === 'READ COMMITTED' ? '#ef4444' : '#10b981', border: `1px solid ${repeatIsolation === 'READ COMMITTED' ? '#ef444450' : '#10b98150'}`, outline: 'none', fontWeight: '600' }}>
                                        <option value="READ COMMITTED">Tier 2: READ COMMITTED (Vulnerable)</option>
                                        <option value="REPEATABLE READ">Tier 3: REPEATABLE READ (Safe)</option>
                                    </select>
                                </div>
                                <ActionButton onClick={executeRepeatA} disabled={isProcessing} label="Open 5s Audit Window" colorHex="#14b8a6" icon="⏱️" />
                                <LiveTerminal status={repeatAStatus} />
                            </div>

                            <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(51,65,85,0.6)', padding: '25px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #f43f5e, transparent)' }} />
                                <h3 style={{ color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ color: '#f43f5e' }}>🥷</span> Transaction B (Updater)
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '25px', minHeight: '60px' }}>
                                    Deducts $50 and commits directly to disk, altering reality while the Auditor is still working.
                                </p>
                                <ActionButton onClick={executeRepeatB} label="Force Disk Update" colorHex="#f43f5e" icon="💾" />
                                <LiveTerminal status={repeatBStatus} />
                            </div>
                        </div>

                        {repeatResult && (
                            <div style={{ background: '#020617', borderRadius: '16px', border: `1px solid ${repeatResult.read1 !== repeatResult.read2 ? '#ef444450' : '#10b98150'}`, padding: '25px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '20px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Read 1 (Start)</span>
                                        <div style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', color: '#f8fafc', marginTop: '8px' }}>${parseFloat(repeatResult.read1).toLocaleString()}</div>
                                    </div>
                                    <div style={{ color: '#334155', fontSize: '32px' }}>➔</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Read 2 (End)</span>
                                        <div style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', color: repeatResult.read1 !== repeatResult.read2 ? '#ef4444' : '#10b981', marginTop: '8px' }}>${parseFloat(repeatResult.read2).toLocaleString()}</div>
                                    </div>
                                </div>

                                {repeatResult.isolation === 'READ COMMITTED' && (
                                    <EngineAnalysis type="danger" title="Snapshot Regeneration" explanation="Under READ COMMITTED, the database creates a brand new snapshot for every single SELECT statement. When Read 2 executed, it saw the new reality that Tx B committed. If Tx A was calculating compound interest, half its math would be based on the old number, and half on the new number." />
                                )}
                                {repeatResult.isolation === 'REPEATABLE READ' && (
                                    <EngineAnalysis type="success" title="Transaction-Scoped Snapshots" explanation="Under REPEATABLE READ (MySQL's default), MVCC anchors its snapshot to the very first query. Even though Tx B permanently altered the hard drive, the engine used the Undo-Log to feed Tx A the exact state the database was in when the audit started. The data remained mathematically consistent." />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= SCENARIO 3: PHANTOM READ ================= */}
                {scenario === 'phantom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <TheoryBanner color="#8b5cf6" title="Scenario 3: The Phantom Read" text="A Phantom Read occurs when Transaction A counts multiple rows (e.g., total active accounts). Before it finishes, Transaction B inserts a brand new row. Transaction A counts again, and a 'Phantom' record has materialized out of nowhere." />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                            <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(51,65,85,0.6)', padding: '25px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)' }} />
                                <h3 style={{ color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ color: '#8b5cf6' }}>📊</span> Transaction A (Auditor)
                                </h3>
                                <div style={{ marginBottom: '18px', minHeight: '60px' }}>
                                    <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'block' }}>Engine Isolation Policy:</label>
                                    <select value={phantomIsolation} onChange={(e) => setPhantomIsolation(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: phantomIsolation === 'READ COMMITTED' ? '#ef4444' : '#10b981', border: `1px solid ${phantomIsolation === 'READ COMMITTED' ? '#ef444450' : '#10b98150'}`, outline: 'none', fontWeight: '600' }}>
                                        <option value="READ COMMITTED">Tier 2: READ COMMITTED (Vulnerable)</option>
                                        <option value="SERIALIZABLE">Tier 4: SERIALIZABLE (Range Locked)</option>
                                    </select>
                                </div>
                                <ActionButton onClick={executePhantomA} disabled={isProcessing} label="Count Rows (5s Window)" colorHex="#8b5cf6" icon="📉" />
                                <LiveTerminal status={phantomAStatus} />
                            </div>

                            <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(51,65,85,0.6)', padding: '25px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #ec4899, transparent)' }} />
                                <h3 style={{ color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ color: '#ec4899' }}>👻</span> Transaction B (Inserter)
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '25px', minHeight: '60px' }}>
                                    Attempts to sneak a brand new Account record into the table while the Auditor is actively counting.
                                </p>
                                <ActionButton onClick={executePhantomB} label="Inject Phantom Row" colorHex="#ec4899" icon="💉" />
                                <LiveTerminal status={phantomBStatus} />
                            </div>
                        </div>

                        {phantomResult && (
                            <div style={{ background: '#020617', borderRadius: '16px', border: `1px solid ${phantomResult.count1 !== phantomResult.count2 ? '#ef444450' : '#10b98150'}`, padding: '25px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '20px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Count 1 (Start)</span>
                                        <div style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', color: '#f8fafc', marginTop: '8px' }}>{phantomResult.count1} <span style={{ fontSize: '16px', color: '#64748b' }}>rows</span></div>
                                    </div>
                                    <div style={{ color: '#334155', fontSize: '32px' }}>➔</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Count 2 (End)</span>
                                        <div style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', color: phantomResult.count1 !== phantomResult.count2 ? '#ef4444' : '#10b981', marginTop: '8px' }}>{phantomResult.count2} <span style={{ fontSize: '16px', color: '#64748b' }}>rows</span></div>
                                    </div>
                                </div>

                                {phantomResult.isolation === 'READ COMMITTED' && (
                                    <EngineAnalysis type="danger" title="Row Locks Cannot Catch Ghosts" explanation="Standard row-level locks only lock existing records. Because Tx B inserted a brand new record, it didn't trigger any locks. By the time Tx A counted the table a second time, the Phantom row had successfully materialized in the gap." />
                                )}
                                {phantomResult.isolation === 'SERIALIZABLE' && (
                                    <EngineAnalysis type="success" title="Gap & Next-Key Locking" explanation="By escalating to SERIALIZABLE, InnoDB placed a Range Lock (or Gap Lock) on the entire table index. When Tx B attempted to insert a row, the database engine literally paralyzed the transaction, forcing it to wait until Tx A's audit was completely finished. Perfect, linear isolation was achieved at the cost of concurrency speed." />
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default ConcurrencyLab;