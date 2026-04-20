import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './RecoveryLab.css';

// ── tiny helpers ──────────────────────────────────────────────────────────────
const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ── State machine ─────────────────────────────────────────────────────────────
const PHASE = {
  IDLE:       'idle',
  FLOATING:   'floating',    // transaction in RAM, uncommitted
  KILLED:     'killed',      // container SIGKILLed mid-transaction
  RECOVERING: 'recovering',  // InnoDB crash-recovery in progress
  RECOVERED:  'recovered',   // rollback complete, original balances restored
  COMMITTED:  'committed',   // 15 s elapsed, transaction committed to disk
};

// ── WAL log templates ─────────────────────────────────────────────────────────
const WAL = {
  start:    (ts) => `[${ts}] TXN#4821 BEGIN  — Transfer $1,000,000  (Acc#3 → Acc#1)`,
  write:    (ts) => `[${ts}] WAL WRITE — Old Acc#3=$5,000,000 | New Acc#3=$4,000,000`,
  write2:   (ts) => `[${ts}] WAL WRITE — Old Acc#1=$2,500,000 | New Acc#1=$3,500,000`,
  bufPool:  (ts) => `[${ts}] BUFFER POOL — Dirty pages held in RAM (UNCOMMITTED)`,
  commit:   (ts) => `[${ts}] TXN#4821 COMMIT — Flushing dirty pages to disk…`,
  durable:  (ts) => `[${ts}] DURABILITY ✓ — All changes persisted. fsync() complete.`,
  killed:   (ts) => `[${ts}] !! SIGKILL — Process terminated. Disk NOT updated !!`,
  reboot:   (ts) => `[${ts}] InnoDB: Starting crash recovery scan…`,
  redo:     (ts) => `[${ts}] InnoDB: Applying Redo Log — rolling back TXN#4821`,
  done:     (ts) => `[${ts}] InnoDB: Recovery complete. Database in clean state.`,
};

const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

