import React, { useEffect, useRef, useState, useMemo } from "react";

// Self-contained preview that mounts the dynamic background (70% opacity, overscanned)
// and a simple foreground card so you can verify layering.

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (a, b) => a + Math.random() * (b - a);

const COLORS = {
  bg1: "#0c1a24",
  bg2: "#0a1620",
  node: "#1fefff",
  linkBase: "rgba(31, 239, 255, 0.2)",
};

const TIER_CONFIG = [
  { count: 18, size: [5.5, 7.0], glow: 60, amp: [0.4, 0.7], speed: [0.04, 0.08] },
  { count: 110, size: [3.4, 4.2], glow: 42, amp: [0.5, 0.9], speed: [0.06, 0.1] },
  { count: 420, size: [1.8, 2.4], glow: 28, amp: [0.5, 1.0], speed: [0.08, 0.12] },
];

function makePulse(x, y, color, strength = 1) {
  return { x, y, color, r: 0, maxR: 400 * strength, life: 0, maxLife: 6 + 2 * strength };
}

function MicrosintDynamicBackground() {
  const canvasRef = useRef(null);
  const [dpi, setDpi] = useState(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const [running] = useState(true);
  const tiers = useMemo(() => TIER_CONFIG, []);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const pulsesRef = useRef([]);
  const timeRef = useRef(0);
  const sparksRef = useRef([]);
  const sparkTimerRef = useRef(0);

  const resize = () => {
    const c = canvasRef.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1; setDpi(dpr);
    c.width = Math.floor(rect.width * dpr); c.height = Math.floor(rect.height * dpr);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const rebuild = () => {
      const rect = c.getBoundingClientRect();
      const W = rect.width * (window.devicePixelRatio || 1);
      const H = rect.height * (window.devicePixelRatio || 1);
      const nodes = [];
      const cols = Math.max(18, Math.floor(W / 110));
      const rows = Math.max(12, Math.floor(H / 95));
      const padX = 50, padY = 50;
      const cellW = (W - padX * 2) / (cols - 1);
      const cellH = (H - padY * 2) / (rows - 1);
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2 === 0) ? 0 : cellW * 0.5;
        for (let cidx = 0; cidx < cols; cidx++) {
          const baseX = padX + cidx * cellW + offset;
          const baseY = padY + r * cellH;
          const jitterX = rand(-cellW * 0.18, cellW * 0.18);
          const jitterY = rand(-cellH * 0.18, cellH * 0.18);
          const bx = clamp(baseX + jitterX, 30, W - 30);
          const by = clamp(baseY + jitterY, 30, H - 30);
          let tier = 2;
          if ((r % 5 === 0) && (cidx % 5 === 0)) tier = 0; else if ((r % 2 === 0) && (cidx % 2 === 0)) tier = 1;
          const cfg = TIER_CONFIG[tier];
          const size = rand(cfg.size[0], cfg.size[1]);
          const glow = cfg.glow;
          const amp = rand(cfg.amp[0], cfg.amp[1]);
          const speed = rand(cfg.speed[0], cfg.speed[1]);
          const theta = Math.random() * Math.PI * 2;
          const phase = Math.random() * Math.PI * 2;
          nodes.push({ baseX: bx, baseY: by, x: bx, y: by, size, glow, tier, theta, speed, amp, phase });
        }
      }
      // connectivity: MST + kNN
      const links = [];
      const N = nodes.length;
      const inTree = new Array(N).fill(false);
      const dist = new Array(N).fill(Infinity);
      const parent = new Array(N).fill(-1);
      dist[0] = 0;
      for (let it = 0; it < N; it++) {
        let u = -1, best = Infinity;
        for (let i = 0; i < N; i++) if (!inTree[i] && dist[i] < best) { best = dist[i]; u = i; }
        if (u === -1) break;
        inTree[u] = true;
        if (parent[u] !== -1) links.push({ a: parent[u], b: u });
        for (let v = 0; v < N; v++) {
          if (inTree[v] || v === u) continue;
          const dx = nodes[u].baseX - nodes[v].baseX; const dy = nodes[u].baseY - nodes[v].baseY;
          const d2 = dx*dx + dy*dy; if (d2 < dist[v]) { dist[v] = d2; parent[v] = u; }
        }
      }
      const k = 4;
      for (let i = 0; i < N; i++) {
        const a = nodes[i];
        const dists = [];
        for (let j = 0; j < N; j++) { if (i === j) continue; const b = nodes[j]; const dx = a.baseX - b.baseX, dy = a.baseY - b.baseY; dists.push({ j, d2: dx*dx + dy*dy }); }
        dists.sort((u,v)=>u.d2 - v.d2);
        for (let t = 0; t < k; t++) { const j = dists[t].j; if (!links.some(L => (L.a===i && L.b===j) || (L.a===j && L.b===i))) links.push({ a: i, b: j }); }
      }
      nodesRef.current = nodes; linksRef.current = links;
    };
    rebuild(); resize();
    const onR = () => { resize(); rebuild(); };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    let last = performance.now();
    const draw = () => {
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext("2d");
      const W = c.width, H = c.height;
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000); last = now; timeRef.current += dt;
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, COLORS.bg1); grad.addColorStop(1, COLORS.bg2);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      const nodes = nodesRef.current; const links = linksRef.current;

      // links
      ctx.lineWidth = 1; ctx.strokeStyle = COLORS.linkBase;
      links.forEach(L => { const na = nodes[L.a], nb = nodes[L.b]; ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke(); });

      // traveling particles
      if (!sparkTimerRef.current) sparkTimerRef.current = 1;
      sparkTimerRef.current -= dt;
      if (sparkTimerRef.current <= 0 && sparksRef.current.length < 3 && links.length) {
        sparkTimerRef.current = rand(4, 9);
        const L = links[Math.floor(Math.random() * links.length)];
        const duration = rand(2.5, 4.0);
        sparksRef.current.push({ a: L.a, b: L.b, t: 0, dur: duration });
      }
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const s = sparksRef.current[i]; s.t += dt / s.dur;
        const na = nodes[s.a], nb = nodes[s.b];
        const x = na.x + (nb.x - na.x) * s.t; const y = na.y + (nb.y - na.y) * s.t;
        const r = 2 * (window.devicePixelRatio || 1);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
        grd.addColorStop(0, "rgba(31,239,255,0.45)"); grd.addColorStop(1, "rgba(31,239,255,0)");
        ctx.save(); ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r * 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.shadowColor = COLORS.node; ctx.shadowBlur = 22; ctx.globalAlpha = 0.9; ctx.fillStyle = COLORS.node; ctx.beginPath(); ctx.arc(x, y, 1.8 * (window.devicePixelRatio || 1), 0, Math.PI * 2); ctx.fill(); ctx.restore();
        if (s.t >= 1) { pulsesRef.current.push(makePulse(nb.x, nb.y, COLORS.node, 1)); sparksRef.current.splice(i, 1); }
      }

      // nodes
      nodes.forEach(n => {
        n.theta = (n.theta || 0) + dt * n.speed;
        const ox = Math.cos(n.theta + n.phase) * n.amp * 4;
        const oy = Math.sin(n.theta + n.phase*0.7) * n.amp * 4;
        n.x = n.baseX + ox; n.y = n.baseY + oy;
        ctx.save(); ctx.shadowColor = COLORS.node; ctx.shadowBlur = 22; ctx.fillStyle = COLORS.node; ctx.beginPath(); ctx.arc(n.x, n.y, n.size * (window.devicePixelRatio || 1), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });

      // pulses
      for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
        const p = pulsesRef.current[i]; p.life = (p.life || 0) + dt; p.r = (p.life / p.maxLife) * p.maxR; const t = p.life / p.maxLife; const alpha = Math.max(0, 0.1 * (1 - t));
        ctx.save(); ctx.strokeStyle = p.color; ctx.lineWidth = 1.5 * (window.devicePixelRatio || 1); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        if (p.life >= p.maxLife) pulsesRef.current.splice(i, 1);
      }

      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }, []);

  return (
    <div className="pointer-events-none fixed -top-[5vh] -left-[5vw] w-[110vw] h-[110vh] -z-10 opacity-70">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default function Preview() {
  return (
    <div className="relative min-h-screen">
      <MicrosintDynamicBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 text-white">
          <div className="text-xl font-semibold">Foreground UI</div>
          <div className="text-sm opacity-80">If you can read this clearly, the background layering is correct.</div>
        </div>
      </div>
    </div>
  );
}
