import { useState, useEffect, useRef, useCallback } from "react";

// ── MOODS ──────────────────────────────────────────────────────────────────────
const MOODS = [
  { id: "happy",     label: "Happy",     emoji: "😄", color: "#f1c40f", spread: 0.35, resistance: 0.3  },
  { id: "angry",     label: "Angry",     emoji: "😡", color: "#e74c3c", spread: 0.72, resistance: 0.1  },
  { id: "anxious",   label: "Anxious",   emoji: "😰", color: "#e67e22", spread: 0.65, resistance: 0.15 },
  { id: "proud",     label: "Proud",     emoji: "😤", color: "#9b59b6", spread: 0.28, resistance: 0.45 },
  { id: "sad",       label: "Sad",       emoji: "😢", color: "#3498db", spread: 0.50, resistance: 0.25 },
  { id: "excited",   label: "Excited",   emoji: "🤩", color: "#ff6b35", spread: 0.60, resistance: 0.2  },
  { id: "suspicious",label: "Suspicious",emoji: "🤨", color: "#7f8c8d", spread: 0.55, resistance: 0.3  },
  { id: "peaceful",  label: "Peaceful",  emoji: "😌", color: "#27ae60", spread: 0.20, resistance: 0.55 },
  { id: "greedy",    label: "Greedy",    emoji: "🤑", color: "#d4ac0d", spread: 0.45, resistance: 0.35 },
  { id: "rebellious",label: "Rebellious",emoji: "✊", color: "#c0392b", spread: 0.78, resistance: 0.08 },
];

// ── SEGMENTS (Indian city stereotypes) ────────────────────────────────────────
const SEGMENTS = [
  { id: "politician",  label: "Politician",   status: 10, money: 9, power: 10, resources: 8, spreadBoost: 0.4,  resistBoost: -0.3, color: "#8e44ad", desc: "High power, spreads narratives fast, rarely changes own mood" },
  { id: "businessman", label: "Seth Ji",      status: 7,  money: 10,power: 6,  resources: 9, spreadBoost: 0.1,  resistBoost: 0.35, color: "#d4ac0d", desc: "Rich, resistant to mood change, self-interested" },
  { id: "autowala",    label: "Auto Driver",  status: 3,  money: 3, power: 2,  resources: 2, spreadBoost: 0.5,  resistBoost: -0.2, color: "#e67e22", desc: "Highly connected, spreads gossip like wildfire" },
  { id: "chaiwala",    label: "Chai Wala",    status: 2,  money: 2, power: 1,  resources: 2, spreadBoost: 0.6,  resistBoost: -0.25,color: "#795548", desc: "Hub of all gossip, every mood amplified" },
  { id: "uncle",       label: "Society Uncle",status: 5,  money: 5, power: 4,  resources: 4, spreadBoost: 0.3,  resistBoost: 0.1,  color: "#607d8b", desc: "Opinionated, influences neighbours strongly" },
  { id: "student",     label: "Student",      status: 2,  money: 1, power: 1,  resources: 1, spreadBoost: 0.4,  resistBoost: -0.35,color: "#2980b9", desc: "Very susceptible to moods, fast spreader" },
  { id: "govt",        label: "Sarkari Babu", status: 6,  money: 5, power: 7,  resources: 6, spreadBoost: -0.1, resistBoost: 0.5,  color: "#546e7a", desc: "Bureaucrat, resistant, slow to react" },
  { id: "influencer",  label: "Influencer",   status: 6,  money: 4, power: 3,  resources: 3, spreadBoost: 0.7,  resistBoost: -0.4, color: "#e91e63", desc: "Massive spread radius, highly emotional" },
  { id: "police",      label: "Constable",    status: 5,  money: 4, power: 8,  resources: 5, spreadBoost: 0.0,  resistBoost: 0.4,  color: "#37474f", desc: "Resistant, spreads fear, suppresses rebellion" },
  { id: "auntie",      label: "Gossip Auntie",status: 4,  money: 4, power: 3,  resources: 3, spreadBoost: 0.65, resistBoost: -0.1, color: "#c2185b", desc: "Supreme gossip vector, turbo spreader" },
];