// ── Component ─────────────────────────────────────────────────────────────────
export default function RecoveryLab() {
  const [phase,      setPhase]      = useState(PHASE.IDLE);
  const [countdown,  setCountdown]  = useState(0);
  const [ramData,    setRamData]    = useState(null);
  const [walLog,     setWalLog]     = useState([]);
  const [statusMsg,  setStatusMsg]  = useState('System idle — ready to begin simulation.');
  const [particles,  setParticles]  = useState([]);

  // refs to avoid stale-closure bugs
  const timerRef      = useRef(null);   // countdown setTimeout id
  const ramFetchRef   = useRef(null);   // ram-peek setTimeout id  ← FIX #2
  const phaseRef      = useRef(phase);  // always mirrors phase    ← FIX #1
  const walEndRef     = useRef(null);

  // keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // auto-scroll WAL terminal
  useEffect(() => { walEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [walLog]);

  // ── Countdown tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  // ── FIX #1: auto-commit when timer hits 0 while still FLOATING ───────────
  useEffect(() => {
    if (countdown === 0 && phaseRef.current === PHASE.FLOATING) {
      handleAutoCommit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const appendWal = (...lines) =>
    setWalLog((prev) => [
      ...prev,
      ...lines.map((l) => ({ id: Date.now() + Math.random(), text: l })),
    ]);

  const spawnParticles = () => {
    const ps = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x:  40 + Math.random() * 20,
      y:  40 + Math.random() * 20,
      dx: (Math.random() - 0.5) * 140,
      dy: (Math.random() - 0.5) * 140,
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 900);
  };

  // ── Step 1 — start slow transaction ───────────────────────────────────────
  const startSlowTransaction = async () => {
    setPhase(PHASE.FLOATING);
    setRamData(null);
    setWalLog([]);
    setCountdown(15);
    setStatusMsg('⚡ Transaction is floating in the Buffer Pool — UNCOMMITTED!');

    appendWal(
      WAL.start(now()),
      WAL.write(now()),
      WAL.write2(now()),
      WAL.bufPool(now()),
    );

    try {
      axios.post('http://localhost:5000/api/crash-lab/start-transfer');

      // FIX #2 — store the timeout id so executeKill can cancel it
      ramFetchRef.current = setTimeout(async () => {
        // Only apply if we're still in FLOATING (not yet killed)
        if (phaseRef.current !== PHASE.FLOATING) return;
        try {
          const res = await axios.get('http://localhost:5000/api/crash-lab/monitor');
          setRamData(res.data);
        } catch { /* DB might already be dead — silently ignore */ }
      }, 1200);
    } catch {
      setStatusMsg('❌ Error: Could not reach backend.');
      setPhase(PHASE.IDLE);
    }
  };

  // ── Step 2 — kill the container ───────────────────────────────────────────
  const executeKill = async () => {
    // FIX #2 — cancel the pending ramData fetch before it can overwrite null
    clearTimeout(ramFetchRef.current);
    clearTimeout(timerRef.current);
    setCountdown(0);
    setPhase(PHASE.KILLED);
    setStatusMsg('💀 SIGKILL sent — database process terminated mid-transaction!');
    spawnParticles();
    appendWal(WAL.killed(now()));

    try {
      const res = await axios.post('http://localhost:5000/api/crash-lab/kill');
      setStatusMsg(`💀 ${res.data.message}`);
    } catch {
      setStatusMsg('❌ Error: Failed to kill container.');
    }
    setRamData(null);
  };

  // ── Step 3 — reboot and recover ───────────────────────────────────────────
  const executeRecover = async () => {
    setPhase(PHASE.RECOVERING);
    setStatusMsg('🔄 Rebooting InnoDB — scanning Redo Log for incomplete transactions…');
    appendWal(WAL.reboot(now()), WAL.redo(now()));

    try {
      const res = await axios.post('http://localhost:5000/api/crash-lab/recover');
      setStatusMsg(`✅ ${res.data.message}`);
      appendWal(WAL.done(now()));
      const monitor = await axios.get('http://localhost:5000/api/crash-lab/monitor');
      setRamData(monitor.data);
      setPhase(PHASE.RECOVERED);
    } catch {
      setStatusMsg('❌ Error: Failed to recover database.');
      setPhase(PHASE.KILLED);   // allow retry
    }
  };

  // ── FIX #1 — auto-commit handler (called when countdown reaches 0) ────────
  const handleAutoCommit = async () => {
    // Guard: only run if we're truly still floating (race-safe via phaseRef)
    if (phaseRef.current !== PHASE.FLOATING) return;

    setPhase(PHASE.COMMITTED);
    setStatusMsg('✅ Transaction COMMITTED — changes flushed to disk. Durability guaranteed!');
    appendWal(WAL.commit(now()), WAL.durable(now()));

    // Fetch the now-committed balances to display in the Disk block
    try {
      const res = await axios.get('http://localhost:5000/api/crash-lab/monitor');
      setRamData(res.data);
    } catch { /* backend might be unreachable in demo */ }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    clearTimeout(timerRef.current);
    clearTimeout(ramFetchRef.current);
    setPhase(PHASE.IDLE);
    setCountdown(0);
    setRamData(null);
    setWalLog([]);
    setStatusMsg('System idle — ready to begin simulation.');
  };

  // ── Derived booleans ───────────────────────────────────────────────────────
  const isFloating   = phase === PHASE.FLOATING;
  const isKilled     = phase === PHASE.KILLED;
  const isRecovering = phase === PHASE.RECOVERING;
  const isRecovered  = phase === PHASE.RECOVERED;
  const isCommitted  = phase === PHASE.COMMITTED;   // FIX #1

  const acc1 = ramData?.find((r) => r.account_id === 1);
  const acc3 = ramData?.find((r) => r.account_id === 3);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="rl-root">

      {/* ── Header ── */}
      <div className="rl-header">
        <div className="rl-header-left">
          <span className="rl-badge">ACID DEMO</span>
          <h2 className="rl-title">💥 Crash Recovery Lab</h2>
          <p className="rl-subtitle">
            Proving <strong>Atomicity</strong> &amp; <strong>Write-Ahead Logging (WAL)</strong> — watch $1 M
            float in the InnoDB Buffer Pool, then either commit cleanly <em>or</em> survive a sudden kill
            and roll back via the Redo Log.
          </p>
        </div>
        <div className="rl-concept-pills">
          <span className="rl-pill pill-blue">InnoDB Buffer Pool</span>
          <span className="rl-pill pill-amber">Redo Log (WAL)</span>
          <span className="rl-pill pill-green">Crash Recovery</span>
          <span className="rl-pill pill-red">Atomicity</span>
        </div>
      </div>

      {/* ── Architecture Pipeline ── */}
      <div className="rl-pipeline">

        {/* RAM / Buffer Pool */}
        <PipelineBlock
          icon="🧠"
          label="Buffer Pool"
          sub="RAM (Volatile)"
          active={isFloating}
          danger={isKilled}
          success={isRecovered || isCommitted}
          committed={isCommitted}
          color="blue"
        >
          {/* Shimmer while we wait for the ram-peek response */}
          {isFloating && !ramData && (
            <div className="rl-shimmer-row">
              <span className="rl-shimmer" style={{ width: '80%' }} />
              <span className="rl-shimmer" style={{ width: '60%' }} />
            </div>
          )}

          {/* Dirty-page data (floating) */}
          {ramData && isFloating && (
            <div className="rl-ram-accounts">
              <AccountRow label="Receiver (ID 1)" value={fmt(acc1?.balance)} positive />
              <AccountRow label="Sender   (ID 3)" value={fmt(acc3?.balance)} negative />
              <p className="rl-hint-note">⚠ Dirty pages — not yet on disk</p>
            </div>
          )}

          {/* After a clean commit: buffer pool flushed */}
          {isCommitted && (
            <div className="rl-ram-accounts">
              <p className="rl-flushed-hint">✓ Buffer pool flushed — pages written to disk</p>
            </div>
          )}

          {/* After crash-recovery rollback */}
          {isRecovered && ramData && (
            <div className="rl-ram-accounts">
              <AccountRow label="Receiver (ID 1)" value={fmt(acc1?.balance)} restored />
              <AccountRow label="Sender   (ID 3)" value={fmt(acc3?.balance)} restored />
            </div>
          )}

          {/* Idle */}
          {!isFloating && !isKilled && !isCommitted && !isRecovered && (
            <p className="rl-empty-hint">Idle — no dirty pages</p>
          )}

          {/* Dead overlay */}
          {isKilled && (
            <div className="rl-dead-overlay">
              <span>💥</span>
              <span>PROCESS DEAD</span>
            </div>
          )}
        </PipelineBlock>

        {/* Arrow RAM → WAL */}
        <PipelineArrow
          active={isFloating}
          danger={isKilled}
          success={isCommitted || isRecovered}
        />

        {/* WAL / Redo Log */}
        <PipelineBlock
          icon="📋"
          label="Redo Log"
          sub="Write-Ahead Log (Disk)"
          active={isFloating || isRecovering || isRecovered || isCommitted}
          danger={false}
          success={isRecovered || isCommitted}
          committed={isCommitted}
          color="amber"
        >
          <div className="rl-wal-mini">
            {walLog.slice(-4).map((entry) => (
              <div key={entry.id} className="rl-wal-mini-line">
                {entry.text.substring(0, 54)}…
              </div>
            ))}
            {walLog.length === 0 && <p className="rl-empty-hint">No entries yet</p>}
          </div>
        </PipelineBlock>

        {/* Arrow WAL → Disk */}
        <PipelineArrow
          active={isRecovered || isCommitted}
          danger={isKilled}
          success={isCommitted || isRecovered}
        />

        {/* Disk Storage */}
        <PipelineBlock
          icon="💾"
          label="Disk Storage"
          sub="Committed State"
          active={isRecovered || isCommitted}
          danger={isKilled}
          success={isRecovered || isCommitted}
          committed={isCommitted}
          color="green"
        >
          {/* FIX #7 — committed path shows the NEW committed balances */}
          {isCommitted && ramData && (
            <div className="rl-ram-accounts">
              <AccountRow label="Receiver (ID 1)" value={fmt(acc1?.balance)} committed />
              <AccountRow label="Sender   (ID 3)" value={fmt(acc3?.balance)} committed />
              <p className="rl-commit-proof">✓ Written to disk — Durability guaranteed</p>
            </div>
          )}

          {isCommitted && !ramData && (
            <p className="rl-flushed-hint">✓ Transaction committed to disk</p>
          )}

          {/* Recovered path — rolled-back balances */}
          {isRecovered && ramData && (
            <div className="rl-ram-accounts">
              <AccountRow label="Receiver (ID 1)" value={fmt(acc1?.balance)} restored />
              <AccountRow label="Sender   (ID 3)" value={fmt(acc3?.balance)} restored />
              <p className="rl-rollback-proof">⟳ Rolled back — original balances restored</p>
            </div>
          )}

          {/* Kill path */}
          {isKilled && (
            <p className="rl-empty-hint">⚠ Write never reached disk</p>
          )}

          {/* Default */}
          {!isCommitted && !isRecovered && !isKilled && (
            <p className="rl-empty-hint">Awaiting committed transaction</p>
          )}
        </PipelineBlock>
      </div>

      {/* ── Bottom: Controls + WAL Terminal ── */}
      <div className="rl-bottom">

        {/* Controls */}
        <div className="rl-controls-panel">
          <h3 className="rl-panel-title">⚙ Simulation Controls</h3>

          <StepCard
            step="01"
            title="Start $1M Transfer"
            desc="Initiates a slow 15-second transaction. Money enters the Buffer Pool but is NOT yet committed to disk."
            color="amber"
            disabled={phase !== PHASE.IDLE}
            onClick={startSlowTransaction}
            btnLabel="▶ Launch Transfer"
          />

          {/* FIX #3 — kill only enabled during FLOATING, not any other phase */}
          <StepCard
            step="02"
            title="Pull the Plug ⚡"
            desc="Sends SIGKILL to the Docker container mid-transaction. Simulates a sudden power cut before commit."
            color="red"
            disabled={!isFloating}
            onClick={executeKill}
            btnLabel="⚡ KILL DATABASE"
            danger
          />

          <StepCard
            step="03"
            title="Reboot & Recover"
            desc="Restarts InnoDB. The engine scans the Redo Log, finds the incomplete transaction, and rolls it back."
            color="green"
            disabled={!isKilled}
            onClick={executeRecover}
            btnLabel="🔄 Reboot Database"
          />

          {/* FIX #5 — reset also shown for COMMITTED */}
          {(isRecovered || isKilled || isCommitted) && (
            <button className="rl-btn-reset" onClick={reset}>↺ Reset Lab</button>
          )}

          {/* Countdown ring — only while floating */}
          {countdown > 0 && isFloating && (
            <div className="rl-countdown-wrap">
              <svg className="rl-ring" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" className="rl-ring-track" />
                <circle
                  cx="32" cy="32" r="28"
                  className="rl-ring-prog"
                  strokeDasharray={`${(countdown / 15) * 176} 176`}
                />
              </svg>
              <span className="rl-ring-num">{countdown}</span>
              <span className="rl-ring-label">COMMIT IN</span>
            </div>
          )}

          {/* FIX #1 — show committed badge when timer expired cleanly */}
          {isCommitted && (
            <div className="rl-commit-badge">
              <span className="rl-commit-icon">✅</span>
              <div>
                <div className="rl-commit-badge-title">Transaction Committed!</div>
                <div className="rl-commit-badge-sub">
                  Timer expired — WAL flushed to disk. No crash, no rollback. Durability holds.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WAL Terminal */}
        <div className="rl-wal-panel">
          <h3 className="rl-panel-title">
            📋 Redo Log Terminal
            <span className="rl-terminal-dot" />
          </h3>
          <div className="rl-terminal">
            {walLog.length === 0 && (
              <span className="rl-terminal-idle">mysql&gt; Waiting for transaction…▌</span>
            )}
            {walLog.map((entry) => (
              <div key={entry.id} className={`rl-terminal-line ${getLineClass(entry.text)}`}>
                {entry.text}
              </div>
            ))}
            <div ref={walEndRef} />
          </div>

          {/* FIX #4 — getStatusClass now handles COMMITTED → green */}
          <div className={`rl-statusbar ${getStatusClass(phase)}`}>
            <span className="rl-status-dot" />
            <span>{statusMsg}</span>
          </div>
        </div>
      </div>

      {/* Kill particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="rl-particle"
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, left: `${p.x}%`, top: `${p.y}%` }}
        />
      ))}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PipelineBlock({ icon, label, sub, active, danger, success, committed, color, children }) {
  const cls = [
    'rl-block',
    `rl-block-${color}`,
    active     && 'rl-block-active',
    danger     && 'rl-block-danger',
    success    && 'rl-block-success',
    committed  && 'rl-block-committed',   // FIX #1 — new visual state
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <div className="rl-block-header">
        <span className="rl-block-icon">{icon}</span>
        <div>
          <div className="rl-block-label">{label}</div>
          <div className="rl-block-sub">{sub}</div>
        </div>
        {active && !danger && !committed && <span className="rl-pulse-dot" />}
        {committed && <span className="rl-commit-dot" />}
        {danger  && <span className="rl-danger-dot"  />}
      </div>
      <div className="rl-block-body">{children}</div>
    </div>
  );
}

function PipelineArrow({ active, danger, success }) {
  const cls = [
    'rl-arrow',
    active  && 'rl-arrow-active',
    danger  && 'rl-arrow-danger',
    success && 'rl-arrow-success',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className="rl-arrow-line" />
      <div className="rl-arrow-head">▶</div>
      {active && <div className="rl-arrow-packet" />}
    </div>
  );
}

function AccountRow({ label, value, positive, negative, restored, committed }) {
  const cls = [
    'rl-acc-row',
    positive  && 'acc-positive',
    negative  && 'acc-negative',
    restored  && 'acc-restored',
    committed && 'acc-committed',   // FIX #7 — committed colour
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <span className="rl-acc-label">{label}</span>
      <span className="rl-acc-value">${value}</span>
    </div>
  );
}

function StepCard({ step, title, desc, color, disabled, onClick, btnLabel, danger }) {
  return (
    <div className={`rl-step-card step-${color} ${disabled ? 'step-disabled' : ''}`}>
      <div className="rl-step-num">STEP {step}</div>
      <div className="rl-step-title">{title}</div>
      <div className="rl-step-desc">{desc}</div>
      <button
        className={`rl-step-btn ${danger ? 'rl-step-btn-danger' : ''}`}
        disabled={disabled}
        onClick={onClick}
      >
        {btnLabel}
      </button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getLineClass(text) {
  if (text.includes('SIGKILL') || text.includes('!!'))           return 'line-danger';
  if (text.includes('COMMIT') || text.includes('DURABILITY'))    return 'line-success';
  if (text.includes('BEGIN')  || text.includes('WAL WRITE'))     return 'line-amber';
  if (text.includes('Recovery complete') || text.includes('clean state')) return 'line-success';
  if (text.includes('rolling back') || text.includes('crash recovery'))   return 'line-cyan';
  return 'line-default';
}

// FIX #4 — COMMITTED now maps to status-success (green)
function getStatusClass(phase) {
  if (phase === PHASE.KILLED)     return 'status-danger';
  if (phase === PHASE.RECOVERED)  return 'status-success';
  if (phase === PHASE.COMMITTED)  return 'status-success';
  if (phase === PHASE.FLOATING || phase === PHASE.RECOVERING) return 'status-warn';
  return 'status-idle';
}
