import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS, ArcElement, BarElement, CategoryScale,
    LinearScale, Tooltip, Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ── B-Tree SVG ────────────────────────────────────────────────────────────────
function BTreeViz({ isActive }) {
    const nodes = [
        { id: 'root', x: 200, y: 28, label: 'idx_status', lv: 0 },
        { id: 'l', x: 100, y: 98, label: "'Failed'", lv: 1 },
        { id: 'r', x: 300, y: 98, label: "'Compl.'", lv: 1 },
        { id: 'll', x: 48, y: 168, label: 'Leaf A', lv: 2 },
        { id: 'lr', x: 152, y: 168, label: 'Leaf B', lv: 2 },
        { id: 'rl', x: 248, y: 168, label: 'Leaf C', lv: 2 },
        { id: 'rr', x: 352, y: 168, label: 'Leaf D', lv: 2 },
    ];
    const edges = [['root', 'l'], ['root', 'r'], ['l', 'll'], ['l', 'lr'], ['r', 'rl'], ['r', 'rr']];
    const lvColor = ['#1d4ed8', '#0f766e', '#166534'];
    const lvBorder = ['#3b82f6', '#14b8a6', '#22c55e'];

    return (
        <div>
            <p style={{ fontSize: '11px', color: isActive ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 'bold' }}>
                {isActive ? '✅ B-Tree Index — O(log N) Navigation' : '❌ Index Destroyed — O(N) Full Table Scan'}
            </p>
            <svg viewBox="0 0 400 200" style={{ width: '100%', opacity: isActive ? 1 : 0.25, transition: 'opacity 0.6s ease' }}>
                {edges.map(([f, t]) => {
                    const fn = nodes.find(n => n.id === f), tn = nodes.find(n => n.id === t);
                    return <line key={`${f}${t}`} x1={fn.x} y1={fn.y + 14} x2={tn.x} y2={tn.y - 14}
                        stroke={isActive ? '#334155' : '#1e293b'} strokeWidth="1.5" style={{ transition: 'stroke 0.6s' }} />;
                })}
                {nodes.map(n => (
                    <g key={n.id}>
                        <rect x={n.x - 38} y={n.y - 14} width="76" height="28" rx="6"
                            fill={isActive ? lvColor[n.lv] : '#1e293b'}
                            stroke={isActive ? lvBorder[n.lv] : '#334155'}
                            strokeWidth="1" style={{ transition: 'all 0.6s' }} />
                        <text x={n.x} y={n.y + 5} textAnchor="middle"
                            fill={isActive ? '#f8fafc' : '#475569'} fontSize="9" fontFamily="monospace"
                            style={{ transition: 'fill 0.6s' }}>{n.label}</text>
                    </g>
                ))}
                {!isActive && (
                    <text x="200" y="104" textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="bold" fontFamily="monospace">
                        SEQUENTIAL SCAN ↓↓↓
                    </text>
                )}
            </svg>
        </div>
    );
}

// ── Half-circle Speedometer ───────────────────────────────────────────────────
function Speedometer({ latencyMs, isIndexed }) {
    const ms = parseFloat(latencyMs || 0);
    const MAX = 300;
    const fill = Math.min(ms / MAX, 1);
    const color = isIndexed ? '#10b981' : '#ef4444';

    const gaugeData = {
        datasets: [{
            data: [fill, 1 - fill],
            backgroundColor: [color, '#1e293b'],
            borderWidth: 0,
            circumference: 180,
            rotation: -90,
        }],
    };
    const gaugeOpts = {
        responsive: true, maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 800 },
    };

    return (
        <div style={{ position: 'relative', height: '140px', width: '100%' }}>
            <Doughnut data={gaugeData} options={gaugeOpts} />
            <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'monospace', color, lineHeight: 1 }}>
                    {ms}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', letterSpacing: '1px' }}>ms latency</div>
            </div>
        </div>
    );
}