const GOSSIPS = [
  { id: "cricket",   label: "India won the match!",         mood: "excited",    viral: 0.9 },
  { id: "price",     label: "Petrol price hiked again",     mood: "angry",      viral: 0.8 },
  { id: "wedding",   label: "Big fat wedding next door",    mood: "happy",      viral: 0.6 },
  { id: "scam",      label: "Neta caught in scam",          mood: "rebellious", viral: 0.85 },
  { id: "promotion", label: "Sharma ji ka beta got IIT",    mood: "proud",      viral: 0.7 },
  { id: "rain",      label: "Flood warning issued",         mood: "anxious",    viral: 0.75 },
  { id: "bribe",     label: "Inspector took bribe",         mood: "suspicious", viral: 0.8 },
  { id: "shutdown",  label: "Factory closing down",         mood: "sad",        viral: 0.7 },
  { id: "tax",       label: "New tax on everything",        mood: "greedy",     viral: 0.6 },
  { id: "festival",  label: "Free mithai at the mandir",    mood: "peaceful",   viral: 0.5 },
];

const DEFAULT_MOOD = "peaceful";

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

function createPerson(id, W, H, segWeights) {
  const seg = pickWeightedSegment(segWeights);
  return {
    id, x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40),
    vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
    mood: DEFAULT_MOOD, segment: seg.id,
    moodIntensity: 0.5 + Math.random() * 0.5,
    gossipCarrying: null, gossipTimer: 0,
    pulseTimer: 0, justChanged: false,
  };
}

function pickWeightedSegment(weights) {
  const keys = Object.keys(weights);
  const total = keys.reduce((s, k) => s + weights[k], 0);
  let r = Math.random() * total;
  for (const k of keys) { r -= weights[k]; if (r <= 0) return SEGMENTS.find(s => s.id === k); }
  return SEGMENTS[0];
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function CrowdSim() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ people: [], tick: 0, W: 800, H: 500 });
  const rafRef = useRef(null);
  const [selectedMood, setSelectedMood] = useState("angry");
  const [popCount, setPopCount] = useState(60);
  const [activeMoods, setActiveMoods] = useState({});
  const [moodHistory, setMoodHistory] = useState([]);
  const [showSegments, setShowSegments] = useState(false);
  const [segWeights, setSegWeights] = useState(() => Object.fromEntries(SEGMENTS.map(s => [s.id, s.id === "chaiwala" ? 2 : 1])));
  const [gossipText, setGossipText] = useState("");
  const [gossipActive, setGossipActive] = useState(null);
  const [gossipSpreading, setGossipSpreading] = useState(false);
  const [stats, setStats] = useState({ dominant: "peaceful", entropy: 0, spreadRate: 0 });
  const [tooltip, setTooltip] = useState(null);

  // ── INIT PEOPLE ────────────────────────────────────────────────────────────
  const initPeople = useCallback((count, sw) => {
    const st = stateRef.current;
    const { W, H } = st;
    st.people = Array.from({ length: count }, (_, i) => createPerson(i, W, H, sw));
    stateRef.current.tick = 0;
  }, []);

  useEffect(() => { initPeople(popCount, segWeights); }, []);

  // ── SPREAD LOGIC ───────────────────────────────────────────────────────────
  const tickSim = useCallback(() => {
    const st = stateRef.current;
    const { people, W, H } = st;
    st.tick++;

    people.forEach(p => {
      // Move
      p.x += p.vx; p.y += p.vy;
      if (p.x < 10 || p.x > W - 10) p.vx *= -1;
      if (p.y < 10 || p.y > H - 10) p.vy *= -1;
      p.x = clamp(p.x, 5, W - 5); p.y = clamp(p.y, 5, H - 5);
      // Slow drift
      p.vx += (Math.random() - 0.5) * 0.04;
      p.vy += (Math.random() - 0.5) * 0.04;
      p.vx = clamp(p.vx, -1.2, 1.2); p.vy = clamp(p.vy, -1.2, 1.2);
      if (p.pulseTimer > 0) p.pulseTimer--;
      if (p.justChanged && p.pulseTimer <= 0) p.justChanged = false;
      if (p.gossipTimer > 0) p.gossipTimer--;
    });

    // Spread mood between neighbours
    if (st.tick % 3 === 0) {
      people.forEach(p => {
        const seg = SEGMENTS.find(s => s.id === p.segment);
        const myMood = MOODS.find(m => m.id === p.mood);
        const radius = 45 + (seg.power / 10) * 25;

        const neighbours = people.filter(o => o !== p && Math.hypot(o.x - p.x, o.y - p.y) < radius);
        if (!neighbours.length) return;

        neighbours.forEach(nbr => {
          const nbrSeg = SEGMENTS.find(s => s.id === nbr.segment);
          // Calculate if nbr catches mood from p
          const spreadChance = myMood.spread + seg.spreadBoost - nbrSeg.resistBoost + (nbrSeg.money < 3 ? 0.1 : 0) + (nbrSeg.power < 3 ? 0.1 : 0);
          // Rebellion suppressed by police
          if (p.mood === "rebellious" && nbr.segment === "police") return;
          if (Math.random() < clamp(spreadChance * 0.035, 0, 0.15)) {
            if (nbr.mood !== p.mood) {
              // resistance check
              const resist = myMood.resistance + nbrSeg.resistBoost;
              if (Math.random() > clamp(resist, 0.05, 0.95)) {
                nbr.mood = p.mood;
                nbr.justChanged = true;
                nbr.pulseTimer = 18;
                nbr.moodIntensity = clamp(p.moodIntensity * 0.85, 0.3, 1);
              }
            }
            // Gossip spread
            if (p.gossipCarrying && p.gossipTimer > 0 && !nbr.gossipCarrying) {
              if (Math.random() < 0.3 + seg.spreadBoost) {
                nbr.gossipCarrying = p.gossipCarrying;
                nbr.gossipTimer = 120 + Math.floor(Math.random() * 80);
              }
            }
          }
        });
      });
    }

    // Stats
    if (st.tick % 20 === 0) {
      const counts = {};
      MOODS.forEach(m => counts[m.id] = 0);
      people.forEach(p => counts[p.mood]++);
      const total = people.length || 1;
      const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
      const entropy = -Object.values(counts).filter(v=>v>0).map(v=>v/total).reduce((s,p)=>s+p*Math.log2(p),0);
      const changed = people.filter(p=>p.justChanged).length;
      setActiveMoods({ ...counts });
      setStats({ dominant, entropy: Math.round(entropy * 10) / 10, spreadRate: changed });
    }
  }, []);

  // ── DRAW ───────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { people, W, H } = stateRef.current;

    ctx.clearRect(0, 0, W, H);
    // Background grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Draw connection lines for gossip spreading
    if (gossipActive) {
      people.filter(p => p.gossipCarrying && p.gossipTimer > 0).forEach(p => {
        const nearby = people.filter(o => o !== p && Math.hypot(o.x-p.x,o.y-p.y)<70);
        nearby.forEach(o => {
          ctx.save();
          ctx.strokeStyle = `rgba(255,220,50,0.08)`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(o.x,o.y); ctx.stroke();
          ctx.restore();
        });
      });
    }

    // People
    people.forEach(p => {
      const mood = MOODS.find(m => m.id === p.mood);
      const seg = SEGMENTS.find(s => s.id === p.segment);
      const r = 6 + (seg.power / 10) * 5;

      // Pulse ring on change
      if (p.justChanged && p.pulseTimer > 0) {
        const pProg = 1 - p.pulseTimer / 18;
        ctx.save();
        ctx.globalAlpha = (1 - pProg) * 0.7;
        ctx.strokeStyle = mood.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + pProg * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Gossip aura
      if (p.gossipCarrying && p.gossipTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Body
      ctx.save();
      ctx.globalAlpha = 0.88 + p.moodIntensity * 0.12;
      ctx.fillStyle = mood.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();

      // Segment ring
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.restore();
    });
  }, [gossipActive]);

  // ── LOOP ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => { tickSim(); draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tickSim, draw]);

  // ── CANVAS CLICK ───────────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const { people } = stateRef.current;
    // Find nearest person
    let nearest = null, minD = Infinity;
    people.forEach(p => { const d = Math.hypot(p.x-cx, p.y-cy); if (d < minD) { minD = d; nearest = p; } });
    if (nearest && minD < 30) {
      nearest.mood = selectedMood;
      nearest.justChanged = true;
      nearest.pulseTimer = 18;
      nearest.moodIntensity = 1;
    }
  }, [selectedMood]);

  const handleCanvasHover = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const { people } = stateRef.current;
    let nearest = null, minD = Infinity;
    people.forEach(p => { const d = Math.hypot(p.x-cx, p.y-cy); if (d < minD) { minD = d; nearest = p; } });
    if (nearest && minD < 22) {
      const seg = SEGMENTS.find(s => s.id === nearest.segment);
      const mood = MOODS.find(m => m.id === nearest.mood);
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, seg, mood });
    } else setTooltip(null);
  }, []);

  // ── RESET ──────────────────────────────────────────────────────────────────
  const reset = () => { initPeople(popCount, segWeights); setGossipActive(null); setGossipSpreading(false); };

  const applyGossip = (g) => {
    setGossipActive(g);
    setGossipSpreading(true);
    const { people } = stateRef.current;
    // Seed gossip in high-spread people
    const seedCount = Math.max(1, Math.floor(people.length * 0.05));
    const seeds = [...people].sort((a,b)=>{
      const sa=SEGMENTS.find(s=>s.id===a.segment), sb=SEGMENTS.find(s=>s.id===b.segment);
      return (sb.spreadBoost+sb.power/10)-(sa.spreadBoost+sa.power/10);
    }).slice(0, seedCount);
    seeds.forEach(p => {
      p.mood = g.mood;
      p.gossipCarrying = g;
      p.gossipTimer = 200;
      p.justChanged = true;
      p.pulseTimer = 18;
      p.moodIntensity = 1;
    });
  };

  const applyCustomGossip = () => {
    if (!gossipText.trim()) return;
    const g = { id: "custom", label: gossipText, mood: selectedMood, viral: 0.7 };
    applyGossip(g);
  };

  const handlePopChange = (v) => {
    setPopCount(v);
    const { W, H } = stateRef.current;
    stateRef.current.people = Array.from({ length: v }, (_, i) => createPerson(i, W, H, segWeights));
  };

  const handleSegWeight = (id, v) => {
    const nw = { ...segWeights, [id]: Number(v) };
    setSegWeights(nw);
  };

  const dominant = MOODS.find(m => m.id === stats.dominant);
  const total = Object.values(activeMoods).reduce((s,v)=>s+v,0) || 1;

  return (
    <div style={{ background: "var(--color-background-tertiary)", minHeight: "100vh", padding: "0 0 2rem" }}>
      <style>{`
        .sim-canvas { width: 100%; border-radius: 12px; cursor: crosshair; display: block; }
        .mood-btn { padding: 6px 10px; border-radius: 8px; border: 1.5px solid transparent; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.15s; background: var(--color-background-secondary); color: var(--color-text-secondary); display: flex; align-items: center; gap: 5px; }
        .mood-btn.active { border-color: currentColor; color: var(--color-text-primary); background: var(--color-background-primary); }
        .mood-btn:hover { background: var(--color-background-primary); }
        .gossip-pill { padding: 6px 12px; border-radius: 20px; border: 0.5px solid var(--color-border-secondary); cursor: pointer; font-size: 12px; background: var(--color-background-secondary); color: var(--color-text-secondary); transition: all 0.15s; white-space: nowrap; }
        .gossip-pill:hover { background: var(--color-background-primary); color: var(--color-text-primary); }
        .gossip-pill.active { background: #ffe066; border-color: #d4ac0d; color: #633806; }
        .seg-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .stat-chip { background: var(--color-background-secondary); border-radius: 8px; padding: 6px 12px; text-align: center; }
        input[type=range] { width: 100%; }
      `}</style>

      <h2 className="sr-only">Indian City Crowd Mood Simulator — click people to change moods and watch them spread</h2>

      {/* TOP BAR */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginRight: 4 }}>🇮🇳 Indian City Crowd Sim</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {MOODS.map(m => (
            <button key={m.id} className={`mood-btn${selectedMood===m.id?" active":""}`} style={{ color: m.color }} onClick={() => setSelectedMood(m.id)}>
              <span>{m.emoji}</span><span>{m.label}</span>
            </button>
          ))}
        </div>
        <button onClick={reset} style={{ padding: "6px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" }}>Reset</button>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "12px 16px", alignItems: "flex-start" }}>

        {/* LEFT PANEL */}
        <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Pop count */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "12px" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: 8 }}>Population</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="range" min={10} max={200} step={5} value={popCount} onChange={e => handlePopChange(Number(e.target.value))} />
              <span style={{ fontSize: 18, fontWeight: 500, minWidth: 36, color: "var(--color-text-primary)" }}>{popCount}</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "12px" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: 8 }}>Live stats</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="stat-chip"><div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Dominant mood</div><div style={{ fontSize: 15, fontWeight: 500, color: dominant?.color }}>{dominant?.emoji} {dominant?.label}</div></div>
              <div className="stat-chip"><div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Mood diversity</div><div style={{ fontSize: 15, fontWeight: 500 }}>{stats.entropy}/3.3</div></div>
              <div className="stat-chip"><div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Spreading now</div><div style={{ fontSize: 15, fontWeight: 500, color: "#e74c3c" }}>{stats.spreadRate} people</div></div>
            </div>
          </div>

          {/* Mood breakdown */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "12px" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: 8 }}>Breakdown</div>
            {MOODS.filter(m => activeMoods[m.id] > 0).sort((a,b)=>(activeMoods[b.id]||0)-(activeMoods[a.id]||0)).map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11 }}>{m.emoji}</span>
                <div style={{ flex: 1, height: 6, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((activeMoods[m.id]||0)/total*100)}%`, background: m.color, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", minWidth: 24, textAlign: "right" }}>{activeMoods[m.id]||0}</span>
              </div>
            ))}
          </div>

          {/* Segments toggle */}
          <button onClick={() => setShowSegments(!showSegments)} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left", color: "var(--color-text-primary)", fontSize: 13 }}>
            {showSegments ? "▲" : "▼"} Segment mix
          </button>

          {showSegments && (
            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "12px", maxHeight: 300, overflowY: "auto" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: 8 }}>Crowd composition</div>
              {SEGMENTS.map(seg => (
                <div key={seg.id} className="seg-row">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--color-text-primary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seg.label}</span>
                  <input type="range" min={0} max={5} step={1} value={segWeights[seg.id]||0} onChange={e => handleSegWeight(seg.id, e.target.value)} style={{ width: 60 }} />
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", minWidth: 12 }}>{segWeights[seg.id]||0}</span>
                </div>
              ))}
              <button onClick={() => { const nw={...segWeights}; initPeople(popCount, nw); }} style={{ marginTop: 8, width: "100%", padding: "6px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, cursor: "pointer", fontSize: 12, background: "transparent", color: "var(--color-text-secondary)" }}>Apply mix</button>
            </div>
          )}
        </div>

        {/* CANVAS AREA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <div style={{ position: "relative" }}>
            <canvas
              ref={canvasRef}
              width={820} height={480}
              className="sim-canvas"
              style={{ background: "#0d1117" }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasHover}
              onMouseLeave={() => setTooltip(null)}
            />
            {/* Tooltip */}
            {tooltip && (
              <div style={{ position: "absolute", left: tooltip.x + 10, top: tooltip.y - 10, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, padding: "8px 12px", pointerEvents: "none", fontSize: 12, zIndex: 10, maxWidth: 180 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tooltip.seg.color }} />
                  <strong style={{ fontSize: 13 }}>{tooltip.seg.label}</strong>
                </div>
                <div style={{ color: "var(--color-text-secondary)", marginBottom: 4 }}>{tooltip.seg.desc}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["Status",tooltip.seg.status],["Money",tooltip.seg.money],["Power",tooltip.seg.power],["Resources",tooltip.seg.resources]].map(([k,v])=>(
                    <span key={k} style={{ fontSize: 10, background: "var(--color-background-secondary)", borderRadius: 6, padding: "2px 6px" }}>{k}: {v}/10</span>
                  ))}
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 16 }}>{tooltip.mood.emoji}</span>
                  <span style={{ color: tooltip.mood.color, fontWeight: 500 }}>{tooltip.mood.label}</span>
                </div>
              </div>
            )}
            {/* Legend dot */}
            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(13,17,23,0.88)", borderRadius: 8, padding: "6px 10px", display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 240 }}>
              {MOODS.slice(0,5).map(m=>(
                <span key={m.id} style={{ fontSize: 11, color: m.color, display:"flex",alignItems:"center",gap:3 }}>
                  <span style={{ width:7,height:7,borderRadius:"50%",background:m.color,display:"inline-block" }} />
                  {m.label}
                </span>
              ))}
            </div>
            {gossipActive && (
              <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,220,50,0.95)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#633806", maxWidth: 260 }}>
                📢 "{gossipActive.label}" spreading...
              </div>
            )}
          </div>

          {/* GOSSIP PANEL */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: 10 }}>Pass a gossip — watch it spread</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {GOSSIPS.map(g => {
                const m = MOODS.find(x=>x.id===g.mood);
                return (
                  <button key={g.id} className={`gossip-pill${gossipActive?.id===g.id?" active":""}`} onClick={() => applyGossip(g)}>
                    {m?.emoji} {g.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={gossipText}
                onChange={e=>setGossipText(e.target.value)}
                placeholder="Type your own gossip..."
                style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: 13 }}
                onKeyDown={e=>{ if(e.key==="Enter") applyCustomGossip(); }}
              />
              <button onClick={applyCustomGossip} style={{ padding: "7px 16px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)" }}>
                Spread it
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-text-tertiary)" }}>
              Gossip spreads based on selected mood above. Autowala, Chai Wala, Auntie, and Influencer carry it furthest. Sarkari Babu and Seth Ji resist it.
            </div>
          </div>

          {/* SEGMENT LEGEND */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "12px" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: 8 }}>Segment ring colours</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SEGMENTS.map(seg => (
                <div key={seg.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-text-secondary)" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${seg.color}`, background: "transparent" }} />
                  {seg.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