// ── Animated Rows-Scanned Bar ─────────────────────────────────────────────────
function RowsScanBar({ rows, isIndexed, isProcessing }) {
    const MAX_ROWS = 120000;
    const pct = Math.min((rows || 0) / MAX_ROWS * 100, 100);
    const color = isIndexed ? '#10b981' : '#ef4444';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rows Scanned</span>
                <span style={{ color, fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>
                    {isProcessing ? '...' : (rows || 0).toLocaleString()}
                </span>
            </div>
            <div style={{ height: '14px', background: '#0f172a', borderRadius: '7px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                <div style={{
                    height: '100%', width: isProcessing ? '100%' : `${pct}%`,
                    background: isProcessing
                        ? 'repeating-linear-gradient(90deg, #1e293b 0px, #334155 20px, #1e293b 40px)'
                        : `linear-gradient(90deg, ${color}, ${color}80)`,
                    borderRadius: '7px',
                    transition: isProcessing ? 'none' : 'width 1s cubic-bezier(0.4,0,0.2,1)',
                    animation: isProcessing ? 'scanSlide 1.2s linear infinite' : 'none',
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#334155', fontSize: '10px', fontFamily: 'monospace' }}>0</span>
                <span style={{ color: '#334155', fontSize: '10px', fontFamily: 'monospace' }}>120,000 rows</span>
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
function PerformanceLab() {
    const [telemetry, setTelemetry] = useState(null);
    const [indexStatus, setIndexStatus] = useState('Checking...');
    const [isIndexed, setIsIndexed] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [history, setHistory] = useState([]); // [{ms, indexed}]

    const runAnalysis = async () => {
        setIsProcessing(true);
        try {
            const res = await axios.get('http://localhost:5000/api/optimization/analyze');
            const d = res.data;
            const idx = d.explain.type !== 'ALL';
            setTelemetry(d);
            setIsIndexed(idx);
            setIndexStatus(idx ? 'ACTIVE — B-Tree Scan' : 'OFFLINE — Full Table Scan');
            setHistory(prev => [...prev.slice(-7), { ms: parseFloat(d.actualTimeMs), indexed: idx }]);
        } catch {
            setIndexStatus('Error connecting to DB');
        }
        setIsProcessing(false);
    };

    useEffect(() => { runAnalysis(); }, []);

    const addIndex = async () => {
        setIsProcessing(true);
        setIndexStatus('Building index on 100k+ rows…');
        try { await axios.post('http://localhost:5000/api/optimization/add-index'); } catch { }
        await runAnalysis();
    };

    const removeIndex = async () => {
        setIsProcessing(true);
        setIndexStatus('Destroying B-Tree…');
        try { await axios.post('http://localhost:5000/api/optimization/remove-index'); } catch { }
        await runAnalysis();
    };

    // History bar chart
    const historyData = {
        labels: history.map((_, i) => `Run ${i + 1}`),
        datasets: [{
            label: 'Latency (ms)',
            data: history.map(h => h.ms),
            backgroundColor: history.map(h => h.indexed ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
            borderColor: history.map(h => h.indexed ? '#10b981' : '#ef4444'),
            borderWidth: 1,
            borderRadius: 6,
        }],
    };
    const historyOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false }, tooltip: {
                backgroundColor: 'rgba(2,6,23,0.9)', borderColor: '#334155', borderWidth: 1,
                titleColor: '#f8fafc', bodyColor: '#94a3b8',
            }
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { family: 'monospace', size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'monospace', size: 10 } } },
        },
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
            <style>{`
        @keyframes scanSlide {
          0%   { background-position: 0 0; }
          100% { background-position: 80px 0; }
        }
      `}</style>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <h2 style={{
                    fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '10px',
                    background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    Query Optimization Simulator
                </h2>
                <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '580px', margin: '0 auto' }}>
                    Drop and rebuild a B-Tree index live on 100,000+ rows. Watch latency and row scan counts change in real time.
                </p>
            </div>

            {/* Control Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: '1. Set Baseline (O(N))', sub: 'Destroy the B-Tree. Forces the engine into a full sequential scan of every row.', color: '#ef4444', btn: 'Drop Index', action: removeIndex },
                    { label: '2. Execute Query', sub: 'Fire the query. Node.js measures real CPU latency and MySQL returns its EXPLAIN plan.', color: '#3b82f6', btn: 'Run Analysis', action: runAnalysis },
                    { label: '3. Optimize (O(log N))', sub: 'Build a B-Tree index. The engine skips millions of rows by navigating tree nodes.', color: '#10b981', btn: 'Build B-Tree Index', action: addIndex },
                ].map(c => (
                    <div key={c.label} style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ color: c.color, fontSize: '14px', fontWeight: '700', margin: 0 }}>{c.label}</h4>
                        <p style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.6', flex: 1, margin: 0 }}>{c.sub}</p>
                        <button onClick={c.action} disabled={isProcessing} style={{
                            padding: '11px', borderRadius: '10px', border: `1px solid ${c.color}40`,
                            background: isProcessing ? `${c.color}08` : `${c.color}15`, color: c.color,
                            fontWeight: '700', cursor: isProcessing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        }}>
                            {isProcessing ? '⏳ Processing…' : c.btn}
                        </button>
                    </div>
                ))}
            </div>

            {/* Query bar */}
            <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 22px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ color: '#38bdf8', fontSize: '13px' }}>
                    {"SELECT COUNT(*) FROM Transactions WHERE status = 'Failed' AND amount >= 0 AND RAND() >= 0';"}
                </code>
                <span style={{
                    padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    background: isIndexed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: isIndexed ? '#10b981' : '#ef4444',
                    border: `1px solid ${isIndexed ? '#10b98140' : '#ef444440'}`,
                }}>
                    {indexStatus}
                </span>
            </div>

            {/* Main Data Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                {/* Left: Speedometer + Rows + EXPLAIN */}
                <div style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '26px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h4 style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Execution Metrics</h4>

                    <Speedometer latencyMs={telemetry?.actualTimeMs} isIndexed={isIndexed} />

                    {telemetry && (
                        <RowsScanBar rows={parseInt(telemetry.explain.rows)} isIndexed={isIndexed} isProcessing={isProcessing} />
                    )}

                    {/* EXPLAIN rows */}
                    {telemetry && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h4 style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>MySQL EXPLAIN Plan</h4>
                            {[
                                { k: 'type (Scan Method)', v: telemetry.explain.type, color: telemetry.explain.type === 'ALL' ? '#ef4444' : '#10b981' },
                                { k: 'key (Index Used)', v: telemetry.explain.key || 'NULL', color: telemetry.explain.key ? '#10b981' : '#ef4444' },
                                { k: 'Extra (Notes)', v: telemetry.explain.Extra || 'None', color: '#94a3b8' },
                            ].map(row => (
                                <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#020617', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                    <span style={{ color: '#64748b', fontSize: '12px' }}>{row.k}</span>
                                    <span style={{ color: row.color, fontFamily: 'monospace', fontSize: '13px', fontWeight: '700' }}>{row.v}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: B-Tree + History Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* B-Tree */}
                    <div style={{ background: 'rgba(30,41,59,0.4)', border: `1px solid ${isIndexed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`, borderRadius: '20px', padding: '22px', transition: 'border-color 0.5s' }}>
                        <BTreeViz isActive={!!isIndexed} />
                    </div>

                    {/* Latency History */}
                    <div style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '22px', flex: 1 }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>
                            Latency History — <span style={{ color: '#10b981' }}>green=indexed</span> / <span style={{ color: '#ef4444' }}>red=scan</span>
                        </h4>
                        <div style={{ height: '140px' }}>
                            {history.length > 0
                                ? <Bar data={historyData} options={historyOpts} />
                                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#334155', fontSize: '13px' }}>Run a query to start tracking…</div>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {!telemetry && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    {isProcessing ? '⏳ Connecting to database engine…' : 'Awaiting first query…'}
                </div>
            )}
        </div>
    );
}

export default PerformanceLab;