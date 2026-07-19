// ─────────────────────────────────────────────────────────────────────────────
// NEURALPATH — zero-to-mastery AI/ML platform. Single-file React application.
// Design: "research lab at night" — instrument surfaces, mono display type,
// 7-stage spectral ramp. Green = run/pass only. Amber = records/XP.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import * as THREE from "three";
import { evaluate as mathEval } from "mathjs";
import {
  LayoutDashboard, Network, FlaskConical, Layers, BookOpen, Library, Sparkles,
  Flame, Zap, Play, RotateCcw, Check, X, ChevronRight, ChevronLeft, Lock,
  MessageCircle, Send, Loader2, Trophy, Target, GraduationCap, Bot, Copy, Sun, Moon,
  ArrowRight, CircleDot, Search, ExternalLink, Pause, Shuffle, Award, Route,
  FileText, Braces, Eye, Hammer, ListChecks, Compass, TerminalSquare, Cpu
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTip,
  CartesianGrid, LineChart, Line
} from "recharts";

// ── tokens ───────────────────────────────────────────────────────────────────
const PALETTES = {
  dark: {
    void: "#0B0E1A", panel: "#121729", panel2: "#1A2138", panel3: "#212A47",
    line: "rgba(140,160,220,.14)", line2: "rgba(140,160,220,.26)",
    ink: "#E9EDFB", dim: "#8C94B0", faint: "#5A6382",
    signal: "#5B8CFF", charge: "#FFC53D", grow: "#3DDC97", heat: "#FF6B72",
    onPrimary: "#0A1128", sel: "rgba(91,140,255,.35)",
    cell: "rgba(233,237,251,", arrow: "rgba(233,237,251,.75)", wireA: 0.14,
    sideBg: "rgba(10,13,25,.6)", topBg: "rgba(11,14,26,.82)",
    ctaGrad: "linear-gradient(135deg,#4C7DFF,#6E9BFF)",
    heroGrad: "linear-gradient(120deg, rgba(91,140,255,.09), rgba(18,23,41,.4) 55%)",
    glow: "radial-gradient(1000px 500px at 85% -10%, rgba(91,140,255,.07), transparent 60%),radial-gradient(700px 400px at -10% 110%, rgba(255,197,61,.045), transparent 60%)",
    cardShadow: "none",
    blob1: "rgba(91,140,255,.10)", blob2: "rgba(255,197,61,.06)", blob3: "rgba(79,209,224,.07)",
  },
  light: {
    void: "#F6F7FB", panel: "#FFFFFF", panel2: "#EEF1F8", panel3: "#DDE3F0",
    line: "rgba(28,36,56,.12)", line2: "rgba(28,36,56,.22)",
    ink: "#1C2438", dim: "#4A5568", faint: "#66708C",
    signal: "#3D5CCC", charge: "#8F5F00", grow: "#0E7D5C", heat: "#C23A43",
    onPrimary: "#FFFFFF", sel: "rgba(61,92,204,.22)",
    cell: "rgba(28,36,56,", arrow: "rgba(28,36,56,.7)", wireA: 0.3,
    sideBg: "rgba(246,247,251,.72)", topBg: "rgba(255,255,255,.8)",
    ctaGrad: "linear-gradient(135deg,#3D5CCC,#5B8CFF)",
    heroGrad: "linear-gradient(120deg, #E8EDFF 0%, #FDFDFF 46%, #FFF4E2 100%)",
    glow: "radial-gradient(900px 480px at 85% -10%, rgba(61,92,204,.08), transparent 60%),radial-gradient(700px 400px at -10% 110%, rgba(143,95,0,.06), transparent 60%)",
    cardShadow: "0 1px 2px rgba(23,32,64,.05), 0 10px 28px -14px rgba(23,32,64,.14)",
    blob1: "rgba(61,92,204,.12)", blob2: "rgba(255,183,77,.14)", blob3: "rgba(14,125,92,.09)",
  },
};
let RAW = PALETTES.dark;
const setThemeRaw = (mode) => { RAW = PALETTES[mode] || PALETTES.dark; };
// Live palette: DOM styles and canvas draw loops both read through this proxy,
// so canvases re-theme on the next animation frame after a toggle.
const C = new Proxy({}, { get: (_, k) => RAW[k] });
const themeVars = (p) => `--void:${p.void};--panel:${p.panel};--panel2:${p.panel2};--panel3:${p.panel3};--line:${p.line};--line2:${p.line2};--ink:${p.ink};--dim:${p.dim};--faint:${p.faint};--signal:${p.signal};--charge:${p.charge};--grow:${p.grow};--heat:${p.heat};--onPrimary:${p.onPrimary};--sel:${p.sel};--side-bg:${p.sideBg};--top-bg:${p.topBg};--cta-grad:${p.ctaGrad};--hero-grad:${p.heroGrad};--np-glow:${p.glow};--card-shadow:${p.cardShadow};--blob1:${p.blob1};--blob2:${p.blob2};--blob3:${p.blob3};`;
const VARS_CSS = `.np{${themeVars(PALETTES.dark)}}
.np[data-theme="light"]{${themeVars(PALETTES.light)}}`;
// spectral ramp — one hue per curriculum stage (position in the journey)
const STAGE_HUES = ["#5B8CFF", "#4FD1E0", "#3DDC97", "#C9E04F", "#FFC53D", "#FF9950", "#FF6B8A"];
const heatColor = (p) => { // mastery 0..1 → plasma-like ramp on dark
  if (p <= 0) return "rgba(140,160,220,.10)";
  const stops = [[91,140,255],[79,209,224],[61,220,151],[255,197,61],[255,130,110]];
  const t = Math.min(0.999, p) * (stops.length - 1), i = Math.floor(t), f = t - i;
  const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
  const m = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgba(${m[0]},${m[1]},${m[2]},${0.28 + 0.72 * p})`;
};

const CSS = `
@keyframes np-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes np-pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
@keyframes np-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes np-spin{to{transform:rotate(360deg)}}
@keyframes np-dash{to{stroke-dashoffset:0}}
*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0}
.np{min-height:100vh;background:var(--void);color:var(--ink);font-family:'IBM Plex Sans',system-ui,-apple-system,sans-serif;font-size:14.5px;line-height:1.6;
  background-image:var(--np-glow);}
.np ::selection{background:var(--sel)}
.np h1,.np h2,.np h3,.np .disp{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,monospace;letter-spacing:-.02em}
.np-mono{font-family:'JetBrains Mono',ui-monospace,monospace}
.np a{color:var(--signal);text-decoration:none}
.np a:hover{text-decoration:underline}
.np ::-webkit-scrollbar{width:10px;height:10px}
.np ::-webkit-scrollbar-thumb{background:var(--panel3);border-radius:8px;border:2px solid var(--void)}
.np ::-webkit-scrollbar-track{background:transparent}
.np-shell{display:grid;grid-template-columns:224px 1fr;min-height:100vh}
.np-side{border-right:1px solid var(--line);padding:18px 12px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:4px;background:var(--side-bg);backdrop-filter:blur(6px)}
.np-main{min-width:0;display:flex;flex-direction:column}
.np-top{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:14px;padding:10px 22px;border-bottom:1px solid var(--line);background:var(--top-bg);backdrop-filter:blur(10px)}
.np-content{padding:26px 28px 80px;max-width:1240px;width:100%;margin:0 auto;animation:np-up .3s ease}
.np-nav{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;color:var(--dim);cursor:pointer;font-size:13.5px;border:1px solid transparent;background:none;width:100%;text-align:left;font-family:inherit}
.np-nav:hover{color:var(--ink);background:var(--panel)}
.np-nav.on{color:var(--ink);background:var(--panel2);border-color:var(--line)}
.np-nav svg{flex:none}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);font-weight:500}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px}
.card.hov:hover{border-color:var(--line2);background:var(--panel2);cursor:pointer}
.btn{display:inline-flex;align-items:center;gap:7px;border-radius:10px;border:1px solid var(--line2);background:var(--panel2);color:var(--ink);padding:8px 14px;font-size:13.5px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .16s ease;font-weight:500}
.btn:hover{border-color:var(--signal);transform:translateY(-1px)}
.btn:disabled{opacity:.45;cursor:default;transform:none}
.btn.pri{background:var(--cta-grad);border-color:var(--signal);color:var(--onPrimary);font-weight:700}
.btn.pri:hover{filter:brightness(1.1)}
.btn.run{background:rgba(61,220,151,.12);border-color:rgba(61,220,151,.5);color:var(--grow)}
.btn.run:hover{border-color:var(--grow)}
.btn.ghost{background:transparent;border-color:transparent;color:var(--dim)}
.btn.ghost:hover{color:var(--ink);border-color:var(--line)}
.btn.sm{padding:5px 10px;font-size:12px;border-radius:8px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;border:1px solid var(--line);background:var(--panel);font-size:12px;color:var(--dim);cursor:pointer;font-family:'JetBrains Mono',monospace}
.chip:hover{color:var(--ink);border-color:var(--line2)}
.chip.on{color:var(--onPrimary);background:var(--signal);border-color:var(--signal);font-weight:600}
.np input[type=text],.np textarea,.np select{background:var(--void);border:1px solid var(--line2);color:var(--ink);border-radius:10px;padding:9px 12px;font-size:13.5px;font-family:inherit;outline:none;width:100%}
.np input[type=text]:focus,.np textarea:focus{border-color:var(--signal);box-shadow:0 0 0 3px rgba(91,140,255,.18)}
.np input[type=range]{accent-color:var(--signal);width:100%}
.np :focus-visible{outline:2px solid var(--signal);outline-offset:2px}
.tabbar{display:flex;gap:2px;border-bottom:1px solid var(--line);overflow-x:auto}
.tab{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--dim);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;white-space:nowrap}
.tab:hover{color:var(--ink)}
.tab.on{color:var(--ink);border-bottom-color:var(--signal)}
.prose p{margin:0 0 12px}
.prose strong{color:var(--ink)}
.prose code{font-family:'JetBrains Mono',monospace;font-size:.9em;background:var(--panel2);border:1px solid var(--line);padding:1px 6px;border-radius:6px;color:var(--signal)}
.prose pre{background:#0A0E1C;color:#E9EDFB;border:1px solid var(--line);border-radius:10px;padding:12px;overflow:auto}
.prose pre code{background:none;border:none;padding:0}
.prose ul{margin:0 0 12px;padding-left:20px}
.prose li{margin:3px 0}
.codebox{position:relative;background:#0A0E1C;border:1px solid var(--line2);border-radius:12px;overflow:hidden}
.codebox pre,.codebox textarea{margin:0;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.65;padding:14px 14px 14px 52px;tab-size:4}
.codebox pre{position:absolute;inset:0;overflow:auto;pointer-events:none;color:#E9EDFB;white-space:pre}
.codebox textarea{position:relative;width:100%;background:transparent;color:transparent;caret-color:var(--signal);border:none;resize:vertical;min-height:120px;white-space:pre;overflow:auto;outline:none}
.codebox .gut{position:absolute;left:0;top:0;bottom:0;width:40px;background:rgba(140,160,220,.04);border-right:1px solid var(--line);color:#5A6382;font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.65;padding:14px 0;text-align:right;pointer-events:none;overflow:hidden}
.tok-k{color:#7FA5FF}.tok-s{color:#FFD27A}.tok-c{color:#5A6382;font-style:italic}.tok-n{color:#5EE0C0}.tok-f{color:#C9A9FF}
.out{background:#070A14;color:#E9EDFB;border-top:1px solid var(--line);font-family:'JetBrains Mono',monospace;font-size:12.5px;padding:12px 14px;white-space:pre-wrap;max-height:280px;overflow:auto}
.out .err{color:var(--heat)}
.play-wrap{border:1px solid var(--line);border-radius:14px;background:var(--panel);overflow:hidden}
.play-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)}
.play-body{display:grid;grid-template-columns:1fr 250px;gap:0}
.play-canvas{padding:14px;display:flex;align-items:center;justify-content:center;min-height:300px}
.play-ctrl{border-left:1px solid var(--line);padding:14px;display:flex;flex-direction:column;gap:12px;background:rgba(10,13,25,.4)}
.ctl label{display:flex;justify-content:space-between;font-size:11.5px;color:var(--dim);font-family:'JetBrains Mono',monospace;margin-bottom:4px}
.ctl label b{color:var(--ink)}
.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.statv{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;letter-spacing:-.03em}
.dot{width:8px;height:8px;border-radius:99px;display:inline-block}
.trow{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:10px;cursor:pointer;border:1px solid transparent}
.trow:hover{background:var(--panel2);border-color:var(--line)}
.modal-bg{position:fixed;inset:0;background:rgba(5,7,15,.7);backdrop-filter:blur(3px);z-index:90;display:flex;align-items:center;justify-content:center;padding:20px;animation:np-up .18s ease}
.modal{background:var(--panel);border:1px solid var(--line2);border-radius:16px;max-width:720px;width:100%;max-height:86vh;overflow:auto;padding:22px;animation:np-pop .22s ease}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(460px,94vw);background:var(--panel);border-left:1px solid var(--line2);z-index:80;display:flex;flex-direction:column;box-shadow:-30px 0 60px rgba(0,0,0,.5);animation:np-drawer .24s ease}
@keyframes np-drawer{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
.toasts{position:fixed;bottom:20px;right:20px;z-index:120;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--panel2);border:1px solid var(--line2);border-left:3px solid var(--signal);border-radius:10px;padding:10px 14px;font-size:13px;animation:np-pop .25s ease;max-width:320px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.toast.gold{border-left-color:var(--charge)}
.toast.green{border-left-color:var(--grow)}
.spec{height:4px;border-radius:99px;background:linear-gradient(90deg,#5B8CFF,#4FD1E0,#3DDC97,#C9E04F,#FFC53D,#FF9950,#FF6B8A);position:relative;overflow:hidden}
.spec .cover{position:absolute;top:0;right:0;bottom:0;background:var(--panel3);transition:width .5s ease}
.katex-display{margin:10px 0}
.tex-fallback{font-family:'JetBrains Mono',monospace;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:8px 12px;display:inline-block;color:var(--signal);font-size:13px}
.mm b{color:var(--ink)} .mm code{font-family:'JetBrains Mono',monospace;background:var(--panel2);padding:1px 5px;border-radius:5px;font-size:.88em;border:1px solid var(--line)}
.mm pre{background:#0A0E1C;color:#E9EDFB;border:1px solid var(--line);padding:10px;border-radius:8px;overflow:auto;font-size:12.5px}
.mm ul{padding-left:18px;margin:6px 0}
.hmap{display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:5px}
.hcell{aspect-ratio:1.35;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:10.5px;cursor:pointer;border:1px solid var(--line);color:var(--dim);transition:transform .12s}
.hcell:hover{transform:scale(1.12);color:var(--ink);z-index:2}
.quiz-opt{display:flex;gap:10px;align-items:flex-start;padding:11px 14px;border:1px solid var(--line);border-radius:10px;cursor:pointer;margin-bottom:8px;background:var(--void)}
.quiz-opt:hover{border-color:var(--line2)}
.quiz-opt.pick{border-color:var(--signal);background:rgba(91,140,255,.08)}
.quiz-opt.right{border-color:var(--grow);background:rgba(61,220,151,.08)}
.quiz-opt.wrong{border-color:var(--heat);background:rgba(255,107,114,.07)}
.msg{padding:10px 13px;border-radius:12px;max-width:88%;font-size:13.5px;line-height:1.55}
.msg.u{background:var(--signal);color:var(--onPrimary);align-self:flex-end;border-bottom-right-radius:4px}
.msg.a{background:var(--panel2);border:1px solid var(--line);align-self:flex-start;border-bottom-left-radius:4px}
.gnode{cursor:pointer}
.gnode:hover .gring{stroke-width:3.5}
.lock-note{display:flex;gap:8px;align-items:center;font-size:12px;color:var(--charge);background:rgba(255,197,61,.07);border:1px solid rgba(255,197,61,.25);padding:8px 12px;border-radius:10px}
.rec{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--void)}
.rec .best{color:var(--charge);font-family:'JetBrains Mono',monospace;font-weight:700}
.flash-card{background:var(--panel2);border:1px solid var(--line2);border-radius:16px;min-height:220px;display:flex;align-items:center;justify-content:center;padding:28px;text-align:center;font-size:16px;cursor:pointer;position:relative}
.badge{display:inline-flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:10.5px;padding:3px 8px;border-radius:6px;border:1px solid var(--line2);color:var(--dim);text-transform:uppercase;letter-spacing:.08em}
@media(max-width:980px){.np-shell{grid-template-columns:1fr}.np-side{display:none}.play-body{grid-template-columns:1fr}.play-ctrl{border-left:none;border-top:1px solid var(--line)}.grid2,.grid3{grid-template-columns:1fr}.np-content{padding:18px 14px 80px}}
@media(prefers-reduced-motion:reduce){.np *{animation-duration:.01ms!important;transition-duration:.01ms!important}}
.np-blobs{position:fixed;inset:-22%;z-index:0;pointer-events:none;overflow:hidden}
.np-blob{position:absolute;width:46vw;height:46vw;min-width:420px;min-height:420px;border-radius:50%;will-change:transform}
.np-blob.b1{top:-6%;left:-4%;background:radial-gradient(circle at 50% 50%, var(--blob1) 0%, transparent 62%);animation:np-drift1 90s ease-in-out infinite}
.np-blob.b2{bottom:-8%;right:-6%;background:radial-gradient(circle at 50% 50%, var(--blob2) 0%, transparent 62%);animation:np-drift2 110s ease-in-out infinite}
.np-blob.b3{top:34%;left:42%;width:34vw;height:34vw;background:radial-gradient(circle at 50% 50%, var(--blob3) 0%, transparent 62%);animation:np-drift3 74s ease-in-out infinite}
@keyframes np-drift1{50%{transform:translate(9vw,7vh) scale(1.12)}}
@keyframes np-drift2{50%{transform:translate(-8vw,-6vh) scale(1.16)}}
@keyframes np-drift3{50%{transform:translate(-6vw,8vh) scale(0.9)}}
.np-shell{position:relative;z-index:1}
.np[data-theme="light"] .card{box-shadow:var(--card-shadow)}
.np[data-theme="light"] .np-top,.np[data-theme="light"] .np-side{box-shadow:0 1px 0 rgba(23,32,64,.04)}
`;

// ── utils ────────────────────────────────────────────────────────────────────
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dateAdd = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dayDiff = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── persistence — prefers Claude artifact storage, falls back to localStorage
//    (web deploy), then in-memory. Works unchanged in both environments. ───────
const STORE_KEY = "neuralpath:v1";
async function loadState() {
  try { if (typeof window !== "undefined" && window.storage) { const r = await window.storage.get(STORE_KEY); if (r && r.value) return JSON.parse(r.value); } } catch (e) {}
  try { if (typeof localStorage !== "undefined") { const v = localStorage.getItem(STORE_KEY); if (v) return JSON.parse(v); } } catch (e) {}
  return null;
}
let _saveT = null;
function saveState(data) {
  if (_saveT) clearTimeout(_saveT);
  _saveT = setTimeout(async () => {
    try { if (typeof window !== "undefined" && window.storage) { await window.storage.set(STORE_KEY, JSON.stringify(data)); return; } } catch (e) {}
    try { if (typeof localStorage !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
  }, 900);
}

// ── Claude client — in Claude, calls the built-in endpoint directly; on a
//    self-hosted deploy, set VITE_AI_ENDPOINT to your serverless proxy so the
//    API key stays server-side. Falls back to the direct URL if unset. ────────
const AI_ENDPOINT =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_AI_ENDPOINT) ||
  "https://api.anthropic.com/v1/messages";
async function askClaude(messages, system, maxTokens = 1000) {
  const res = await fetch(AI_ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) throw new Error("AI service unavailable (" + res.status + ")");
  const data = await res.json();
  return (data.content || []).map((b) => (b.type === "text" ? b.text : "")).filter(Boolean).join("\n");
}
const parseJSONish = (t) => { const m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error("no json"); return JSON.parse(m[0]); };

// ── KaTeX (lazy CDN load, graceful fallback) ─────────────────────────────────
let katexP = null;
function ensureKatex() {
  if (katexP) return katexP;
  katexP = new Promise((resolve) => {
    if (window.katex) return resolve(window.katex);
    const css = document.createElement("link"); css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
    s.onload = () => resolve(window.katex || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
    setTimeout(() => resolve(window.katex || null), 6000);
  });
  return katexP;
}
function Tex({ tex, block }) {
  const ref = useRef(null); const [fail, setFail] = useState(false);
  useEffect(() => { let ok = true;
    ensureKatex().then((k) => { if (!ok) return;
      if (k && ref.current) { try { k.render(tex, ref.current, { displayMode: !!block, throwOnError: false }); return; } catch (e) {} }
      setFail(true);
    }); return () => { ok = false; };
  }, [tex, block]);
  if (fail) return <span className="tex-fallback">{tex}</span>;
  return <span ref={ref} style={{ display: block ? "block" : "inline-block", textAlign: block ? "center" : "left", overflowX: "auto", maxWidth: "100%" }} />;
}

// ── markdown-lite renderer (tutor / generated content) ───────────────────────
function mdLite(src) {
  const parts = String(src || "").split(/```/);
  let html = "";
  parts.forEach((p, i) => {
    if (i % 2 === 1) { const body = p.replace(/^[a-z]*\n/, ""); html += `<pre><code>${esc(body)}</code></pre>`; return; }
    let t = esc(p);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.split(/\n/).map((line) => {
      if (/^\s*[-•]\s+/.test(line)) return `<li>${line.replace(/^\s*[-•]\s+/, "")}</li>`;
      if (/^#{1,3}\s+/.test(line)) return `<b>${line.replace(/^#{1,3}\s+/, "")}</b><br/>`;
      return line + "<br/>";
    }).join("").replace(/(<li>[\s\S]*?<\/li>)(<br\/>)*/g, "$1").replace(/((?:<li>[\s\S]*?<\/li>)+)/g, "<ul>$1</ul>");
    html += t;
  });
  return html;
}
const MD = ({ text }) => <div className="mm" dangerouslySetInnerHTML={{ __html: mdLite(text) }} />;

// ── python syntax highlight + editor ─────────────────────────────────────────
function hiPy(code) {
  const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(def|class|return|if|elif|else|for|while|in|not|and|or|import|from|as|with|try|except|finally|lambda|pass|break|continue|None|True|False|assert|yield|global|del|raise|is|print|range|len|zip|enumerate|sum|min|max|abs|sorted|list|dict|set|tuple|float|int|str)\b|\b(\d+(?:\.\d+)?(?:e-?\d+)?)\b/g;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += `<span class="tok-c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="tok-s">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="tok-k">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="tok-n">${esc(m[4])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}
function CodeEditor({ value, onChange, height = 260, readOnly }) {
  const pre = useRef(null), gut = useRef(null);
  const sync = (e) => { if (pre.current) { pre.current.scrollTop = e.target.scrollTop; pre.current.scrollLeft = e.target.scrollLeft; } if (gut.current) gut.current.scrollTop = e.target.scrollTop; };
  const lines = value.split("\n").length;
  return (
    <div className="codebox">
      <div className="gut" ref={gut}>{Array.from({ length: lines }, (_, i) => <div key={i} style={{ paddingRight: 10 }}>{i + 1}</div>)}</div>
      <pre ref={pre} aria-hidden dangerouslySetInnerHTML={{ __html: hiPy(value) + "\n" }} />
      <textarea spellCheck={false} value={value} readOnly={readOnly} style={{ height }} onScroll={sync}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.target, s = t.selectionStart, en = t.selectionEnd; const nv = value.slice(0, s) + "    " + value.slice(en); onChange(nv); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4; }); } }} />
    </div>
  );
}

// ── Pyodide runtime (in-browser Python) ──────────────────────────────────────
const pyRT = { status: "idle", pyodide: null, listeners: new Set(), pkgs: new Set(), note: "" };
function pyNotify() { pyRT.listeners.forEach((f) => f({ status: pyRT.status, note: pyRT.note })); }
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
async function ensurePyodide() {
  if (pyRT.status === "ready") return pyRT.pyodide;
  if (pyRT.status === "loading") return new Promise((res, rej) => { const l = () => { if (pyRT.status === "ready") { pyRT.listeners.delete(l); res(pyRT.pyodide); } if (pyRT.status === "error") { pyRT.listeners.delete(l); rej(new Error(pyRT.note)); } }; pyRT.listeners.add(l); });
  pyRT.status = "loading"; pyRT.note = "Downloading Python runtime (~7 MB, first run only)…"; pyNotify();
  const cands = [
    "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    "https://cdnjs.cloudflare.com/ajax/libs/pyodide/0.26.4/",
    "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
  ];
  for (const base of cands) {
    try {
      await loadScript(base + "pyodide.js");
      const py = await window.loadPyodide({ indexURL: base });
      pyRT.pyodide = py; pyRT.base = base; pyRT.status = "ready"; pyRT.note = ""; pyNotify(); return py;
    } catch (e) { /* try next */ }
  }
  pyRT.status = "error"; pyRT.note = "Couldn't load the in-browser Python runtime. Copy the code into Google Colab to run it."; pyNotify();
  throw new Error(pyRT.note);
}
async function runPython(code) {
  const py = await ensurePyodide();
  if (/\b(import|from)\s+numpy\b/.test(code) && !pyRT.pkgs.has("numpy")) {
    pyRT.note = "Fetching numpy…"; pyNotify();
    try { await py.loadPackage("numpy"); pyRT.pkgs.add("numpy"); } catch (e) {}
    pyRT.note = ""; pyNotify();
  }
  const buf = [];
  py.setStdout({ batched: (s) => buf.push(s) });
  py.setStderr({ batched: (s) => buf.push(s) });
  try { const r = await py.runPythonAsync(code); if (r !== undefined && r !== null && String(r) !== "undefined") buf.push(String(r)); return { out: buf.join("\n"), err: null }; }
  catch (e) { let msg = String(e.message || e); const lines = msg.split("\n"); if (lines.length > 14) msg = lines.slice(-12).join("\n"); return { out: buf.join("\n"), err: msg }; }
}

// ── ambient depth layer (CSS-only '3D': pre-faded radial blobs, no blur filter,
//    GPU-composited transforms, frozen by prefers-reduced-motion — cheaper than WebGL) ──
const Blobs = () => (
  <div className="np-blobs" aria-hidden>
    <div className="np-blob b1" /><div className="np-blob b2" /><div className="np-blob b3" />
  </div>
);

// ── shared context ───────────────────────────────────────────────────────────
const NP = createContext(null);
const useNP = () => useContext(NP);

// ── UI atoms ─────────────────────────────────────────────────────────────────
const Eyebrow = ({ children, color }) => <div className="eyebrow" style={color ? { color } : null}>{children}</div>;
function Ring({ pct, size = 46, stroke = 4, color = C.signal, children }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flex: "none" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.panel3} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - clamp(pct, 0, 1))} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .6s ease" }} />
      <foreignObject x={0} y={0} width={size} height={size}>
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: size / 4.2, fontWeight: 700 }}>{children}</div>
      </foreignObject>
    </svg>
  );
}
const Spectrum = ({ pct }) => <div className="spec"><div className="cover" style={{ width: `${100 - clamp(pct, 0, 1) * 100}%` }} /></div>;
function Modal({ open, onClose, children, width }) {
  if (!open) return null;
  return <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" style={width ? { maxWidth: width } : null}>{children}</div>
  </div>;
}
function Slider({ label, value, min, max, step, onChange, fmt }) {
  return <div className="ctl"><label><span>{label}</span><b>{fmt ? fmt(value) : value}</b></label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} /></div>;
}
function Sel({ label, value, opts, onChange }) {
  return <div className="ctl">{label && <label><span>{label}</span></label>}
    <select value={value} onChange={(e) => onChange(e.target.value)}>{opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></div>;
}
// confetti
function fireConfetti() {
  try {
    const cv = document.createElement("canvas"); cv.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200";
    cv.width = window.innerWidth; cv.height = window.innerHeight; document.body.appendChild(cv);
    const ctx = cv.getContext("2d"); const cols = [C.signal, C.charge, C.grow, "#FF9950", "#4FD1E0", "#FF6B8A"];
    const ps = Array.from({ length: 140 }, () => ({ x: cv.width / 2 + (Math.random() - .5) * 260, y: cv.height * 0.32, vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3, r: Math.random() * 5 + 2, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * Math.PI, va: (Math.random() - .5) * .3 }));
    let t = 0; const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height); t++;
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.32; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - t / 80); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (t < 85) requestAnimationFrame(tick); else cv.remove();
    }; requestAnimationFrame(tick);
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM — 7 stages · 43 parts · every topic is a lesson node
// ─────────────────────────────────────────────────────────────────────────────
const STAGES = [
  { roman: "I", name: "Foundations" }, { roman: "II", name: "Classical ML" },
  { roman: "III", name: "Deep Learning" }, { roman: "IV", name: "Modern AI" },
  { roman: "V", name: "Production & Systems" }, { roman: "VI", name: "Safety & Frontiers" },
  { roman: "VII", name: "Applications & Career" },
];
const PARTS = [
{n:1,s:0,name:"Foundations & Philosophy of AI",topics:"What is AI|History: Dartmouth to Deep Learning|Symbolic vs Connectionist AI|Turing Test & Chinese Room|Narrow, General & Super AI|Agents & Environments|Rationality & Bounded Rationality|Classical Search & Planning|Knowledge Representation|Expert Systems|The AI Winters|Compute Trends & Moore's Law|The Bitter Lesson|Data, Compute, Algorithms Triad|The Modern AI Landscape|AI vs ML vs DL vs GenAI|Philosophy of Mind & Consciousness|Defining & Measuring Intelligence|The AI Effect & Moving Goalposts|The Research Ecosystem"},
{n:2,s:0,name:"Mathematics for AI",topics:"Scalars, Vectors, Matrices, Tensors|Vector Operations & Dot Product|Norms & Distances|Linear Independence & Span|Matrix Multiplication|Identity, Inverse & Transpose|Determinant & Rank|Eigenvalues & Eigenvectors|Eigendecomposition|Singular Value Decomposition|Orthogonality & Projections|Functions, Limits & Continuity|Derivatives & Differentiation Rules|Partial Derivatives|Gradient, Jacobian & Hessian|The Chain Rule|Taylor Series|Integrals (Essentials)|Convexity|Optimization Basics|Gradient Descent (math view)|Constrained Optimization & Lagrange|Probability Axioms|Conditional Probability & Bayes' Rule|Random Variables|Common Distributions|Expectation & Variance|Covariance & Correlation|Joint & Marginal Distributions|Law of Large Numbers|Central Limit Theorem|Maximum Likelihood Estimation|MAP & Bayesian Inference|Entropy|Cross-Entropy & KL Divergence|Mutual Information|Information Theory in ML|Numerical Stability & Conditioning|Sampling & Random Numbers|Set Theory & Logic Essentials"},
{n:3,s:0,name:"Programming & Computational Foundations",topics:"Python Setup & Environments|Python Syntax Essentials|Data Types & Structures|Control Flow|Functions & Scope|Comprehensions|OOP in Python|Modules & Packages|Errors & Exceptions|File I/O|Iterators & Generators|Decorators & Context Managers|Typing & Dataclasses|Virtual Envs, pip & uv|NumPy Arrays|Broadcasting|Vectorization|Pandas DataFrames|Indexing & GroupBy|Merges & Reshaping|Matplotlib & Seaborn|Plotly Basics|Git & GitHub|CLI & Shell Basics|Jupyter & Colab|Debugging & Profiling|Testing with pytest|Code Style & Clean Code|Data Structures & Algorithms Refresher|Complexity & Big-O|SQL Essentials|APIs & JSON|Regular Expressions|Concurrency Basics|GPU 101: the CUDA Mindset"},
{n:4,s:0,name:"Data Fundamentals",topics:"What is Data|Structured vs Unstructured Data|Data Types & Scales of Measurement|Datasets, Samples & Populations|Data Collection Methods|Web Scraping: Ethics & Basics|Public Datasets & Benchmarks|Data Licensing|Data Quality Dimensions|Missing Data Mechanisms|Outliers & Anomalies|Bias in Data|Data Labeling & Annotation|Synthetic Data|Data Versioning|Databases: SQL vs NoSQL|Data Lakes & Warehouses|File Formats: CSV, JSON, Parquet|Big Data & Distributed Storage|Streaming Data|Data Privacy Basics|Train/Validation/Test Splits|Data Leakage"},
{n:5,s:0,name:"Data Preprocessing & Feature Engineering",topics:"The Cleaning Pipeline|Handling Missing Values|Imputation Strategies|Outlier Treatment|Deduplication|Type Conversion & Parsing|Scaling: Standard & MinMax|Robust Scaling & Normalization|One-Hot Encoding|Ordinal & Target Encoding|High-Cardinality Categoricals|Binning & Discretization|Log & Power Transforms|Date/Time Features|Text Cleaning Basics|Bag-of-Words & TF-IDF|Feature Hashing|Interaction Features|Polynomial Features|Domain Feature Engineering|Feature Selection: Filter Methods|Wrapper & Embedded Selection|Pipelines with scikit-learn|Class Imbalance: SMOTE & Weights|Preprocessing for Trees vs Linear Models"},
{n:6,s:0,name:"EDA & Statistics",topics:"The EDA Mindset|Descriptive Statistics|Histograms & Density Plots|Boxplots & Violin Plots|Scatterplots & Pair Plots|Correlation Analysis|Categorical EDA|Time-Based EDA|Grouped Aggregations|Pivot Tables|Spotting Anomalies Visually|Simpson's Paradox|Hypothesis Testing Basics|p-values & Significance|t-tests & ANOVA|Chi-Square Tests|Nonparametric Tests|Confidence Intervals|Bootstrap Methods|Effect Sizes|A/B Testing|The Multiple Testing Problem|Bayesian vs Frequentist Views|Storytelling with Data"},
{n:7,s:0,name:"Machine Learning Fundamentals",topics:"What is Learning|Supervised, Unsupervised & RL|Semi- & Self-Supervised Learning|The ML Workflow|Hypothesis Space & Inductive Bias|Loss Functions Intro|Empirical Risk Minimization|Generalization|Overfitting & Underfitting|Bias-Variance Tradeoff|Train/Val/Test Discipline|Cross-Validation|Baselines & Sanity Checks|No Free Lunch Theorem|Curse of Dimensionality|Parametric vs Nonparametric Models|k-Nearest Neighbors|A Probabilistic View of ML|Generative vs Discriminative|Online vs Batch Learning|Transfer & Multi-Task (preview)|The scikit-learn Mental Model"},
{n:8,s:1,name:"Regression",topics:"Simple Linear Regression|Multiple Linear Regression|Least Squares & the Normal Equation|Gradient Descent for Regression|Polynomial Regression|Interactions & Basis Functions|Assumptions & Diagnostics|Residual Analysis|R-squared & Adjusted R-squared|MAE, MSE, RMSE & MAPE|Ridge Regression (L2)|Lasso (L1) & Sparsity|Elastic Net|Robust Regression|Quantile Regression|Bayesian Linear Regression|Generalized Linear Models|Poisson Regression|Regularization Paths|Feature Scaling for Regression"},
{n:9,s:1,name:"Classification",topics:"k-NN Classification|Logistic Regression|Decision Boundaries|Softmax & Multiclass|Naive Bayes|LDA & QDA|Decision Trees|Splitting Criteria: Gini & Entropy|Tree Pruning|SVM: Maximum Margin|SVM: Kernels|Probabilities & Calibration|Threshold Tuning|Imbalanced Classification|Cost-Sensitive Learning|Multi-Label Classification|One-vs-Rest & One-vs-One|Precision/Recall Preview"},
{n:10,s:1,name:"Clustering",topics:"Clustering Overview|K-Means|K-Means++ & Initialization|Choosing k: Elbow & Silhouette|Hierarchical Clustering|Dendrograms & Linkage|DBSCAN|HDBSCAN|Gaussian Mixture Models|The EM Algorithm|Spectral Clustering|Mean-Shift|Cluster Validation Metrics|Clustering High-Dimensional Data|Segmentation & Anomaly Use-Cases"},
{n:11,s:1,name:"Dimensionality Reduction & Association",topics:"Why Reduce Dimensions|PCA|Explained Variance|Kernel PCA|SVD for Data|Factor Analysis|ICA|t-SNE|UMAP|Autoencoders (preview)|Manifold Learning|Selection vs Extraction|Association Rules|Apriori|FP-Growth|Support, Confidence & Lift"},
{n:12,s:1,name:"Ensemble Learning",topics:"Why Ensembles Work|Bias-Variance View of Ensembles|Bagging|Random Forests|Feature Importance|Out-of-Bag Estimation|Boosting Intuition|AdaBoost|Gradient Boosting|XGBoost|LightGBM|CatBoost|Regularization in GBMs|Stacking & Blending|Voting Classifiers|Ensemble Diversity|Tuning Tree Ensembles"},
{n:13,s:1,name:"Evaluation, Validation & Selection",topics:"Accuracy & Error|The Confusion Matrix|Precision, Recall & F1|ROC & AUC|Precision-Recall Curves|Log Loss|Regression Metrics Recap|Ranking Metrics|Calibration Curves|Cross-Validation Schemes|Stratified & Grouped CV|Time-Series CV|Nested CV|Grid & Random Search|Bayesian Hyperparameter Optimization|Early Stopping|Statistical Model Comparison|Overfitting the Validation Set|Data Leakage Audits|Error Analysis|Ablation Studies|Reporting & Reproducibility"},
{n:14,s:1,name:"Optimization for ML",topics:"The Optimization Landscape|Convex vs Non-Convex|Batch, Stochastic & Mini-Batch GD|Learning Rate & Schedules|Momentum|Nesterov Momentum|AdaGrad|RMSProp|Adam & AdamW|Second-Order Methods|Newton & Quasi-Newton|Line Search & Trust Regions|Coordinate Descent|Proximal Methods & Soft Thresholding|Projected Gradient Descent|Saddle Points & Escapes|Neural Loss Surfaces|Gradient Noise & Generalization"},
{n:15,s:2,name:"Neural Networks & DL Foundations",topics:"Biological Inspiration|The Perceptron|From Perceptron to MLP|Activation Functions|Universal Approximation|Forward Propagation|Loss Functions for Networks|Backpropagation|Computational Graphs|Automatic Differentiation|Weight Initialization|Xavier & He Initialization|Why Depth Helps|Width vs Depth|Softmax & Cross-Entropy|A Network from Scratch|PyTorch Tensors|Autograd in PyTorch|nn.Module & Layers|Anatomy of a Training Loop"},
{n:16,s:2,name:"Training Deep Networks",topics:"Vanishing & Exploding Gradients|Gradient Clipping|Batch Normalization|Layer, Group & Instance Norm|Dropout|Weight Decay|Data Augmentation|Early Stopping in DL|Warmup & Cosine Schedules|The One-Cycle Policy|Curriculum Learning|Label Smoothing|Mixed Precision Training|Gradient Accumulation|Data Parallel Training|Model & Pipeline Parallelism|Debugging Training Runs|Reading Loss Curves|Hyperparameters for DL|Reproducibility & Seeds|Scaling Laws (preview)"},
{n:17,s:2,name:"CNNs & Computer Vision",topics:"Images as Tensors|Convolution Operation|Stride, Padding & Dilation|Pooling|Receptive Fields|Feature Hierarchies|LeNet & AlexNet|VGG & Inception|ResNet & Skip Connections|EfficientNet & Model Scaling|Transfer Learning for Vision|Fine-Tuning CNNs|Object Detection: R-CNN Family|YOLO & SSD|Anchor-Free Detection|Semantic Segmentation: U-Net|Instance Segmentation|Keypoints & Pose Estimation|Vision Transformers (ViT)|CLIP & Image-Text Models|Self-Supervised Vision|OCR|Video Understanding Basics|Augmentation for Vision|Deploying Vision Models"},
{n:18,s:2,name:"Sequence Models",topics:"Sequences & Time in Data|RNN Fundamentals|Backprop Through Time|Vanishing Gradients in RNNs|LSTM|GRU|Bidirectional RNNs|Deep & Stacked RNNs|Seq2Seq|The Encoder-Decoder Bottleneck|Teacher Forcing|Beam Search|Attention (pre-Transformer)|CTC & Alignment|Sequence Labeling|When Recurrence Still Wins"},
{n:19,s:2,name:"Attention & Transformers",topics:"Attention Intuition|Queries, Keys & Values|Scaled Dot-Product Attention|Self-Attention|Multi-Head Attention|Positional Encodings|RoPE & ALiBi|The Transformer Encoder|The Transformer Decoder|Masked Attention & Causality|Residuals & LayerNorm Placement|Feed-Forward Blocks|The Full Architecture|Complexity & the KV Cache|Efficient Attention|Long-Context Techniques|Encoder-only vs Decoder-only|Transformer from Scratch"},
{n:20,s:2,name:"Natural Language Processing",topics:"Text Preprocessing|Tokenization Overview|Stemming & Lemmatization|word2vec|GloVe & fastText|Contextual Embeddings|The Language Modeling Objective|BERT & Masked LM|GPT & Causal LM|T5 & Seq2Seq LM|Transfer Learning in NLP|Text Classification|Named Entity Recognition|Question Answering|Summarization|Machine Translation|Sentence Embeddings|Semantic Similarity|Topic Modeling: LDA|BLEU, ROUGE & BERTScore|Multilingual NLP|The Hugging Face Ecosystem"},
{n:21,s:3,name:"Large Language Models",topics:"What is an LLM|Pretraining Data & Curation|Next-Token Prediction Deep Dive|Tokenizers: BPE, WordPiece, Unigram|Context Windows|Scaling Laws & Chinchilla|The Emergent Abilities Debate|Instruction Tuning|RLHF|DPO & Preference Optimization|Constitutional AI|System Prompts & Chat Templates|Sampling: Temperature, Top-k, Top-p|Repetition & Penalties|Hallucination: Causes & Mitigation|LLM Evaluation & Benchmarks|LLM APIs & SDKs|Open vs Closed Models|The Model Landscape|Multimodal LLMs (preview)|Reasoning Models & Test-Time Compute|Tool Use & Function Calling|LLM Limitations|Cost & Latency Basics"},
{n:22,s:3,name:"Prompt Engineering",topics:"The Prompting Mindset|Zero-Shot Prompting|Few-Shot & In-Context Learning|Role & System Prompts|Chain-of-Thought|Self-Consistency|Decomposition Prompts|ReAct Prompting|Structured Output & JSON|XML Tags & Delimiters|Prompt Templates|Output Constraints & Formatting|Iterating & Testing Prompts|Prompt Injection Awareness|Meta-Prompting|Long-Context Prompting|Evaluating Prompts|Prompt Libraries & Versioning"},
{n:23,s:3,name:"Retrieval-Augmented Generation",topics:"Why RAG|RAG Architecture|Document Loading|Chunking Strategies|Embeddings for Retrieval|Vector Databases|Similarity Search & ANN|Hybrid Search: BM25 + Dense|Metadata Filtering|Reranking|Query Transformation|HyDE & Multi-Query|Context Construction|Citations & Grounding|RAG Evaluation|Graph RAG|Agentic RAG|Multimodal RAG|Production RAG Pitfalls|A RAG App End-to-End"},
{n:24,s:3,name:"Fine-Tuning & Model Adaptation",topics:"Fine-Tune vs RAG vs Prompt|Full Fine-Tuning|Transfer Learning Recap|PEFT Overview|LoRA|QLoRA|Adapters & Prefix Tuning|Instruction Datasets|Data Quality for Fine-Tuning|Chat Formatting for FT|Hyperparameters for FT|Catastrophic Forgetting|Evaluating Fine-Tunes|RLHF & DPO in Practice|Distillation|Continued Pretraining|Domain Adaptation|Serving Fine-Tuned Models"},
{n:25,s:3,name:"Agentic AI & AI Agents",topics:"What is an Agent|The Agent Loop|Tool Use & Function Calling|ReAct Pattern|Planning & Decomposition|Reflection & Self-Critique|Short- & Long-Term Memory|Agent State Management|Multi-Agent Systems|Orchestration Patterns|Agent Frameworks Landscape|Model Context Protocol (MCP)|Computer-Use & Browser Agents|Coding Agents|Sandboxing & Permissions|Guardrails for Agents|Human-in-the-Loop|Evaluating Agents|Cost & Latency Engineering|Failure Modes & Debugging|An Agent from Scratch"},
{n:26,s:3,name:"Generative AI",topics:"Generative Modeling Overview|Autoencoders|Variational Autoencoders|GANs|GAN Training Pathologies|StyleGAN Ideas|Diffusion Intuition|DDPM Essentials|Latent Diffusion|Conditioning & Guidance|Text-to-Image Systems|ControlNet & Adapters|Editing & Inpainting|Text-to-Video|Audio Generation|Music Generation|Speech Synthesis|3D & NeRF Basics|FID & Human Evaluation|Watermarking & Detection|Ethics of Generative Media"},
{n:27,s:3,name:"Deep Reinforcement Learning",topics:"The RL Problem Setup|Markov Decision Processes|Returns & Discounting|Policies & Value Functions|Bellman Equations|Dynamic Programming|Monte Carlo Methods|Temporal-Difference Learning|Q-Learning|SARSA|Exploration vs Exploitation|Function Approximation|DQN & Variants|Policy Gradients|REINFORCE|Actor-Critic|A2C & A3C|PPO|DDPG & SAC|Model-Based RL|Offline RL|Reward Shaping & Hacking|The RLHF Connection|Multi-Agent RL"},
{n:28,s:3,name:"Graph & Geometric Deep Learning",topics:"Graphs & Representations|Node, Edge & Graph Tasks|Graph Statistics & Features|DeepWalk & node2vec|Message Passing|Graph Convolutional Networks|GraphSAGE|Graph Attention Networks|Pooling & Readout|Link Prediction|Knowledge Graph Embeddings|Heterogeneous Graphs|Temporal Graphs|Oversmoothing & Depth|Graph Transformers|Molecules & RecSys Applications"},
{n:29,s:3,name:"Recommender Systems",topics:"The Recommendation Problem|Implicit vs Explicit Feedback|Content-Based Filtering|Collaborative Filtering|Matrix Factorization|ALS & SGD for MF|Factorization Machines|Neural Collaborative Filtering|Two-Tower Models|Sequence-Aware RecSys|Session-Based RecSys|Candidate Generation & Ranking|Precision@k & NDCG|Cold Start|Diversity & Fairness|Bandits for RecSys|LLMs for RecSys|Production RecSys Architecture"},
{n:30,s:3,name:"Time Series & Forecasting",topics:"Time Series Fundamentals|Trend, Seasonality & Residuals|Stationarity & Differencing|ACF & PACF|Smoothing & Moving Averages|Exponential Smoothing (ETS)|ARIMA|SARIMA & Exogenous Variables|Prophet-Style Models|Feature-Based Forecasting|Backtesting & TS Validation|MAPE, sMAPE & MASE|Probabilistic Forecasting|RNNs & TCNs for TS|N-BEATS & TS Transformers|Foundation Models for TS|Anomaly Detection in TS|Multivariate & Hierarchical"},
{n:31,s:3,name:"Speech & Audio AI",topics:"Sound & Digital Audio|Sampling Rate & Bit Depth|Fourier & Spectrograms|Mel Scale & MFCCs|The Classical ASR Pipeline|CTC for ASR|Whisper-Style Seq2Seq ASR|Speaker ID & Diarization|Keyword Spotting|The TTS Pipeline|Neural Vocoders|Voice Cloning Ethics|Audio Classification|Music Information Retrieval|Audio Embeddings|Real-Time & Streaming Audio"},
{n:32,s:3,name:"Multimodal AI",topics:"What is Multimodality|Joint Embedding Spaces|CLIP Deep Dive|Image Captioning|Visual Question Answering|VLM Architectures|Cross-Attention Fusion|Early vs Late Fusion|Audio-Language Models|Video-Language Models|Any-to-Any Models|Multimodal Prompting|Document AI & Charts|Multimodal RAG|Evaluating VLMs|Building with Multimodal APIs"},
{n:33,s:4,name:"MLOps & Production ML",topics:"What is MLOps|ML System Design|Project Structure|Experiment Tracking|Data Versioning (DVC)|Feature Stores|Pipelines & Orchestration|Airflow & Prefect Concepts|Model Registry|CI/CD for ML|Testing ML Systems|Batch vs Online Serving|REST & gRPC Model APIs|Docker for ML|Kubernetes Basics|Autoscaling & Load|Data & Concept Drift|Performance Monitoring|Alerting & Incidents|Retraining Strategies|Shadow & Canary Deployments|A/B Testing Models|Cost Management|Governance & Model Cards"},
{n:34,s:4,name:"LLMOps & Deploying LLMs",topics:"LLM App Architecture|Prompt Management & Versioning|Gateways & Model Routing|Caching Strategies|Streaming Responses|Structured Output Enforcement|Function-Calling Infrastructure|Observability & Tracing|Golden Sets & LLM-as-Judge|Prompt Regression Testing|Guardrails & Content Filtering|PII Redaction|Rate Limits & Retries|Cost Tracking & Budgets|Latency Optimization|Self-Hosting: vLLM & TGI|Quantized Serving|GPU Capacity Planning|Fallbacks & Degradation|Security for LLM Apps"},
{n:35,s:4,name:"Model Compression & Efficient AI",topics:"Why Efficiency Matters|Quantization Basics|PTQ vs QAT|INT8/INT4, GPTQ & AWQ|Pruning|Structured Sparsity|Knowledge Distillation|Low-Rank Factorization|Efficient Architectures|Neural Architecture Search|KV-Cache Optimization|Speculative Decoding|Continuous Batching & Paged Attention|ONNX & TensorRT|Edge Deployment|Benchmarking Efficiency"},
{n:36,s:4,name:"AI Hardware & Systems",topics:"CPU vs GPU vs TPU|GPU Architecture Essentials|Memory Hierarchy & Bandwidth|Roofline Thinking|The CUDA Programming Model|Kernels & Fusion|Tensor Cores & Precision|NVLink & Interconnects|Distributed Training Topologies|All-Reduce & Collectives|Storage & Data Loading|Cluster Schedulers|The Cloud GPU Landscape|Energy & Datacenters|Trends in AI Chips"},
{n:37,s:5,name:"AI Safety, Alignment & Interpretability",topics:"Why Safety|The Alignment Problem|Outer vs Inner Alignment|Reward Hacking & Goodhart|Specification Gaming|RLHF & Its Limits|Constitutional AI & RLAIF|Scalable Oversight|Red Teaming|Jailbreaks & Robustness|Dangerous-Capability Evals|Interpretability Overview|Features & Superposition|Sparse Autoencoders|Circuits & Attribution|Probing Representations|Model Organisms of Misalignment|Deception & Sandbagging (concepts)|Control & Containment|Governance of Frontier Models|Open Problems in Safety"},
{n:38,s:5,name:"AI Ethics, Fairness, Governance & Law",topics:"Ethical Frameworks for AI|Fairness Definitions|Sources of Bias|Measuring Disparate Impact|Debiasing Techniques|SHAP & LIME|Transparency & Documentation|Privacy Principles|Surveillance Concerns|Accountability & Liability|Designing Human Oversight|AI & Labor|Environmental Impact|Copyright & Training Data|The EU AI Act|Global Policy Landscape|Sector Rules: Health & Finance|Responsible AI in Practice|Ethics Case Studies"},
{n:39,s:5,name:"Security, Privacy & Adversarial ML",topics:"Threat Modeling for ML|Adversarial Examples|FGSM & PGD|Adversarial Training|Data Poisoning|Backdoor Attacks|Model Extraction|Membership Inference|Model Inversion|Differential Privacy|DP-SGD|Federated Learning|Secure Aggregation|Homomorphic Encryption (concepts)|Prompt Injection Deep Dive|Jailbreak Taxonomy|Supply-Chain Security|OWASP for LLM Apps|Watermarking & Provenance|AI Incident Response"},
{n:40,s:5,name:"Advanced Topics & Research Frontiers",topics:"Reasoning & Test-Time Compute|Process Reward Models|Search + LLMs: ToT & MCTS|Self-Improvement Loops|Synthetic Data at Scale|World Models|Causality & ML|Neurosymbolic AI|Continual Learning|Meta-Learning|Few-Shot Learning Research|Self-Supervised Frontiers|State-Space Models (Mamba)|Mixture-of-Experts|Long-Context Architectures|Embodied AI & Robotics|AI for Science|The AlphaFold Story|Quantum ML (a skeptic's view)|AGI Debates|Reading Research Effectively"},
{n:41,s:6,name:"Domain Applications of AI",topics:"Healthcare & Medical Imaging|Drug Discovery|Finance: Fraud & Risk|Algorithmic Trading Concepts|Retail & Demand Forecasting|Marketing & Personalization|Predictive Maintenance|Autonomous Vehicles|Robotics Applications|Agriculture|Energy & Climate|Legal Tech|Education & Tutoring Systems|Creative Industries|Gaming & NPCs|Cybersecurity AI|Geospatial AI|Scientific Discovery|Public Sector AI|Building Domain Solutions"},
{n:42,s:6,name:"Tools, Frameworks & Ecosystem",topics:"The Python Ecosystem Map|NumPy, Pandas & Polars|scikit-learn|PyTorch|TensorFlow & Keras|JAX|The Hugging Face Hub|Transformers & Datasets Libraries|LangChain & LlamaIndex|The Vector DB Landscape|Weights & Biases / MLflow|Docker & Compose|FastAPI|Gradio & Streamlit|Cloud AI Platforms|Local LLM Tooling|Anthropic & OpenAI SDKs|Evaluation Tooling|Choosing Your Stack"},
{n:43,s:6,name:"Learning, Research & Career",topics:"Learning How to Learn|Deliberate Practice for ML|Math Anxiety to Math Fluency|Reading Papers Systematically|Reproducing Papers|Writing & Communication|Building a Portfolio|GitHub Profile & READMEs|Kaggle & Competitions|Open-Source Contribution|Blogging & Teaching|Networking & Community|MLE vs Data Scientist vs Researcher|ML System Design Interviews|Coding Interviews for ML|Take-Homes & Case Studies|The Research Career Path|Staying Current|Avoiding Burnout|Your 12-Month Plan"},
];
const PREREQ = {1:[],2:[1],3:[1],4:[3],5:[4],6:[5],7:[2,6],8:[7],9:[7],10:[7],11:[7],12:[9],13:[8,9],14:[2,8],15:[13,14],16:[15],17:[16],18:[16],19:[18],20:[19],21:[19,20],22:[21],23:[21],24:[21],25:[22,23],26:[16],27:[15],28:[15],29:[12,15],30:[8],31:[18],32:[17,20],33:[13],34:[21,33],35:[16],36:[16],37:[21],38:[7],39:[21],40:[21,27],41:[13],42:[3],43:[1]};
const CURR = PARTS.map((p) => ({ ...p, list: p.topics.split("|") }));
const ALL_TOPICS = []; CURR.forEach((p) => p.list.forEach((t, i) => ALL_TOPICS.push({ id: p.n + "-" + i, part: p.n, i, title: t, stage: p.s, partName: p.name })));
const T_BY_ID = {}; ALL_TOPICS.forEach((t) => { T_BY_ID[t.id] = t; });
const T_BY_TITLE = {}; ALL_TOPICS.forEach((t) => { if (!T_BY_TITLE[t.title]) T_BY_TITLE[t.title] = t; });
const N_TOPICS = ALL_TOPICS.length;
const PART_BY_N = {}; CURR.forEach((p) => { PART_BY_N[p.n] = p; });
const estMin = (t) => 16 + (hashStr(t.id) % 4) * 6 + t.stage * 2;

const LANES = [
  { id: "llm", name: "AI / LLM & Agent Engineer", icon: "🤖", desc: "The highest-leverage modern path: transformers, LLMs, RAG, and production agents.", parts: [1,2,3,7,15,16,19,20,21,22,23,24,25,34,37], milestones: ["Foundations cleared","First network trained","Transformer internals mastered","RAG system shipped","Agent capstone deployed"], capstone: "Build a tool-using research agent with RAG grounding, guardrails, and an eval harness." },
  { id: "cv", name: "Computer Vision", icon: "👁", desc: "From convolutions to ViTs, detection, segmentation, and deployment.", parts: [1,2,3,5,7,13,15,16,17,26,32,33], milestones: ["Foundations cleared","CNN trained on real images","Detector fine-tuned","ViT & CLIP understood","Vision capstone shipped"], capstone: "Fine-tune a detector on a custom dataset and serve it behind an API with monitoring." },
  { id: "nlp", name: "NLP Specialist", icon: "💬", desc: "Text processing, embeddings, transformers, and applied language tasks.", parts: [1,2,3,7,15,16,18,19,20,21,24], milestones: ["Foundations cleared","Embeddings mastered","Transformer from scratch","Fine-tuned task model","NLP capstone shipped"], capstone: "Fine-tune a small LM for a domain task and beat a strong classical baseline honestly." },
  { id: "gen", name: "Generative AI", icon: "🎨", desc: "VAEs, GANs, diffusion, and multimodal generation systems.", parts: [2,7,15,16,19,21,26,32,35], milestones: ["DL foundations","VAE implemented","Diffusion understood step-by-step","Conditioning mastered","Generative capstone"], capstone: "Train a small diffusion model on a toy image set and write up what each component does." },
  { id: "ds", name: "Classical ML / Data Science", icon: "📊", desc: "The full tabular stack: EDA, features, trees, evaluation, and shipping.", parts: [1,3,4,5,6,7,8,9,10,11,12,13,33], milestones: ["Python + data fluency","First model beat baseline","Ensembles tuned","Rigorous evaluation","End-to-end DS capstone"], capstone: "Take a messy real dataset to a validated model with an honest error analysis and report." },
  { id: "rl", name: "Deep Reinforcement Learning", icon: "🕹", desc: "From MDPs and Q-learning to policy gradients and PPO.", parts: [2,7,14,15,16,27,40], milestones: ["Math foundations","Tabular Q-learning solved","DQN implemented","Policy gradients derived","RL capstone"], capstone: "Implement PPO from scratch and train it on a classic control task with ablations." },
  { id: "mlops", name: "MLOps / LLMOps", icon: "⚙️", desc: "Take models to production: pipelines, serving, monitoring, and LLM infrastructure.", parts: [3,7,13,33,34,35,36,39], milestones: ["ML fundamentals","Pipeline automated","Model served + monitored","LLM app instrumented","Ops capstone"], capstone: "Ship an LLM app with tracing, evals, cost tracking, guardrails, and a rollback plan." },
  { id: "safety", name: "AI Safety & Research", icon: "🛡", desc: "Alignment, interpretability, evaluations, and the open research problems.", parts: [7,15,19,21,37,38,39,40,43], milestones: ["ML + transformer fluency","Alignment landscape mapped","Interpretability basics","Paper reproduced","Safety research capstone"], capstone: "Reproduce a small interpretability result and write a clear research note about it." },
];
const PAPERS = [
  { t: "ImageNet Classification with Deep CNNs (AlexNet)", y: 2012, a: "Krizhevsky et al.", part: 17, why: "The result that relaunched deep learning: GPUs + ReLU + dropout crushed ImageNet.", url: "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks" },
  { t: "Efficient Estimation of Word Representations (word2vec)", y: 2013, a: "Mikolov et al.", part: 20, why: "Showed meaning can live in vector arithmetic — the gateway to embeddings.", url: "https://arxiv.org/abs/1301.3781" },
  { t: "Adam: A Method for Stochastic Optimization", y: 2014, a: "Kingma & Ba", part: 14, why: "The default optimizer of deep learning; adaptive moments explained.", url: "https://arxiv.org/abs/1412.6980" },
  { t: "Dropout: A Simple Way to Prevent Overfitting", y: 2014, a: "Srivastava et al.", part: 16, why: "Randomly deleting neurons as regularization — simple, weird, effective.", url: "https://jmlr.org/papers/v15/srivastava14a.html" },
  { t: "Deep Residual Learning (ResNet)", y: 2015, a: "He et al.", part: 17, why: "Skip connections let networks go 100+ layers deep. Changed everything after.", url: "https://arxiv.org/abs/1512.03385" },
  { t: "Attention Is All You Need", y: 2017, a: "Vaswani et al.", part: 19, why: "The Transformer. The single most consequential architecture paper of the era.", url: "https://arxiv.org/abs/1706.03762" },
  { t: "Proximal Policy Optimization", y: 2017, a: "Schulman et al.", part: 27, why: "The workhorse policy-gradient method — later the engine inside RLHF.", url: "https://arxiv.org/abs/1707.06347" },
  { t: "BERT: Pre-training of Deep Bidirectional Transformers", y: 2018, a: "Devlin et al.", part: 20, why: "Masked language modeling made transfer learning the default in NLP.", url: "https://arxiv.org/abs/1810.04805" },
  { t: "Language Models are Few-Shot Learners (GPT-3)", y: 2020, a: "Brown et al.", part: 21, why: "Scale alone produced in-context learning. The starting gun for the LLM era.", url: "https://arxiv.org/abs/2005.14165" },
  { t: "Denoising Diffusion Probabilistic Models", y: 2020, a: "Ho et al.", part: 26, why: "Learn to remove noise step by step — the core of modern image generation.", url: "https://arxiv.org/abs/2006.11239" },
  { t: "An Image is Worth 16x16 Words (ViT)", y: 2020, a: "Dosovitskiy et al.", part: 17, why: "Transformers eat vision: images as patch sequences.", url: "https://arxiv.org/abs/2010.11929" },
  { t: "Retrieval-Augmented Generation", y: 2020, a: "Lewis et al.", part: 23, why: "Ground generation in retrieved documents — the blueprint for RAG systems.", url: "https://arxiv.org/abs/2005.11401" },
  { t: "Learning Transferable Visual Models (CLIP)", y: 2021, a: "Radford et al.", part: 32, why: "Contrastive image-text training created a shared multimodal space.", url: "https://arxiv.org/abs/2103.00020" },
  { t: "LoRA: Low-Rank Adaptation of LLMs", y: 2021, a: "Hu et al.", part: 24, why: "Fine-tune giant models by training tiny low-rank deltas. PEFT's flagship.", url: "https://arxiv.org/abs/2106.09685" },
  { t: "Training Compute-Optimal LLMs (Chinchilla)", y: 2022, a: "Hoffmann et al.", part: 21, why: "Data and parameters should scale together — rewrote how labs train.", url: "https://arxiv.org/abs/2203.15556" },
  { t: "Training LMs to Follow Instructions (InstructGPT)", y: 2022, a: "Ouyang et al.", part: 21, why: "RLHF turned raw LMs into assistants people can actually use.", url: "https://arxiv.org/abs/2203.02155" },
  { t: "Constitutional AI: Harmlessness from AI Feedback", y: 2022, a: "Bai et al.", part: 37, why: "Align models with explicit written principles and AI feedback (RLAIF).", url: "https://arxiv.org/abs/2212.08073" },
  { t: "ReAct: Synergizing Reasoning and Acting", y: 2022, a: "Yao et al.", part: 25, why: "Interleave thoughts with tool calls — the pattern behind most agents.", url: "https://arxiv.org/abs/2210.03629" },
];
const GLOSS = {
  "Tensor": "An n-dimensional array of numbers — the universal data container of deep learning.",
  "Gradient": "The vector of partial derivatives; points in the direction of steepest increase of a function.",
  "Loss Function": "A number measuring how wrong the model is; training means pushing it down.",
  "Learning Rate": "Step size of gradient descent. Too big diverges, too small crawls.",
  "Epoch": "One full pass through the training dataset.",
  "Batch": "A subset of examples processed together in one gradient step.",
  "Logits": "Raw, unnormalized scores a model outputs before softmax turns them into probabilities.",
  "Softmax": "Turns a vector of scores into a probability distribution that sums to 1.",
  "Embedding": "A learned dense vector representing a token, item, or concept so similarity becomes geometry.",
  "Overfitting": "Memorizing training noise instead of learning the pattern; great train score, poor test score.",
  "Regularization": "Any pressure that keeps a model simpler than the data would let it be (L2, dropout, early stopping).",
  "Hyperparameter": "A knob you set before training (LR, depth, batch size) rather than one the model learns.",
  "Inference": "Running a trained model to get predictions.",
  "Backpropagation": "The chain rule, applied efficiently backwards through a network to get all gradients.",
  "Attention": "A mechanism where each position computes a weighted mix of other positions, with learned weights.",
  "Transformer": "An architecture built from self-attention + feed-forward blocks; the basis of modern LLMs.",
  "Token": "The unit an LLM reads and writes — usually a subword chunk of text.",
  "Context Window": "The maximum number of tokens a model can attend to at once.",
  "Temperature": "Sampling knob: scales logits; low = predictable, high = diverse/chaotic.",
  "Hallucination": "Fluent output that is factually ungrounded — a failure of knowledge, not of grammar.",
  "Fine-Tuning": "Continuing training of a pretrained model on your data to specialize it.",
  "LoRA": "Fine-tune by learning small low-rank weight deltas instead of touching all parameters.",
  "RAG": "Retrieval-Augmented Generation: fetch relevant documents, then generate an answer grounded in them.",
  "Agent": "An LLM in a loop that can plan, call tools, observe results, and act toward a goal.",
  "MCP": "Model Context Protocol — a standard for connecting models to tools and data sources.",
  "RLHF": "Reinforcement Learning from Human Feedback: tune a model against a learned human-preference reward.",
  "Q-Value": "Expected future reward for taking action a in state s, then acting well afterwards.",
  "Policy": "The agent's behavior: a mapping from states to actions (or action probabilities).",
  "Reward": "The scalar signal an RL agent maximizes over time.",
  "Convolution": "Slide a small learned filter across an input, computing local weighted sums — spatial pattern detection.",
  "Latent Space": "The internal compressed representation space a model learns.",
  "Diffusion Model": "Generate data by learning to reverse a gradual noising process, one denoising step at a time.",
  "GAN": "Two networks in a game: a generator forges samples, a discriminator calls fakes.",
  "VAE": "An autoencoder with a probabilistic latent space you can sample from.",
  "Epsilon-Greedy": "Explore randomly with probability ε, otherwise exploit the best-known action.",
  "Batch Norm": "Normalize activations per batch to stabilize and speed up training.",
  "Dropout": "Randomly zero neurons during training so the network can't over-rely on any one path.",
  "Cross-Entropy": "The standard classification loss: penalizes confident wrong probabilities heavily.",
  "KL Divergence": "How different one probability distribution is from another (asymmetric).",
  "Perplexity": "exp(average cross-entropy) — how 'surprised' a language model is by text; lower is better.",
  "Vector Database": "A store optimized for nearest-neighbor search over embeddings.",
  "Prompt Injection": "Adversarial text that hijacks an LLM's instructions — the classic LLM-app attack.",
  "Quantization": "Store weights in fewer bits (8/4) to shrink and speed up models with minor quality loss.",
  "Distillation": "Train a small student model to imitate a large teacher's outputs.",
};

// ─────────────────────────────────────────────────────────────────────────────
// FLAGSHIP LESSONS — hand-authored deep content (theory ▸ math ▸ code ▸ lab)
// ─────────────────────────────────────────────────────────────────────────────
const FLAGSHIP = {
"Vector Operations & Dot Product": { play: "pca",
eli5: "A vector is just a list of numbers — an arrow pointing somewhere. The dot product multiplies two arrows position-by-position and adds it all up. Big positive number: the arrows agree. Zero: they ignore each other. Negative: they disagree. Almost everything in AI is secretly asking 'how much do these two arrows agree?'",
intu: "Vectors let us turn anything — a word, an image, a user — into a point in space, and the dot product measures agreement between two of them. Geometrically it equals |a||b|cos(θ): magnitude times alignment. Divide out the lengths and you get cosine similarity, the standard 'how related are these embeddings?' score. Attention scores, recommendation matching, and retrieval in RAG are all dot products at heart. Master this one operation and half of modern AI notation stops being scary.",
rig: "For a, b in R^n, the inner product ⟨a,b⟩ = Σ aᵢbᵢ induces the Euclidean norm ||a|| = √⟨a,a⟩ and satisfies the Cauchy–Schwarz inequality |⟨a,b⟩| ≤ ||a||·||b||, which guarantees cos θ = ⟨a,b⟩/(||a||·||b||) ∈ [−1,1]. Orthogonality (⟨a,b⟩ = 0) underlies projections: the component of a along unit vector u is ⟨a,u⟩u, the workhorse of PCA and attention's query–key scoring QKᵀ.",
math: [
 { t: "a \\cdot b = \\sum_{i=1}^{n} a_i b_i = \\|a\\|\\,\\|b\\|\\cos\\theta", n: "Two views of the same number: componentwise sum, and length-times-alignment." },
 { t: "\\text{cosine\\_sim}(a,b) = \\frac{a \\cdot b}{\\|a\\|\\,\\|b\\|}", n: "Length-free agreement in [-1, 1] — the standard embedding similarity." },
 { t: "\\text{proj}_u(a) = (a \\cdot u)\\,u, \\quad \\|u\\| = 1", n: "Projection: how much of a lies along direction u. PCA is repeated projection." },
],
code: `import math

# tiny 4-d "embeddings"
king  = [0.9, 0.8, 0.1, 0.3]
queen = [0.8, 0.9, 0.1, 0.4]
pizza = [0.1, 0.0, 0.9, 0.7]

def dot(a, b): return sum(x*y for x, y in zip(a, b))
def norm(a):   return math.sqrt(dot(a, a))
def cos(a, b): return dot(a, b) / (norm(a) * norm(b))

print(f"dot(king, queen) = {dot(king, queen):.3f}")
print(f"dot(king, pizza) = {dot(king, pizza):.3f}")
print(f"cos(king, queen) = {cos(king, queen):.3f}   <- close in meaning")
print(f"cos(king, pizza) = {cos(king, pizza):.3f}   <- unrelated")`,
quiz: [
 { q: "Two embeddings have a cosine similarity of 0. Geometrically they are…", o: ["Identical", "Opposite", "Orthogonal (unrelated directions)", "Zero-length"], a: 2, why: "cos θ = 0 means θ = 90°: the vectors carry no shared direction." },
 { q: "Why is cosine similarity often preferred over raw dot product for comparing embeddings?", o: ["It's faster to compute", "It ignores vector length, isolating direction/meaning", "It's always positive", "It works only on unit vectors"], a: 1, why: "Dividing by the norms removes magnitude, so a long verbose embedding doesn't 'win' just by being long." },
 { q: "Attention scores in a Transformer are computed with which operation at their core?", o: ["Cross product", "Query–key dot products", "Matrix determinant", "Elementwise max"], a: 1, why: "QKᵀ is a grid of dot products: every query scored against every key." },
],
cards: [["Dot product (two views)", "Σ aᵢbᵢ — and equivalently ||a||·||b||·cos θ: agreement between directions."], ["Cosine similarity", "Dot product divided by both norms; length-free relatedness in [-1,1]."], ["Orthogonal vectors", "Dot product = 0 — no shared direction; the basis of projections."]],
links: [["3Blue1Brown — Essence of Linear Algebra", "https://www.3blue1brown.com/topics/linear-algebra"], ["Mathematics for Machine Learning (free book)", "https://mml-book.github.io/"]] },

"Gradient Descent (math view)": { play: "gd",
eli5: "You're on a foggy hill and want the lowest valley. You can't see far, but you can feel the slope under your feet. So you take a small step downhill, feel again, step again. That's gradient descent: the slope is the gradient, the step size is the learning rate, and the valley is the best model.",
intu: "Every model has a loss function — a landscape where height = wrongness and position = parameter values. The gradient points uphill, so we step against it: θ ← θ − η∇L. The learning rate η is the whole game: too small and training crawls; too big and you overshoot the valley and bounce or explode. Momentum smooths the walk by remembering recent direction, powering through ravines and small bumps. Training a 100-billion-parameter LLM is this exact loop, just in a very high-dimensional fog.",
rig: "For differentiable L: R^d → R, gradient descent iterates θₜ₊₁ = θₜ − η∇L(θₜ). If L is convex and ∇L is Lipschitz with constant β, choosing η ≤ 1/β guarantees monotone descent with L(θₜ) − L* = O(1/t); strong convexity upgrades this to linear (geometric) convergence. Momentum (Polyak) adds a velocity term vₜ₊₁ = γvₜ − η∇L(θₜ), damping oscillation across high-curvature directions and accelerating along low-curvature ones — the intuition later refined by Adam's per-coordinate scaling.",
math: [
 { t: "\\theta_{t+1} = \\theta_t - \\eta\\, \\nabla L(\\theta_t)", n: "The update rule. η is the learning rate; the minus sign means 'go downhill'." },
 { t: "v_{t+1} = \\gamma v_t - \\eta \\nabla L(\\theta_t), \\qquad \\theta_{t+1} = \\theta_t + v_{t+1}", n: "Momentum: a rolling ball with friction γ — smooths zig-zags in ravines." },
 { t: "L(\\theta_t) - L^* \\le \\frac{\\|\\theta_0 - \\theta^*\\|^2}{2\\eta t}", n: "Convex + smooth guarantee: error shrinks like 1/t with a safe step size." },
],
code: `def f(x):  return (x - 3) ** 2 + 1     # a simple bowl, minimum at x = 3
def df(x): return 2 * (x - 3)            # its gradient

x, lr = -4.0, 0.15
print(" step      x        f(x)      grad")
for step in range(12):
    g = df(x)
    print(f"  {step:2d}   {x:7.3f}   {f(x):7.3f}   {g:7.3f}")
    x = x - lr * g

print(f"landed at x = {x:.3f}  (true minimum: 3)")
print("try lr = 1.1 above and watch it diverge.")`,
quiz: [
 { q: "The learning rate is too large. The most typical symptom is…", o: ["Loss decreases very slowly", "Loss oscillates or explodes", "The model underfits silently", "Gradients become exactly zero"], a: 1, why: "Big steps overshoot the minimum, bouncing across the valley or diverging entirely." },
 { q: "Why step in the direction of the *negative* gradient?", o: ["The gradient points downhill", "The gradient points uphill — we reverse it", "It avoids saddle points", "It normalizes the loss"], a: 1, why: "∇L points toward steepest increase; descending means moving against it." },
 { q: "Momentum mainly helps by…", o: ["Making steps larger everywhere", "Averaging out zig-zags and pushing through shallow ravines", "Guaranteeing a global minimum", "Removing the need for a learning rate"], a: 1, why: "The velocity term cancels oscillation across steep walls while accumulating speed along the valley floor." },
],
cards: [["Gradient descent update", "θ ← θ − η ∇L(θ): step against the gradient, scaled by the learning rate."], ["Learning rate tradeoff", "Too small: slow crawl. Too large: oscillation or divergence."], ["Momentum", "Keep a velocity: v ← γv − η∇L; smooths ravines and accelerates flat directions."]],
links: [["Distill — Why Momentum Really Works", "https://distill.pub/2017/momentum/"], ["Ruder — An overview of gradient descent variants", "https://www.ruder.io/optimizing-gradient-descent/"]] },

"Bias-Variance Tradeoff": { play: "poly",
eli5: "Imagine two archers. One always hits the same wrong spot — steady but off-target (bias). The other sprays arrows all around the bullseye — sometimes great, usually not (variance). A too-simple model is archer one; a too-flexible model that memorizes noise is archer two. Learning is finding the archer in between.",
intu: "Expected test error decomposes into bias² + variance + irreducible noise. Simple models (a straight line through curvy data) have high bias: consistently wrong in the same way. Flexible models (a degree-12 polynomial through 15 points) have high variance: exquisitely fit to *this* sample's noise, wildly different on the next sample. As you add capacity, bias falls and variance rises — test error is U-shaped. Regularization, more data, and ensembling are all ways to buy less variance without paying much bias.",
rig: "For y = f(x) + ε with E[ε]=0, Var(ε)=σ², and a learner producing ĥ_D from random training sets D: E_D[(ĥ_D(x) − y)²] = (E_D[ĥ_D(x)] − f(x))² + E_D[(ĥ_D(x) − E_D[ĥ_D(x)])²] + σ² — squared bias, variance, and noise. Classical theory predicts the U-curve in capacity; modern deep learning complicates the picture (double descent past the interpolation threshold), but the decomposition itself remains exact and diagnostic: compare train vs validation error to locate yourself on the curve.",
math: [
 { t: "\\mathbb{E}\\big[(\\hat h(x) - y)^2\\big] = \\underbrace{\\text{Bias}^2}_{\\text{too simple}} + \\underbrace{\\text{Var}}_{\\text{too twitchy}} + \\underbrace{\\sigma^2}_{\\text{noise floor}}", n: "The exact decomposition of expected squared test error." },
 { t: "\\text{Bias} = \\mathbb{E}_D[\\hat h_D(x)] - f(x)", n: "Average model (over resampled datasets) vs the truth: systematic error." },
 { t: "\\text{Var} = \\mathbb{E}_D\\big[(\\hat h_D(x) - \\mathbb{E}_D[\\hat h_D(x)])^2\\big]", n: "How much the fitted model jumps around when the training sample changes." },
],
code: `import math, random
random.seed(0)
def target(x): return math.sin(2.2 * x)

def dataset(n=12):
    xs = [random.uniform(0, 3) for _ in range(n)]
    return [(x, target(x) + random.gauss(0, 0.25)) for x in xs]

test = [(i/50*3, target(i/50*3)) for i in range(50)]
def mse(pred, data): return sum((pred(x)-y)**2 for x, y in data)/len(data)

simple_err, wild_err = [], []
for trial in range(200):
    d = dataset()
    mean_y = sum(y for _, y in d)/len(d)
    knn1 = lambda x, d=d: min(d, key=lambda p: abs(p[0]-x))[1]
    simple_err.append(mse(lambda x: mean_y, test))   # high bias
    wild_err.append(mse(knn1, test))                 # high variance

print(f"constant model (high bias):  avg test MSE = {sum(simple_err)/200:.3f}")
print(f"1-NN memorizer (high var):   avg test MSE = {sum(wild_err)/200:.3f}")
print("two different ways to be wrong.")`,
quiz: [
 { q: "Training error is near zero, validation error is high and climbing. You are suffering from…", o: ["High bias", "High variance (overfitting)", "Irreducible noise", "Data leakage, necessarily"], a: 1, why: "Fitting the training set far better than unseen data is the signature of variance." },
 { q: "Which intervention primarily reduces *variance*?", o: ["A bigger, deeper model", "More training data or stronger regularization", "Training for more epochs", "Removing the validation set"], a: 1, why: "More data pins the model down; regularization limits how twitchy it can be." },
 { q: "The σ² term in the decomposition represents…", o: ["Optimizer randomness", "Label noise no model can remove", "Initialization variance", "Batch-size effects"], a: 1, why: "Irreducible noise: even the perfect f(x) misses by ε." },
],
cards: [["Bias–variance decomposition", "E[test error] = Bias² + Variance + irreducible noise σ²."], ["Overfitting signature", "Train error ≪ validation error → high variance."], ["Underfitting signature", "Train and validation error both high and close → high bias."]],
links: [["scikit-learn — Underfitting vs overfitting example", "https://scikit-learn.org/stable/auto_examples/model_selection/plot_underfitting_overfitting.html"], ["Belkin et al. — Double descent", "https://arxiv.org/abs/1812.11118"]] },

"Simple Linear Regression": { play: "poly",
eli5: "You suspect that studying more hours means better scores. Linear regression draws the single best straight line through your data points, so you can predict a score from hours studied. 'Best' means the line whose total squared miss, across every point, is as small as possible.",
intu: "The model is ŷ = wx + b: slope w says how much y changes per unit of x, intercept b anchors the line. We measure wrongness with mean squared error and pick (w, b) minimizing it — solvable exactly with calculus (the loss is a smooth bowl) or iteratively with gradient descent. It's the simplest real ML model, yet it already contains the entire pipeline: model → loss → optimize → evaluate (R² tells you the fraction of variance explained). Every deep network is this loop with a fancier ŷ.",
rig: "Minimizing L(w,b) = (1/n)Σ(wxᵢ + b − yᵢ)² is convex; setting ∂L/∂w = ∂L/∂b = 0 yields the closed form w = Σ(xᵢ−x̄)(yᵢ−ȳ)/Σ(xᵢ−x̄)² = Cov(x,y)/Var(x), b = ȳ − wx̄. In matrix form for multiple features, the normal equation gives ŵ = (XᵀX)⁻¹Xᵀy. Under Gauss–Markov assumptions (linearity, exogeneity, homoscedastic uncorrelated errors) OLS is the best linear unbiased estimator; MLE under Gaussian noise recovers the same objective, tying least squares to probability.",
math: [
 { t: "L(w,b) = \\frac{1}{n}\\sum_{i=1}^{n} (w x_i + b - y_i)^2", n: "Mean squared error — a convex bowl in (w, b)." },
 { t: "w^* = \\frac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sum (x_i-\\bar x)^2}, \\qquad b^* = \\bar y - w^* \\bar x", n: "Closed-form solution: slope is covariance over variance." },
 { t: "R^2 = 1 - \\frac{\\sum (y_i - \\hat y_i)^2}{\\sum (y_i - \\bar y)^2}", n: "Fraction of variance explained; 1 is perfect, 0 is no better than the mean." },
],
code: `xs = [1, 2, 3, 4, 5, 6, 7, 8]
ys = [2.9, 5.1, 6.8, 9.2, 10.9, 13.1, 15.2, 16.8]

n = len(xs)
mx, my = sum(xs)/n, sum(ys)/n
w = sum((x-mx)*(y-my) for x, y in zip(xs, ys)) / sum((x-mx)**2 for x in xs)
b = my - w * mx

ss_res = sum((y - (w*x+b))**2 for x, y in zip(xs, ys))
ss_tot = sum((y - my)**2 for y in ys)

print(f"model:  y = {w:.3f} x + {b:.3f}")
print(f"R^2  =  {1 - ss_res/ss_tot:.4f}")
for x in [2, 5, 10]:
    print(f"  predict x={x:2d}  ->  {w*x+b:6.2f}")`,
quiz: [
 { q: "In ŷ = wx + b, the slope w is best interpreted as…", o: ["The prediction at x = 0", "The change in ŷ per unit increase in x", "The correlation coefficient", "The residual variance"], a: 1, why: "b is the value at x=0; w is the per-unit effect." },
 { q: "Why square the errors instead of just summing them?", o: ["Squares are faster to compute", "Positive and negative misses would cancel; squaring also punishes big misses more", "It guarantees R² = 1", "Tradition only"], a: 1, why: "Squaring makes all misses positive and convex, and heavily penalizes outsized errors." },
 { q: "R² = 0.92 means…", o: ["92% of predictions are exactly right", "The model explains 92% of the variance in y", "The slope is 0.92", "Errors are 8% on average"], a: 1, why: "R² compares your squared error to the always-predict-the-mean baseline." },
],
cards: [["Linear regression model", "ŷ = wx + b, fit by minimizing mean squared error."], ["Closed-form slope", "w* = Cov(x,y)/Var(x); b* = ȳ − w x̄."], ["R²", "1 − SS_res/SS_tot: fraction of variance the model explains."]],
links: [["StatQuest — Linear regression, clearly explained", "https://www.youtube.com/watch?v=7ArmBVF2dCs"], ["An Introduction to Statistical Learning (free)", "https://www.statlearning.com/"]] },

"Logistic Regression": { play: "nn",
eli5: "Sometimes the answer isn't a number but a yes/no: spam or not, cat or dog. Logistic regression draws a line (or plane) between the two groups and, instead of saying a hard yes/no, reports a confidence: 'I'm 93% sure this is spam.' The squashing S-curve that turns any score into a 0–1 probability is called the sigmoid.",
intu: "Take the linear score z = w·x + b, then squash it: p = σ(z) = 1/(1+e⁻ᶻ). The decision boundary is where p = 0.5, i.e. z = 0 — still a straight line, but now with calibrated confidence on each side. Training maximizes the likelihood of the observed labels, equivalent to minimizing cross-entropy loss, whose gradient is the beautifully simple (p − y)x. Logistic regression is also the final layer of nearly every neural classifier — deep nets just learn better features to feed it.",
rig: "Model P(y=1|x) = σ(wᵀx + b). The negative log-likelihood over the data, L = −Σ[yᵢ log pᵢ + (1−yᵢ)log(1−pᵢ)], is convex in (w,b); its gradient ∇w L = Σ(pᵢ − yᵢ)xᵢ follows from dσ/dz = σ(1−σ) collapsing with the log terms. There is no closed form; optimize with (stochastic) gradient descent or Newton/IRLS. The log-odds are linear — log(p/(1−p)) = wᵀx + b — which is why coefficients are interpretable as additive effects on log-odds, and multiclass generalizes via softmax.",
math: [
 { t: "\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\qquad p = \\sigma(w^\\top x + b)", n: "Sigmoid squashes any real score into a probability." },
 { t: "L = -\\sum_i \\big[y_i \\log p_i + (1-y_i)\\log(1-p_i)\\big]", n: "Cross-entropy / negative log-likelihood — convex, so no bad local minima." },
 { t: "\\nabla_w L = \\sum_i (p_i - y_i)\\,x_i", n: "The elegant gradient: error times input. Also the last-layer gradient of deep classifiers." },
],
code: `import math
# 1-d data: class 0 lives left of ~2.5, class 1 to the right
X = [0.5, 1.0, 1.5, 2.0, 3.0, 3.5, 4.0, 4.5]
Y = [0,   0,   0,   0,   1,   1,   1,   1  ]

def sigmoid(z): return 1 / (1 + math.exp(-z))

w, b, lr = 0.0, 0.0, 0.3
for step in range(2000):
    dw = db = 0.0
    for x, y in zip(X, Y):
        p = sigmoid(w*x + b)
        dw += (p - y) * x
        db += (p - y)
    w -= lr * dw / len(X)
    b -= lr * db / len(X)

print(f"learned  w = {w:.2f}  b = {b:.2f}   boundary at x = {-b/w:.2f}")
for x in [1.0, 2.5, 4.0]:
    print(f"  P(class=1 | x={x}) = {sigmoid(w*x+b):.3f}")`,
quiz: [
 { q: "The decision boundary of logistic regression sits where…", o: ["p = 0 exactly", "z = w·x + b = 0, i.e. p = 0.5", "The sigmoid is steepest — p = 1", "The loss is zero"], a: 1, why: "z=0 ⇒ σ(z)=0.5: the fence between predicted classes. It is still linear in x." },
 { q: "Why cross-entropy instead of squared error for classification?", o: ["It's differentiable, MSE isn't", "It matches the likelihood of Bernoulli labels and keeps gradients strong for confident-wrong predictions", "It bounds probabilities", "It requires no learning rate"], a: 1, why: "NLL of a Bernoulli model = cross-entropy; with sigmoid+MSE gradients vanish exactly when the model is confidently wrong." },
 { q: "The gradient of the loss w.r.t. w is Σ(p − y)x. When the model is exactly right (p = y) the contribution is…", o: ["Maximal", "Zero", "Negative", "Undefined"], a: 1, why: "No error, no update — learning is driven purely by prediction error." },
],
cards: [["Sigmoid", "σ(z) = 1/(1+e⁻ᶻ): squashes scores to probabilities; σ' = σ(1−σ)."], ["Logistic loss gradient", "∇w = Σ(p − y)x — error × input."], ["Decision boundary", "Where w·x + b = 0 (p = 0.5); linear in feature space."]],
links: [["StatQuest — Logistic regression", "https://www.youtube.com/watch?v=yIYKR4sgzI8"], ["CS229 notes — Classification", "https://cs229.stanford.edu/main_notes.pdf"]] },

"K-Means": { play: "kmeans",
eli5: "You have a pile of unlabeled dots and a hunch they form groups. K-means: drop k pins randomly, assign every dot to its nearest pin, then move each pin to the center of its dots. Repeat. The pins wander to the middles of the natural clumps, and the dots get sorted into k groups — no labels needed.",
intu: "K-means alternates two greedy steps — assign each point to the nearest centroid, then recompute each centroid as the mean of its points — and each step can only lower the total within-cluster squared distance (inertia), so it always converges. The catches: you must choose k yourself (elbow plots and silhouette scores help), results depend on initialization (k-means++ spreads the starting pins), and the 'nearest mean' geometry assumes roughly spherical, similar-sized blobs — crescents and rings will fool it (that's DBSCAN's territory).",
rig: "Objective: minimize J = Σₖ Σ_{x∈Cₖ} ||x − μₖ||². Lloyd's algorithm is block-coordinate descent on J: the assignment step minimizes J over cluster memberships with centroids fixed; the update step minimizes over centroids with memberships fixed (the mean uniquely minimizes summed squared distance). J is monotone non-increasing and the state space finite, so convergence to a local optimum is guaranteed — but the global problem is NP-hard, hence restarts and k-means++ seeding, which gives an O(log k)-competitive expected bound. K-means is also the hard-assignment limit of EM on an isotropic Gaussian mixture.",
math: [
 { t: "J = \\sum_{k=1}^{K} \\sum_{x_i \\in C_k} \\| x_i - \\mu_k \\|^2", n: "Inertia: total squared distance to assigned centroids. K-means descends this." },
 { t: "c_i = \\arg\\min_k \\|x_i - \\mu_k\\|^2", n: "Assignment step — nearest centroid wins." },
 { t: "\\mu_k = \\frac{1}{|C_k|} \\sum_{x_i \\in C_k} x_i", n: "Update step — the mean is the point minimizing summed squared distance." },
],
code: `pts = [(1,1), (1.5,2), (2,1.2), (8,8), (8.5,9), (9,8.2)]
cents = [(0,0), (5,5)]

def d2(a, b): return (a[0]-b[0])**2 + (a[1]-b[1])**2

for it in range(3):
    labels = [min(range(len(cents)), key=lambda k: d2(p, cents[k])) for p in pts]
    new = []
    for k in range(len(cents)):
        mine = [p for p, l in zip(pts, labels) if l == k]
        if mine:
            new.append((sum(p[0] for p in mine)/len(mine),
                        sum(p[1] for p in mine)/len(mine)))
        else:
            new.append(cents[k])
    cents = new
    cshow = [(round(c[0],2), round(c[1],2)) for c in cents]
    print(f"iter {it+1}: labels={labels}  centroids={cshow}")`,
quiz: [
 { q: "Why is k-means guaranteed to converge?", o: ["The loss is convex", "Both steps never increase inertia and there are finitely many assignments", "It uses gradient descent", "Centroids are fixed after initialization"], a: 1, why: "Monotone descent on J over a finite state space must terminate — though only at a local optimum." },
 { q: "K-means will struggle most on…", o: ["Well-separated round blobs", "Two interleaved crescent moons", "Blobs of equal size", "Standardized features"], a: 1, why: "Nearest-mean geometry carves space into convex (Voronoi) cells — crescents and rings violate that." },
 { q: "k-means++ improves plain k-means by…", o: ["Choosing k automatically", "Spreading initial centroids proportionally to squared distance from existing ones", "Using medians instead of means", "Making the objective convex"], a: 1, why: "Smart seeding avoids the classic failure of several pins landing in one clump." },
],
cards: [["K-means objective", "Minimize inertia: Σ over clusters of squared distances to their centroid."], ["Lloyd's two steps", "Assign to nearest centroid → move centroid to mean → repeat."], ["k-means++", "Seed new centroids far from existing ones (∝ squared distance) for better local optima."]],
links: [["scikit-learn — Clustering guide", "https://scikit-learn.org/stable/modules/clustering.html"], ["Visualizing K-Means (Naftali Harris)", "https://www.naftaliharris.com/blog/visualizing-k-means-clustering/"]] },

"PCA": { play: "pca",
eli5: "Photograph a fish tank: you flatten 3-D fish onto a 2-D photo. A good photographer picks the angle that keeps the fish most spread out and recognizable. PCA does exactly that for data with hundreds of dimensions: it finds the camera angles (directions) where your data varies the most, and drops the boring ones.",
intu: "PCA finds orthogonal directions of maximal variance — the principal components. Project onto the top few and you keep most of the information in far fewer numbers: compression, visualization, noise-reduction, and de-correlated features all at once. Mechanically: center the data, form the covariance matrix, take its eigenvectors (directions) and eigenvalues (variance along each). The 'explained variance ratio' tells you how much signal each component carries, so you can choose how many to keep with eyes open. Its limit: PCA only sees linear structure — a spiral confuses it (enter t-SNE/UMAP for visualization).",
rig: "Given centered data X ∈ R^{n×d} with covariance C = XᵀX/n, the first component solves max_{||w||=1} wᵀCw, whose optimum is the top eigenvector of C by the Rayleigh quotient; subsequent components are eigenvectors under orthogonality constraints. Equivalently, PCA is the best rank-k approximation of X in Frobenius norm (Eckart–Young), computed stably via SVD: X = UΣVᵀ with components V and variances Σ²/n. The same objective is reached from the other side as minimizing squared reconstruction error — variance maximization and reconstruction are dual views.",
math: [
 { t: "C = \\frac{1}{n} X^\\top X \\quad (X \\text{ centered})", n: "Covariance matrix: how every pair of features co-varies." },
 { t: "w_1 = \\arg\\max_{\\|w\\|=1} w^\\top C w \\;\\Rightarrow\\; C w_1 = \\lambda_1 w_1", n: "Max-variance direction = top eigenvector; λ₁ is the variance along it." },
 { t: "\\text{explained}_k = \\frac{\\lambda_k}{\\sum_j \\lambda_j}", n: "Share of total variance carried by component k — your keep/drop dial." },
],
code: `import math, random
random.seed(0)
pts = []
for _ in range(200):                      # correlated 2-d cloud
    t = random.gauss(0, 2)
    pts.append((t + random.gauss(0, .4), 0.6*t + random.gauss(0, .4)))

n = len(pts)
mx = sum(p[0] for p in pts)/n
my = sum(p[1] for p in pts)/n
sxx = sum((p[0]-mx)**2 for p in pts)/n
syy = sum((p[1]-my)**2 for p in pts)/n
sxy = sum((p[0]-mx)*(p[1]-my) for p in pts)/n

tr, det = sxx+syy, sxx*syy - sxy*sxy      # 2x2 eigen, closed form
l1 = tr/2 + math.sqrt(tr*tr/4 - det)
l2 = tr/2 - math.sqrt(tr*tr/4 - det)
v = (sxy, l1 - sxx); nv = math.hypot(*v); v = (v[0]/nv, v[1]/nv)

print(f"covariance = [[{sxx:.2f},{sxy:.2f}],[{sxy:.2f},{syy:.2f}]]")
print(f"PC1 direction = ({v[0]:.2f}, {v[1]:.2f})")
print(f"variance explained by PC1 = {l1/(l1+l2):.1%}")`,
quiz: [
 { q: "The first principal component is the direction that…", o: ["Minimizes variance", "Maximizes variance of the projected data", "Passes through the most points", "Is always the x-axis"], a: 1, why: "PC1 = top eigenvector of the covariance matrix = max-variance direction." },
 { q: "Why must you center (and usually scale) data before PCA?", o: ["Eigenvectors don't exist otherwise", "Uncentered data makes 'variance' point at the mean; unscaled features let big-unit features dominate", "It speeds up SVD", "It's only cosmetic"], a: 1, why: "PCA is variance-hungry: offsets and unit choices distort what 'largest variance' means." },
 { q: "Components 1–3 explain 95% of variance in 50-d data. A reasonable move is…", o: ["Keep all 50 dimensions anyway", "Project to 3 dimensions for modeling/visualization, knowing ~5% of variance is lost", "Conclude the data has exactly 3 clusters", "Discard components 1–3 as noise"], a: 1, why: "Explained variance is the principled dial for how much structure survives compression." },
],
cards: [["PCA in one line", "Eigenvectors of the covariance matrix = orthogonal max-variance directions."], ["Explained variance ratio", "λₖ / Σλⱼ — how much signal component k carries."], ["Eckart–Young", "Top-k PCA/SVD is the best rank-k approximation in least-squares sense."]],
links: [["Setosa — PCA explained visually", "https://setosa.io/ev/principal-component-analysis/"], ["Distill — t-SNE, use with care (contrast)", "https://distill.pub/2016/misread-tsne/"]] },

"Activation Functions": { play: "act",
eli5: "Stack ten linear layers and you still have… one linear layer. Boring. Activation functions add a tiny nonlinearity after each layer — a bend in the wire — and suddenly stacking layers creates real complexity: curves, corners, hierarchies. ReLU is the famous one: 'if negative, output 0; else pass through.' Brutally simple, works great.",
intu: "Without nonlinearity, depth is an illusion (compositions of linear maps are linear). Sigmoid and tanh were the classics but saturate: at large |z| their gradient ≈ 0, starving deep nets of learning signal — the vanishing gradient problem. ReLU fixed it: gradient exactly 1 for positive inputs, cheap, sparse — but a neuron stuck negative can 'die' (always-zero gradient). Leaky ReLU keeps a small negative slope; GELU/SiLU (smooth, slightly probabilistic gates) power modern Transformers. Rule of thumb: ReLU-family for hidden layers, sigmoid/softmax only at output where you need probabilities.",
rig: "σ(z)=1/(1+e⁻ᶻ) has σ′=σ(1−σ) ≤ 1/4; tanh′ = 1−tanh² ≤ 1 — both decay exponentially in |z|, so products across L layers shrink like ε^L (vanishing gradients). ReLU(z)=max(0,z) has derivative 1 on z>0, preserving gradient norm through active paths and inducing sparsity, at the cost of dead units and non-differentiability at 0 (subgradient suffices). GELU(z)=zΦ(z) weights the input by the Gaussian CDF — a smooth interpolation between identity and zero used in BERT/GPT-family FFNs; SiLU/Swish z·σ(z) behaves similarly. Output layers pair with losses: sigmoid+BCE, softmax+CE, identity+MSE.",
math: [
 { t: "\\sigma(z) = \\frac{1}{1+e^{-z}}, \\quad \\sigma'(z) = \\sigma(z)(1-\\sigma(z)) \\le \\tfrac{1}{4}", n: "Sigmoid saturates: tiny gradients at large |z| ⇒ vanishing gradients when stacked." },
 { t: "\\mathrm{ReLU}(z) = \\max(0, z), \\quad \\mathrm{ReLU}'(z) = \\mathbf{1}[z > 0]", n: "Gradient 1 on the active side — signal flows undamped; inactive units go silent." },
 { t: "\\mathrm{GELU}(z) = z\\,\\Phi(z) \\approx 0.5z\\big(1+\\tanh(0.7979(z + 0.0447 z^3))\\big)", n: "The smooth gate used in Transformer feed-forward blocks." },
],
code: `import math
def sigmoid(z): return 1/(1+math.exp(-z))
def relu(z):    return max(0.0, z)
def gelu(z):    return 0.5*z*(1+math.tanh(0.79788456*(z+0.044715*z**3)))

print("   z    sigmoid  sig'     tanh     relu    gelu")
for z in [-4, -2, -1, 0, 1, 2, 4]:
    s = sigmoid(z)
    print(f"{z:4d}   {s:6.3f}  {s*(1-s):6.3f}  {math.tanh(z):7.3f}  {relu(z):5.2f}  {gelu(z):7.3f}")

print()
print("watch sig' collapse toward 0 at |z|=4: that is saturation,")
print("the reason deep sigmoid nets could not train before ReLU.")`,
quiz: [
 { q: "A deep network with no activation functions is equivalent to…", o: ["A decision tree", "A single linear layer", "A ReLU network", "Nothing computable"], a: 1, why: "Composition of linear maps is linear: W₃(W₂(W₁x)) = Wx." },
 { q: "'Dying ReLU' refers to…", o: ["ReLU being deprecated", "Units whose input stays negative, giving zero output and zero gradient forever", "Exploding activations", "ReLU at the output layer"], a: 1, why: "On the flat side, gradient is 0 — a unit pushed there may never recover. Leaky ReLU keeps a small slope as insurance." },
 { q: "Why do sigmoid/tanh cause vanishing gradients in deep stacks?", o: ["They are non-monotonic", "Their derivatives are ≤ 1 and near 0 when saturated, so products across layers shrink exponentially", "They are expensive", "They output negative values"], a: 1, why: "Backprop multiplies layer-local derivatives; many small factors ⇒ exponentially small gradient." },
],
cards: [["Why nonlinearity", "Without it, any depth collapses to one linear map."], ["Saturation", "Sigmoid/tanh gradients ≈ 0 at large |z| → vanishing gradients in deep nets."], ["Default choice", "ReLU/GELU in hidden layers; sigmoid/softmax only at outputs needing probabilities."]],
links: [["CS231n — Neural nets notes", "https://cs231n.github.io/neural-networks-1/"], ["GELU paper", "https://arxiv.org/abs/1606.08415"]] },

"Backpropagation": { play: "nn",
eli5: "A network makes a bad guess. Whose fault was it, among millions of knobs? Backprop answers by passing the blame backwards: the last layer tells the layer before 'you fed me this much error,' that layer splits blame among its own inputs, and so on to the start. One backward sweep and every knob knows its share — then each nudges itself accordingly.",
intu: "Backprop is the chain rule, organized. Forward pass: compute and cache each intermediate value. Backward pass: starting from dL/d(output), multiply by local derivatives edge-by-edge through the computational graph, accumulating dL/d(every parameter) in one sweep — same cost order as the forward pass, no matter how many parameters. That efficiency (reverse-mode autodiff) is *the* reason deep learning is trainable. Frameworks record the graph as you compute (autograd) and run this sweep for you; understanding it hand-cranked is what turns 'loss.backward()' from magic into machinery.",
rig: "For a composition L = f_L ∘ … ∘ f_1(x), reverse-mode differentiation propagates adjoints: with zₖ = fₖ(zₖ₋₁), define δₖ = ∂L/∂zₖ; then δₖ₋₁ = Jₖᵀ δₖ where Jₖ = ∂fₖ/∂zₖ₋₁, and parameter gradients are ∂L/∂θₖ = (∂fₖ/∂θₖ)ᵀ δₖ. One forward + one backward pass computes the full gradient at O(1)× the cost of evaluation (cheap gradient principle), versus O(d) for forward-mode/finite differences. Canonical shortcut: sigmoid (or softmax) output with cross-entropy gives δ_out = ŷ − y exactly. Numerical gradient checking, (L(θ+ε)−L(θ−ε))/2ε, is the standard correctness test.",
math: [
 { t: "\\frac{\\partial L}{\\partial w_1} = \\frac{\\partial L}{\\partial \\hat y}\\cdot \\frac{\\partial \\hat y}{\\partial h}\\cdot \\frac{\\partial h}{\\partial w_1}", n: "The chain rule: multiply local derivatives along the path from loss to parameter." },
 { t: "\\delta_{k-1} = J_k^\\top\\, \\delta_k", n: "Reverse-mode recursion: pull the error signal backwards through each layer's Jacobian." },
 { t: "\\delta_{\\text{out}} = \\hat y - y \\quad (\\text{sigmoid/softmax} + \\text{cross-entropy})", n: "The famous cancellation — memorize it; it starts almost every backward pass." },
],
code: `import math
def sig(z): return 1/(1+math.exp(-z))

# 1 -> 1 -> 1 net:  h = tanh(w1 x + b1),  y = sigmoid(w2 h + b2)
p = {"w1": 0.6, "b1": -0.1, "w2": -0.8, "b2": 0.2}
x, t = 0.9, 1.0

def forward(q):
    h = math.tanh(q["w1"]*x + q["b1"])
    return h, sig(q["w2"]*h + q["b2"])

def loss(q):
    h, y = forward(q)
    return -(t*math.log(y) + (1-t)*math.log(1-y))

h, y = forward(p)
dz2 = y - t                                # the famous shortcut
g = {"dw2": dz2*h, "db2": dz2,
     "dw1": dz2*p["w2"]*(1-h*h)*x, "db1": dz2*p["w2"]*(1-h*h)}

print("param   backprop    numeric check")
for k in ["w1", "b1", "w2", "b2"]:
    e = 1e-5
    a, b2_ = dict(p), dict(p); a[k] += e; b2_[k] -= e
    num = (loss(a) - loss(b2_)) / (2*e)
    print(f"  {k}   {g['d'+k]:9.6f}   {num:9.6f}")`,
quiz: [
 { q: "Backprop computes gradients for ALL parameters in roughly…", o: ["One pass per parameter", "One forward + one backward pass total", "O(d²) passes", "It approximates them randomly"], a: 1, why: "Reverse-mode autodiff shares work: cost is a small constant times the forward pass, regardless of parameter count." },
 { q: "With sigmoid output + cross-entropy loss, the output-layer error term simplifies to…", o: ["ŷ(1−ŷ)", "ŷ − y", "−y/ŷ", "(ŷ − y)²"], a: 1, why: "The σ′ factor cancels against the log-loss derivative — the cleanest identity in deep learning." },
 { q: "The forward pass must cache intermediate activations because…", o: ["They are the model's output", "Local derivatives in the backward pass are evaluated at those cached values", "Memory is free", "They prevent overfitting"], a: 1, why: "e.g. d tanh/du = 1 − h²: you need h from the forward pass. This is why training uses more memory than inference." },
],
cards: [["Backprop in one line", "Chain rule applied backwards through the computational graph, caching forward values."], ["Cheap gradient principle", "Full gradient ≈ same cost as one forward pass — the enabler of deep learning."], ["δ_out shortcut", "Sigmoid/softmax + cross-entropy ⇒ output error = ŷ − y."]],
links: [["Karpathy — micrograd (build backprop from scratch)", "https://github.com/karpathy/micrograd"], ["CS231n — Backprop notes", "https://cs231n.github.io/optimization-2/"]] },

"Convolution Operation": { play: "conv",
eli5: "To find every cat ear in a photo, you don't need a new detector for each pixel position. Take one small 'ear stencil,' slide it across the whole image, and mark where it lights up. That sliding stencil is a convolution filter — one tiny set of weights reused everywhere, hunting for its pattern at every location.",
intu: "A conv layer slides a small learned kernel (say 3×3) over the input, computing a weighted sum at each position → a feature map of 'pattern found here' scores. Two superpowers: weight sharing (one kernel, reused everywhere ⇒ ~thousands of parameters instead of millions) and translation awareness (a cat is a cat anywhere). Stride controls step size, padding preserves borders, and stacking layers grows the receptive field so late layers see whole objects: edges → textures → parts → things. That hierarchy, learned not hand-coded, is why CNNs conquered vision.",
rig: "For input X and kernel K ∈ R^{k×k}: (X ∗ K)[i,j] = Σₐ Σ_b X[i+a, j+b]·K[a,b] (cross-correlation, as implemented in DL frameworks). Output spatial size = ⌊(n + 2p − k)/s⌋ + 1 with padding p and stride s. With C_in input and C_out output channels, each output channel owns a C_in×k×k kernel: parameters = C_out·C_in·k² + C_out — independent of image size, the source of the efficiency. Convolution is a linear operator with a Toeplitz structure (equivariant to translation); receptive field grows linearly with depth (faster with stride/dilation), and 1×1 convolutions mix channels without spatial extent.",
math: [
 { t: "(X * K)[i,j] = \\sum_{a=0}^{k-1}\\sum_{b=0}^{k-1} X[i+a,\\, j+b]\\; K[a,b]", n: "Slide, multiply, sum. One kernel, every location." },
 { t: "\\text{out} = \\left\\lfloor \\frac{n + 2p - k}{s} \\right\\rfloor + 1", n: "Spatial size from input n, padding p, kernel k, stride s." },
 { t: "\\#\\text{params} = C_{out}\\, C_{in}\\, k^2 + C_{out}", n: "Independent of image size — the weight-sharing payoff." },
],
code: `img = [
 [0,0,0,0,0,0],
 [0,9,9,9,9,0],
 [0,9,0,0,9,0],
 [0,9,0,0,9,0],
 [0,9,9,9,9,0],
 [0,0,0,0,0,0]]
K = [[-1,-1,-1],
     [-1, 8,-1],
     [-1,-1,-1]]        # classic edge detector

H, W = len(img), len(img[0])
out = []
for i in range(H-2):
    row = []
    for j in range(W-2):
        s = sum(img[i+a][j+b] * K[a][b] for a in range(3) for b in range(3))
        row.append(s)
    out.append(row)

print("input (a hollow square):")
for r in img: print("  " + " ".join(str(v) for v in r))
print()
print("after the 3x3 edge kernel (edges light up):")
for r in out: print("  " + " ".join(f"{v:4d}" for v in r))`,
quiz: [
 { q: "The main reason conv layers need so few parameters is…", o: ["They use small images", "One kernel's weights are shared across every spatial position", "They skip the bias term", "They quantize weights"], a: 1, why: "Parameters scale with kernel size and channels — not with image size." },
 { q: "A 3×3 kernel, stride 1, on a 32×32 input with padding 1 produces an output of size…", o: ["30×30", "32×32", "34×34", "16×16"], a: 1, why: "(32 + 2·1 − 3)/1 + 1 = 32: 'same' padding preserves spatial size." },
 { q: "Deeper conv layers detect increasingly abstract features because…", o: ["Their kernels are physically larger", "Their receptive field covers more of the input, composing earlier features", "They use different math", "They see the labels"], a: 1, why: "Stacking layers composes local detectors: edges → motifs → parts → objects." },
],
cards: [["Convolution", "Slide a small learned kernel over the input; weighted sum at each spot → feature map."], ["Output size formula", "⌊(n + 2p − k)/s⌋ + 1."], ["Receptive field", "Input region a unit can see — grows with depth/stride, enabling edge→object hierarchies."]],
links: [["CNN explainer (interactive)", "https://poloclub.github.io/cnn-explainer/"], ["Conv arithmetic guide", "https://arxiv.org/abs/1603.07285"]] },

"Self-Attention": { play: "attn",
eli5: "Reading 'The animal didn't cross the street because it was too tired,' your brain instantly links 'it' to 'animal.' Self-attention gives every word that skill: each word looks at all the other words, decides which are relevant to it right now, and blends in their information. Every word, attending to every word, all at once.",
intu: "Each token emits three vectors: a Query ('what am I looking for?'), a Key ('what do I contain?'), and a Value ('what will I contribute?'). Token i scores every token j by qᵢ·kⱼ, softmaxes the scores into weights, and outputs the weighted sum of Values — a new, context-aware representation. Because it's all matrix multiplies, every pair interacts in parallel (no RNN-style waiting), and distance costs nothing: token 1 can attend to token 1000 as easily as its neighbor. Multi-head = several attention 'searchlights' running in parallel, each learning a different relationship (syntax, coreference, position…).",
rig: "Attention(Q,K,V) = softmax(QKᵀ/√d_k)V, with Q = XW_Q, K = XW_K, V = XW_V. The √d_k scaling keeps dot-product variance ≈ 1 (for entries with unit variance, Var(q·k) = d_k), preventing softmax saturation and vanishing gradients. Causal (decoder) attention masks j > i with −∞ pre-softmax, enforcing autoregression. Cost is O(n²d) time and O(n²) score memory — the long-context bottleneck driving FlashAttention (IO-aware exact attention), sparse/linear variants, and KV caching at inference (store K,V of past tokens; generation becomes O(n) per new token).",
math: [
 { t: "\\mathrm{Attn}(Q,K,V) = \\mathrm{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right) V", n: "The whole Transformer, one line: score, normalize, mix values." },
 { t: "\\alpha_{ij} = \\frac{\\exp(q_i \\cdot k_j / \\sqrt{d_k})}{\\sum_{j'} \\exp(q_i \\cdot k_{j'} / \\sqrt{d_k})}", n: "How much token i attends to token j — each row of the attention heatmap." },
 { t: "\\text{mask: } \\alpha_{ij} = 0 \\;\\; \\forall\\, j > i", n: "Causality for generation: no peeking at the future." },
],
code: `import math
tokens = ["the", "cat", "sat"]
E = {"the": [1.0, 0.2], "cat": [0.3, 1.0], "sat": [0.5, 0.8]}
d = 2

def dot(a, b): return sum(x*y for x, y in zip(a, b))
def softmax(xs):
    m = max(xs); e = [math.exp(v - m) for v in xs]; s = sum(e)
    return [v/s for v in e]

print("attention weights (each row sums to 1):")
for qt in tokens:
    scores = [dot(E[qt], E[kt]) / math.sqrt(d) for kt in tokens]
    w = softmax(scores)
    mix = [sum(w[j]*E[kt][k] for j, kt in enumerate(tokens)) for k in range(d)]
    row = "  ".join(f"{kt}:{wj:.2f}" for kt, wj in zip(tokens, w))
    print(f"  {qt:>3} -> {row}   new vec: {[round(v,2) for v in mix]}")`,
quiz: [
 { q: "In Q·K·V terms, the Query of a token represents…", o: ["Its final output", "What information it is looking for from other tokens", "Its position", "Its probability"], a: 1, why: "Query asks; Keys advertise; Values deliver. The Q–K match decides the mixing weights." },
 { q: "Why divide the scores by √d_k?", o: ["To normalize rows to sum to 1", "To keep score variance ~1 so softmax doesn't saturate into one-hot spikes", "To reduce memory", "It is arbitrary"], a: 1, why: "Dot products grow with dimension; unscaled, softmax saturates and gradients vanish. (Row normalization is softmax's job.)" },
 { q: "Self-attention's advantage over RNNs for long-range dependencies is that…", o: ["It uses fewer parameters", "Any two positions interact in one step, in parallel — no signal decay across time steps", "It never overfits", "It is O(n) in sequence length"], a: 1, why: "Direct pairwise paths; the price is O(n²) compute, not degraded gradients." },
],
cards: [["Attention formula", "softmax(QKᵀ/√d_k)·V — score, normalize, mix."], ["Q / K / V roles", "Query: what I seek. Key: what I contain. Value: what I give."], ["Why √d_k", "Keeps dot-product variance ~1; prevents softmax saturation."]],
links: [["The Illustrated Transformer — Jay Alammar", "https://jalammar.github.io/illustrated-transformer/"], ["Attention Is All You Need", "https://arxiv.org/abs/1706.03762"]] },

"Tokenizers: BPE, WordPiece, Unigram": { play: "tok",
eli5: "A model can't read letters or words directly — it needs a fixed menu of pieces. BPE builds that menu by starting from single characters and repeatedly gluing the most frequent neighboring pair: t+h→th, th+e→the. Common words end up as one piece; rare words get spelled from smaller chunks. Nothing is ever 'unknown' — worst case, it falls back to characters.",
intu: "Tokenization is the interface between text and tensors, and it quietly shapes everything: context windows are measured in tokens, API bills are per token, and weird failures (arithmetic, spelling, rare names, non-English text costing 3× more tokens) often trace back to how text got chopped. BPE learns merges by frequency; WordPiece scores merges by likelihood gain; Unigram starts big and prunes. Modern LLMs run byte-level BPE (vocab ~50k–200k) so any byte sequence is representable. When an LLM behaves oddly, 'look at the tokens' is a genuinely elite debugging move.",
rig: "BPE (Sennrich et al., 2016): initialize with characters/bytes; iterate — count adjacent symbol-pair frequencies, merge the argmax pair into a new symbol, record the merge — until the vocab budget is met. Encoding replays merges in learned order (or greedily longest-match). WordPiece selects the merge maximizing likelihood of the corpus under a unigram LM (score = freq(ab)/(freq(a)·freq(b))). Unigram-LM (Kudo) instead starts from a large candidate set and prunes tokens by EM to maximize corpus likelihood, enabling sampling-based subword regularization. Compression ratio (chars/token ≈ 3–4 for English) directly sets the effective context and cost; byte fallback guarantees closed-vocabulary coverage of arbitrary input.",
math: [
 { t: "(a^*, b^*) = \\arg\\max_{(a,b)} \\; \\mathrm{count}(a, b)", n: "The BPE step: merge the most frequent adjacent pair; repeat to budget." },
 { t: "\\text{WordPiece score}(a,b) = \\frac{\\mathrm{freq}(ab)}{\\mathrm{freq}(a)\\cdot \\mathrm{freq}(b)}", n: "Likelihood-driven merging rather than raw frequency." },
 { t: "\\text{compression} = \\frac{\\#\\text{chars}}{\\#\\text{tokens}}", n: "~3–4 for English with modern vocabs; lower for code and low-resource languages." },
],
code: `corpus = "low lower lowest new newer newest wide wider widest"
seqs = [list(w) for w in corpus.split()]

def get_stats(seqs):
    st = {}
    for s in seqs:
        for a, b in zip(s, s[1:]):
            st[(a, b)] = st.get((a, b), 0) + 1
    return st

def merge(seqs, pair):
    out = []
    for s in seqs:
        r, i = [], 0
        while i < len(s):
            if i < len(s)-1 and (s[i], s[i+1]) == pair:
                r.append(s[i] + s[i+1]); i += 2
            else:
                r.append(s[i]); i += 1
        out.append(r)
    return out

for step in range(8):
    best = max(get_stats(seqs), key=get_stats(seqs).get)
    seqs = merge(seqs, best)
    print(f"merge {step+1}: '{best[0]}' + '{best[1]}'  ->  '{best[0]+best[1]}'")

print()
print("tokenized:", ["/".join(s) for s in seqs])`,
quiz: [
 { q: "At each training step, classic BPE merges…", o: ["The longest existing token", "The most frequent adjacent pair of symbols", "A random pair", "All vowel pairs"], a: 1, why: "Greedy frequency-based merging is the entire algorithm." },
 { q: "Byte-level BPE never produces an 'unknown token' because…", o: ["Its vocab contains every word", "Any input can fall back to raw byte tokens", "It skips unknown text", "It uses infinite vocab"], a: 1, why: "The 256 byte symbols are always available as a floor — everything is representable." },
 { q: "A practical consequence of tokenization for LLM users is…", o: ["It only matters during pretraining", "Context limits and API cost are measured in tokens, and rare/multilingual text tokenizes less efficiently", "All languages cost the same", "Tokens equal words"], a: 1, why: "Same paragraph, different language → different token count → different cost and context usage." },
],
cards: [["BPE training loop", "Count adjacent pairs → merge the most frequent → repeat to vocab budget."], ["Byte fallback", "Byte-level vocab means no input is ever unrepresentable."], ["Compression ratio", "chars/token (~3–4 English) — sets effective context and cost."]],
links: [["Karpathy — Let's build the GPT tokenizer", "https://www.youtube.com/watch?v=zduSFxRajkE"], ["BPE paper (Sennrich 2016)", "https://arxiv.org/abs/1508.07909"]] },

"Sampling: Temperature, Top-k, Top-p": { play: "sampling",
eli5: "An LLM doesn't pick 'the' next word — it holds an opinion poll over every possible next token. Sampling decides how to use the poll. Temperature low: almost always take the winner (safe, repetitive). Temperature high: give underdogs a chance (creative, chaotic). Top-k/top-p first throw out the ridiculous candidates, then draw from what's left.",
intu: "Decoding turns probabilities into text, and it changes behavior as much as prompting does. Temperature rescales logits before softmax: T→0 approaches greedy argmax; T>1 flattens toward uniform. Top-k keeps only the k highest-probability tokens; top-p (nucleus) keeps the smallest set whose cumulative probability ≥ p — adaptive: narrow when the model is confident, wide when uncertain. Typical recipes: T≈0–0.3 for code/extraction, T≈0.7–1.0 with top-p≈0.9 for creative work. Greedy/beam maximize likelihood but famously loop and go bland; sampling trades a bit of likelihood for humanity.",
rig: "Given logits z, p_i = exp(z_i/T)/Σⱼexp(zⱼ/T). As T→0 the distribution → argmax; entropy increases monotonically with T. Top-k truncates support to the k largest p_i then renormalizes; nucleus sampling (Holtzman et al., 2020) truncates to the minimal set S with Σ_{i∈S} p_i ≥ p, adapting support size to the distribution's entropy and cutting the unreliable low-probability tail where degenerate repetition lives. Repetition/frequency/presence penalties modify logits of already-seen tokens. These operate per-step on the conditional p(x_t | x_<t); small per-step changes compound over long generations, which is why decoding settings shift global style so strongly.",
math: [
 { t: "p_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}", n: "Temperature rescales logits: T<1 sharpens, T>1 flattens, T→0 = greedy." },
 { t: "S_p = \\text{smallest } S \\text{ with } \\sum_{i \\in S} p_i \\ge p", n: "Nucleus (top-p): keep just enough head to cover mass p; drop the junk tail." },
 { t: "H(p) = -\\sum_i p_i \\log p_i", n: "Entropy = uncertainty of the next-token poll; temperature turns this dial." },
],
code: `import math, random
random.seed(0)
vocab  = ["the", "a", "cat", "dog", "moon", "quantum", "sings"]
logits = [ 3.0,  2.2,  1.6,   1.4,   0.5,    -0.5,     -1.0 ]

def softmax(xs):
    m = max(xs); e = [math.exp(v-m) for v in xs]; s = sum(e)
    return [v/s for v in e]

def draw(probs):
    r, c = random.random(), 0.0
    for i, p in enumerate(probs):
        c += p
        if r <= c: return i
    return len(probs)-1

for T in [0.3, 1.0, 2.0]:
    probs = softmax([z/T for z in logits])
    sample = [vocab[draw(probs)] for _ in range(300)]
    counts = {w: sample.count(w) for w in vocab}
    print(f"T={T}: {counts}")
print()
print("low T concentrates on 'the'; high T spreads to 'quantum sings'.")`,
quiz: [
 { q: "Setting temperature very low (→0) makes generation…", o: ["More diverse", "Nearly deterministic — argmax at each step", "Faster", "Longer"], a: 1, why: "Dividing logits by tiny T makes the max dominate softmax completely." },
 { q: "Top-p (nucleus) sampling differs from top-k by…", o: ["Always keeping fewer tokens", "Adapting the kept set's size to cover fixed probability mass p", "Ignoring probabilities", "Only working with T=1"], a: 1, why: "Confident distribution → tiny nucleus; uncertain → wide. Top-k is a fixed-size cutoff." },
 { q: "For extracting structured JSON from documents, a sensible decoding choice is…", o: ["T=1.8, no truncation", "Low temperature (~0–0.3)", "High top-p only", "Random sampling per field"], a: 1, why: "You want the model's single most probable, consistent completion — not creativity." },
],
cards: [["Temperature", "Divide logits by T: <1 sharpens toward greedy, >1 flattens toward uniform."], ["Top-p / nucleus", "Keep the smallest token set with cumulative probability ≥ p; adaptive truncation."], ["Setting intuition", "Code/extraction: T≈0–0.3. Creative: T≈0.7–1.0 with top-p≈0.9."]],
links: [["The Curious Case of Neural Text Degeneration", "https://arxiv.org/abs/1904.09751"], ["Hugging Face — How to generate", "https://huggingface.co/blog/how-to-generate"]] },

"RAG Architecture": { play: "rag",
eli5: "An LLM is a brilliant intern with a sealed brain: it knows a lot, but nothing about your private documents or last week. RAG hands the intern a library card. When a question arrives, the system first fetches the most relevant pages from your documents, staples them to the question, and says: 'answer using these.' Grounded answers, with receipts.",
intu: "Two phases. Ingestion: split documents into chunks, embed each chunk into a vector, store in a vector database. Query: embed the question, retrieve the nearest chunks (often hybrid: dense vectors + BM25 keywords, then a reranker), assemble them into the prompt with instructions to cite, and generate. Why it beats alternatives: fresher than retraining, cheaper than fine-tuning, auditable (you can show sources), and permission-aware. Where it fails: bad chunking, retrieval misses, or the model ignoring context — so evaluation must score retrieval (did the right chunks arrive?) and generation (was the answer faithful to them?) separately.",
rig: "Retriever: score(q, c) = cos(E(q), E(c)) with a bi-encoder E; ANN indexes (HNSW/IVF) make top-k search sublinear over millions of chunks. Hybrid retrieval fuses dense scores with BM25 (e.g., reciprocal rank fusion); a cross-encoder reranker then reads (q, c) pairs jointly for precision at the top. Generation: p(a | q, c₁..c_k) — the retrieved context conditions decoding; faithfulness = P(claims ⊆ entailed by context). Chunking is a bias–variance dial: small chunks retrieve precisely but fragment reasoning; large chunks preserve context but dilute similarity and burn tokens. Evaluate with context recall/precision, answer faithfulness, and answer relevance as separate metrics (the RAG triad); most production failures localize to retrieval, not generation.",
math: [
 { t: "\\mathrm{score}(q, c) = \\frac{E(q) \\cdot E(c)}{\\|E(q)\\|\\, \\|E(c)\\|}", n: "Dense retrieval: cosine similarity between query and chunk embeddings." },
 { t: "p_\\theta(a \\mid q, c_1, \\dots, c_k)", n: "Generation conditioned on retrieved chunks — retrieval writes the model's working memory." },
 { t: "\\text{faithfulness} = \\frac{\\#\\{\\text{answer claims supported by context}\\}}{\\#\\{\\text{answer claims}\\}}", n: "The core RAG metric: did the model stay inside its receipts?" },
],
code: `import math
docs = {
 "optimizer": "gradient descent updates weights against the loss gradient using a learning rate",
 "tokenizer": "byte pair encoding merges frequent character pairs to build subword tokens",
 "rag":       "retrieval augmented generation fetches relevant chunks then answers grounded in them",
 "attention": "attention computes weighted mixes of values using query key similarity",
}

def score(q, d):                      # tiny lexical retriever (TF/len-normalized)
    ds = d.lower().split()
    return sum(ds.count(w) for w in set(q.lower().split())) / math.sqrt(len(ds))

query = "how do systems retrieve relevant chunks to ground an answer"
ranked = sorted(docs.items(), key=lambda kv: -score(query, kv[1]))

print("query:", query)
for name, d in ranked:
    print(f"  {score(query, d):5.2f}  [{name:9}] {d}")
print()
print("top chunks get stuffed into the prompt as context -> grounded answer.")
print("(the live playground for this lesson does it with a real model)")`,
quiz: [
 { q: "RAG's key advantage over fine-tuning for company-document Q&A is…", o: ["It trains faster", "Fresh, auditable, permission-aware knowledge without retraining — sources can be cited", "It needs no LLM", "It never errs"], a: 1, why: "Update the index, not the weights; show receipts; filter what each user may retrieve." },
 { q: "Answers keep missing info that IS in the corpus. The first place to investigate is…", o: ["Raise temperature", "Retrieval: chunking, embeddings, and top-k — is the right chunk even reaching the prompt?", "A bigger LLM", "Longer answers"], a: 1, why: "Generation can't use what retrieval never delivered. Debug the pipeline stage by stage." },
 { q: "Chunk size is a tradeoff because…", o: ["Vector DBs cap chunk length", "Small chunks match precisely but fragment context; big chunks keep context but dilute similarity and cost tokens", "Embeddings only work under 100 tokens", "It only affects speed"], a: 1, why: "Precision vs coherence vs budget — tune per corpus, often ~200–800 tokens with overlap." },
],
cards: [["RAG pipeline", "Chunk → embed → index → retrieve (hybrid + rerank) → generate with citations."], ["Faithfulness", "Share of answer claims actually supported by retrieved context."], ["First debugging rule", "Most RAG failures are retrieval failures — inspect what reached the prompt."]],
links: [["RAG paper (Lewis et al.)", "https://arxiv.org/abs/2005.11401"], ["Anthropic docs — Retrieval patterns", "https://docs.claude.com/"]] },

"ReAct Pattern": { play: "agent",
eli5: "Ask a friend 'what's 87 × 43 plus the population of France?' — they think, grab a calculator, look at the result, think again, maybe search, then answer. ReAct teaches an LLM that exact rhythm: Thought (reason about what's needed) → Action (use a tool) → Observation (read the result) → repeat → Answer. Reasoning and acting, interleaved.",
intu: "A raw LLM only emits text; ReAct turns text into a control loop. The model writes a Thought, then an Action like calc[87*43]; your code intercepts it, actually runs the tool, and appends Observation: 3741 to the conversation; the model continues with that fresh fact in context. Reasoning grounds the actions (why this tool, with what input); observations ground the reasoning (real data beats hallucination). This loop — plus stop conditions, step limits, and error handling when tools fail or the model emits malformed actions — is the skeleton under nearly every modern agent framework. Function-calling APIs are ReAct with structured JSON instead of parsed text.",
rig: "Formally the agent is a policy over an augmented action space: at step t, given trajectory τ = (q, th₁, a₁, o₁, …), the LM samples either a thought (free-form token sequence, changing context but not the environment) or an action aₜ ∈ tools with arguments; the environment returns oₜ = exec(aₜ). Yao et al. (2022) showed interleaving beats action-only (grounding failures) and reason-only/CoT (hallucinated facts) on knowledge and interaction benchmarks. Engineering realities dominate: max-iteration guards against loops, tool schemas + validation against malformed calls, observation truncation against context blowup, and sandboxing/allowlists because the model's output becomes executed behavior. Evaluation is end-to-end task success plus trajectory audits (tool-call precision, unnecessary-step rate).",
math: [
 { t: "a_t \\sim \\pi_{LM}(\\cdot \\mid q,\\, th_1, a_1, o_1, \\dots, th_t)", n: "The LM as a policy: next thought-or-action conditioned on the whole trajectory." },
 { t: "o_t = \\mathrm{exec}(a_t)", n: "The environment answers back — observations re-ground the reasoning." },
 { t: "\\text{loop} \\le N_{max}, \\quad \\text{stop on } \\texttt{Answer:}", n: "Always bound the loop; agents without limits find infinite ways to spin." },
],
code: `# a hand-run ReAct trace (the live playground runs this loop with a real model)
def calc(expr):
    if not set(expr) <= set("0123456789+-*/(). "):
        return "error: unsupported characters"
    return str(eval(expr, {"__builtins__": {}}, {}))

print("Question: A run uses 12 layers x 64 heads split over 8 GPUs.")
print("          How many head-layers per GPU?")
print()
print("Thought: I should compute (12 * 64) / 8 with the calculator.")
print("Action:  calc[(12 * 64) / 8]")
obs = calc("(12 * 64) / 8")
print(f"Observation: {obs}")
print()
print("Thought: 96 head-layers per GPU. I can answer.")
print(f"Answer: Each GPU handles {obs} head-layers.")`,
quiz: [
 { q: "In ReAct, an 'Observation' is…", o: ["The model's private reasoning", "The real result of executing the model's chosen action, fed back into context", "The user's question", "A random hint"], a: 1, why: "Your harness runs the tool and appends its actual output — reality re-enters the loop." },
 { q: "Interleaving Thoughts with Actions beats actions-only mainly because…", o: ["It's fewer tokens", "Reasoning steers which tool to use and how to interpret results — fewer flailing calls", "Tools require it", "It disables hallucination entirely"], a: 1, why: "Yao et al.: reasoning grounds acting; acting grounds reasoning. Each fixes the other's failure mode." },
 { q: "A non-negotiable safety feature of any agent loop is…", o: ["High temperature", "A maximum iteration count and validated/sandboxed tool execution", "Unlimited memory", "Hiding observations from the model"], a: 1, why: "The model's text becomes executed behavior — bound it, validate it, sandbox it." },
],
cards: [["ReAct loop", "Thought → Action → Observation → … → Answer; the LM as a tool-using policy."], ["Why interleave", "Reasoning grounds tool choice; observations ground the next reasoning step."], ["Agent guardrails", "Step limits, schema validation, sandboxed tools, observation truncation."]],
links: [["ReAct paper", "https://arxiv.org/abs/2210.03629"], ["Anthropic — Building effective agents", "https://www.anthropic.com/research/building-effective-agents"]] },

"Q-Learning": { play: "rl",
eli5: "A mouse in a maze learns cheese-finding without a map: try a move, feel the result, and keep a scorecard — 'from this square, going right eventually leads to cheese: +8.' Every experience nudges the scorecard toward the truth. Eventually the mouse just follows the biggest numbers. The scorecard is Q, and updating it from experience is Q-learning.",
intu: "Q(s,a) estimates total future reward for taking action a in state s, then behaving well afterwards. After each step you compare what you predicted with what you actually saw — reward plus the best you now think the next state is worth — and move Q a little toward that target. The gap is the temporal-difference error: the learning signal of RL (and, neuroscientists note, a good model of dopamine). Exploration is the catch: always exploiting the current best means never discovering better routes, so ε-greedy forces occasional random tries. Crucially, Q-learning is off-policy: it learns the optimal Q even while behaving exploratorily. Swap the table for a neural network and you have DQN — the Atari breakthrough.",
rig: "For an MDP (S, A, P, R, γ), the optimal action-value satisfies the Bellman optimality equation Q*(s,a) = E[r + γ max_{a'} Q*(s',a')]. Tabular Q-learning performs stochastic approximation on this fixed point: Q(s,a) ← Q(s,a) + α[r + γ max_{a'}Q(s',a') − Q(s,a)]. With all pairs visited infinitely often and Robbins–Monro step sizes (Σα = ∞, Σα² < ∞), Q → Q* w.p.1 (Watkins & Dayan 1992) — regardless of the (sufficiently exploratory) behavior policy: off-policy learning. With function approximation, the 'deadly triad' (bootstrapping + off-policy + approximation) can diverge; DQN's replay buffers and target networks are stabilizers, not guarantees.",
math: [
 { t: "Q(s,a) \\leftarrow Q(s,a) + \\alpha\\big[\\underbrace{r + \\gamma \\max_{a'} Q(s',a')}_{\\text{TD target}} - Q(s,a)\\big]", n: "The update: nudge Q toward reward-plus-discounted-best-future." },
 { t: "\\delta = r + \\gamma \\max_{a'} Q(s',a') - Q(s,a)", n: "TD error — surprise. Positive: better than expected; the universal RL learning signal." },
 { t: "\\pi(s) = \\begin{cases} \\text{random} & \\text{w.p. } \\varepsilon \\\\ \\arg\\max_a Q(s,a) & \\text{otherwise} \\end{cases}", n: "ε-greedy: mostly exploit, sometimes explore. Decay ε as knowledge firms up." },
],
code: `import random
random.seed(1)
N = 6                                  # corridor states 0..5, cheese at 5
Q = [[0.0, 0.0] for _ in range(N)]     # actions: 0 = left, 1 = right
alpha, gamma, eps = 0.5, 0.9, 0.2

for ep in range(300):
    s = 0
    while s != N - 1:
        if random.random() < eps: a = random.randint(0, 1)
        else: a = 0 if Q[s][0] > Q[s][1] else 1
        s2 = max(0, s-1) if a == 0 else min(N-1, s+1)
        r = 10.0 if s2 == N-1 else -1.0
        Q[s][a] += alpha * (r + gamma * max(Q[s2]) - Q[s][a])
        s = s2

print("state | Q(left)  Q(right) | greedy move")
for s in range(N - 1):
    g = "left" if Q[s][0] > Q[s][1] else "right"
    print(f"  {s}   | {Q[s][0]:7.2f} {Q[s][1]:8.2f} | {g}")`,
quiz: [
 { q: "The TD target r + γ·max Q(s′,a′) represents…", o: ["The final episode reward", "Immediate reward plus discounted best estimated future value", "The average of all Q values", "The exploration bonus"], a: 1, why: "One real step of experience + your current best guess about the rest — bootstrapped learning." },
 { q: "Q-learning is 'off-policy' because…", o: ["It ignores rewards", "It learns the optimal policy's values while behaving with a different (exploratory) policy", "It needs no environment", "It updates offline only"], a: 1, why: "The max over a′ in the target evaluates the greedy policy, regardless of the ε-greedy action actually taken." },
 { q: "With ε = 0 from the very start, the classic failure is…", o: ["Divergence to infinity", "Locking onto the first found mediocre route and never discovering better ones", "Too much randomness", "Negative Q values"], a: 1, why: "Pure exploitation of early, wrong estimates — the explore/exploit dilemma in one line." },
],
cards: [["Q(s,a)", "Expected discounted future reward for action a in state s, then acting optimally."], ["TD error", "δ = r + γ max Q(s′,·) − Q(s,a): the surprise that drives learning."], ["ε-greedy", "Explore with probability ε, else exploit argmax Q; decay ε over time."]],
links: [["Sutton & Barto — RL: An Introduction (free)", "http://incompleteideas.net/book/the-book-2nd.html"], ["DQN paper (Atari)", "https://arxiv.org/abs/1312.5602"]] },
};

// ── auto-graded labs ─────────────────────────────────────────────────────────
const GRADE_HARNESS = `
_R = []
def _t(name, fn, hint):
    try:
        ok = bool(fn())
    except Exception as _e:
        ok = False
        hint = hint + "   [" + type(_e).__name__ + ": " + str(_e)[:80] + "]"
    _R.append([name, ok, "" if ok else hint])
`;
const GRADE_TAIL = `
import json as _json
print("NPGRADE::" + _json.dumps(_R))
`;
const LABS = {
"Simple Linear Regression": { xp: 60,
brief: "**Lab: implement linear regression with gradient descent — from nothing.**\nFill in `loss` (mean squared error) and `grad_step` (one gradient-descent update). Keep the function signatures. Hidden tests will train your model on data generated from y ≈ 3x + 2 and check that it recovers the line.\n- `dL/dw = (2/n) · Σ (pred − y) · x`\n- `dL/db = (2/n) · Σ (pred − y)`",
starter: `# y is roughly 3x + 2 with a little noise
xs = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
ys = [2.1, 3.4, 5.2, 6.4, 8.1, 9.4, 11.0, 12.6, 14.1]

def predict(x, w, b):
    return w * x + b

def loss(xs, ys, w, b):
    # TODO 1: return the MEAN squared error over the dataset
    return 0.0

def grad_step(xs, ys, w, b, lr):
    # TODO 2: compute dL/dw and dL/db, return the updated (w, b)
    return w, b

def fit(xs, ys, lr=0.02, steps=800):
    w, b = 0.0, 0.0
    for _ in range(steps):
        w, b = grad_step(xs, ys, w, b, lr)
    return w, b

w, b = fit(xs, ys)
print(f"learned: y = {w:.3f} x + {b:.3f}   (target ~ 3x + 2)")`,
tests: `
_w, _b = fit(xs, ys)
_l0 = loss(xs, ys, 0.0, 0.0)
_l1 = loss(xs, ys, _w, _b)
_t("loss() is a real MSE (large at w=b=0)", lambda: _l0 > 5, "loss should average the squared misses: sum((w*x+b - y)**2) / n")
_t("training reduces the loss by >95%", lambda: _l1 < _l0 * 0.05, "check the gradients: dL/dw = (2/n)*sum((pred-y)*x), dL/db = (2/n)*sum(pred-y), then w -= lr*dw")
_t("slope w lands near 3", lambda: abs(_w - 3) < 0.3, "if w barely moves, are you returning the UPDATED values from grad_step?")
_t("intercept b lands near 2", lambda: abs(_b - 2) < 0.45, "db has no x factor: it is just the mean prediction error times 2")`,
sol: `def loss(xs, ys, w, b):
    return sum((w*x + b - y)**2 for x, y in zip(xs, ys)) / len(xs)

def grad_step(xs, ys, w, b, lr):
    n = len(xs)
    dw = 2/n * sum((w*x + b - y) * x for x, y in zip(xs, ys))
    db = 2/n * sum((w*x + b - y)     for x, y in zip(xs, ys))
    return w - lr*dw, b - lr*db`,
hints: ["MSE = average of (prediction − truth)², not the sum.", "Each gradient is an average over ALL points — compute both before updating either parameter.", "The update direction is minus the gradient: w -= lr * dw."] },

"K-Means": { xp: 60,
brief: "**Lab: implement the two halves of k-means.**\nWrite `assign` (each point → index of its nearest centroid) and `update` (each centroid → mean of its assigned points; keep `(0.0, 0.0)` for an empty cluster). Hidden tests run your steps on two obvious blobs.",
starter: `def dist2(a, b):
    return (a[0]-b[0])**2 + (a[1]-b[1])**2

def assign(points, centroids):
    # TODO 1: for each point, return the INDEX of the nearest centroid
    return [0 for p in points]

def update(points, labels, k):
    # TODO 2: return k new centroids: the mean (x, y) of each cluster's points
    # if a cluster has no points, keep its centroid at (0.0, 0.0)
    return [(0.0, 0.0) for _ in range(k)]

pts   = [(1,1), (2,1), (9,9), (10,9)]
cents = [(0,0), (8,8)]
lab   = assign(pts, cents)
print("labels:", lab)
print("new centroids:", update(pts, lab, 2))`,
tests: `
_pts = [(0,0),(0,1),(1,0),(10,10),(10,11),(11,10)]
_cs  = [(0.5,0.5),(10.5,10.5)]
_lb  = assign(_pts, _cs)
_t("assign: first blob -> cluster 0", lambda: list(_lb[:3]) == [0,0,0], "compare dist2(point, c) for every centroid c and keep the argmin index")
_t("assign: second blob -> cluster 1", lambda: list(_lb[3:]) == [1,1,1], "min(range(len(centroids)), key=...) is a clean way to get an argmin")
_nc = update(_pts, [0,0,0,1,1,1], 2)
_t("update: centroids move to cluster means", lambda: abs(_nc[0][0]-1/3) < 1e-6 and abs(_nc[1][1]-31/3) < 1e-6, "mean x = sum of member x / count (and the same for y)")
_t("update: empty cluster stays at (0,0)", lambda: tuple(update([(1,1)],[0],2)[1]) == (0.0, 0.0), "guard the empty-cluster case BEFORE dividing by the count")`,
sol: `def assign(points, centroids):
    return [min(range(len(centroids)), key=lambda k: dist2(p, centroids[k]))
            for p in points]

def update(points, labels, k):
    out = []
    for c in range(k):
        mine = [p for p, l in zip(points, labels) if l == c]
        if mine:
            out.append((sum(p[0] for p in mine)/len(mine),
                        sum(p[1] for p in mine)/len(mine)))
        else:
            out.append((0.0, 0.0))
    return out`,
hints: ["assign is an argmin over centroids, per point — loop or use min(range(k), key=…).", "update needs the members of each cluster: zip points with labels and filter.", "Division by zero on an empty cluster is the classic bug — check the count first."] },

"Backpropagation": { xp: 80,
brief: "**Lab: hand-derive backprop for a tiny network and beat the numeric checker.**\nThe net is `h = tanh(w1·x + b1)`, `y = sigmoid(w2·h + b2)` with binary cross-entropy loss. Implement `grads` returning `{dw1, db1, dw2, db2}`. Your analytic gradients are compared against numeric differentiation to 1e-4.\nKey facts: with sigmoid+BCE, `dL/dz2 = y − t`; and `d tanh(u)/du = 1 − h²`.",
starter: `import math

def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

def forward(x, p):
    h = math.tanh(p["w1"] * x + p["b1"])
    y = sigmoid(p["w2"] * h + p["b2"])
    return h, y

def bce(y, t):
    return -(t * math.log(y) + (1 - t) * math.log(1 - y))

def grads(x, t, p):
    h, y = forward(x, p)
    # TODO: chain rule, backwards.
    #   dz2 = y - t                     (sigmoid + BCE shortcut)
    #   dw2 = dz2 * h        db2 = dz2
    #   dh  = dz2 * w2
    #   dz1 = dh * (1 - h*h)            (tanh derivative)
    #   dw1 = dz1 * x        db1 = dz1
    return {"dw1": 0.0, "db1": 0.0, "dw2": 0.0, "db2": 0.0}

p = {"w1": 0.5, "b1": -0.2, "w2": -0.7, "b2": 0.1}
print(grads(0.8, 1.0, p))`,
tests: `
_p = {"w1": 0.5, "b1": -0.2, "w2": -0.7, "b2": 0.1}
_x, _tg = 0.8, 1.0
def _loss(q):
    _h, _y = forward(_x, q)
    return bce(_y, _tg)
_g = grads(_x, _tg, _p)
def _num(k):
    e = 1e-5
    a = dict(_p); a[k] += e
    b = dict(_p); b[k] -= e
    return (_loss(a) - _loss(b)) / (2*e)
_t("dw2 matches the numeric gradient", lambda: abs(_g["dw2"] - _num("w2")) < 1e-4, "dw2 = (y - t) * h - the cached hidden activation")
_t("db2 matches the numeric gradient", lambda: abs(_g["db2"] - _num("b2")) < 1e-4, "db2 = (y - t): the bias sees the raw output error")
_t("dw1 matches the numeric gradient", lambda: abs(_g["dw1"] - _num("w1")) < 1e-4, "push the error through w2, then through tanh: (y-t)*w2*(1-h*h)*x")
_t("db1 matches the numeric gradient", lambda: abs(_g["db1"] - _num("b1")) < 1e-4, "same path as dw1, without the final *x")`,
sol: `def grads(x, t, p):
    h, y = forward(x, p)
    dz2 = y - t
    dh  = dz2 * p["w2"]
    dz1 = dh * (1 - h*h)
    return {"dw1": dz1 * x, "db1": dz1,
            "dw2": dz2 * h, "db2": dz2}`,
hints: ["Start at the loss and move backwards one edge at a time; never skip a hop.", "dz2 = y − t is given — everything else is multiplying by local derivatives.", "The hidden activation h from the forward pass appears in dw2 AND inside tanh's derivative."] },

"Tokenizers: BPE, WordPiece, Unigram": { xp: 70,
brief: "**Lab: implement the heart of BPE.**\nWrite `get_stats` (count adjacent token pairs) and `merge_pair` (merge every non-overlapping occurrence of a pair, left to right, into a single concatenated token). These two functions ARE the BPE training loop.",
starter: `def get_stats(tokens):
    # TODO 1: return a dict {(a, b): count} of ADJACENT pairs
    #   e.g. list("banana") contains ("a","n") twice
    return {}

def merge_pair(tokens, pair):
    # TODO 2: scan left to right; whenever tokens[i], tokens[i+1] == pair,
    #   append the merged token (a + b) and SKIP BOTH; else copy one token.
    return tokens

tk = list("banana")
print("stats :", get_stats(tk))
print("merged:", merge_pair(tk, ("a", "n")))`,
tests: `
_st = get_stats(list("banana"))
_t("counts ('a','n') twice in banana", lambda: _st.get(("a","n")) == 2, "walk adjacent pairs: zip(tokens, tokens[1:])")
_t("counts ('n','a') twice in banana", lambda: _st.get(("n","a")) == 2, "every adjacent pair is counted at this stage, overlaps included")
_t("merging ('a','n') gives b/an/an/a", lambda: merge_pair(list("banana"), ("a","n")) == ["b","an","an","a"], "on a match: append a+b and advance i by 2; otherwise append tokens[i] and advance by 1")
_t("merges never overlap: aaaa -> aa/aa", lambda: merge_pair(list("aaaa"), ("a","a")) == ["aa","aa"], "after a merge you must jump PAST both consumed tokens before looking again")`,
sol: `def get_stats(tokens):
    st = {}
    for a, b in zip(tokens, tokens[1:]):
        st[(a, b)] = st.get((a, b), 0) + 1
    return st

def merge_pair(tokens, pair):
    out, i = [], 0
    while i < len(tokens):
        if i < len(tokens) - 1 and (tokens[i], tokens[i+1]) == pair:
            out.append(tokens[i] + tokens[i+1]); i += 2
        else:
            out.append(tokens[i]); i += 1
    return out`,
hints: ["zip(tokens, tokens[1:]) yields every adjacent pair in order.", "A while-loop with a manual index makes the skip-two logic easy; a for-loop fights you.", "The overlap test 'aaaa' is the one that catches most first attempts."] },
};

// ── visualize-tab routing for non-flagship topics ────────────────────────────
const PLAY_HINTS = {
"Gradient Descent for Regression":"gd","Batch, Stochastic & Mini-Batch GD":"gd","Momentum":"gd","Learning Rate & Schedules":"gd","Convex vs Non-Convex":"gd","The Optimization Landscape":"gd","Optimization Basics":"gd","Saddle Points & Escapes":"gd","Neural Loss Surfaces":"gd",
"Overfitting & Underfitting":"poly","Polynomial Regression":"poly","Ridge Regression (L2)":"poly","Lasso (L1) & Sparsity":"poly","Generalization":"poly","Regularization Paths":"poly","Cross-Validation":"poly",
"The Perceptron":"nn","From Perceptron to MLP":"nn","Forward Propagation":"nn","A Network from Scratch":"nn","Universal Approximation":"nn","Decision Boundaries":"nn","Why Depth Helps":"nn","Anatomy of a Training Loop":"nn","Xavier & He Initialization":"nn",
"Vanishing & Exploding Gradients":"act","Weight Initialization":"act",
"K-Means++ & Initialization":"kmeans","Choosing k: Elbow & Silhouette":"kmeans","Clustering Overview":"kmeans","DBSCAN":"kmeans","Gaussian Mixture Models":"kmeans",
"Explained Variance":"pca","SVD for Data":"pca","Why Reduce Dimensions":"pca","t-SNE":"pca","UMAP":"pca","Eigenvalues & Eigenvectors":"pca","Covariance & Correlation":"pca","Orthogonality & Projections":"pca",
"Stride, Padding & Dilation":"conv","Pooling":"conv","Receptive Fields":"conv","Images as Tensors":"conv","Feature Hierarchies":"conv",
"Attention Intuition":"attn","Queries, Keys & Values":"attn","Scaled Dot-Product Attention":"attn","Multi-Head Attention":"attn","Masked Attention & Causality":"attn","Attention (pre-Transformer)":"attn",
"Tokenization Overview":"tok","Context Windows":"tok","Next-Token Prediction Deep Dive":"sampling","Repetition & Penalties":"sampling","The Language Modeling Objective":"sampling","Softmax & Multiclass":"sampling","Entropy":"sampling","Cross-Entropy & KL Divergence":"sampling",
"Exploration vs Exploitation":"rl","Temporal-Difference Learning":"rl","Bellman Equations":"rl","SARSA":"rl","The RL Problem Setup":"rl","Markov Decision Processes":"rl","Policies & Value Functions":"rl","Returns & Discounting":"rl",
"Why RAG":"rag","Chunking Strategies":"rag","Embeddings for Retrieval":"rag","Similarity Search & ANN":"rag","Context Construction":"rag","Citations & Grounding":"rag","A RAG App End-to-End":"rag","Hybrid Search: BM25 + Dense":"rag",
"What is an Agent":"agent","The Agent Loop":"agent","Tool Use & Function Calling":"agent","An Agent from Scratch":"agent","Planning & Decomposition":"agent","ReAct Prompting":"agent",
"word2vec":"pca","Sentence Embeddings":"rag","Semantic Similarity":"rag",
};

const DEFAULT_CODE = (t) => `# Scratchpad - Python runs right here in your browser (Pyodide).
# Topic: ${t.title}
# Try things. Break things. This is where understanding compounds.

import math, random
random.seed(0)

# demo: estimate an average with more and more samples
for n in [10, 100, 1000, 10000]:
    est = sum(random.gauss(5, 2) for _ in range(n)) / n
    print(f"n={n:>6}  estimated mean = {est:.4f}  (true: 5)")
`;

// ── AI content generation for the other ~800 topics ──────────────────────────
const GEN_SYS = `You are the curriculum engine of NeuralPath, an AI/ML mastery platform. Generate a complete micro-lesson for the requested topic.
OUTPUT FORMAT — hard rules:
- Respond with ONE minified JSON object on a single line. No markdown fences, no commentary, nothing before or after it.
- Your ENTIRE response must fit within ~900 tokens. Brevity beats completeness: if in doubt, shorten every string. NEVER let the JSON get cut off.
Keys:
"eli5": string, <=45 words, a vivid everyday analogy.
"intu": string, <=85 words, the practitioner's mental model and why it matters.
"rig": string, <=85 words, the precise technical account (real definitions/results).
"math": array of at most 2 objects {"t": LaTeX string (double-escape every backslash for JSON, e.g. \\\\frac), "n": one-line plain note}.
"code": string, a runnable Python 3 demo <=14 lines, STANDARD LIBRARY ONLY, printing illustrative results.
"quiz": array of exactly 2 objects {"q": string, "o": array of 4 short options, "a": correct index 0-3, "why": one line}.
"cards": array of exactly 2 arrays [front, back] for spaced repetition.
Be technically accurate and concrete.`;
// The model's JSON sometimes arrives truncated at the token ceiling or with bad
// LaTeX escapes. balanceJSON closes unterminated strings/brackets; parseLessonJSON
// additionally chops an incomplete tail back to the last safe boundary.
function balanceJSON(s) {
  let inStr = false, esc = false; const stack = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = s;
  if (inStr) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length) out += stack.pop() === "{" ? "}" : "]";
  return out;
}
function parseLessonJSON(raw) {
  let t = String(raw).replace(/```[a-zA-Z]*/g, "").trim();
  const start = t.indexOf("{");
  if (start < 0) throw new Error("no JSON found in the model's response");
  t = t.slice(start);
  const variants = [t, t.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")]; // as-is, then with lone backslashes escaped
  // Pass 1: try each full variant intact (and bracket-balanced). This handles clean
  // JSON, fenced/preambled JSON, and bad-LaTeX-escape cases before any lossy repair.
  for (const v of variants) {
    try { return JSON.parse(v); } catch (e) {}
    try { return JSON.parse(balanceJSON(v)); } catch (e) {}
  }
  // Pass 2: truncation repair — chop the tail back to the last safe boundary,
  // re-balance, retry. Only reached if the response was genuinely cut off.
  for (const v of variants) {
    let end = v.length;
    for (let k = 0; k < 60 && end > 2; k++) {
      end = Math.max(v.lastIndexOf(",", end - 2), v.lastIndexOf("}", end - 2), v.lastIndexOf("]", end - 2), v.lastIndexOf('"', end - 2));
      if (end <= 1) break;
      try { return JSON.parse(balanceJSON(v.slice(0, end))); } catch (e) {}
    }
  }
  throw new Error("malformed JSON");
}
function sanitizeLesson(j) {
  const L = {
    gen: true,
    eli5: String(j.eli5 || "").trim(), intu: String(j.intu || "").trim(), rig: String(j.rig || "").trim(),
    math: Array.isArray(j.math) ? j.math.slice(0, 3).filter((m) => m && m.t).map((m) => ({ t: String(m.t), n: String(m.n || "") })) : [],
    code: typeof j.code === "string" && j.code.trim() ? j.code : null,
    quiz: Array.isArray(j.quiz) ? j.quiz.filter((q) => q && q.q && Array.isArray(q.o) && q.o.length === 4 && q.why != null).slice(0, 3).map((q) => ({ q: String(q.q), o: q.o.map(String), a: clamp(q.a | 0, 0, 3), why: String(q.why || "") })) : [],
    cards: Array.isArray(j.cards) ? j.cards.filter((c) => Array.isArray(c) && c[0] && c[1]).slice(0, 3).map((c) => [String(c[0]), String(c[1])]) : [],
  };
  if (!L.eli5 || !L.intu) throw new Error("incomplete lesson");
  if (!L.rig) L.rig = L.intu;
  return L;
}
async function genLessonOnce(topic, compact) {
  const msg = `Topic: "${topic.title}" — from Part ${topic.part}: ${topic.partName} (Stage ${STAGES[topic.stage].roman}: ${STAGES[topic.stage].name}) of a zero-to-mastery AI/ML curriculum.${compact ? " IMPORTANT: your previous attempt was cut off before the JSON closed. Be MUCH more compact this time — halve the length of every string — and make absolutely sure the JSON object closes." : ""}`;
  let txt;
  try { txt = await askClaude([{ role: "user", content: msg }], GEN_SYS, 1000); }
  catch (e) { const err = new Error("Couldn't reach the AI service — generation runs inside the Claude app's artifact view."); err.net = true; throw err; }
  return sanitizeLesson(parseLessonJSON(txt));
}
async function genLesson(topic) {
  try { return await genLessonOnce(topic, false); }
  catch (e) {
    if (e.net) throw e;
    try { return await genLessonOnce(topic, true); }
    catch (e2) {
      if (e2.net) throw e2;
      throw new Error("The model's response came back malformed twice in a row — tap generate again; it almost always lands on the next try.");
    }
  }
}
const getLesson = (topic, data) => FLAGSHIP[topic.title] || (data.gen && data.gen[topic.id]) || null;

// ─────────────────────────────────────────────────────────────────────────────
// PLAYGROUNDS — the signature feature. All real, all manipulable.
// ─────────────────────────────────────────────────────────────────────────────
function PlayShell({ title, sub, controls, children, foot }) {
  return (
    <div className="play-wrap">
      <div className="play-head">
        <div>
          <div className="disp" style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 12, color: C.dim }}>{sub}</div>
        </div>
        <span className="badge" style={{ color: C.grow, borderColor: "rgba(61,220,151,.4)" }}>live</span>
      </div>
      <div className="play-body">
        <div className="play-canvas"><div style={{ width: "100%" }}>{children}</div></div>
        <div className="play-ctrl">{controls}</div>
      </div>
      {foot && <div style={{ padding: "10px 16px", borderTop: `1px solid var(--line)`, fontSize: 12, color: C.dim }}>{foot}</div>}
    </div>
  );
}

// 1 ▸ GRADIENT DESCENT on a 3-D loss surface ─────────────────────────────────
const GD_SURFACES = {
  ravine: { name: "Ravine (elongated bowl)", f: (x, y) => (x * x + 14 * y * y) / 10, g: (x, y) => [x / 5, 2.8 * y] },
  bowl: { name: "Round bowl", f: (x, y) => (x * x + y * y) / 5, g: (x, y) => [0.4 * x, 0.4 * y] },
  twowell: { name: "Two valleys (non-convex)", f: (x, y) => ((x * x - 2.2) ** 2) / 6 + 0.35 * y * y, g: (x, y) => [(2 * x * (x * x - 2.2)) / 3, 0.7 * y] },
};
function PlayGD() {
  const [lr, setLr] = useState(0.08); const [mom, setMom] = useState(0.0);
  const [surf, setSurf] = useState("ravine"); const [running, setRunning] = useState(true);
  const [info, setInfo] = useState({ f: 0, steps: 0 });
  const cv = useRef(null);
  const st = useRef({ x: 2.6, y: 1.6, vx: 0, vy: 0, trail: [], steps: 0 });
  const reset = () => { const R = Math.random; st.current = { x: 2.9 * (R() - .5) * 2 * 0.9 + (R() < .5 ? -2.4 : 2.4) * 0.4, y: (R() * 2 - 1) * 1.7, vx: 0, vy: 0, trail: [], steps: 0 }; };
  useEffect(() => { st.current = { x: 2.6, y: 1.6, vx: 0, vy: 0, trail: [], steps: 0 }; }, [surf]);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const W = 620, H = 400, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const S = GD_SURFACES[surf]; let raf, frame = 0, alive = true;
    const iso = (x, y, z) => [W / 2 + (x - y) * 52, H * 0.56 + (x + y) * 27 - z * 30];
    const loop = () => {
      if (!alive) return;
      frame++;
      const p = st.current;
      if (running && frame % 3 === 0) {
        const [gx, gy] = S.g(p.x, p.y);
        p.vx = mom * p.vx - lr * gx; p.vy = mom * p.vy - lr * gy;
        p.x = clamp(p.x + p.vx, -3.4, 3.4); p.y = clamp(p.y + p.vy, -3.4, 3.4);
        p.trail.push([p.x, p.y]); if (p.trail.length > 90) p.trail.shift();
        p.steps++;
        if (frame % 12 === 0) setInfo({ f: S.f(p.x, p.y), steps: p.steps });
      }
      // draw
      ctx.clearRect(0, 0, W, H);
      const n = 24, lo = -3, hi = 3, zmax = S.f(3, 3) || 1;
      ctx.lineWidth = 1;
      for (let i = 0; i <= n; i++) {
        for (const dir of [0, 1]) {
          ctx.beginPath();
          for (let j = 0; j <= n; j++) {
            const a = lo + (hi - lo) * (dir ? j : i) / n, b = lo + (hi - lo) * (dir ? i : j) / n;
            const z = S.f(a, b); const [sx, sy] = iso(a, b, z);
            j ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
          }
          const t = i / n;
          ctx.strokeStyle = `rgba(${91 + t * 100},${140 + t * 30},255,${C.wireA + 0.1 * (1 - t)})`;
          ctx.stroke();
        }
      }
      // trail
      p.trail.forEach(([tx, ty], k) => {
        const [sx, sy] = iso(tx, ty, S.f(tx, ty) + 0.04);
        ctx.fillStyle = `rgba(255,197,61,${0.12 + 0.7 * (k / p.trail.length)})`;
        ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, 7); ctx.fill();
      });
      // ball
      const [bx, by] = iso(p.x, p.y, S.f(p.x, p.y) + 0.06);
      ctx.fillStyle = C.charge; ctx.strokeStyle = "#0A0E1A"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fill(); ctx.stroke();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [surf, lr, mom, running]);
  return (
    <PlayShell title="Gradient descent, live" sub="A ball feeling its way downhill on a loss surface. Break it with a huge learning rate."
      controls={<>
        <Sel label="surface" value={surf} onChange={setSurf} opts={Object.entries(GD_SURFACES).map(([k, v]) => [k, v.name])} />
        <Slider label="learning rate η" value={lr} min={0.005} max={0.42} step={0.005} onChange={setLr} fmt={(v) => v.toFixed(3)} />
        <Slider label="momentum γ" value={mom} min={0} max={0.95} step={0.05} onChange={setMom} fmt={(v) => v.toFixed(2)} />
        <div className="row">
          <button className="btn sm" onClick={() => setRunning(!running)}>{running ? <><Pause size={13}/>pause</> : <><Play size={13}/>run</>}</button>
          <button className="btn sm" onClick={reset}><Shuffle size={13}/>new start</button>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.dim }}>
          loss <b style={{ color: C.ink }}>{info.f.toFixed(4)}</b> · steps <b style={{ color: C.ink }}>{info.steps}</b>
        </div>
      </>}
      foot="Ravine + zero momentum = zig-zag agony. Add momentum ≈ 0.8 and watch it sail. On the two-valley surface, different starts find different minima — non-convexity in one picture." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto" }} />
    </PlayShell>
  );
}

// 2 ▸ ACTIVATION FUNCTIONS ───────────────────────────────────────────────────
const ACTS = {
  relu: { name: "ReLU", f: (z) => Math.max(0, z), d: (z) => (z > 0 ? 1 : 0) },
  leaky: { name: "Leaky ReLU", f: (z) => (z > 0 ? z : 0.1 * z), d: (z) => (z > 0 ? 1 : 0.1) },
  sigmoid: { name: "Sigmoid", f: (z) => 1 / (1 + Math.exp(-z)), d: (z) => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); } },
  tanh: { name: "tanh", f: (z) => Math.tanh(z), d: (z) => 1 - Math.tanh(z) ** 2 },
  gelu: { name: "GELU", f: (z) => 0.5 * z * (1 + Math.tanh(0.79788456 * (z + 0.044715 * z ** 3))), d: (z) => { const e = 1e-4; return (ACTS.gelu.f(z + e) - ACTS.gelu.f(z - e)) / (2 * e); } },
  swish: { name: "SiLU / Swish", f: (z) => z / (1 + Math.exp(-z)), d: (z) => { const s = 1 / (1 + Math.exp(-z)); return s + z * s * (1 - s); } },
};
function PlayAct() {
  const [fn, setFn] = useState("relu"); const [z, setZ] = useState(1.2);
  const cv = useRef(null);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const W = 560, H = 340, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const A = ACTS[fn]; const X = (v) => (v + 5) / 10 * W; const Y = (v) => H / 2 - v * 55;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = C.line2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    const plot = (g, color, dash) => {
      ctx.beginPath(); ctx.setLineDash(dash ? [5, 4] : []);
      for (let px = 0; px <= W; px += 2) { const v = (px / W) * 10 - 5; const y = Y(g(v)); px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); }
      ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.stroke(); ctx.setLineDash([]);
    };
    plot(A.f, C.signal); plot(A.d, C.charge, true);
    // point + tangent
    const fz = A.f(z), dz = A.d(z);
    ctx.strokeStyle = C.dim; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(X(z - 1.1), Y(fz - dz * 1.1)); ctx.lineTo(X(z + 1.1), Y(fz + dz * 1.1)); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(X(z), Y(fz), 5.5, 0, 7); ctx.fill();
    ctx.font = "12px JetBrains Mono"; ctx.fillStyle = C.signal; ctx.fillText("f(z)", 12, 18);
    ctx.fillStyle = C.charge; ctx.fillText("f'(z) — the gradient that flows backwards", 12, 36);
  }, [fn, z]);
  const A = ACTS[fn];
  return (
    <PlayShell title="Activation functions & their gradients" sub="The dashed curve is what backprop actually multiplies by. Watch it die on sigmoid's tails."
      controls={<>
        <Sel label="function" value={fn} onChange={setFn} opts={Object.entries(ACTS).map(([k, v]) => [k, v.name])} />
        <Slider label="input z" value={z} min={-5} max={5} step={0.1} onChange={setZ} fmt={(v) => v.toFixed(1)} />
        <div className="rec"><div className="eyebrow">at this point</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, marginTop: 6 }}>
            f({z.toFixed(1)}) = <b>{A.f(z).toFixed(3)}</b><br />f'({z.toFixed(1)}) = <b style={{ color: A.d(z) < 0.05 ? C.heat : C.charge }}>{A.d(z).toFixed(3)}</b>
            {A.d(z) < 0.05 && <div style={{ color: C.heat, fontSize: 11, marginTop: 4 }}>⚠ gradient ≈ 0 — a neuron here barely learns</div>}
          </div></div>
      </>}
      foot="Slide z to ±5 on sigmoid: the gradient collapses below 0.01 — multiply that across 20 layers and nothing reaches layer 1. ReLU's flat left side is the 'dying ReLU' zone; Leaky/GELU keep a pulse." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto" }} />
    </PlayShell>
  );
}

// 3 ▸ OVERFITTING / BIAS-VARIANCE (polynomial fit) ───────────────────────────
function solveLin(A, b) {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    const tmp = M[c]; M[c] = M[p]; M[p] = tmp;
    const pv = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / pv; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / (r[i] || 1e-12));
}
function PlayPoly() {
  const [deg, setDeg] = useState(3); const [lamExp, setLamExp] = useState(-9); const [seed, setSeed] = useState(7);
  const cv = useRef(null);
  const world = useMemo(() => {
    const R = mulberry32(seed); const f = (x) => Math.sin(2.1 * x);
    const pts = Array.from({ length: 26 }, () => { const x = R() * 3; return [x, f(x) + (R() * 2 - 1) * 0.42]; });
    return { train: pts.slice(0, 17), test: pts.slice(17), f };
  }, [seed]);
  const lam = lamExp <= -9 ? 0 : Math.pow(10, lamExp);
  const fitD = useCallback((d) => {
    const phi = (x) => Array.from({ length: d + 1 }, (_, k) => Math.pow(x / 1.5 - 1, k));
    const A = Array.from({ length: d + 1 }, () => new Array(d + 1).fill(0));
    const b = new Array(d + 1).fill(0);
    world.train.forEach(([x, y]) => { const p = phi(x); for (let i = 0; i <= d; i++) { b[i] += p[i] * y; for (let j = 0; j <= d; j++) A[i][j] += p[i] * p[j]; } });
    for (let i = 0; i <= d; i++) A[i][i] += lam + 1e-10;
    const w = solveLin(A, b);
    return (x) => { const p = phi(x); let s = 0; for (let i = 0; i <= d; i++) s += w[i] * p[i]; return s; };
  }, [world, lam]);
  const errs = useMemo(() => {
    const mse = (h, D) => D.reduce((s, [x, y]) => s + (h(x) - y) ** 2, 0) / D.length;
    return Array.from({ length: 13 }, (_, d) => { const h = fitD(d); return [mse(h, world.train), mse(h, world.test)]; });
  }, [fitD, world]);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const W = 600, H = 400, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const PH = 258, X = (x) => 20 + (x / 3) * (W - 40), Y = (y) => PH / 2 + 16 - y * 74;
    // truth
    ctx.beginPath(); ctx.setLineDash([4, 5]);
    for (let px = 0; px <= W - 40; px += 3) { const x = (px / (W - 40)) * 3; const y = Y(world.f(x)); px ? ctx.lineTo(X(x), y) : ctx.moveTo(X(x), y); }
    ctx.strokeStyle = "rgba(140,160,220,.4)"; ctx.lineWidth = 1.4; ctx.stroke(); ctx.setLineDash([]);
    // fit
    const h = fitD(deg);
    ctx.beginPath();
    for (let px = 0; px <= W - 40; px += 2) { const x = (px / (W - 40)) * 3; const y = clamp(Y(h(x)), -40, PH + 60); px ? ctx.lineTo(X(x), y) : ctx.moveTo(X(x), y); }
    ctx.strokeStyle = C.signal; ctx.lineWidth = 2.4; ctx.stroke();
    // points
    world.train.forEach(([x, y]) => { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(X(x), Y(y), 3.6, 0, 7); ctx.fill(); });
    world.test.forEach(([x, y]) => { ctx.strokeStyle = C.charge; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(X(x), Y(y), 4, 0, 7); ctx.stroke(); });
    ctx.font = "11px JetBrains Mono"; ctx.fillStyle = C.dim;
    ctx.fillText("● train    ○ held-out test    ┄ truth sin(2.1x)", 20, 14);
    // error chart
    const top = PH + 44; const CH = H - top - 24;
    const maxE = Math.min(2.5, Math.max(...errs.flat()));
    ctx.fillStyle = C.dim; ctx.fillText("error vs polynomial degree — the U-curve", 20, top - 8);
    const EX = (d) => 30 + (d / 12) * (W - 60), EY = (e) => top + CH - clamp(e / maxE, 0, 1) * CH;
    [[0, C.dim, "train"], [1, C.charge, "test"]].forEach(([idx, col]) => {
      ctx.beginPath(); errs.forEach((e, d) => { const y = EY(e[idx]); d ? ctx.lineTo(EX(d), y) : ctx.moveTo(EX(d), y); });
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      errs.forEach((e, d) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(EX(d), EY(e[idx]), 2.6, 0, 7); ctx.fill(); });
    });
    ctx.strokeStyle = C.signal; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(EX(deg), top); ctx.lineTo(EX(deg), top + CH); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.dim; ctx.fillText("train", W - 90, EY(errs[12][0]) - 6); ctx.fillStyle = C.charge; ctx.fillText("test", W - 90, EY(errs[12][1]) - 6);
  }, [deg, world, fitD, errs]);
  return (
    <PlayShell title="Overfitting, watched in the act" sub="Fit a polynomial to noisy data. Degree = capacity. Test error tells the truth."
      controls={<>
        <Slider label="degree (capacity)" value={deg} min={0} max={12} step={1} onChange={setDeg} />
        <Slider label="ridge λ = 10^x" value={lamExp} min={-9} max={0} step={1} onChange={setLamExp} fmt={(v) => (v <= -9 ? "off" : `1e${v}`)} />
        <button className="btn sm" onClick={() => setSeed((s) => s + 1)}><Shuffle size={13}/>resample data</button>
        <div className="rec"><div className="eyebrow">this fit</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, marginTop: 6 }}>
            train MSE <b>{errs[deg][0].toFixed(3)}</b><br />test MSE <b style={{ color: errs[deg][1] > errs[deg][0] * 3 + 0.05 ? C.heat : C.grow }}>{errs[deg][1].toFixed(3)}</b>
          </div></div>
      </>}
      foot="Degree 0–1: high bias (both errors high). Degree 10+: train error plummets while test error explodes — pure variance. Now crank λ at degree 12 and watch regularization pull the curve back to sanity." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto" }} />
    </PlayShell>
  );
}

// 4 ▸ K-MEANS convergence ────────────────────────────────────────────────────
function PlayKMeans() {
  const [k, setK] = useState(3); const [seed, setSeed] = useState(3); const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const st = useRef({ pts: [], cents: [], labels: [], trails: [], conv: false, iters: 0 });
  useEffect(() => {
    const R = mulberry32(seed * 977 + 13); const pts = [];
    const centers = [[0.24, 0.3], [0.74, 0.28], [0.44, 0.76], [0.8, 0.72], [0.16, 0.72]];
    for (let c = 0; c < 4; c++) for (let i = 0; i < 34; i++) {
      pts.push([centers[c][0] + (R() * 2 - 1) * 0.1 + (R() * 2 - 1) * 0.04, centers[c][1] + (R() * 2 - 1) * 0.1]);
    }
    const cents = Array.from({ length: k }, () => [...pts[(R() * pts.length) | 0]]);
    st.current = { pts, cents, labels: pts.map(() => 0), trails: cents.map((c) => [[...c]]), conv: false, iters: 0 };
    setTick((t) => t + 1);
  }, [seed, k]);
  const step = useCallback(() => {
    const s = st.current; if (s.conv) return;
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    s.labels = s.pts.map((p) => { let bi = 0, bd = Infinity; s.cents.forEach((c, i) => { const d = d2(p, c); if (d < bd) { bd = d; bi = i; } }); return bi; });
    let move = 0;
    s.cents = s.cents.map((c, i) => {
      const mine = s.pts.filter((_, j) => s.labels[j] === i);
      if (!mine.length) return c;
      const nc = [mine.reduce((a, p) => a + p[0], 0) / mine.length, mine.reduce((a, p) => a + p[1], 0) / mine.length];
      move += Math.hypot(nc[0] - c[0], nc[1] - c[1]); return nc;
    });
    s.cents.forEach((c, i) => s.trails[i] && s.trails[i].push([...c]));
    s.iters++; if (move < 1e-4) s.conv = true;
    setTick((t) => t + 1);
  }, []);
  useEffect(() => { if (!auto) return; const iv = setInterval(step, 650); return () => clearInterval(iv); }, [auto, step, seed, k]);
  const cv = useRef(null);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const W = 560, H = 400, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const s = st.current; const X = (v) => v * W, Y = (v) => v * H;
    s.pts.forEach((p, i) => { ctx.fillStyle = STAGE_HUES[s.labels[i] % 7] + "CC"; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 4, 0, 7); ctx.fill(); });
    s.trails.forEach((tr, i) => {
      ctx.strokeStyle = STAGE_HUES[i % 7] + "88"; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
      ctx.beginPath(); tr.forEach((c, j) => { j ? ctx.lineTo(X(c[0]), Y(c[1])) : ctx.moveTo(X(c[0]), Y(c[1])); }); ctx.stroke(); ctx.setLineDash([]);
    });
    s.cents.forEach((c, i) => {
      ctx.strokeStyle = "#0A0E1A"; ctx.fillStyle = STAGE_HUES[i % 7]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), 9, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#0A0E1A"; ctx.font = "bold 11px JetBrains Mono"; ctx.textAlign = "center"; ctx.fillText(String(i + 1), X(c[0]), Y(c[1]) + 4); ctx.textAlign = "left";
    });
  }, [tick]);
  const s = st.current;
  const inertia = s.pts.length ? s.pts.reduce((a, p, i) => { const c = s.cents[s.labels[i]] || [0, 0]; return a + (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; }, 0) : 0;
  return (
    <PlayShell title="K-means, step by step" sub="Assign to nearest pin, move pins to their means, repeat. The data has 4 natural blobs — try the wrong k."
      controls={<>
        <Slider label="k (clusters)" value={k} min={1} max={8} step={1} onChange={setK} />
        <div className="row">
          <button className="btn sm" onClick={step} disabled={s.conv}>step</button>
          <button className="btn sm" onClick={() => setAuto(!auto)}>{auto ? <><Pause size={13}/>pause</> : <><Play size={13}/>auto</>}</button>
          <button className="btn sm" onClick={() => setSeed((v) => v + 1)}><Shuffle size={13}/>reseed</button>
        </div>
        <div className="rec"><div className="eyebrow">objective</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, marginTop: 6 }}>
            inertia J = <b>{inertia.toFixed(3)}</b><br />iterations <b>{s.iters}</b>
            {s.conv && <div style={{ color: C.grow, marginTop: 4 }}>✓ converged — centroids stopped moving</div>}
          </div></div>
      </>}
      foot="Inertia only ever falls — that's the convergence guarantee. But reseed a few times at k=4: different random pins, different local optima. That's why k-means++ and restarts exist." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto" }} />
    </PlayShell>
  );
}

// 5 ▸ NEURAL NETWORK PLAYGROUND (train a real MLP in your browser) ───────────
function nnMakeData(kind, noise, seed) {
  const R = mulberry32(seed); const pts = []; const N = 110;
  for (let i = 0; i < 2 * N; i++) {
    let x = 0, y = 0, l = 0;
    if (kind === "circle") { const ang = R() * 6.283, inside = i < N; const r = inside ? R() * 0.36 : 0.6 + R() * 0.36; x = Math.cos(ang) * r; y = Math.sin(ang) * r; l = inside ? 1 : 0; }
    else if (kind === "xor") { x = R() * 2 - 1; y = R() * 2 - 1; if (Math.abs(x) < 0.1) x += x < 0 ? -0.12 : 0.12; if (Math.abs(y) < 0.1) y += y < 0 ? -0.12 : 0.12; l = x * y > 0 ? 1 : 0; x *= 0.92; y *= 0.92; }
    else if (kind === "spiral") { const arm = i < N ? 0 : 1; const t = (i % N) / N; const r = t * 0.82 + 0.06; const ang = t * 4.2 + arm * Math.PI; x = Math.cos(ang) * r; y = Math.sin(ang) * r; l = arm; }
    else { const cx = i < N ? -0.45 : 0.45, cy = i < N ? -0.32 : 0.4; x = cx + (R() * 2 - 1) * 0.3; y = cy + (R() * 2 - 1) * 0.3; l = i < N ? 0 : 1; }
    x += (R() * 2 - 1) * noise; y += (R() * 2 - 1) * noise;
    pts.push({ x, y, l });
  }
  return pts;
}
function nnInit(hidden, act, seed) {
  const sizes = [2, ...hidden, 1]; const R = mulberry32(seed);
  const W = [], B = [];
  for (let l = 1; l < sizes.length; l++) {
    const nin = sizes[l - 1], nout = sizes[l];
    const sc = act === "relu" ? Math.sqrt(2 / nin) : Math.sqrt(1.3 / nin);
    W.push(Array.from({ length: nout }, () => Array.from({ length: nin }, () => (R() * 2 - 1) * sc)));
    B.push(Array.from({ length: nout }, () => 0));
  }
  return { W, B, act };
}
function nnForward(net, x, y) {
  const A = [[x, y]], Z = [];
  for (let l = 0; l < net.W.length; l++) {
    const inp = A[l], z = [], a = [], last = l === net.W.length - 1;
    for (let i = 0; i < net.W[l].length; i++) {
      let s = net.B[l][i]; const row = net.W[l][i];
      for (let j = 0; j < row.length; j++) s += row[j] * inp[j];
      z.push(s);
      if (last) a.push(1 / (1 + Math.exp(-s)));
      else a.push(net.act === "relu" ? (s > 0 ? s : 0) : net.act === "sigmoid" ? 1 / (1 + Math.exp(-s)) : Math.tanh(s));
    }
    Z.push(z); A.push(a);
  }
  return { A, Z };
}
function nnTrain(net, data, lr, bs, R) {
  const gW = net.W.map((m) => m.map((r) => r.map(() => 0)));
  const gB = net.B.map((b) => b.map(() => 0));
  let loss = 0;
  for (let n = 0; n < bs; n++) {
    const p = data[(R() * data.length) | 0];
    const { A, Z } = nnForward(net, p.x, p.y);
    const o = clamp(A[A.length - 1][0], 1e-7, 1 - 1e-7);
    loss += -(p.l * Math.log(o) + (1 - p.l) * Math.log(1 - o));
    let delta = [o - p.l];
    for (let l = net.W.length - 1; l >= 0; l--) {
      for (let i = 0; i < net.W[l].length; i++) {
        gB[l][i] += delta[i];
        for (let j = 0; j < net.W[l][i].length; j++) gW[l][i][j] += delta[i] * A[l][j];
      }
      if (l > 0) {
        const nd = new Array(net.W[l][0].length).fill(0);
        for (let j = 0; j < nd.length; j++) {
          let s = 0;
          for (let i = 0; i < net.W[l].length; i++) s += net.W[l][i][j] * delta[i];
          const a = A[l][j], z = Z[l - 1][j];
          nd[j] = s * (net.act === "relu" ? (z > 0 ? 1 : 0) : net.act === "sigmoid" ? a * (1 - a) : 1 - a * a);
        }
        delta = nd;
      }
    }
  }
  const sc = lr / bs;
  for (let l = 0; l < net.W.length; l++)
    for (let i = 0; i < net.W[l].length; i++) {
      net.B[l][i] -= sc * gB[l][i];
      for (let j = 0; j < net.W[l][i].length; j++) net.W[l][i][j] -= sc * gW[l][i][j];
    }
  return loss / bs;
}
function PlayNN() {
  const [dataset, setDataset] = useState("circle");
  const [noise, setNoise] = useState(0.05);
  const [hidden, setHidden] = useState([4, 4]);
  const [act, setAct] = useState("tanh");
  const [lr, setLr] = useState(0.08);
  const [running, setRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [info, setInfo] = useState({ loss: 0, acc: 0, steps: 0 });
  const cv = useRef(null), lossCv = useRef(null);
  const net = useRef(null), data = useRef([]), hist = useRef([]), steps = useRef(0), R = useRef(mulberry32(42)), off = useRef(null);
  useEffect(() => { data.current = nnMakeData(dataset, noise, 5 + resetKey); }, [dataset, noise, resetKey]);
  useEffect(() => { net.current = nnInit(hidden, act, 11 + resetKey * 7); hist.current = []; steps.current = 0; }, [hidden.join(","), act, resetKey, dataset]);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const W = 400, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = W * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!off.current) { off.current = document.createElement("canvas"); off.current.width = 46; off.current.height = 46; }
    const octx = off.current.getContext("2d");
    let raf, alive = true, frame = 0;
    const drawHeat = () => {
      const img = octx.createImageData(46, 46);
      for (let gy = 0; gy < 46; gy++) for (let gx = 0; gx < 46; gx++) {
        const x = (gx / 45) * 2.3 - 1.15, y = (gy / 45) * 2.3 - 1.15;
        const p = nnForward(net.current, x, y).A.slice(-1)[0][0];
        const idx = (gy * 46 + gx) * 4;
        const t = p; // class1=signal blue, class0=warm orange
        img.data[idx] = Math.round(255 + (91 - 255) * t);
        img.data[idx + 1] = Math.round(153 + (140 - 153) * t);
        img.data[idx + 2] = Math.round(80 + (255 - 80) * t);
        img.data[idx + 3] = Math.round(40 + 150 * Math.abs(p - 0.5) * 2);
      }
      octx.putImageData(img, 0, 0);
    };
    const loop = () => {
      if (!alive) return;
      frame++;
      if (running && net.current) {
        let L = 0;
        for (let k = 0; k < 10; k++) L = nnTrain(net.current, data.current, lr, 16, R.current);
        steps.current += 10;
        hist.current.push(L); if (hist.current.length > 140) hist.current.shift();
      }
      if (frame % 4 === 1) drawHeat();
      ctx.clearRect(0, 0, W, W);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off.current, 0, 0, W, W);
      const P = (v) => ((v + 1.15) / 2.3) * W;
      data.current.forEach((p) => {
        ctx.fillStyle = p.l ? "#5B8CFF" : "#FF9950";
        ctx.strokeStyle = "#0A0E1A"; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(P(p.x), P(p.y), 3.6, 0, 7); ctx.fill(); ctx.stroke();
      });
      // loss sparkline
      const lc = lossCv.current;
      if (lc) {
        const lw = 212, lh = 54; if (lc.width !== lw * dpr) { lc.width = lw * dpr; lc.height = lh * dpr; lc.style.width = lw + "px"; }
        const lctx = lc.getContext("2d"); lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lctx.clearRect(0, 0, lw, lh);
        const h = hist.current; if (h.length > 1) {
          const mx = Math.max(...h, 0.75);
          lctx.beginPath();
          h.forEach((v, i) => { const x = (i / (h.length - 1)) * lw, y = lh - (v / mx) * (lh - 6) - 2; i ? lctx.lineTo(x, y) : lctx.moveTo(x, y); });
          lctx.strokeStyle = C.grow; lctx.lineWidth = 1.8; lctx.stroke();
        }
      }
      if (frame % 14 === 0 && net.current) {
        let correct = 0, L = 0;
        data.current.forEach((p) => { const o = nnForward(net.current, p.x, p.y).A.slice(-1)[0][0]; if ((o > 0.5 ? 1 : 0) === p.l) correct++; const oc = clamp(o, 1e-7, 1 - 1e-7); L += -(p.l * Math.log(oc) + (1 - p.l) * Math.log(1 - oc)); });
        setInfo({ loss: L / data.current.length, acc: correct / data.current.length, steps: steps.current });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [running, lr, dataset, noise, hidden.join(","), act, resetKey]);
  const chgN = (i, d) => setHidden((h) => h.map((v, j) => (j === i ? clamp(v + d, 1, 8) : v)));
  return (
    <PlayShell title="Neural network playground" sub="A real MLP training live on 2-D data. The background is its current decision boundary."
      controls={<>
        <Sel label="dataset" value={dataset} onChange={setDataset} opts={[["circle", "Circle-in-ring"], ["xor", "XOR quadrants"], ["gauss", "Two blobs (easy)"], ["spiral", "Two spirals (hard)"]]} />
        <div className="ctl"><label><span>hidden layers</span><b>{hidden.length ? hidden.join("·") : "none (logistic!)"}</b></label>
          <div className="row" style={{ gap: 6 }}>
            {hidden.map((h, i) => (
              <span key={i} className="chip" style={{ gap: 5, userSelect: "none" }}>
                <span role="button" style={{ cursor: "pointer", padding: "0 3px" }} onClick={() => chgN(i, -1)}>−</span>
                <b>{h}</b>
                <span role="button" style={{ cursor: "pointer", padding: "0 3px" }} onClick={() => chgN(i, 1)}>+</span>
              </span>
            ))}
            {hidden.length < 4 && <span className="chip" role="button" onClick={() => setHidden((h) => [...h, 3])}>+ layer</span>}
            {hidden.length > 0 && <span className="chip" role="button" onClick={() => setHidden((h) => h.slice(0, -1))}>− layer</span>}
          </div>
        </div>
        <Sel label="activation" value={act} onChange={setAct} opts={[["tanh", "tanh"], ["relu", "ReLU"], ["sigmoid", "sigmoid"]]} />
        <Slider label="learning rate" value={lr} min={0.005} max={0.5} step={0.005} onChange={setLr} fmt={(v) => v.toFixed(3)} />
        <Slider label="noise" value={noise} min={0} max={0.22} step={0.01} onChange={setNoise} fmt={(v) => v.toFixed(2)} />
        <div className="row">
          <button className="btn sm run" onClick={() => setRunning(!running)}>{running ? <><Pause size={13}/>pause</> : <><Play size={13}/>train</>}</button>
          <button className="btn sm" onClick={() => setResetKey((k) => k + 1)}><RotateCcw size={13}/>reset</button>
        </div>
        <div className="rec"><div className="eyebrow">training</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, margin: "6px 0" }}>
            loss <b>{info.loss.toFixed(3)}</b> · acc <b style={{ color: info.acc > 0.95 ? C.grow : C.ink }}>{(info.acc * 100).toFixed(0)}%</b><br />steps <b>{info.steps}</b>
          </div>
          <canvas ref={lossCv} style={{ display: "block" }} />
        </div>
      </>}
      foot="Remove all hidden layers: you get logistic regression — a straight boundary that fails on the circle. Add one layer of 4 tanh units and watch it bend. The spiral usually wants 2×6+ and patience. Try ReLU with a huge learning rate to meet exploding gradients personally." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto", borderRadius: 10 }} />
    </PlayShell>
  );
}

// 6 ▸ PCA projection ─────────────────────────────────────────────────────────
function PlayPCA() {
  const [rho, setRho] = useState(0.78); const [seed, setSeed] = useState(1); const [proj, setProj] = useState(false);
  const cv = useRef(null); const tRef = useRef(0);
  const world = useMemo(() => {
    const R = mulberry32(seed * 31 + 5); const g = () => { let s = 0; for (let i = 0; i < 6; i++) s += R(); return (s - 3) / 1.6; };
    const pts = Array.from({ length: 170 }, () => { const a = g(), b = rho * a + Math.sqrt(Math.max(0, 1 - rho * rho)) * g(); return [a * 0.62, b * 0.62]; });
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0, syy = 0, sxy = 0;
    pts.forEach(([x, y]) => { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); });
    sxx /= n; syy /= n; sxy /= n;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy;
    const l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
    let v1 = Math.abs(sxy) > 1e-9 ? [sxy, l1 - sxx] : (sxx >= syy ? [1, 0] : [0, 1]);
    const nv = Math.hypot(...v1) || 1; v1 = [v1[0] / nv, v1[1] / nv];
    const v2 = [-v1[1], v1[0]];
    return { pts, mx, my, l1, l2, v1, v2 };
  }, [rho, seed]);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const W = 560, H = 400, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf, alive = true;
    const X = (v) => W / 2 + v * 150, Y = (v) => H / 2 - v * 150;
    const loop = () => {
      if (!alive) return;
      const target = proj ? 1 : 0;
      tRef.current += (target - tRef.current) * 0.07;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      const { pts, mx, my, v1, v2, l1, l2 } = world;
      // PC axes
      const drawAxis = (v, lam, col, wdt) => {
        const s = 2.2 * Math.sqrt(Math.max(lam, 1e-6));
        ctx.strokeStyle = col; ctx.lineWidth = wdt;
        ctx.beginPath(); ctx.moveTo(X(mx - v[0] * s), Y(my - v[1] * s)); ctx.lineTo(X(mx + v[0] * s), Y(my + v[1] * s)); ctx.stroke();
      };
      drawAxis(v2, l2, "rgba(140,160,220,.5)", 1.6);
      drawAxis(v1, l1, C.charge, 2.6);
      pts.forEach(([x, y]) => {
        const d = (x - mx) * v1[0] + (y - my) * v1[1];
        const px = mx + d * v1[0], py = my + d * v1[1];
        const cx = x + (px - x) * t, cy = y + (py - y) * t;
        if (t > 0.04 && t < 0.98) { ctx.strokeStyle = "rgba(91,140,255,.16)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(px), Y(py)); ctx.stroke(); }
        ctx.fillStyle = "rgba(91,140,255,.85)";
        ctx.beginPath(); ctx.arc(X(cx), Y(cy), 3.4, 0, 7); ctx.fill();
      });
      ctx.font = "11.5px JetBrains Mono"; ctx.fillStyle = C.charge; ctx.fillText("PC1 (max variance)", 14, 20);
      ctx.fillStyle = C.dim; ctx.fillText("PC2", 14, 38);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [world, proj]);
  const ve = world.l1 / (world.l1 + world.l2 + 1e-12);
  return (
    <PlayShell title="PCA — finding the best camera angle" sub="The amber axis is the direction of maximum variance. Project and see how much survives."
      controls={<>
        <Slider label="correlation ρ" value={rho} min={-0.95} max={0.95} step={0.01} onChange={setRho} fmt={(v) => v.toFixed(2)} />
        <button className="btn sm pri" onClick={() => setProj(!proj)}>{proj ? "restore 2-D" : "project → PC1"}</button>
        <button className="btn sm" onClick={() => setSeed((s) => s + 1)}><Shuffle size={13}/>resample</button>
        <div className="rec"><div className="eyebrow">explained variance</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, margin: "8px 0 6px" }}>PC1: <b style={{ color: C.charge }}>{(ve * 100).toFixed(1)}%</b> · PC2: {(100 - ve * 100).toFixed(1)}%</div>
          <div style={{ height: 8, borderRadius: 99, background: C.panel3, overflow: "hidden" }}><div style={{ width: `${ve * 100}%`, height: "100%", background: C.charge }} /></div>
        </div>
      </>}
      foot="At ρ≈0.9, PC1 carries ~95% of the variance — one number per point nearly suffices. Drag ρ to 0 and PCA has no favorite direction: compression only works when structure exists." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto" }} />
    </PlayShell>
  );
}

// 7 ▸ CONVOLUTION playground ─────────────────────────────────────────────────
const CONV_IMGS = {
  square: () => { const g = Array.from({ length: 10 }, () => new Array(10).fill(0)); for (let i = 2; i < 8; i++) { g[2][i] = g[7][i] = 9; g[i][2] = g[i][7] = 9; } return g; },
  cross: () => { const g = Array.from({ length: 10 }, () => new Array(10).fill(0)); for (let i = 1; i < 9; i++) { g[4][i] = g[5][i] = 9; g[i][4] = g[i][5] = 9; } return g; },
  diag: () => { const g = Array.from({ length: 10 }, () => new Array(10).fill(0)); for (let i = 0; i < 10; i++) { g[i][i] = 9; if (i < 9) g[i + 1][i] = 6; } return g; },
  grad: () => Array.from({ length: 10 }, (_, i) => Array.from({ length: 10 }, (_, j) => Math.round(j))),
};
const CONV_KERNELS = {
  edge: { name: "Edge detect", k: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
  sobelx: { name: "Sobel X (vertical edges)", k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
  sobely: { name: "Sobel Y (horizontal edges)", k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
  sharpen: { name: "Sharpen", k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
  box: { name: "Box blur (÷9)", k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], div: 9 },
  identity: { name: "Identity", k: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
};
function PlayConv() {
  const [imgK, setImgK] = useState("square"); const [kerK, setKerK] = useState("edge");
  const [stride, setStride] = useState(1); const [pad, setPad] = useState(1);
  const [pos, setPos] = useState(0); const [playing, setPlaying] = useState(true);
  const img = useMemo(() => CONV_IMGS[imgK](), [imgK]);
  const ker = CONV_KERNELS[kerK];
  const world = useMemo(() => {
    const H = img.length, W = img[0].length;
    const at = (i, j) => (i < 0 || j < 0 || i >= H || j >= W ? 0 : img[i][j]);
    const oh = Math.floor((H + 2 * pad - 3) / stride) + 1, ow = Math.floor((W + 2 * pad - 3) / stride) + 1;
    const out = [];
    for (let i = 0; i < oh; i++) { const row = []; for (let j = 0; j < ow; j++) {
      let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += at(i * stride - pad + a, j * stride - pad + b) * ker.k[a][b];
      row.push(s / (ker.div || 1));
    } out.push(row); }
    return { out, oh, ow };
  }, [img, ker, stride, pad]);
  useEffect(() => { setPos(0); }, [imgK, kerK, stride, pad]);
  useEffect(() => { if (!playing) return; const iv = setInterval(() => setPos((p) => (p + 1) % (world.oh * world.ow)), 200); return () => clearInterval(iv); }, [playing, world]);
  const cv = useRef(null);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const W = 640, H = 330, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const { out, oh, ow } = world;
    const pi = Math.floor(pos / ow), pj = pos % ow;
    const cell = 24, ox0 = 14, oy0 = 36, ih = img.length, iw = img[0].length;
    ctx.font = "11px JetBrains Mono"; ctx.fillStyle = C.dim;
    ctx.fillText(`input ${ih}×${iw}${pad ? " (+padding)" : ""}`, ox0, 20);
    for (let i = -pad; i < ih + pad; i++) for (let j = -pad; j < iw + pad; j++) {
      const x = ox0 + (j + pad) * cell, y = oy0 + (i + pad) * cell;
      const inside = i >= 0 && j >= 0 && i < ih && j < iw;
      const v = inside ? img[i][j] : 0;
      ctx.fillStyle = inside ? C.cell + (0.06 + v / 9 * 0.72) + ")" : "rgba(140,160,220,.05)";
      ctx.fillRect(x, y, cell - 2, cell - 2);
      if (!inside) { ctx.strokeStyle = "rgba(140,160,220,.25)"; ctx.setLineDash([2, 2]); ctx.strokeRect(x, y, cell - 2, cell - 2); ctx.setLineDash([]); }
    }
    // sliding window highlight
    const wx = ox0 + (pj * stride) * cell, wy = oy0 + (pi * stride) * cell;
    ctx.strokeStyle = C.charge; ctx.lineWidth = 2.2; ctx.strokeRect(wx - 1, wy - 1, cell * 3, cell * 3);
    // kernel
    const kx0 = ox0 + (iw + 2 * pad) * cell + 26, ky0 = oy0 + 30;
    ctx.fillStyle = C.dim; ctx.fillText("kernel", kx0, ky0 - 12);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const v = ker.k[a][b];
      ctx.fillStyle = v > 0 ? "rgba(91,140,255,.3)" : v < 0 ? "rgba(255,107,114,.28)" : "rgba(140,160,220,.1)";
      ctx.fillRect(kx0 + b * 30, ky0 + a * 30, 27, 27);
      ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.fillText(String(v), kx0 + b * 30 + 13, ky0 + a * 30 + 17); ctx.textAlign = "left";
    }
    ctx.fillStyle = C.charge; ctx.fillText("×  Σ  →", kx0 + 8, ky0 + 118);
    // output
    const oCell = 24, ux0 = kx0 + 118, uy0 = 36;
    ctx.fillStyle = C.dim; ctx.fillText(`output ${oh}×${ow}   stride ${stride}, pad ${pad}`, ux0, 20);
    const mag = Math.max(1, ...out.flat().map((v) => Math.abs(v)));
    for (let i = 0; i < oh; i++) for (let j = 0; j < ow; j++) {
      const v = out[i][j], x = ux0 + j * oCell, y = uy0 + i * oCell;
      const done = i * ow + j <= pos;
      ctx.fillStyle = !done ? "rgba(140,160,220,.06)" : v >= 0 ? `rgba(91,140,255,${0.1 + 0.8 * Math.abs(v) / mag})` : `rgba(255,107,114,${0.1 + 0.8 * Math.abs(v) / mag})`;
      ctx.fillRect(x, y, oCell - 2, oCell - 2);
      if (i === pi && j === pj) { ctx.strokeStyle = C.charge; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, oCell, oCell); }
    }
    ctx.fillStyle = C.ink; ctx.font = "12px JetBrains Mono";
    ctx.fillText(`this position: Σ (window ⊙ kernel) = ${out[pi][pj].toFixed(1)}`, ox0, H - 12);
  }, [world, pos, img, ker, stride, pad]);
  return (
    <PlayShell title="Convolution — one stencil, every position" sub="The amber window slides; each stop is a weighted sum. Blue = positive response, red = negative."
      controls={<>
        <Sel label="input pattern" value={imgK} onChange={setImgK} opts={[["square", "Hollow square"], ["cross", "Cross"], ["diag", "Diagonal"], ["grad", "Left→right ramp"]]} />
        <Sel label="kernel" value={kerK} onChange={setKerK} opts={Object.entries(CONV_KERNELS).map(([k, v]) => [k, v.name])} />
        <Slider label="stride" value={stride} min={1} max={2} step={1} onChange={setStride} />
        <Slider label="padding" value={pad} min={0} max={1} step={1} onChange={setPad} />
        <div className="row">
          <button className="btn sm" onClick={() => setPlaying(!playing)}>{playing ? <><Pause size={13}/>pause</> : <><Play size={13}/>slide</>}</button>
          <button className="btn sm" onClick={() => setPos((p) => (p + 1) % (world.oh * world.ow))}>step</button>
        </div>
      </>}
      foot="Sobel X on the ramp fires uniformly (constant horizontal change); on the square it lights only the vertical walls. Stride 2 halves the output size — cheap downsampling. Padding 1 keeps 10×10 → 10×10: 'same' convolution." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto" }} />
    </PlayShell>
  );
}

// 8 ▸ TOKENIZER (a real BPE, trained in your browser) ────────────────────────
const TOK_CORPUS = "the transformer model learns to predict the next token by attending to every previous token the training process updates the weights with gradient descent lower learning rates make the training slower but more stable the tokenizer merges frequent character pairs into subword tokens so the model never meets an unknown word newer larger models learn faster with better data the lowest loss wins the learner keeps learning";
function bpeMerge(seq, pair) {
  const out = []; let i = 0;
  while (i < seq.length) {
    if (i < seq.length - 1 && seq[i] === pair[0] && seq[i + 1] === pair[1]) { out.push(seq[i] + seq[i + 1]); i += 2; }
    else { out.push(seq[i]); i += 1; }
  }
  return out;
}
const BPE = (() => {
  let cache = null;
  return () => {
    if (cache) return cache;
    let seqs = TOK_CORPUS.split(/\s+/).map((w) => w.split(""));
    const merges = [];
    for (let step = 0; step < 130; step++) {
      const st = {};
      seqs.forEach((s) => { for (let i = 0; i < s.length - 1; i++) { const k = s[i] + "\u0000" + s[i + 1]; st[k] = (st[k] || 0) + 1; } });
      const keys = Object.keys(st); if (!keys.length) break;
      let best = keys[0]; keys.forEach((k) => { if (st[k] > st[best]) best = k; });
      if (st[best] < 2) break;
      const pair = best.split("\u0000");
      merges.push(pair);
      seqs = seqs.map((s) => bpeMerge(s, pair));
    }
    const vocab = {}; let id = 0;
    "abcdefghijklmnopqrstuvwxyz".split("").forEach((c) => { vocab[c] = id++; });
    merges.forEach(([a, b]) => { const t = a + b; if (!(t in vocab)) vocab[t] = id++; });
    cache = { merges, vocab };
    return cache;
  };
})();
function bpeEncode(text) {
  const { merges, vocab } = BPE();
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const toks = [];
  words.forEach((w) => {
    let seq = w.split("").filter((c) => /[a-z]/.test(c));
    if (!seq.length) return;
    merges.forEach((pair) => { seq = bpeMerge(seq, pair); });
    seq.forEach((t) => toks.push({ t, id: t in vocab ? vocab[t] : "·" }));
  });
  return toks;
}
function PlayTok() {
  const [text, setText] = useState("the lowest learning rate trains the newest transformer slowly");
  const toks = useMemo(() => bpeEncode(text), [text]);
  const chars = text.replace(/\s+/g, "").length;
  const { merges } = BPE();
  return (
    <PlayShell title="BPE tokenizer — trained live on a tiny corpus" sub="130 merges learned from ~70 words of ML text. Type anything; watch it get chopped."
      controls={<>
        <div className="rec"><div className="eyebrow">stats</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, marginTop: 6 }}>
            chars <b>{chars}</b> · tokens <b>{toks.length}</b><br />compression <b style={{ color: C.charge }}>{toks.length ? (chars / toks.length).toFixed(2) : "—"}</b> chars/token
          </div></div>
        <div className="rec"><div className="eyebrow">first merges learned</div>
          <div className="row" style={{ gap: 4, marginTop: 6 }}>
            {merges.slice(0, 14).map((m, i) => <span key={i} className="badge" style={{ textTransform: "none", letterSpacing: 0 }}>{m[0]}+{m[1]}</span>)}
          </div></div>
      </>}
      foot="Words from the training corpus ('the', 'learn', 'token') compress into one or two chunks; out-of-corpus words fall back toward characters — exactly why rare names and other languages cost more tokens in real LLMs.">
      <div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} style={{ marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }} />
        <div className="row" style={{ gap: 6 }}>
          {toks.map((tk, i) => {
            const h = hashStr(tk.t) % 360;
            return <span key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, padding: "5px 9px", borderRadius: 8, background: `hsla(${h},70%,62%,.14)`, border: `1px solid hsla(${h},70%,62%,.45)` }}>
              {tk.t}<span style={{ opacity: 0.5, fontSize: 10, marginLeft: 5 }}>#{tk.id}</span>
            </span>;
          })}
          {!toks.length && <span style={{ color: C.faint }}>type something…</span>}
        </div>
      </div>
    </PlayShell>
  );
}

// 9 ▸ SELF-ATTENTION heatmap ─────────────────────────────────────────────────
const attnCache = {};
function wordVec(w) {
  if (attnCache[w]) return attnCache[w];
  const v = new Array(16).fill(0); const s = "^" + w + "$";
  for (let i = 0; i < s.length - 2; i++) {
    const R = mulberry32(hashStr(s.slice(i, i + 3)));
    for (let d = 0; d < 16; d++) v[d] += R() * 2 - 1;
  }
  const n = Math.hypot(...v) || 1;
  return (attnCache[w] = v.map((x) => x / n));
}
const ATTN_W = (() => {
  const R = mulberry32(20240229);
  const mk = () => Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => (R() * 2 - 1) * 0.55));
  return { Q: mk(), K: mk() };
})();
const matv = (M, v) => M.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
function PlayAttn() {
  const [text, setText] = useState("the robot read the manual because it was confused");
  const [temp, setTemp] = useState(1); const [causal, setCausal] = useState(true);
  const [hover, setHover] = useState(null);
  const toks = useMemo(() => text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean).slice(0, 11), [text]);
  const Wgt = useMemo(() => {
    const qs = toks.map((t) => matv(ATTN_W.Q, wordVec(t)));
    const ks = toks.map((t) => matv(ATTN_W.K, wordVec(t)));
    return toks.map((_, i) => {
      const scores = toks.map((_, j) => (causal && j > i ? -1e9 : qs[i].reduce((s, x, d) => s + x * ks[j][d], 0) / (4 * temp)));
      const m = Math.max(...scores); const e = scores.map((s) => Math.exp(s - m)); const Z = e.reduce((a, b) => a + b, 0);
      return e.map((x) => x / Z);
    });
  }, [toks, temp, causal]);
  const cv = useRef(null);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const n = toks.length; const cell = Math.min(38, 340 / Math.max(1, n));
    const off = 86, W = off + n * cell + 16, H = off + n * cell + 16;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = "11px JetBrains Mono";
    toks.forEach((t, j) => {
      ctx.save(); ctx.translate(off + j * cell + cell / 2 + 3, off - 8); ctx.rotate(-Math.PI / 3.4);
      ctx.fillStyle = hover && hover[1] === j ? C.charge : C.dim; ctx.fillText(t.slice(0, 8), 0, 0); ctx.restore();
      ctx.fillStyle = hover && hover[0] === j ? C.charge : C.dim; ctx.textAlign = "right";
      ctx.fillText(toks[j].slice(0, 9), off - 8, off + j * cell + cell / 2 + 4); ctx.textAlign = "left";
    });
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const w = Wgt[i][j];
      ctx.fillStyle = causal && j > i ? "rgba(140,160,220,.04)" : `rgba(91,140,255,${0.06 + w * 0.94})`;
      ctx.fillRect(off + j * cell, off + i * cell, cell - 2, cell - 2);
      if (hover && hover[0] === i && hover[1] === j) { ctx.strokeStyle = C.charge; ctx.lineWidth = 2; ctx.strokeRect(off + j * cell, off + i * cell, cell - 2, cell - 2); }
    }
    canvas.onmousemove = (e) => {
      const r = canvas.getBoundingClientRect(); const sc = W / r.width;
      const x = (e.clientX - r.left) * sc - off, y = (e.clientY - r.top) * sc - off;
      const j = Math.floor(x / cell), i = Math.floor(y / cell);
      setHover(i >= 0 && j >= 0 && i < n && j < n ? [i, j] : null);
    };
    canvas.onmouseleave = () => setHover(null);
  }, [Wgt, toks, hover, causal]);
  return (
    <PlayShell title="Self-attention heatmap" sub="Row = query token, column = key token. Each row is a softmax: it sums to exactly 1."
      controls={<>
        <Slider label="temperature (score scale)" value={temp} min={0.25} max={3} step={0.05} onChange={setTemp} fmt={(v) => v.toFixed(2)} />
        <div className="row"><span className={"chip" + (causal ? " on" : "")} role="button" onClick={() => setCausal(true)}>causal (GPT-style)</span>
          <span className={"chip" + (!causal ? " on" : "")} role="button" onClick={() => setCausal(false)}>bidirectional</span></div>
        <div className="rec" style={{ minHeight: 62 }}><div className="eyebrow">hovered weight</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, marginTop: 6 }}>
            {hover ? <>"{toks[hover[0]]}" → "{toks[hover[1]]}" : <b style={{ color: C.charge }}>{Wgt[hover[0]][hover[1]].toFixed(3)}</b></> : "hover a cell"}
          </div></div>
        <div style={{ fontSize: 11, color: C.faint }}>Mechanics demo: Q/K come from fixed random projections of hashed word vectors. Real models LEARN these matrices — the mechanism shown (score → softmax → mix) is exact.</div>
      </>}
      foot="Causal mode blanks the upper triangle: token i may only look backwards — that mask is what makes a decoder generative. Low temperature sharpens rows toward one-hot; high temperature flattens them toward uniform.">
      <div>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} style={{ marginBottom: 12, fontFamily: "'JetBrains Mono',monospace" }} />
        <canvas ref={cv} style={{ display: "block", margin: "0 auto", cursor: "crosshair" }} />
      </div>
    </PlayShell>
  );
}

// 10 ▸ SAMPLING (temperature / top-k / top-p) ────────────────────────────────
const LM_CORPUS = "the model reads the tokens and the model predicts the next token . the network learns the weights by gradient descent . the loss goes down when the model learns . a transformer uses attention to mix information across tokens . the agent calls a tool and reads the result . the data trains the model and the model fits the data . sampling with high temperature makes the text creative and strange . sampling with low temperature makes the text safe and boring . the researcher trains the network on the data . attention weights show what the model reads . the tokens flow through the network .";
const BIGRAM = (() => {
  const ws = LM_CORPUS.split(/\s+/).filter(Boolean);
  const m = {};
  for (let i = 0; i < ws.length - 1; i++) { const a = ws[i], b = ws[i + 1]; (m[a] = m[a] || {})[b] = (m[a][b] || 0) + 1; }
  return m;
})();
function PlaySampling() {
  const [T, setT] = useState(1); const [topk, setTopk] = useState(12); const [topp, setTopp] = useState(1);
  const [gen, setGen] = useState(["the"]);
  const ctxWord = BIGRAM[gen[gen.length - 1]] ? gen[gen.length - 1] : "the";
  const dist = useMemo(() => {
    const counts = BIGRAM[ctxWord] || { the: 1 };
    const entries = Object.entries(counts);
    const tot = entries.reduce((s, [, c]) => s + c, 0);
    let rows = entries.map(([w, c]) => ({ w, base: c / tot }));
    const logits = rows.map((r) => Math.log(r.base) / T);
    const mx = Math.max(...logits); const e = logits.map((l) => Math.exp(l - mx)); const Z = e.reduce((a, b) => a + b, 0);
    rows = rows.map((r, i) => ({ ...r, adj: e[i] / Z })).sort((a, b) => b.adj - a.adj);
    let cum = 0;
    rows = rows.map((r, i) => {
      const cut = i >= topk || cum >= topp;
      cum += r.adj;
      return { ...r, cut };
    });
    const keptZ = rows.filter((r) => !r.cut).reduce((s, r) => s + r.adj, 0) || 1;
    return rows.map((r) => ({ ...r, fin: r.cut ? 0 : r.adj / keptZ }));
  }, [ctxWord, T, topk, topp]);
  const sample = useCallback(() => {
    const r = Math.random(); let c = 0;
    for (const row of dist) { c += row.fin; if (r <= c && row.fin > 0) return row.w; }
    const kept = dist.filter((d) => !d.cut);
    return kept.length ? kept[0].w : "the";
  }, [dist]);
  const stepOne = () => setGen((g) => [...g, sample()]);
  const auto = () => {
    let g = [...gen];
    for (let i = 0; i < 22; i++) {
      const cw = BIGRAM[g[g.length - 1]] ? g[g.length - 1] : "the";
      const counts = BIGRAM[cw]; const entries = Object.entries(counts);
      const tot = entries.reduce((s, [, c]) => s + c, 0);
      let rows = entries.map(([w, c]) => ({ w, p: c / tot }));
      const logits = rows.map((r) => Math.log(r.p) / T);
      const mx = Math.max(...logits); const e = logits.map((l) => Math.exp(l - mx)); const Z = e.reduce((a, b) => a + b, 0);
      rows = rows.map((r, i) => ({ w: r.w, p: e[i] / Z })).sort((a, b) => b.p - a.p);
      let cum = 0; rows = rows.filter((r, i) => { const keep = i < topk && cum < topp; cum += r.p; return keep; });
      const kz = rows.reduce((s, r) => s + r.p, 0) || 1;
      const rr = Math.random(); let cc = 0; let pick = rows[0] ? rows[0].w : "the";
      for (const row of rows) { cc += row.p / kz; if (rr <= cc) { pick = row.w; break; } }
      g.push(pick);
    }
    setGen(g);
  };
  return (
    <PlayShell title="Decoding controls — temperature, top-k, top-p" sub={`A tiny bigram LM. Context: "…${ctxWord}". Bars: outline = raw model, fill = after your knobs.`}
      controls={<>
        <Slider label="temperature T" value={T} min={0.1} max={3} step={0.05} onChange={setT} fmt={(v) => v.toFixed(2)} />
        <Slider label="top-k" value={topk} min={1} max={12} step={1} onChange={setTopk} fmt={(v) => (v >= 12 ? "off" : v)} />
        <Slider label="top-p (nucleus)" value={topp} min={0.1} max={1} step={0.05} onChange={setTopp} fmt={(v) => (v >= 1 ? "off" : v.toFixed(2))} />
        <div className="row">
          <button className="btn sm pri" onClick={stepOne}>sample next</button>
          <button className="btn sm" onClick={auto}>+22 words</button>
          <button className="btn sm ghost" onClick={() => setGen(["the"])}><RotateCcw size={13}/></button>
        </div>
      </>}
      foot="T=0.1: the same safe sentence forever (greedy-ish). T=3 with everything off: word salad. The craft is the middle — try T=0.9, top-p=0.9, the workhorse setting of real systems.">
      <div>
        <div className="rec" style={{ marginBottom: 14, minHeight: 64 }}>
          <div className="eyebrow">generated</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5, marginTop: 6, lineHeight: 1.8 }}>
            {gen.join(" ")}<span style={{ color: C.grow }}>▌</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {dist.slice(0, 10).map((r) => (
            <div key={r.w} style={{ display: "flex", alignItems: "center", gap: 10, opacity: r.cut ? 0.35 : 1 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, width: 92, textAlign: "right", textDecoration: r.cut ? "line-through" : "none" }}>{r.w}</span>
              <div style={{ flex: 1, height: 15, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, width: `${r.base * 100}%`, border: `1px solid var(--line2)`, borderRadius: 4 }} />
                <div style={{ position: "absolute", inset: 0, width: `${r.fin * 100}%`, background: r.cut ? "transparent" : C.signal, borderRadius: 4, opacity: 0.8, transition: "width .2s" }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.dim, width: 44 }}>{(r.fin * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </PlayShell>
  );
}

// 11 ▸ Q-LEARNING gridworld ──────────────────────────────────────────────────
function PlayRL() {
  const GW = 8, GH = 5, GOAL = [7, 0], PITS = [[3, 2], [5, 3]], START = [0, 4];
  const [alpha, setAlpha] = useState(0.3); const [gamma, setGamma] = useState(0.92); const [eps, setEps] = useState(0.25);
  const [speed, setSpeed] = useState(6); const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ eps: 0, ret: 0 });
  const Q = useRef(null); const returns = useRef([]);
  const resetQ = () => { Q.current = Array.from({ length: GW }, () => Array.from({ length: GH }, () => [0, 0, 0, 0])); returns.current = []; setStats({ eps: 0, ret: 0 }); };
  if (!Q.current) resetQ();
  const isPit = (x, y) => PITS.some(([px, py]) => px === x && py === y);
  const cv = useRef(null);
  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const cell = 56, W = GW * cell + 8, H = GH * cell + 8, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px";
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // U D L R
    let raf, alive = true, epCount = stats.eps;
    const episode = () => {
      let [x, y] = START, steps = 0, ret = 0;
      while (steps++ < 120) {
        const a = Math.random() < eps ? (Math.random() * 4) | 0 : Q.current[x][y].indexOf(Math.max(...Q.current[x][y]));
        const nx = clamp(x + DIRS[a][0], 0, GW - 1), ny = clamp(y + DIRS[a][1], 0, GH - 1);
        const done = (nx === GOAL[0] && ny === GOAL[1]) || isPit(nx, ny);
        const r = nx === GOAL[0] && ny === GOAL[1] ? 10 : isPit(nx, ny) ? -10 : -0.15;
        ret += r;
        const tgt = r + (done ? 0 : gamma * Math.max(...Q.current[nx][ny]));
        Q.current[x][y][a] += alpha * (tgt - Q.current[x][y][a]);
        x = nx; y = ny;
        if (done) break;
      }
      returns.current.push(ret); if (returns.current.length > 60) returns.current.shift();
      epCount++;
    };
    const loop = () => {
      if (!alive) return;
      if (running) { for (let i = 0; i < speed; i++) episode(); setStats({ eps: epCount, ret: returns.current.reduce((a, b) => a + b, 0) / (returns.current.length || 1) }); }
      // draw
      ctx.clearRect(0, 0, W, H);
      let vmax = 1; Q.current.forEach((col) => col.forEach((qs) => { vmax = Math.max(vmax, Math.abs(Math.max(...qs))); }));
      for (let x = 0; x < GW; x++) for (let y = 0; y < GH; y++) {
        const v = Math.max(...Q.current[x][y]);
        const px = 4 + x * cell, py = 4 + y * cell;
        if (GOAL[0] === x && GOAL[1] === y) ctx.fillStyle = "rgba(61,220,151,.28)";
        else if (isPit(x, y)) ctx.fillStyle = "rgba(255,107,114,.26)";
        else ctx.fillStyle = v >= 0 ? `rgba(91,140,255,${0.05 + 0.5 * v / vmax})` : `rgba(255,107,114,${0.05 + 0.4 * Math.abs(v) / vmax})`;
        ctx.fillRect(px, py, cell - 3, cell - 3);
        ctx.strokeStyle = C.line; ctx.strokeRect(px, py, cell - 3, cell - 3);
        ctx.font = "15px JetBrains Mono"; ctx.textAlign = "center"; ctx.fillStyle = C.ink;
        if (GOAL[0] === x && GOAL[1] === y) ctx.fillText("◎", px + cell / 2, py + cell / 2 + 5);
        else if (isPit(x, y)) ctx.fillText("✕", px + cell / 2, py + cell / 2 + 5);
        else if (START[0] === x && START[1] === y) { ctx.fillStyle = C.charge; ctx.font = "10px JetBrains Mono"; ctx.fillText("START", px + cell / 2, py + cell - 8); }
        // policy arrow
        if (!(GOAL[0] === x && GOAL[1] === y) && !isPit(x, y) && Math.max(...Q.current[x][y]) !== 0) {
          const a = Q.current[x][y].indexOf(Math.max(...Q.current[x][y]));
          const [dx, dy] = DIRS[a];
          ctx.strokeStyle = C.arrow; ctx.lineWidth = 1.8;
          const mx = px + cell / 2, my = py + cell / 2 - 4;
          ctx.beginPath(); ctx.moveTo(mx - dx * 9, my - dy * 9); ctx.lineTo(mx + dx * 9, my + dy * 9);
          ctx.moveTo(mx + dx * 9, my + dy * 9); ctx.lineTo(mx + dx * 9 - dx * 5 - dy * 4, my + dy * 9 - dy * 5 - dx * 4);
          ctx.moveTo(mx + dx * 9, my + dy * 9); ctx.lineTo(mx + dx * 9 - dx * 5 + dy * 4, my + dy * 9 - dy * 5 + dx * 4);
          ctx.stroke();
        }
        ctx.textAlign = "left";
      }
      // greedy rollout trace
      let [gx, gy] = START; const seen = new Set(); ctx.strokeStyle = C.charge; ctx.lineWidth = 2.4; ctx.beginPath();
      ctx.moveTo(4 + gx * cell + cell / 2, 4 + gy * cell + cell / 2);
      for (let s = 0; s < 40; s++) {
        const key = gx + "," + gy; if (seen.has(key)) break; seen.add(key);
        if ((gx === GOAL[0] && gy === GOAL[1]) || isPit(gx, gy)) break;
        const a = Q.current[gx][gy].indexOf(Math.max(...Q.current[gx][gy]));
        gx = clamp(gx + DIRS[a][0], 0, GW - 1); gy = clamp(gy + DIRS[a][1], 0, GH - 1);
        ctx.lineTo(4 + gx * cell + cell / 2, 4 + gy * cell + cell / 2);
      }
      ctx.stroke();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [alpha, gamma, eps, speed, running]);
  return (
    <PlayShell title="Q-learning gridworld" sub="◎ cheese +10, ✕ pits −10, every step −0.15. The amber line is the current greedy policy from START."
      controls={<>
        <Slider label="learning rate α" value={alpha} min={0.05} max={1} step={0.05} onChange={setAlpha} fmt={(v) => v.toFixed(2)} />
        <Slider label="discount γ" value={gamma} min={0.5} max={0.99} step={0.01} onChange={setGamma} fmt={(v) => v.toFixed(2)} />
        <Slider label="exploration ε" value={eps} min={0} max={1} step={0.05} onChange={setEps} fmt={(v) => v.toFixed(2)} />
        <Slider label="episodes / frame" value={speed} min={1} max={30} step={1} onChange={setSpeed} />
        <div className="row">
          <button className="btn sm run" onClick={() => setRunning(!running)}>{running ? <><Pause size={13}/>pause</> : <><Play size={13}/>train</>}</button>
          <button className="btn sm" onClick={resetQ}><RotateCcw size={13}/>forget all</button>
        </div>
        <div className="rec"><div className="eyebrow">progress</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, marginTop: 6 }}>
            episodes <b>{stats.eps}</b><br />avg return (last 60) <b style={{ color: stats.ret > 5 ? C.grow : C.ink }}>{stats.ret.toFixed(2)}</b>
          </div></div>
      </>}
      foot="Set ε=0 right after 'forget all': the agent greedily worships its first mediocre discovery — the exploration problem, live. Drop γ to 0.5 and watch it get short-sighted about the distant cheese." >
      <canvas ref={cv} style={{ display: "block", margin: "0 auto" }} />
    </PlayShell>
  );
}

// 12 ▸ RAG pipeline (real retrieval + real generation) ───────────────────────
const RAG_DOCS = [
  { id: "D1", t: "Gradient descent", s: "Gradient descent trains a model by repeatedly nudging its weights against the gradient of the loss. The learning rate sets the step size and momentum smooths the path." },
  { id: "D2", t: "Backpropagation", s: "Backpropagation applies the chain rule backwards through the computational graph, producing every parameter's gradient in one backward sweep at roughly the cost of a forward pass." },
  { id: "D3", t: "Tokenization", s: "A tokenizer such as BPE splits text into subword tokens by merging frequent character pairs. Context windows and API costs are measured in these tokens." },
  { id: "D4", t: "Self-attention", s: "Self-attention lets every token score every other token with query-key dot products, then mix their value vectors using the softmaxed weights." },
  { id: "D5", t: "RAG", s: "Retrieval-augmented generation embeds document chunks, retrieves the nearest ones for a query, and asks the model to answer grounded in that context with citations." },
  { id: "D6", t: "LoRA fine-tuning", s: "LoRA adapts a large model by training small low-rank weight updates while the base stays frozen, making fine-tuning cheap in memory and compute." },
  { id: "D7", t: "Q-learning", s: "Q-learning nudges a table of action values toward reward plus the discounted best next value, learning optimal behavior off-policy from exploratory experience." },
  { id: "D8", t: "Overfitting", s: "Overfitting is memorizing training noise: training error keeps falling while held-out error rises. Regularization, more data and early stopping fight it." },
];
const RAG_INDEX = (() => {
  const toks = (s) => s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const df = {};
  const docs = RAG_DOCS.map((d) => { const ts = toks(d.t + " " + d.s); new Set(ts).forEach((w) => { df[w] = (df[w] || 0) + 1; }); return { ...d, ts }; });
  const idf = (w) => Math.log((RAG_DOCS.length + 1) / ((df[w] || 0) + 1)) + 1;
  const vec = (ts) => { const v = {}; ts.forEach((w) => { v[w] = (v[w] || 0) + idf(w); }); const n = Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0)) || 1; Object.keys(v).forEach((k) => (v[k] /= n)); return v; };
  const dvecs = docs.map((d) => vec(d.ts));
  return { score: (q) => { const qv = vec(toks(q)); return docs.map((d, i) => { let s = 0; Object.keys(qv).forEach((w) => { if (dvecs[i][w]) s += qv[w] * dvecs[i][w]; }); return { ...RAG_DOCS[i], score: s }; }).sort((a, b) => b.score - a.score); } };
})();
function PlayRAG() {
  const [q, setQ] = useState("how does a model learn from its mistakes during training?");
  const [k, setK] = useState(2);
  const [ans, setAns] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
  const ranked = useMemo(() => RAG_INDEX.score(q), [q]);
  const generate = async () => {
    setBusy(true); setErr(null); setAns(null);
    try {
      const ctxTxt = ranked.slice(0, k).map((d) => `[${d.id}] ${d.t}: ${d.s}`).join("\n");
      const sys = "You are the generation stage of a RAG pipeline. Answer the user's question using ONLY the provided context chunks. Cite chunk ids inline like [D2]. If the context does not contain the answer, say exactly: \"The retrieved context does not cover this.\" Keep it under 120 words.";
      const txt = await askClaude([{ role: "user", content: `Context chunks:\n${ctxTxt}\n\nQuestion: ${q}` }], sys, 400);
      setAns(txt);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  const stages = ["chunk", "embed", "retrieve", "generate"];
  return (
    <PlayShell title="RAG pipeline — retrieval you can watch, generation that's real" sub="8-chunk corpus · TF-IDF retriever (a stand-in for dense embeddings) · a real model answers from the top-k."
      controls={<>
        <Slider label="top-k chunks into prompt" value={k} min={1} max={4} step={1} onChange={setK} />
        <button className="btn pri" onClick={generate} disabled={busy}>{busy ? <><Loader2 size={14} style={{ animation: "np-spin 1s linear infinite" }}/>generating…</> : <><Sparkles size={14}/>generate grounded answer</>}</button>
        <div style={{ fontSize: 11.5, color: C.faint }}>Try a question the corpus can't answer ("what is the capital of France?") and watch the model refuse to hallucinate — because the instructions bind it to its receipts.</div>
      </>}
      foot="Production RAG swaps TF-IDF for dense embeddings + ANN indexes + a reranker, but the shape is identical: retrieve → stuff context → generate with citations. Most failures live in the left half of this diagram.">
      <div>
        <div className="row" style={{ marginBottom: 12, gap: 6 }}>
          {stages.map((s, i) => <span key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="badge" style={{ color: (s === "generate" && busy) || (s === "retrieve" && !busy) ? C.charge : C.dim, borderColor: (s === "generate" && busy) || (s === "retrieve" && !busy) ? "rgba(255,197,61,.5)" : C.line2 }}>{s}</span>
            {i < 3 && <ArrowRight size={12} color={C.faint} />}
          </span>)}
        </div>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {ranked.map((d, i) => (
            <div key={d.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10, border: `1px solid ${i < k ? "rgba(91,140,255,.5)" : C.line}`, background: i < k ? "rgba(91,140,255,.06)" : "transparent", opacity: i < k ? 1 : 0.55 }}>
              <span className="badge" style={{ flex: "none", color: i < k ? C.signal : C.dim }}>{d.id}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{d.t} <span style={{ color: C.faint, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>cos {d.score.toFixed(3)}</span></div>
                <div style={{ fontSize: 12, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.s}</div>
                <div style={{ height: 3, borderRadius: 99, background: C.panel3, marginTop: 5 }}><div style={{ width: `${Math.min(100, d.score * 160)}%`, height: "100%", background: i < k ? C.signal : C.faint, borderRadius: 99 }} /></div>
              </div>
            </div>
          ))}
        </div>
        {err && <div className="lock-note" style={{ color: C.heat, borderColor: "rgba(255,107,114,.35)", background: "rgba(255,107,114,.06)" }}>{err} — the retrieval ranking above is real; the generation step needs the live model (it runs inside the Claude app's artifact view).</div>}
        {ans && <div className="rec" style={{ borderColor: "rgba(61,220,151,.4)" }}><div className="eyebrow" style={{ color: C.grow }}>grounded answer</div><div style={{ marginTop: 6, fontSize: 13.5 }}><MD text={ans} /></div></div>}
      </div>
    </PlayShell>
  );
}

// 13 ▸ ReAct AGENT (a real tool-using loop) ──────────────────────────────────
const AGENT_TOOLS = {
  calc: { sig: "calc[expression]", run: (inp) => { try { return String(mathEval(inp)); } catch (e) { return "calc error: " + (e.message || e); } } },
  lookup: { sig: "lookup[search terms]", run: (inp) => {
    const q = inp.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = ALL_TOPICS.map((t) => ({ t, s: q.reduce((a, w) => a + (t.title.toLowerCase().includes(w) ? 2 : 0) + (t.partName.toLowerCase().includes(w) ? 1 : 0), 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
    const g = Object.keys(GLOSS).filter((kk) => q.some((w) => kk.toLowerCase().includes(w))).slice(0, 2);
    const lines = [...scored.map((x) => `topic "${x.t.title}" lives in Part ${x.t.part}: ${x.t.partName}`), ...g.map((kk) => `glossary — ${kk}: ${GLOSS[kk]}`)];
    return lines.length ? lines.join(" | ") : "no curriculum match found";
  } },
  today: { sig: "today[]", run: () => new Date().toDateString() },
};
const AGENT_SYS = `You are a ReAct agent inside NeuralPath, an AI/ML learning platform. Solve the user's task with this strict loop:
Thought: <one short reasoning step>
Action: <tool>[<input>]
Then STOP and wait for the Observation (never invent one).
Available tools:
- calc[expression]  (exact math, e.g. calc[(2^10+44)*3/6])
- lookup[search terms]  (search the NeuralPath curriculum and glossary)
- today[]  (current date)
When you have enough information, finish with:
Answer: <final answer in one short paragraph>
Rules: per turn, output exactly one Thought and then EITHER one Action OR the final Answer. Nothing after an Action.`;
function PlayAgent() {
  const [task, setTask] = useState("Which part of NeuralPath teaches LoRA, and what is LoRA in one line? Also compute 12*64/8.");
  const [trace, setTrace] = useState([]); const [busy, setBusy] = useState(false);
  const run = async () => {
    if (busy) return;
    setBusy(true); setTrace([{ k: "task", t: task }]);
    const msgs = [{ role: "user", content: task }];
    const add = (k, t) => setTrace((tr) => [...tr, { k, t }]);
    try {
      for (let i = 0; i < 5; i++) {
        const txt = await askClaude(msgs, AGENT_SYS, 400);
        const th = txt.match(/Thought:\s*([\s\S]*?)(?=\n\s*(?:Action|Answer):|$)/);
        if (th) add("thought", th[1].trim());
        const ansM = txt.match(/Answer:\s*([\s\S]*)/);
        if (ansM) { add("answer", ansM[1].trim()); break; }
        const actM = txt.match(/Action:\s*([a-zA-Z_]+)\s*\[([\s\S]*?)\]/);
        if (!actM) { add("err", "The model broke the format (no Action or Answer). Stopping."); break; }
        const [, tool, inp] = actM;
        add("action", `${tool}[${inp}]`);
        const obs = AGENT_TOOLS[tool] ? AGENT_TOOLS[tool].run(inp) : `unknown tool "${tool}"`;
        add("obs", obs);
        msgs.push({ role: "assistant", content: txt }, { role: "user", content: "Observation: " + obs });
        if (i === 4) add("err", "Step limit (5) reached — every agent loop needs a leash.");
      }
    } catch (e) { add("err", String(e.message || e) + " — the live agent needs the Claude artifact environment."); }
    setBusy(false);
  };
  const KIND = { task: ["task", C.dim], thought: ["Thought", C.dim], action: ["Action", C.signal], obs: ["Observation", C.charge], answer: ["Answer", C.grow], err: ["⚠", C.heat] };
  return (
    <PlayShell title="ReAct agent — a real model, really using tools" sub="Watch the raw loop under every agent framework: Thought → Action → Observation → … → Answer."
      controls={<>
        <div className="ctl"><label><span>preset tasks</span></label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["What is (2^10 + 44) * 3 / 6? Show the value.", "Which part of NeuralPath teaches LoRA, and what is LoRA in one line? Also compute 12*64/8.", "Use today[] to get the date, then compute how many days remain in this month."].map((p) => (
              <span key={p} className="chip" role="button" style={{ whiteSpace: "normal", lineHeight: 1.4 }} onClick={() => setTask(p)}>{p}</span>
            ))}
          </div></div>
        <button className="btn pri" onClick={run} disabled={busy}>{busy ? <><Loader2 size={14} style={{ animation: "np-spin 1s linear infinite" }}/>agent running…</> : <><Bot size={14}/>run agent</>}</button>
        <div style={{ fontSize: 11.5, color: C.faint }}>Tools: {Object.values(AGENT_TOOLS).map((t) => t.sig).join(" · ")} — executed by this page, results fed back as Observations. Max 5 steps.</div>
      </>}
      foot="Note what the harness does that the model can't: it actually runs the tools, injects real Observations, validates format, and enforces the step limit. That harness IS agent engineering.">
      <div>
        <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={2} style={{ marginBottom: 12, fontSize: 13 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {trace.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", borderRadius: 10, background: e.k === "answer" ? "rgba(61,220,151,.07)" : e.k === "obs" ? "rgba(255,197,61,.05)" : C.void, border: `1px solid ${e.k === "answer" ? "rgba(61,220,151,.4)" : C.line}`, animation: "np-up .25s ease" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: KIND[e.k][1], flex: "none", width: 92, paddingTop: 2 }}>{KIND[e.k][0]}</span>
              <span style={{ fontSize: 13, fontFamily: e.k === "action" || e.k === "obs" ? "'JetBrains Mono',monospace" : "inherit", whiteSpace: "pre-wrap" }}>{e.t}</span>
            </div>
          ))}
          {!trace.length && <div style={{ color: C.faint, fontSize: 13, padding: 20, textAlign: "center" }}>Pick a task and run the agent — the full reasoning trace appears here.</div>}
        </div>
      </div>
    </PlayShell>
  );
}

// ── playground registry ──────────────────────────────────────────────────────
const PLAYGROUNDS = {
  nn: { name: "Neural Network Trainer", desc: "Train a real MLP on 2-D data; watch the decision boundary learn to bend.", comp: PlayNN, tag: "deep learning" },
  gd: { name: "Gradient Descent", desc: "Roll down loss surfaces; feel learning rate, momentum, and non-convexity.", comp: PlayGD, tag: "optimization" },
  attn: { name: "Attention Heatmap", desc: "Query·Key softmax over your own sentence, with a causal mask toggle.", comp: PlayAttn, tag: "transformers" },
  tok: { name: "BPE Tokenizer", desc: "A byte-pair tokenizer trained live in your browser. Type; watch the chopping.", comp: PlayTok, tag: "llms" },
  sampling: { name: "Sampling Controls", desc: "Temperature, top-k, top-p reshaping a real next-token distribution.", comp: PlaySampling, tag: "llms" },
  rag: { name: "RAG Pipeline", desc: "Watch retrieval rank chunks, then a real model answers with citations.", comp: PlayRAG, tag: "llms" },
  agent: { name: "ReAct Agent", desc: "A live model in a tool-use loop: Thought → Action → Observation → Answer.", comp: PlayAgent, tag: "agents" },
  rl: { name: "Q-Learning Gridworld", desc: "An agent learns cheese-seeking from scratch. ε, α, γ under your thumb.", comp: PlayRL, tag: "reinforcement" },
  poly: { name: "Overfitting Lab", desc: "Polynomial capacity vs the truth: the bias-variance U-curve, live.", comp: PlayPoly, tag: "fundamentals" },
  kmeans: { name: "K-Means Steps", desc: "Assign, average, repeat — watch centroids wander to the blobs.", comp: PlayKMeans, tag: "clustering" },
  pca: { name: "PCA Projector", desc: "Find the max-variance axis and squash 2-D onto it, animated.", comp: PlayPCA, tag: "fundamentals" },
  conv: { name: "Convolution Slider", desc: "A kernel gliding over an image: stride, padding, edge detectors.", comp: PlayConv, tag: "vision" },
  act: { name: "Activation Explorer", desc: "Six activations and their gradients — meet saturation personally.", comp: PlayAct, tag: "deep learning" },
};

// ── Pyodide status + code running UI ─────────────────────────────────────────
function usePyStatus() {
  const [s, setS] = useState({ status: pyRT.status, note: pyRT.note });
  useEffect(() => { const l = (x) => setS({ ...x }); pyRT.listeners.add(l); return () => pyRT.listeners.delete(l); }, []);
  return s;
}
function PyBadge() {
  const s = usePyStatus();
  if (s.status === "ready" && !s.note) return <span className="badge" style={{ color: C.grow, borderColor: "rgba(61,220,151,.4)" }}><CircleDot size={10} /> python ready</span>;
  if (s.status === "loading") return <span className="badge" style={{ color: C.charge }}><Loader2 size={10} style={{ animation: "np-spin 1s linear infinite" }} /> {s.note || "loading python…"}</span>;
  if (s.status === "error") return <span className="badge" style={{ color: C.heat }}>python unavailable — use Colab</span>;
  return <span className="badge">python loads on first run</span>;
}
function CodeRunner({ initial, onSave, height = 300 }) {
  const [code, setCode] = useState(initial);
  const [out, setOut] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const saveT = useRef(null);
  const change = (v) => { setCode(v); if (onSave) { clearTimeout(saveT.current); saveT.current = setTimeout(() => onSave(v), 900); } };
  const run = async () => {
    setBusy(true); setOut(null); setErr(null);
    try { const r = await runPython(code); setOut(r.out); setErr(r.err); }
    catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div className="row">
          <button className="btn run sm" onClick={run} disabled={busy}>{busy ? <><Loader2 size={13} style={{ animation: "np-spin 1s linear infinite" }}/>running…</> : <><Play size={13}/>run</>}</button>
          <button className="btn sm ghost" onClick={() => { setCode(initial); setOut(null); setErr(null); if (onSave) onSave(initial); }}><RotateCcw size={13}/>reset</button>
          <button className="btn sm ghost" onClick={() => { try { navigator.clipboard.writeText(code); } catch (e) {} }}><Copy size={13}/>copy</button>
          <a className="btn sm ghost" href="https://colab.research.google.com/" target="_blank" rel="noreferrer"><ExternalLink size={13}/>open Colab</a>
        </div>
        <PyBadge />
      </div>
      <CodeEditor value={code} onChange={change} height={height} />
      {(out !== null || err) && (
        <div className="out">{out}{err && <div className="err">{"\n"}{err}</div>}</div>
      )}
    </div>
  );
}
// ── auto-graded lab runner ───────────────────────────────────────────────────
function LabRunner({ topic, lab }) {
  const { data, up, addXp, toast, celebrate } = useNP();
  const saved = (data.topics[topic.id] || {}).labCode;
  const passed = (data.topics[topic.id] || {}).lab;
  const [code, setCode] = useState(saved || lab.starter);
  const [res, setRes] = useState(null); const [raw, setRaw] = useState(null); const [busy, setBusy] = useState(false);
  const [showSol, setShowSol] = useState(false); const [hintN, setHintN] = useState(0);
  const saveT = useRef(null);
  const change = (v) => { setCode(v); clearTimeout(saveT.current); saveT.current = setTimeout(() => up((d) => { d.topics[topic.id] = { ...(d.topics[topic.id] || {}), labCode: v }; }), 900); };
  const grade = async () => {
    setBusy(true); setRes(null); setRaw(null);
    try {
      const script = code + "\n\n" + GRADE_HARNESS + "\n" + lab.tests + "\n" + GRADE_TAIL;
      const r = await runPython(script);
      const line = (r.out || "").split("\n").find((l) => l.startsWith("NPGRADE::"));
      if (line) {
        const arr = JSON.parse(line.slice(9));
        setRes(arr);
        const allPass = arr.every((t) => t[1]);
        if (allPass && !passed) {
          up((d) => { d.topics[topic.id] = { ...(d.topics[topic.id] || {}), lab: true, status: "mastered" }; });
          addXp(lab.xp, "lab");
          celebrate("Lab passed — " + topic.title);
        } else if (allPass) toast("All tests green. Still got it.", "green");
      } else {
        setRaw((r.out || "") + (r.err ? "\n" + r.err : "") || "No output — did the code crash before the tests ran?");
      }
    } catch (e) { setRaw(String(e.message || e)); }
    setBusy(false);
  };
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge" style={{ color: C.charge, borderColor: "rgba(255,197,61,.4)" }}><Hammer size={11}/> auto-graded · +{lab.xp} XP</span>
          {passed && <span className="badge" style={{ color: C.grow, borderColor: "rgba(61,220,151,.4)" }}><Check size={11}/> passed</span>}
        </div>
        <PyBadge />
      </div>
      <div className="prose" style={{ marginBottom: 12, fontSize: 13.5 }}><MD text={lab.brief} /></div>
      <CodeEditor value={code} onChange={change} height={330} />
      <div className="row" style={{ margin: "10px 0" }}>
        <button className="btn run" onClick={grade} disabled={busy}>{busy ? <><Loader2 size={14} style={{ animation: "np-spin 1s linear infinite" }}/>grading…</> : <><ListChecks size={14}/>run hidden tests</>}</button>
        <button className="btn sm ghost" onClick={() => setHintN((h) => Math.min(h + 1, lab.hints.length))}>hint ({hintN}/{lab.hints.length})</button>
        <button className="btn sm ghost" onClick={() => setShowSol(!showSol)}>{showSol ? "hide solution" : "reveal solution"}</button>
      </div>
      {hintN > 0 && <div className="rec" style={{ marginBottom: 10 }}>{lab.hints.slice(0, hintN).map((h, i) => <div key={i} style={{ fontSize: 12.5, color: C.dim, margin: "3px 0" }}>◆ {h}</div>)}</div>}
      {res && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {res.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", borderRadius: 10, border: `1px solid ${t[1] ? "rgba(61,220,151,.4)" : "rgba(255,107,114,.4)"}`, background: t[1] ? "rgba(61,220,151,.05)" : "rgba(255,107,114,.05)" }}>
              {t[1] ? <Check size={15} color={C.grow} style={{ flex: "none", marginTop: 2 }} /> : <X size={15} color={C.heat} style={{ flex: "none", marginTop: 2 }} />}
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t[0]}</div>
                {!t[1] && t[2] && <div style={{ fontSize: 12, color: C.dim, fontFamily: "'JetBrains Mono',monospace" }}>{t[2]}</div>}</div>
            </div>
          ))}
          {res.every((t) => t[1]) && <div style={{ color: C.grow, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>✓ all tests passed — implementation verified.</div>}
        </div>
      )}
      {raw && <div className="out"><span className="err">{raw}</span></div>}
      {showSol && <div style={{ marginTop: 10 }}><div className="eyebrow" style={{ marginBottom: 6 }}>reference solution</div><CodeEditor value={lab.sol} readOnly height={200} /></div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON EXPERIENCE — multi-tab: intuition · math · visualize · code · lab · check
// ─────────────────────────────────────────────────────────────────────────────
const seenAwarded = new Set(); const playAwarded = new Set();
function QuizBlock({ quiz, onScore, scored }) {
  const [picks, setPicks] = useState({}); const [done, setDone] = useState(false);
  const submit = () => { setDone(true); const right = quiz.filter((q, i) => picks[i] === q.a).length; onScore(Math.round((right / quiz.length) * 100)); };
  const retry = () => { setPicks({}); setDone(false); };
  return (
    <div>
      {quiz.map((q, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14.5 }}><span style={{ color: C.faint, fontFamily: "'JetBrains Mono',monospace" }}>{String(i + 1).padStart(2, "0")} · </span>{q.q}</div>
          {q.o.map((opt, j) => {
            let cls = "quiz-opt";
            if (!done && picks[i] === j) cls += " pick";
            if (done && j === q.a) cls += " right";
            if (done && picks[i] === j && j !== q.a) cls += " wrong";
            return <div key={j} className={cls} onClick={() => !done && setPicks((p) => ({ ...p, [i]: j }))}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.faint, marginTop: 1 }}>{"ABCD"[j]}</span>
              <span style={{ fontSize: 13.5 }}>{opt}</span>
            </div>;
          })}
          {done && <div style={{ fontSize: 12.5, color: picks[i] === q.a ? C.grow : C.dim, marginTop: 4, paddingLeft: 4 }}>{picks[i] === q.a ? "✓ " : "→ "}{q.why}</div>}
        </div>
      ))}
      {!done
        ? <button className="btn pri" disabled={Object.keys(picks).length < quiz.length} onClick={submit}><ListChecks size={14}/>submit ({Object.keys(picks).length}/{quiz.length})</button>
        : <div className="row"><button className="btn" onClick={retry}><RotateCcw size={14}/>retry</button>{scored != null && <span className="badge" style={{ color: scored >= 70 ? C.grow : C.charge }}>best: {scored}%</span>}</div>}
    </div>
  );
}
const STAGE_FALLBACK_PLAY = ["gd", "kmeans", "nn", "attn", "rag", "agent", "nn"];
function LessonView() {
  const { data, up, addXp, nav, view, toast, celebrate, setTutor } = useNP();
  const topic = T_BY_ID[view.id]; const part = PART_BY_N[topic.part];
  const td = data.topics[topic.id] || {};
  const lesson = getLesson(topic, data);
  const lab = LABS[topic.title];
  const [tab, setTab] = useState("intuition");
  const [depth, setDepth] = useState("intu");
  const [genBusy, setGenBusy] = useState(false); const [genErr, setGenErr] = useState(null);
  useEffect(() => { setTab("intuition"); setGenErr(null); }, [view.id]);
  useEffect(() => {
    if (!td.status && !seenAwarded.has(topic.id)) {
      seenAwarded.add(topic.id);
      up((d) => { d.topics[topic.id] = { ...(d.topics[topic.id] || {}), status: "seen" }; });
      addXp(5, "concept");
    }
  }, [topic.id]);
  const doGen = async () => {
    setGenBusy(true); setGenErr(null);
    try { const L = await genLesson(topic); up((d) => { d.gen[topic.id] = L; }); toast("Lesson generated & cached — it's yours now.", "green"); }
    catch (e) { setGenErr(String(e.message || e)); }
    setGenBusy(false);
  };
  const onScore = (pct) => {
    up((d) => {
      const t = d.topics[topic.id] = { ...(d.topics[topic.id] || {}) };
      t.qb = Math.max(t.qb || 0, pct);
      if (pct >= 70 && (!t.status || t.status === "seen")) t.status = "done";
      if (pct === 100) t.status = t.lab || !lab ? "mastered" : t.status;
    });
    if (pct >= 70) addXp(20, "quiz");
    if (pct === 100) celebrate("Perfect check — " + topic.title);
    up((d) => { if (pct > (d.records.quiz || 0)) d.records.quiz = pct; });
  };
  const playKey = (lesson && lesson.play) || PLAY_HINTS[topic.title];
  const idx = part.list.indexOf(topic.title);
  const prevT = idx > 0 ? T_BY_ID[part.n + "-" + (idx - 1)] : null;
  const nextT = idx < part.list.length - 1 ? T_BY_ID[part.n + "-" + (idx + 1)] : null;
  const prereqsWeak = (PREREQ[part.n] || []).filter((p) => partMastery(PART_BY_N[p], data) < 0.25);
  const statusScore = td.status === "mastered" ? 1 : td.status === "done" ? 0.66 : td.status === "seen" ? 0.33 : 0;
  const TABS = [
    ["intuition", "Intuition", BookOpen], ["math", "Math", Braces], ["visualize", "Visualize", Eye],
    ["code", "Code", TerminalSquare], ...(lab ? [["lab", "Lab", Hammer]] : []),
    ["check", "Check", ListChecks], ["deeper", "Go deeper", Compass],
  ];
  const PG = playKey && PLAYGROUNDS[playKey];
  const FB = PLAYGROUNDS[STAGE_FALLBACK_PLAY[topic.stage]];
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <div className="eyebrow" style={{ color: STAGE_HUES[topic.stage] }}>
          <span role="button" style={{ cursor: "pointer" }} onClick={() => nav({ name: "curriculum", part: part.n })}>Part {part.n} · {part.name}</span>
          <span style={{ color: C.faint }}> · Stage {STAGES[topic.stage].roman}</span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {prevT && <button className="btn sm ghost" onClick={() => nav({ name: "lesson", id: prevT.id })}><ChevronLeft size={14}/>{prevT.title.slice(0, 18)}</button>}
          {nextT && <button className="btn sm" onClick={() => nav({ name: "lesson", id: nextT.id })}>{nextT.title.slice(0, 20)}<ChevronRight size={14}/></button>}
        </div>
      </div>
      <h1 style={{ fontSize: 26, margin: "2px 0 10px" }}>{topic.title}</h1>
      <div className="row" style={{ gap: 10, marginBottom: 10 }}>
        <span className="badge">{estMin(topic)} min</span>
        <span className="badge" style={{ color: td.status ? (td.status === "mastered" ? C.grow : C.charge) : C.dim }}>{td.status || "new"}</span>
        {td.qb != null && <span className="badge">check {td.qb}%</span>}
        {td.lab && <span className="badge" style={{ color: C.grow }}>lab ✓</span>}
        {FLAGSHIP[topic.title] && <span className="badge" style={{ color: C.signal, borderColor: "rgba(91,140,255,.4)" }}>flagship</span>}
        <button className="btn sm ghost" onClick={() => setTutor({ open: true })}><MessageCircle size={13}/>ask the tutor</button>
      </div>
      <div style={{ maxWidth: 300, marginBottom: 16 }}><Spectrum pct={statusScore} /></div>
      {prereqsWeak.length > 0 && (
        <div className="lock-note" style={{ marginBottom: 16 }}>
          <Lock size={14} /> Recommended first:&nbsp;
          {prereqsWeak.map((p, i) => <span key={p}><a style={{ cursor: "pointer" }} onClick={() => nav({ name: "curriculum", part: p })}>Part {p} — {PART_BY_N[p].name}</a>{i < prereqsWeak.length - 1 ? ", " : ""}</span>)}
          &nbsp;— but the door is open if you want in anyway.
        </div>
      )}
      <div className="tabbar" style={{ marginBottom: 20 }}>
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}><Icon size={13} />{label}</button>
        ))}
      </div>

      {!lesson && tab !== "visualize" && tab !== "code" && (
        <div className="card" style={{ textAlign: "center", padding: 34 }}>
          <Sparkles size={26} color={C.signal} style={{ margin: "0 auto 10px" }} />
          <div className="disp" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>This node is waiting for you</div>
          <div style={{ color: C.dim, maxWidth: 480, margin: "0 auto 16px", fontSize: 13.5 }}>
            The full map ships with {Object.keys(FLAGSHIP).length} hand-built flagship lessons; the other {N_TOPICS - Object.keys(FLAGSHIP).length} nodes are generated on demand — theory at three depths, math, runnable code, a check, and flashcards — then cached to your progress forever.
          </div>
          <button className="btn pri" onClick={doGen} disabled={genBusy}>{genBusy ? <><Loader2 size={14} style={{ animation: "np-spin 1s linear infinite" }}/>generating…</> : <><Sparkles size={14}/>generate this lesson</>}</button>
          {genErr && <div style={{ color: C.heat, fontSize: 12.5, marginTop: 10, maxWidth: 520, margin: '10px auto 0' }}>{genErr}</div>}
        </div>
      )}

      {lesson && tab === "intuition" && (
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            {[["eli5", "ELI5"], ["intu", "Intuitive"], ["rig", "Rigorous"]].map(([k, l]) => (
              <span key={k} className={"chip" + (depth === k ? " on" : "")} role="button" onClick={() => setDepth(k)}>{l}</span>
            ))}
          </div>
          <div className="prose" style={{ fontSize: 14.5, maxWidth: 720 }}><p>{lesson[depth]}</p></div>
          {lesson.gen && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8 }}>AI-generated micro-lesson · cached to your library · verify anything surprising against the Go-deeper sources.</div>}
        </div>
      )}
      {lesson && tab === "math" && (
        <div className="card">
          {(lesson.math || []).length ? lesson.math.map((m, i) => (
            <div key={i} style={{ marginBottom: 22 }}>
              <div style={{ padding: "14px 10px", background: C.void, borderRadius: 12, border: `1px solid var(--line)`, overflowX: "auto" }}><Tex tex={m.t} block /></div>
              <div style={{ fontSize: 13, color: C.dim, marginTop: 8, paddingLeft: 4 }}>◆ {m.n}</div>
            </div>
          )) : <div style={{ color: C.dim }}>No formal math for this node — the intuition and code tabs carry it.</div>}
        </div>
      )}
      {tab === "visualize" && (
        <div>
          {PG ? <PG.comp /> : (
            <div>
              <div className="lock-note" style={{ marginBottom: 14 }}><Eye size={14} /> No dedicated playground for this node yet — here's the nearest one in spirit. All 13 live in the <a style={{ cursor: "pointer" }} onClick={() => nav({ name: "playgrounds" })}>Playgrounds hub</a>.</div>
              <FB.comp />
            </div>
          )}
        </div>
      )}
      {tab === "code" && (
        <div className="card">
          <CodeRunner key={topic.id} initial={td.code || (lesson && lesson.code) || DEFAULT_CODE(topic)}
            onSave={(v) => up((d) => { d.topics[topic.id] = { ...(d.topics[topic.id] || {}), code: v }; })} />
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10 }}>Runs in-browser via Pyodide (standard library + numpy). Heavy training — PyTorch, GPUs, real datasets — belongs in Colab: copy the code across with the button above. Your edits auto-save per lesson.</div>
        </div>
      )}
      {lab && tab === "lab" && <div className="card"><LabRunner topic={topic} lab={lab} /></div>}
      {lesson && tab === "check" && (
        <div className="card">
          {(lesson.quiz || []).length
            ? <QuizBlock key={topic.id} quiz={lesson.quiz} onScore={onScore} scored={td.qb} />
            : <div style={{ color: C.dim }}>No check generated for this node.</div>}
          {(lesson.cards || []).length > 0 && <div style={{ fontSize: 12, color: C.faint, marginTop: 16, borderTop: `1px solid var(--line)`, paddingTop: 12 }}>
            <Layers size={12} style={{ verticalAlign: -2 }} /> {lesson.cards.length} flashcards from this lesson feed your spaced-repetition deck once the node is opened. Review them in <a style={{ cursor: "pointer" }} onClick={() => nav({ name: "cards" })}>Review</a>.
          </div>}
        </div>
      )}
      {tab === "deeper" && (
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 10 }}>curated sources</div>
          {((lesson && lesson.links) || [["Search arXiv for this topic", "https://arxiv.org/list/cs.LG/recent"], ["Dive into Deep Learning (free book)", "https://d2l.ai/"]]).map(([l, u], i) => (
            <div key={i} style={{ marginBottom: 8 }}><a href={u} target="_blank" rel="noreferrer"><ExternalLink size={12} style={{ verticalAlign: -1 }} /> {l}</a></div>
          ))}
          <div className="rec" style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ color: C.charge }}>reproduce-it challenge</div>
            <div style={{ fontSize: 13.5, marginTop: 6, color: C.dim }}>
              {FLAGSHIP[topic.title]
                ? "Re-implement this lesson's core algorithm from a blank file — no peeking — then diff against the reference. If you can rebuild it, you own it."
                : "Find the canonical paper for this topic in the Papers room (or arXiv), read only the abstract and figures, and try to predict the method before reading Section 3. Then check."}
            </div>
          </div>
          <button className="btn" style={{ marginTop: 14 }} onClick={() => setTutor({ open: true, seed: `Give me one harder exercise about "${topic.title}" and wait for my answer before revealing the solution.` })}><Bot size={14}/>get an exercise from the tutor</button>
        </div>
      )}
    </div>
  );
}

// ── mastery helpers ──────────────────────────────────────────────────────────
function topicScore(td) { if (!td || !td.status) return 0; return td.status === "mastered" ? 1 : td.status === "done" ? 0.66 : 0.33; }
function partMastery(part, data) {
  let s = 0; part.list.forEach((_, i) => { s += topicScore(data.topics[part.n + "-" + i]); });
  return s / part.list.length;
}

// ── spaced repetition ────────────────────────────────────────────────────────
function collectCards(data) {
  const out = [];
  ALL_TOPICS.forEach((t) => {
    const td = data.topics[t.id]; if (!td || !td.status) return;
    const L = getLesson(t, data); if (!L || !L.cards) return;
    L.cards.forEach((c, i) => out.push({ id: t.id + ":" + i, f: c[0], b: c[1], topic: t }));
  });
  return out;
}
function CardsView() {
  const { data, up, addXp, toast } = useNP();
  const today = todayStr();
  const all = useMemo(() => collectCards(data), [data.topics, data.gen]);
  const due = useMemo(() => all.filter((c) => { const s = data.srs[c.id]; return !s || s.due <= today; }), [all, data.srs]);
  const [queue, setQueue] = useState(null); const [flip, setFlip] = useState(false); const [doneN, setDoneN] = useState(0);
  const start = () => { const q = [...due]; for (let i = q.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [q[i], q[j]] = [q[j], q[i]]; } setQueue(q.slice(0, 30)); setFlip(false); setDoneN(0); };
  const rate = (g) => {
    const card = queue[0];
    up((d) => {
      const st = d.srs[card.id] || { iv: 0, ease: 2.3 };
      let iv, ease = st.ease;
      if (g === 0) { iv = 0; ease = Math.max(1.3, ease - 0.2); }
      else if (g === 1) { iv = Math.max(1, Math.round((st.iv || 1) * 1.2)); ease = Math.max(1.3, ease - 0.15); }
      else if (g === 2) { iv = Math.max(1, Math.round((st.iv || 1) * ease)); }
      else { iv = Math.max(2, Math.round((st.iv || 1) * ease * 1.4)); ease = Math.min(3, ease + 0.1); }
      d.srs[card.id] = { iv, ease, due: dateAdd(today, iv || 0) };
    });
    addXp(2, "card");
    setQueue((q) => (g === 0 ? [...q.slice(1), card] : q.slice(1)));
    setFlip(false); setDoneN((n) => n + (g === 0 ? 0 : 1));
  };
  if (queue && queue.length === 0) {
    return <div className="card" style={{ textAlign: "center", padding: 40 }}>
      <Trophy size={30} color={C.charge} style={{ margin: "0 auto 10px" }} />
      <div className="disp" style={{ fontSize: 20, fontWeight: 700 }}>Session complete</div>
      <div style={{ color: C.dim, margin: "6px 0 16px" }}>{doneN} cards reviewed · intervals rescheduled · +{doneN * 2} XP</div>
      <button className="btn" onClick={() => setQueue(null)}>back</button>
    </div>;
  }
  if (queue) {
    const card = queue[0];
    return <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <span className="eyebrow">reviewing · {queue.length} left</span>
        <span className="badge">{card.topic.title}</span>
      </div>
      <div className="flash-card" onClick={() => setFlip(!flip)}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10, color: flip ? C.grow : C.signal }}>{flip ? "answer" : "prompt — tap to flip"}</div>
          <div style={{ fontSize: flip ? 15 : 17, lineHeight: 1.6 }}>{flip ? card.b : card.f}</div>
        </div>
      </div>
      {flip && <div className="row" style={{ marginTop: 14, justifyContent: "center" }}>
        {[["again", C.heat, 0], ["hard", C.charge, 1], ["good", C.signal, 2], ["easy", C.grow, 3]].map(([l, col, g]) => (
          <button key={l} className="btn" style={{ borderColor: col, color: col }} onClick={() => rate(g)}>{l}</button>
        ))}
      </div>}
    </div>;
  }
  const upcoming = all.length - due.length;
  return <div>
    <Eyebrow>spaced repetition</Eyebrow>
    <h1 style={{ fontSize: 24, margin: "4px 0 14px" }}>Review deck</h1>
    <div className="grid3" style={{ marginBottom: 18 }}>
      <div className="card"><div className="eyebrow">due now</div><div className="statv" style={{ color: due.length ? C.charge : C.grow }}>{due.length}</div></div>
      <div className="card"><div className="eyebrow">scheduled later</div><div className="statv">{upcoming}</div></div>
      <div className="card"><div className="eyebrow">total in deck</div><div className="statv">{all.length}</div></div>
    </div>
    {all.length === 0
      ? <div className="card" style={{ color: C.dim }}>Your deck fills itself: every lesson you open contributes its key definitions and formulas. Open a few flagship lessons and come back.</div>
      : due.length === 0
        ? <div className="card" style={{ color: C.grow }}>✓ Nothing due. The forgetting curve has been fought and beaten — for today.</div>
        : <button className="btn pri" onClick={start}><Layers size={15}/>review {Math.min(30, due.length)} due cards</button>}
  </div>;
}

// ── AI tutor drawer ──────────────────────────────────────────────────────────
function TutorDrawer() {
  const { data, up, tutor, setTutor, view, toast } = useNP();
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const thread = data.tutor || [];
  useEffect(() => { if (tutor.seed) { setInput(tutor.seed); setTutor({ open: true }); } }, [tutor.seed]);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [thread.length, busy]);
  if (!tutor.open) return null;
  const locTopic = view.name === "lesson" ? T_BY_ID[view.id] : null;
  const location = locTopic ? `the lesson "${locTopic.title}" (Part ${locTopic.part}: ${locTopic.partName})` : `the ${view.name} screen`;
  const send = async (text) => {
    const msg = (text || input).trim(); if (!msg || busy) return;
    setInput(""); setBusy(true);
    up((d) => { d.tutor = [...(d.tutor || []), { r: "user", c: msg }].slice(-40); });
    try {
      const savedCode = locTopic && data.topics[locTopic.id] && data.topics[locTopic.id].code;
      const sys = `You are the NeuralPath Tutor — a warm, rigorous AI/ML mentor embedded in a learning platform. The learner is currently at: ${location}.${savedCode ? ` Their current code editor for this lesson contains:\n\`\`\`python\n${savedCode.slice(0, 1500)}\n\`\`\`` : ""}\nGround explanations in their location. Prefer concrete tiny-number examples and runnable pure-Python snippets. Use markdown lightly (bold, \`code\`, short lists). Keep answers under 220 words unless deriving math step-by-step. When quizzing, be Socratic: ONE question, then wait.`;
      const msgs = [...thread, { r: "user", c: msg }].slice(-12).map((m) => ({ role: m.r === "user" ? "user" : "assistant", content: m.c }));
      const txt = await askClaude(msgs, sys, 1000);
      up((d) => { d.tutor = [...(d.tutor || []), { r: "a", c: txt }].slice(-40); });
    } catch (e) {
      up((d) => { d.tutor = [...(d.tutor || []), { r: "a", c: "⚠ " + (e.message || e) + " — the tutor needs the Claude artifact environment." }].slice(-40); });
    }
    setBusy(false);
  };
  const chips = [
    ["Explain simpler", `Explain ${locTopic ? `"${locTopic.title}"` : "what I'm looking at"} again, one level simpler, with an everyday analogy.`],
    ["Go deeper", `Take ${locTopic ? `"${locTopic.title}"` : "this topic"} one level deeper — the version a researcher would tell me.`],
    ["Quiz me", `Quiz me Socratically on ${locTopic ? `"${locTopic.title}"` : "what I've been studying"}. One question at a time.`],
    ["Review my code", "Review the code in my editor: find bugs, explain fixes, suggest one idiomatic improvement."],
    ["Walk the math", `Walk me through the key equation of ${locTopic ? `"${locTopic.title}"` : "this topic"} symbol by symbol, with a tiny numeric example.`],
  ];
  return (
    <div className="drawer" role="dialog" aria-label="AI tutor">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid var(--line)` }}>
        <div><div className="disp" style={{ fontSize: 14, fontWeight: 700 }}><Bot size={15} style={{ verticalAlign: -2 }} /> Tutor</div>
          <div style={{ fontSize: 11, color: C.faint }}>context-aware · {locTopic ? locTopic.title : view.name}</div></div>
        <div className="row">
          <button className="btn sm ghost" onClick={() => up((d) => { d.tutor = []; })}>clear</button>
          <button className="btn sm ghost" onClick={() => setTutor({ open: false })}><X size={15} /></button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {thread.length === 0 && <div style={{ color: C.faint, fontSize: 13 }}>I can re-explain at any depth, walk math line by line, debug your lesson code, generate exercises, or quiz you Socratically. I always know where you are in the curriculum.</div>}
        {thread.map((m, i) => <div key={i} className={"msg " + (m.r === "user" ? "u" : "a")}>{m.r === "user" ? m.c : <MD text={m.c} />}</div>)}
        {busy && <div className="msg a" style={{ color: C.dim }}><Loader2 size={13} style={{ animation: "np-spin 1s linear infinite", verticalAlign: -2 }} /> thinking…</div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 12, borderTop: `1px solid var(--line)` }}>
        <div className="row" style={{ gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
          {chips.map(([l, p]) => <span key={l} className="chip" role="button" onClick={() => send(p)}>{l}</span>)}
        </div>
        <div className="row">
          <input type="text" value={input} placeholder="ask anything…" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="btn pri" onClick={() => send()} disabled={busy}><Send size={14} /></button>
        </div>
      </div>
    </div>
  );
}

// ── papers room ──────────────────────────────────────────────────────────────
function PapersView() {
  const { data, up, nav, toast } = useNP();
  const [open, setOpen] = useState(null); const [busy, setBusy] = useState(false);
  const explain = async (i) => {
    setOpen(i);
    if (data.gen["paper:" + i]) return;
    setBusy(true);
    try {
      const p = PAPERS[i];
      const sys = "You are NeuralPath's paper explainer. For the given landmark ML paper produce, in light markdown under 260 words: **The one-sentence idea**, **Why it mattered**, **How it works** (3 short bullets, honest about the mechanism), **Two jargon terms, defined**, and **Reproduce-it-this-weekend** (a realistic toy-scale reproduction suggestion).";
      const txt = await askClaude([{ role: "user", content: `Paper: "${p.t}" (${p.a}, ${p.y}).` }], sys, 1000);
      up((d) => { d.gen["paper:" + i] = txt; });
    } catch (e) { toast(String(e.message || e), "gold"); }
    setBusy(false);
  };
  return (
    <div>
      <Eyebrow>reading room</Eyebrow>
      <h1 style={{ fontSize: 24, margin: "4px 0 6px" }}>18 papers that built the field</h1>
      <div style={{ color: C.dim, fontSize: 13.5, marginBottom: 18, maxWidth: 640 }}>Chronological spine of modern AI. Read them in order and you can feel the field learning. Each links to the source; the explainer breaks it down and hands you a weekend reproduction.</div>
      <div className="grid2">
        {PAPERS.map((p, i) => (
          <div key={i} className="card hov" onClick={() => explain(i)}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <span className="badge" style={{ color: STAGE_HUES[PART_BY_N[p.part].s] }}>{p.y}</span>
              <span className="badge" role="button" onClick={(e) => { e.stopPropagation(); nav({ name: "curriculum", part: p.part }); }}>Part {p.part}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.t}</div>
            <div style={{ fontSize: 12, color: C.faint, marginBottom: 6 }}>{p.a}</div>
            <div style={{ fontSize: 12.5, color: C.dim }}>{p.why}</div>
          </div>
        ))}
      </div>
      <Modal open={open != null} onClose={() => setOpen(null)}>
        {open != null && <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <div className="disp" style={{ fontSize: 16, fontWeight: 700, paddingRight: 20 }}>{PAPERS[open].t}</div>
            <button className="btn sm ghost" onClick={() => setOpen(null)}><X size={15} /></button>
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <a className="btn sm" href={PAPERS[open].url} target="_blank" rel="noreferrer"><ExternalLink size={13}/>read the paper</a>
          </div>
          {busy && !data.gen["paper:" + open] ? <div style={{ color: C.dim }}><Loader2 size={14} style={{ animation: "np-spin 1s linear infinite", verticalAlign: -2 }} /> distilling…</div>
            : data.gen["paper:" + open] ? <div className="mm" style={{ fontSize: 13.5 }}><MD text={data.gen["paper:" + open]} /></div>
              : <div style={{ color: C.dim, fontSize: 13 }}>Couldn't generate the explainer — the AI features need the Claude artifact environment. The paper link above still works.</div>}
        </div>}
      </Modal>
    </div>
  );
}

// ── glossary ─────────────────────────────────────────────────────────────────
function GlossaryView() {
  const { data, up, nav, toast } = useNP();
  const [q, setQ] = useState(""); const [busyTerm, setBusyTerm] = useState(null);
  const entries = useMemo(() => {
    const seen = new Set(); const out = [];
    Object.keys(GLOSS).forEach((k) => { seen.add(k.toLowerCase()); out.push({ term: k, def: GLOSS[k], topic: T_BY_TITLE[k] }); });
    ALL_TOPICS.forEach((t) => { if (!seen.has(t.title.toLowerCase())) { seen.add(t.title.toLowerCase()); out.push({ term: t.title, def: data.glossGen[t.title] || null, topic: t }); } });
    return out.sort((a, b) => a.term.localeCompare(b.term));
  }, [data.glossGen]);
  const filtered = entries.filter((e) => e.term.toLowerCase().includes(q.toLowerCase()) || (e.def || "").toLowerCase().includes(q.toLowerCase()));
  const define = async (term) => {
    setBusyTerm(term);
    try {
      const txt = await askClaude([{ role: "user", content: `Define "${term}" (an AI/ML curriculum topic) in ONE precise sentence a motivated beginner can grasp. No preamble.` }], "You write razor-sharp one-line technical definitions.", 200);
      up((d) => { d.glossGen[term] = txt.trim(); });
    } catch (e) { toast(String(e.message || e), "gold"); }
    setBusyTerm(null);
  };
  return (
    <div>
      <Eyebrow>encyclopedia</Eyebrow>
      <h1 style={{ fontSize: 24, margin: "4px 0 12px" }}>Glossary — {entries.length} concepts</h1>
      <div style={{ position: "relative", maxWidth: 460, marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: C.faint }} />
        <input type="text" placeholder="search every concept in the curriculum…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.slice(0, 40).map((e) => (
          <div key={e.term} className="trow" style={{ cursor: "default", alignItems: "flex-start" }}>
            <div style={{ minWidth: 200, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: C.ink }}>{e.term}</div>
            <div style={{ flex: 1, fontSize: 13, color: C.dim }}>
              {e.def || (busyTerm === e.term ? <span><Loader2 size={12} style={{ animation: "np-spin 1s linear infinite", verticalAlign: -2 }} /> defining…</span>
                : <span className="chip" role="button" onClick={() => define(e.term)}><Sparkles size={11}/>define with AI</span>)}
            </div>
            {e.topic && <span className="chip" role="button" onClick={() => nav({ name: "lesson", id: e.topic.id })}>lesson →</span>}
          </div>
        ))}
        {filtered.length > 40 && <div style={{ color: C.faint, fontSize: 12, padding: 8 }}>+ {filtered.length - 40} more — keep typing to narrow.</div>}
        {filtered.length === 0 && <div style={{ color: C.faint, padding: 8 }}>Nothing matches "{q}".</div>}
      </div>
    </div>
  );
}

// ── playgrounds hub ──────────────────────────────────────────────────────────
function PlaygroundsView() {
  const { view, nav, addXp } = useNP();
  const id = view.id;
  useEffect(() => {
    if (id && !playAwarded.has(id)) { playAwarded.add(id); addXp(3, "play"); }
  }, [id]);
  if (id && PLAYGROUNDS[id]) {
    const PG = PLAYGROUNDS[id];
    const related = ALL_TOPICS.filter((t) => (FLAGSHIP[t.title] && FLAGSHIP[t.title].play === id) || PLAY_HINTS[t.title] === id).slice(0, 4);
    return <div>
      <button className="btn sm ghost" style={{ marginBottom: 14 }} onClick={() => nav({ name: "playgrounds" })}><ChevronLeft size={14}/>all playgrounds</button>
      <PG.comp />
      {related.length > 0 && <div style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>lessons that use this playground</div>
        <div className="row">{related.map((t) => <span key={t.id} className="chip" role="button" onClick={() => nav({ name: "lesson", id: t.id })}>{t.title}</span>)}</div>
      </div>}
    </div>;
  }
  return <div>
    <Eyebrow>interactive laboratory</Eyebrow>
    <h1 style={{ fontSize: 24, margin: "4px 0 6px" }}>13 concept playgrounds</h1>
    <div style={{ color: C.dim, fontSize: 13.5, marginBottom: 18, maxWidth: 620 }}>Nothing here is a video. Every one is the real algorithm running in your browser — training, converging, sometimes diverging, under your fingers. Two of them call a live model.</div>
    <div className="grid3">
      {Object.entries(PLAYGROUNDS).map(([k, p]) => (
        <div key={k} className="card hov" onClick={() => nav({ name: "playgrounds", id: k })}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <FlaskConical size={16} color={C.signal} />
            <span className="badge">{p.tag}</span>
          </div>
          <div className="disp" style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 5 }}>{p.name}</div>
          <div style={{ fontSize: 12.5, color: C.dim }}>{p.desc}</div>
        </div>
      ))}
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD — mission control: records, heatmap, streaks, the 3-D constellation
// ─────────────────────────────────────────────────────────────────────────────
function Hero3D() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let renderer = null, raf = 0, alive = true;
    try {
      const Wd = el.clientWidth || 620, H = el.clientHeight || 200;
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(Wd, H); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(46, Wd / H, 0.1, 100); cam.position.set(0, 0, 7.6);
      const group = new THREE.Group(); scene.add(group);
      const R = mulberry32(7); const nodes = [];
      [[-3.1, 5], [-1.05, 7], [1.05, 7], [3.1, 4]].forEach(([x, n], li) => {
        for (let i = 0; i < n; i++) nodes.push({ x, y: (i - (n - 1) / 2) * 0.74, z: (R() * 2 - 1) * 0.9, l: li });
      });
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.Float32BufferAttribute(nodes.flatMap((n) => [n.x, n.y, n.z]), 3));
      group.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x5b8cff, size: 0.17, transparent: true, opacity: 0.95 })));
      const gGeo = new THREE.BufferGeometry();
      const golds = nodes.filter((_, i) => i % 4 === 0);
      gGeo.setAttribute("position", new THREE.Float32BufferAttribute(golds.flatMap((n) => [n.x, n.y, n.z]), 3));
      const gMat = new THREE.PointsMaterial({ color: 0xffc53d, size: 0.22, transparent: true, opacity: 0.8 });
      group.add(new THREE.Points(gGeo, gMat));
      const linePos = [];
      nodes.forEach((a) => nodes.forEach((b) => { if (b.l === a.l + 1 && R() < 0.55) linePos.push(a.x, a.y, a.z, b.x, b.y, b.z); }));
      const lGeo = new THREE.BufferGeometry();
      lGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
      const lMat = new THREE.LineBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.13 });
      group.add(new THREE.LineSegments(lGeo, lMat));
      const t0 = Date.now();
      const loop = () => {
        if (!alive) return;
        const t = (Date.now() - t0) / 1000;
        group.rotation.y = Math.sin(t * 0.15) * 0.55;
        group.rotation.x = Math.sin(t * 0.1) * 0.13;
        lMat.opacity = 0.1 + 0.08 * (0.5 + 0.5 * Math.sin(t * 1.3));
        gMat.opacity = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.1));
        renderer.render(scene, cam);
        raf = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { /* WebGL unavailable — hero simply stays quiet */ }
    return () => { alive = false; cancelAnimationFrame(raf); try { if (renderer) { renderer.dispose(); if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); } } catch (e) {} };
  }, []);
  return <div ref={ref} style={{ position: "absolute", inset: 0, opacity: 0.85, pointerEvents: "none" }} aria-hidden />;
}
const levelOf = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 60)) + 1;
const liveStreak = (d) => { if (!d.streak.last) return 0; const diff = dayDiff(d.streak.last, todayStr()); return diff <= 1 ? d.streak.count : 0; };
function Dashboard() {
  const { data, up, addXp, nav, celebrate, setTutor } = useNP();
  const t = todayStr(); const day = data.days[t] || { x: 0, c: 0, q: 0, l: 0, cd: 0, p: 0 };
  const mastered = Object.values(data.topics).filter((v) => v.status === "mastered").length;
  const explored = Object.values(data.topics).filter((v) => v.status).length;
  const lvl = levelOf(data.xp); const nextAt = 60 * lvl * lvl; const prevAt = 60 * (lvl - 1) * (lvl - 1);
  const lane = LANES.find((l) => l.id === data.profile.lane) || LANES[0];
  const laneProg = lane.parts.reduce((s, pn) => s + partMastery(PART_BY_N[pn], data), 0) / lane.parts.length;
  const nextTopic = useMemo(() => {
    for (const pn of lane.parts) { const p = PART_BY_N[pn]; for (let i = 0; i < p.list.length; i++) { const td = data.topics[pn + "-" + i]; if (!td || !td.status || td.status === "seen") return T_BY_ID[pn + "-" + i]; } }
    return ALL_TOPICS[0];
  }, [data.topics, lane]);
  const allCards = useMemo(() => collectCards(data), [data.topics, data.gen]);
  const dueN = allCards.filter((c) => { const s = data.srs[c.id]; return !s || s.due <= t; }).length;
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const pgKeys = Object.keys(PLAYGROUNDS); const pgDay = pgKeys[doy % pgKeys.length];
  const mission = [
    { icon: BookOpen, label: `Continue: ${nextTopic.title}`, done: day.c > 0, act: () => nav({ name: "lesson", id: nextTopic.id }) },
    { icon: Layers, label: dueN > 0 ? `Review ${Math.min(dueN, 30)} due cards` : "Review deck (all clear)", done: dueN === 0 || day.cd > 0, act: () => nav({ name: "cards" }) },
    { icon: FlaskConical, label: `Playground of the day: ${PLAYGROUNDS[pgDay].name}`, done: (day.p || 0) > 0, act: () => nav({ name: "playgrounds", id: pgDay }) },
  ];
  useEffect(() => {
    if (mission.every((m) => m.done) && data.missionDone !== t && (day.x || 0) > 0) {
      up((d) => { d.missionDone = t; });
      addXp(15, "mission");
      celebrate("Daily mission complete");
    }
  }, [day.c, day.cd, day.p, dueN]);
  const chart = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) { const ds = dateAdd(t, -i); const dd = data.days[ds] || {}; out.push({ d: ds.slice(5), xp: dd.x || 0, concepts: dd.c || 0 }); }
    return out;
  }, [data.days, t]);
  const recs = [
    ["Longest streak", (data.records.streak || 0) + "d", liveStreak(data) + "d live"],
    ["Best XP day", data.records.day_x || 0, day.x + " today"],
    ["Concepts / day", data.records.day_c || 0, day.c + " today"],
    ["Best check", (data.records.quiz || 0) + "%", "—"],
    ["Labs passed", data.records.labs || 0, "all-time"],
    ["NeuralPath score", data.xp + mastered * 10, "xp + mastery"],
  ];
  return (
    <div>
      <div className="card" style={{ position: "relative", overflow: "hidden", marginBottom: 16, minHeight: 200, background: "var(--hero-grad)" }}>
        <Hero3D />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 520 }}>
          <Eyebrow color={C.signal}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</Eyebrow>
          <h1 style={{ fontSize: 26, margin: "6px 0 8px" }}>{data.profile.name ? `${data.profile.name} —` : ""} beat yesterday's you.</h1>
          <div style={{ color: C.dim, fontSize: 13.5, marginBottom: 14 }}>
            {explored === 0 ? "The map is dark and enormous. Light the first node." :
              `${explored} of ${N_TOPICS} nodes lit · ${mastered} mastered · the ${lane.name} lane is ${(laneProg * 100).toFixed(0)}% complete.`}
          </div>
          <div className="row">
            <button className="btn pri" onClick={() => nav({ name: "lesson", id: (data.lastLesson && T_BY_ID[data.lastLesson]) ? data.lastLesson : nextTopic.id })}><Play size={14} />{data.lastLesson ? "resume" : "start"} learning</button>
            <button className="btn" onClick={() => setTutor({ open: true })}><Bot size={14} />tutor</button>
          </div>
        </div>
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <Eyebrow color={C.charge}>today's mission</Eyebrow>
            <span className="badge" style={{ color: C.charge }}>+15 XP on sweep</span>
          </div>
          {mission.map((m, i) => (
            <div key={i} className="trow" onClick={m.act} style={{ opacity: m.done ? 0.62 : 1 }}>
              {m.done ? <Check size={16} color={C.grow} /> : <m.icon size={16} color={C.signal} />}
              <span style={{ fontSize: 13.5, textDecoration: m.done ? "line-through" : "none" }}>{m.label}</span>
              <ChevronRight size={14} color={C.faint} style={{ marginLeft: "auto" }} />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <Eyebrow>operator status</Eyebrow>
            <span className="badge" style={{ color: C.charge }}><Flame size={11} /> {liveStreak(data)}-day streak</span>
          </div>
          <div className="row" style={{ gap: 18, marginBottom: 10 }}>
            <div><div className="statv" style={{ color: C.signal }}>L{lvl}</div><div style={{ fontSize: 11, color: C.faint }}>level</div></div>
            <div><div className="statv">{data.xp}</div><div style={{ fontSize: 11, color: C.faint }}>total XP</div></div>
            <div><div className="statv" style={{ color: C.grow }}>{mastered}</div><div style={{ fontSize: 11, color: C.faint }}>mastered</div></div>
            <div><div className="statv">{data.records.labs || 0}</div><div style={{ fontSize: 11, color: C.faint }}>labs</div></div>
          </div>
          <div style={{ fontSize: 11, color: C.faint, marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>{data.xp - prevAt} / {nextAt - prevAt} to L{lvl + 1}</div>
          <div style={{ height: 7, borderRadius: 99, background: C.panel3, overflow: "hidden" }}>
            <div style={{ width: `${clamp((data.xp - prevAt) / (nextAt - prevAt), 0, 1) * 100}%`, height: "100%", background: `linear-gradient(90deg, var(--signal), var(--charge))`, transition: "width .5s" }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <Eyebrow color={C.charge}><Trophy size={11} style={{ verticalAlign: -1 }} /> personal records — beat them</Eyebrow>
        </div>
        <div className="grid3">
          {recs.map(([l, best, sub]) => (
            <div key={l} className="rec">
              <div style={{ fontSize: 11, color: C.faint, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em" }}>{l}</div>
              <div className="best" style={{ fontSize: 22 }}>{best}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <div className="card">
          <Eyebrow>14-day signal</Eyebrow>
          <div style={{ height: 190, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="rgba(140,160,220,.08)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: C.faint, fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} />
                <RTip contentStyle={{ background: C.panel2, border: `1px solid var(--line2)`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: C.dim }} />
                <Area type="monotone" dataKey="xp" stroke={C.signal} fill="rgba(91,140,255,.18)" strokeWidth={2} name="XP" />
                <Area type="monotone" dataKey="concepts" stroke={C.grow} fill="rgba(61,220,151,.1)" strokeWidth={1.6} name="concepts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <Eyebrow>{lane.icon} {lane.name} lane</Eyebrow>
            <span className="chip" role="button" onClick={() => nav({ name: "lanes" })}>change</span>
          </div>
          <div style={{ marginBottom: 10 }}><Spectrum pct={laneProg} /></div>
          <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 10 }}>{(laneProg * 100).toFixed(1)}% of the lane mastered · next up: <b style={{ color: C.ink }}>{nextTopic.title}</b></div>
          {lane.milestones.map((m, i) => {
            const hit = laneProg >= (i + 1) / lane.milestones.length - 0.001;
            return <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, margin: "5px 0", color: hit ? C.grow : C.dim }}>
              {hit ? <Award size={13} /> : <CircleDot size={13} color={C.faint} />} {m}
            </div>;
          })}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <Eyebrow>mastery across the whole field — 43 parts, {N_TOPICS} topics</Eyebrow>
          <span className="chip" role="button" onClick={() => nav({ name: "curriculum" })}>open the map →</span>
        </div>
        {STAGES.map((s, si) => (
          <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <div style={{ width: 148, fontSize: 10.5, fontFamily: "'JetBrains Mono',monospace", color: STAGE_HUES[si], flex: "none" }}>{s.roman} · {s.name}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {CURR.filter((p) => p.s === si).map((p) => {
                const m = partMastery(p, data);
                return <div key={p.n} className="hcell" title={`${p.n}. ${p.name} — ${(m * 100).toFixed(0)}%`} style={{ width: 44, background: heatColor(m), borderColor: m > 0 ? "transparent" : C.line }} onClick={() => nav({ name: "curriculum", part: p.n })}>{p.n}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM — the prerequisite knowledge graph
// ─────────────────────────────────────────────────────────────────────────────
function CurriculumView() {
  const { data, up, nav, view } = useNP();
  const [drawer, setDrawer] = useState(view.part || null);
  const [goal, setGoal] = useState(data.goalPart || 0);
  const [q, setQ] = useState("");
  useEffect(() => { if (view.part) setDrawer(view.part); }, [view.part]);
  const layout = useMemo(() => {
    const pos = {}; const colY = {};
    CURR.forEach((p) => { const i = colY[p.s] = (colY[p.s] || 0); pos[p.n] = { x: 104 + p.s * 176, y: 96 + i * 82 }; colY[p.s]++; });
    const H = Math.max(...Object.values(colY)) * 82 + 130;
    return { pos, W: 104 + 7 * 176, H };
  }, []);
  const critical = useMemo(() => {
    if (!goal) return null;
    const s = new Set();
    const walk = (n) => (PREREQ[n] || []).forEach((p) => { if (!s.has(p)) { s.add(p); walk(p); } });
    walk(goal); s.add(goal);
    return s;
  }, [goal]);
  const results = q.length > 1 ? ALL_TOPICS.filter((t) => t.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const dp = drawer ? PART_BY_N[drawer] : null;
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Eyebrow>the knowledge graph</Eyebrow>
          <h1 style={{ fontSize: 24, margin: "4px 0 0" }}>{N_TOPICS} topics · 43 parts · 7 stages</h1>
        </div>
        <div className="row">
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.faint }} />
            <input type="text" placeholder="jump to any topic…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32, width: 240 }} />
            {results.length > 0 && (
              <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: C.panel2, border: `1px solid var(--line2)`, borderRadius: 10, zIndex: 30, overflow: "hidden" }}>
                {results.map((r) => <div key={r.id} className="trow" style={{ borderRadius: 0 }} onClick={() => { setQ(""); nav({ name: "lesson", id: r.id }); }}>
                  <span style={{ fontSize: 12.5 }}>{r.title}</span><span style={{ marginLeft: "auto", fontSize: 10.5, color: C.faint, fontFamily: "'JetBrains Mono',monospace" }}>P{r.part}</span>
                </div>)}
              </div>
            )}
          </div>
          <select value={goal} onChange={(e) => { const g = +e.target.value; setGoal(g); up((d) => { d.goalPart = g; }); }} style={{ width: 220 }}>
            <option value={0}>critical path to… (off)</option>
            {[25, 23, 21, 17, 26, 27, 33, 37].map((n) => <option key={n} value={n}>→ {PART_BY_N[n].name}</option>)}
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: 6, overflow: "auto", maxHeight: "72vh" }}>
        <svg width={layout.W} height={layout.H} style={{ display: "block" }}>
          {STAGES.map((s, si) => (
            <text key={si} x={104 + si * 176} y={40} textAnchor="middle" fill={STAGE_HUES[si]} style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{s.roman} · {s.name.toUpperCase()}</text>
          ))}
          {CURR.map((p) => (PREREQ[p.n] || []).map((pr) => {
            const a = layout.pos[pr], b = layout.pos[p.n];
            const onPath = critical && critical.has(pr) && critical.has(p.n);
            return <path key={pr + "-" + p.n} d={`M ${a.x + 26} ${a.y} C ${a.x + 90} ${a.y}, ${b.x - 90} ${b.y}, ${b.x - 26} ${b.y}`}
              fill="none" stroke={onPath ? C.charge : "rgba(140,160,220,.16)"} strokeWidth={onPath ? 2.4 : 1.2} opacity={critical && !onPath ? 0.35 : 1} />;
          }))}
          {CURR.map((p) => {
            const { x, y } = layout.pos[p.n]; const m = partMastery(p, data);
            const locked = (PREREQ[p.n] || []).some((pr) => partMastery(PART_BY_N[pr], data) < 0.25);
            const dim = critical && !critical.has(p.n);
            const r = 24, circ = 2 * Math.PI * r;
            return (
              <g key={p.n} className="gnode" transform={`translate(${x},${y})`} opacity={dim ? 0.3 : 1} onClick={() => setDrawer(p.n)}>
                <circle r={r} fill={m > 0 ? "rgba(91,140,255,.1)" : C.panel} stroke={C.line2} strokeWidth={1.4} />
                <circle className="gring" r={r} fill="none" stroke={STAGE_HUES[p.s]} strokeWidth={2.6} strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - m)} transform="rotate(-90)" />
                <text y={5} textAnchor="middle" fill={C.ink} style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700 }}>{p.n}</text>
                {locked && m < 0.02 && <text x={17} y={-15} style={{ fontSize: 10 }}>🔒</text>}
                <foreignObject x={-80} y={r + 5} width={160} height={40}>
                  <div style={{ textAlign: "center", fontSize: 10, lineHeight: 1.25, color: C.dim, fontFamily: "'IBM Plex Sans',sans-serif", overflow: "hidden" }}>{p.name}</div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
      {dp && (
        <div className="drawer" style={{ zIndex: 70 }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid var(--line)` }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Eyebrow color={STAGE_HUES[dp.s]}>Part {dp.n} · Stage {STAGES[dp.s].roman}</Eyebrow>
              <button className="btn sm ghost" onClick={() => setDrawer(null)}><X size={15} /></button>
            </div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, margin: "4px 0 8px" }}>{dp.name}</div>
            <div className="row" style={{ gap: 8 }}>
              <Ring pct={partMastery(dp, data)} size={40} stroke={4} color={STAGE_HUES[dp.s]}>{Math.round(partMastery(dp, data) * 100)}</Ring>
              <div style={{ fontSize: 11.5, color: C.dim }}>
                {(PREREQ[dp.n] || []).length ? <>after: {(PREREQ[dp.n] || []).map((pr) => <span key={pr} className="chip" style={{ marginRight: 4 }} role="button" onClick={() => setDrawer(pr)}>P{pr}</span>)}</> : "no prerequisites — a starting node"}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "10px 12px" }}>
            {dp.list.map((tt, i) => {
              const td = data.topics[dp.n + "-" + i] || {};
              const col = td.status === "mastered" ? C.grow : td.status === "done" ? C.charge : td.status === "seen" ? C.signal : C.faint;
              return (
                <div key={i} className="trow" onClick={() => { setDrawer(null); nav({ name: "lesson", id: dp.n + "-" + i }); }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: C.faint, width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="dot" style={{ background: col }} />
                  <span style={{ fontSize: 13, flex: 1 }}>{tt}</span>
                  {FLAGSHIP[tt] && <Sparkles size={12} color={C.signal} />}
                  {LABS[tt] && <Hammer size={12} color={C.charge} />}
                  <span style={{ fontSize: 10.5, color: C.faint, fontFamily: "'JetBrains Mono',monospace" }}>{estMin({ id: dp.n + "-" + i, stage: dp.s })}m</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANES — pick a depth-first path through the map
// ─────────────────────────────────────────────────────────────────────────────
function LanesView() {
  const { data, up, nav, toast } = useNP();
  const [readme, setReadme] = useState(null); const [busy, setBusy] = useState(false);
  const lane = LANES.find((l) => l.id === data.profile.lane) || LANES[0];
  const laneProg = lane.parts.reduce((s, pn) => s + partMastery(PART_BY_N[pn], data), 0) / lane.parts.length;
  const genReadme = async () => {
    setBusy(true); setReadme("");
    try {
      const mastered = ALL_TOPICS.filter((tp) => (data.topics[tp.id] || {}).status === "mastered").map((tp) => tp.title).slice(0, 14);
      const labs = Object.keys(LABS).filter((k) => { const tp = T_BY_TITLE[k]; return tp && (data.topics[tp.id] || {}).lab; });
      const sys = "You write sharp, honest GitHub portfolio READMEs for AI/ML learners. Markdown only. Under 320 words. Sections: a two-line intro; **Skills** (grouped realistically from the mastered topics — do not inflate); **Projects** (turn each passed lab into a believable mini-project entry: what was built from scratch + what it verified); **Currently learning**; a one-line learning-in-public footer. No emoji spam.";
      const msg = `Learner: ${data.profile.name || "an AI/ML learner"}. Lane: ${lane.name} (${(laneProg * 100).toFixed(0)}% complete). Goal: ${data.profile.goal || "mastery"}. Mastered topics: ${mastered.join(", ") || "just starting"}. Labs implemented from scratch & verified by hidden tests: ${labs.join("; ") || "none yet"}. Streak record: ${data.records.streak || 0} days. Total curriculum: ${N_TOPICS} topics across 43 parts.`;
      const txt = await askClaude([{ role: "user", content: msg }], sys, 1000);
      setReadme(txt);
    } catch (e) { toast(String(e.message || e), "gold"); setReadme(null); }
    setBusy(false);
  };
  return (
    <div>
      <Eyebrow>learning lanes</Eyebrow>
      <h1 style={{ fontSize: 24, margin: "4px 0 6px" }}>Depth beats breadth. Pick a lane.</h1>
      <div style={{ color: C.dim, fontSize: 13.5, marginBottom: 18, maxWidth: 640 }}>Every lane is an ordered walk through the same map — foundations first, then your specialty, ending in a portfolio capstone. You can switch anytime; progress never resets.</div>
      <div className="grid2" style={{ marginBottom: 20 }}>
        {LANES.map((l) => {
          const prog = l.parts.reduce((s, pn) => s + partMastery(PART_BY_N[pn], data), 0) / l.parts.length;
          const on = l.id === lane.id;
          return (
            <div key={l.id} className="card hov" style={{ borderColor: on ? C.signal : undefined, background: on ? "rgba(91,140,255,.06)" : undefined }}
              onClick={() => { up((d) => { d.profile.lane = l.id; }); toast(`Lane set: ${l.name}`, "green"); }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <div className="disp" style={{ fontWeight: 700, fontSize: 14.5 }}>{l.icon} {l.name}</div>
                {on && <span className="badge" style={{ color: C.signal }}>active</span>}
              </div>
              <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 10 }}>{l.desc}</div>
              <Spectrum pct={prog} />
              <div style={{ fontSize: 11, color: C.faint, marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>{l.parts.length} parts · {(prog * 100).toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <Eyebrow color={C.charge}>{lane.icon} {lane.name} — the route</Eyebrow>
          <div className="row">
            <button className="btn sm" onClick={() => { up((d) => { d.goalPart = lane.parts[lane.parts.length - 1]; }); nav({ name: "curriculum" }); }}><Route size={13} />show critical path on map</button>
            <button className="btn sm" onClick={genReadme} disabled={busy}>{busy ? <Loader2 size={13} style={{ animation: "np-spin 1s linear infinite" }} /> : <FileText size={13} />} portfolio README</button>
          </div>
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {lane.parts.map((pn, i) => {
            const m = partMastery(PART_BY_N[pn], data);
            return <span key={pn} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="chip" role="button" onClick={() => nav({ name: "curriculum", part: pn })} style={{ borderColor: m >= 0.99 ? C.grow : m > 0 ? C.charge : C.line, color: m > 0 ? C.ink : C.dim }}>
                P{pn} {m > 0 && <b style={{ color: m >= 0.99 ? C.grow : C.charge }}>{Math.round(m * 100)}%</b>}
              </span>
              {i < lane.parts.length - 1 && <ArrowRight size={11} color={C.faint} />}
            </span>;
          })}
        </div>
        <div className="rec"><div className="eyebrow" style={{ color: C.charge }}>capstone</div>
          <div style={{ fontSize: 13.5, marginTop: 6 }}>{lane.capstone}</div></div>
        {readme !== null && (
          <div style={{ marginTop: 14 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <div className="eyebrow" style={{ color: C.grow }}>your README.md — built from verified progress</div>
              <button className="btn sm" onClick={() => { try { navigator.clipboard.writeText(readme); toast("Copied — paste into GitHub.", "green"); } catch (e) {} }}><Copy size={13} />copy markdown</button>
            </div>
            <div className="rec mm" style={{ fontSize: 13 }}>{busy && !readme ? "drafting…" : <MD text={readme} />}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING + DIAGNOSTIC
// ─────────────────────────────────────────────────────────────────────────────
const DIAG = [
  { q: "Two perpendicular vectors have a dot product of…", o: ["1", "0", "−1", "undefined"], a: 1, k: "math" },
  { q: "The derivative of x² is…", o: ["x", "2x", "x²/2", "2"], a: 1, k: "math" },
  { q: "In Python, len([1, 2, 3]) returns…", o: ["2", "3", "4", "an error"], a: 1, k: "code" },
  { q: "for i in range(3) iterates over…", o: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "just 3"], a: 1, k: "code" },
  { q: "Supervised learning fundamentally requires…", o: ["labeled examples", "a GPU", "a neural network", "big data"], a: 0, k: "ml" },
  { q: "'Overfitting' means the model…", o: ["is too simple", "memorized noise in the training data", "trains too slowly", "has too few parameters"], a: 1, k: "ml" },
];
function Onboarding() {
  const { up, addXp, toast, nav } = useNP();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(""); const [bg, setBg] = useState(""); const [goal, setGoal] = useState("");
  const [laneId, setLaneId] = useState("llm"); const [hours, setHours] = useState(6);
  const [ans, setAns] = useState({});
  const finish = (skipped) => {
    let startId = "1-0";
    if (!skipped) {
      const sc = (k) => DIAG.filter((d) => d.k === k).reduce((s, d, _, arr) => s + (ans[DIAG.indexOf(d)] === d.a ? 1 : 0), 0);
      const math = sc("math"), code = sc("code"), ml = sc("ml");
      if (math === 0) startId = "2-0";
      else if (code === 0) startId = "3-0";
      else if (ml < 2) startId = "7-0";
      else startId = LANES.find((l) => l.id === laneId).parts.filter((p) => p > 7)[0] ? PART_BY_N[LANES.find((l) => l.id === laneId).parts.filter((p) => p > 7)[0]].n + "-0" : "7-0";
    }
    up((d) => {
      d.onboarded = true;
      d.profile = { name: name.trim(), bg, goal, lane: laneId, hours };
      d.lastLesson = startId;
      d.goalPart = LANES.find((l) => l.id === laneId).parts.slice(-1)[0];
    });
    addXp(10, "start");
    toast("Baseline recorded. Every record from here is yours to break.", "gold");
    nav({ name: "lesson", id: startId });
  };
  const Chip = ({ v, cur, set, children }) => <span className={"chip" + (cur === v ? " on" : "")} role="button" onClick={() => set(v)} style={{ padding: "9px 14px", fontSize: 13 }}>{children}</span>;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 640, width: "100%", animation: "np-up .4s ease" }}>
        <div className="row" style={{ gap: 10, marginBottom: 26 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? C.signal : C.panel3, transition: "background .3s" }} />)}
        </div>
        {step === 0 && <div style={{ textAlign: "center" }}>
          <div className="disp" style={{ fontSize: 13, color: C.signal, letterSpacing: ".2em", marginBottom: 14 }}>NEURALPATH</div>
          <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>Zero to research-grade.<br />One map. Your records.</h1>
          <div style={{ color: C.dim, fontSize: 14.5, maxWidth: 480, margin: "0 auto 22px" }}>
            {N_TOPICS} topics across 43 parts — from "what is a vector" to agents, alignment, and papers. Theory at three depths, live playgrounds, real Python in your browser, auto-graded labs, and a tutor who always knows where you are.
          </div>
          <input type="text" placeholder="what should we call you? (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 320, margin: "0 auto 18px", textAlign: "center" }} />
          <div><button className="btn pri" onClick={() => setStep(1)}>begin calibration<ArrowRight size={15} /></button></div>
        </div>}
        {step === 1 && <div className="card">
          <Eyebrow>1 / where are you starting?</Eyebrow>
          <h2 style={{ fontSize: 20, margin: "6px 0 16px" }}>Your background</h2>
          <div className="row" style={{ gap: 8 }}>
            {["Total beginner", "Some programming", "Comfortable coder", "Math-strong"].map((b) => <Chip key={b} v={b} cur={bg} set={setBg}>{b}</Chip>)}
          </div>
          <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}><button className="btn pri" disabled={!bg} onClick={() => setStep(2)}>next<ArrowRight size={14} /></button></div>
        </div>}
        {step === 2 && <div className="card">
          <Eyebrow>2 / why are you here?</Eyebrow>
          <h2 style={{ fontSize: 20, margin: "6px 0 16px" }}>Your goal</h2>
          <div className="row" style={{ gap: 8 }}>
            {["Get hired in AI", "Build AI products", "Do research", "Deep curiosity"].map((g) => <Chip key={g} v={g} cur={goal} set={setGoal}>{g}</Chip>)}
          </div>
          <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}><button className="btn pri" disabled={!goal} onClick={() => setStep(3)}>next<ArrowRight size={14} /></button></div>
        </div>}
        {step === 3 && <div className="card">
          <Eyebrow>3 / depth beats breadth</Eyebrow>
          <h2 style={{ fontSize: 20, margin: "6px 0 16px" }}>Pick a lane (switchable anytime)</h2>
          <div className="grid2" style={{ gap: 8 }}>
            {LANES.map((l) => <div key={l.id} className="card hov" style={{ padding: 12, borderColor: laneId === l.id ? C.signal : undefined }} onClick={() => setLaneId(l.id)}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{l.icon} {l.name}</div>
              <div style={{ fontSize: 11.5, color: C.dim }}>{l.desc}</div>
            </div>)}
          </div>
          <div className="row" style={{ marginTop: 18, justifyContent: "flex-end" }}><button className="btn pri" onClick={() => setStep(4)}>next<ArrowRight size={14} /></button></div>
        </div>}
        {step === 4 && <div className="card">
          <Eyebrow>4 / honesty now, streaks later</Eyebrow>
          <h2 style={{ fontSize: 20, margin: "6px 0 16px" }}>Weekly time budget</h2>
          <Slider label="hours / week" value={hours} min={2} max={25} step={1} onChange={setHours} fmt={(v) => v + "h"} />
          <div style={{ fontSize: 12.5, color: C.dim, marginTop: 8 }}>{hours < 5 ? "Slow-burn mode: one concept + its playground per session." : hours < 12 ? "Steady climb: expect the Foundations stage in ~6–8 weeks." : "Full send: labs and papers will come at you fast."}</div>
          <div className="row" style={{ marginTop: 18, justifyContent: "flex-end" }}><button className="btn pri" onClick={() => setStep(5)}>final step: diagnostic<ArrowRight size={14} /></button></div>
        </div>}
        {step === 5 && <div className="card">
          <Eyebrow>5 / your baseline record</Eyebrow>
          <h2 style={{ fontSize: 20, margin: "6px 0 4px" }}>Six questions. No stakes.</h2>
          <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 14 }}>This only sets your starting node — wrong answers just mean we start you earlier on the map.</div>
          {DIAG.map((d, i) => <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{i + 1}. {d.q}</div>
            <div className="row" style={{ gap: 6 }}>
              {d.o.map((o, j) => <span key={j} className={"chip" + (ans[i] === j ? " on" : "")} role="button" onClick={() => setAns((a) => ({ ...a, [i]: j }))}>{o}</span>)}
            </div>
          </div>)}
          <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
            <button className="btn ghost" onClick={() => finish(true)}>skip — start me at Part 1</button>
            <button className="btn pri" disabled={Object.keys(ans).length < 6} onClick={() => finish(false)}><GraduationCap size={15} />calibrate & enter</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_DATA = { v: 1, theme: "dark", onboarded: false, profile: { name: "", bg: "", goal: "", lane: "llm", hours: 6 }, xp: 0, streak: { last: "", count: 0 }, days: {}, topics: {}, records: { streak: 0, day_x: 0, day_c: 0, quiz: 0, labs: 0 }, srs: {}, gen: {}, glossGen: {}, tutor: [], missionDone: "", lastLesson: null, goalPart: null };
const NAV_ITEMS = [
  ["dashboard", "Dashboard", LayoutDashboard], ["curriculum", "Curriculum", Network],
  ["playgrounds", "Playgrounds", FlaskConical], ["cards", "Review", Layers],
  ["lanes", "Lanes", Route], ["papers", "Papers", FileText], ["glossary", "Glossary", Library],
];
export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState({ name: "dashboard" });
  const [tutor, setTutorS] = useState({ open: false });
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    let ok = true;
    loadState().then((loaded) => {
      if (!ok) return;
      const d = { ...DEFAULT_DATA, ...(loaded || {}), profile: { ...DEFAULT_DATA.profile, ...((loaded || {}).profile || {}) }, records: { ...DEFAULT_DATA.records, ...((loaded || {}).records || {}) }, streak: { ...DEFAULT_DATA.streak, ...((loaded || {}).streak || {}) } };
      setThemeRaw(d.theme || "dark");
      setData(d);
    });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700;800&display=swap";
    document.head.appendChild(link);
    return () => { ok = false; };
  }, []);
  useEffect(() => { if (data) saveState(data); }, [data]);
  const toast = useCallback((msg, kind) => {
    const id = Math.random();
    setToasts((ts) => [...ts, { id, msg, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }, []);
  const celebrate = useCallback((label) => { fireConfetti(); toast("★ " + label, "gold"); }, [toast]);
  const up = useCallback((fn) => {
    setData((prev) => { if (!prev) return prev; const d = JSON.parse(JSON.stringify(prev)); fn(d); return d; });
  }, []);
  const addXp = useCallback((n, kind) => {
    const events = [];
    setData((prev) => {
      if (!prev) return prev;
      const d = JSON.parse(JSON.stringify(prev));
      const t = todayStr();
      const oldLvl = levelOf(d.xp);
      d.xp += n;
      const day = (d.days[t] = d.days[t] || { x: 0, c: 0, q: 0, l: 0, cd: 0, p: 0 });
      const beforeX = day.x; day.x += n;
      if (kind === "concept") day.c++;
      if (kind === "quiz") day.q++;
      if (kind === "lab") { day.l++; d.records.labs = (d.records.labs || 0) + 1; }
      if (kind === "card") day.cd++;
      if (kind === "play") day.p = (day.p || 0) + 1;
      if (d.streak.last !== t) {
        const diff = d.streak.last ? dayDiff(d.streak.last, t) : 999;
        d.streak.count = diff === 1 ? d.streak.count + 1 : 1;
        d.streak.last = t;
        if (d.streak.count > (d.records.streak || 0)) {
          d.records.streak = d.streak.count;
          if (d.streak.count > 1) events.push("New streak record — " + d.streak.count + " days");
        }
      }
      const oldX = d.records.day_x || 0;
      if (day.x > oldX) { if (beforeX <= oldX && oldX >= 60) events.push("New record: best XP day — " + day.x); d.records.day_x = day.x; }
      const oldC = d.records.day_c || 0;
      if (day.c > oldC) { if (oldC >= 3) events.push("New record: " + day.c + " concepts in a day"); d.records.day_c = day.c; }
      if (levelOf(d.xp) > oldLvl) events.push("Level " + levelOf(d.xp) + " reached");
      return d;
    });
    if (events.length) { fireConfetti(); events.forEach((e) => toast("★ " + e, "gold")); }
  }, [toast]);
  const nav = useCallback((v) => {
    setView(v);
    try { window.scrollTo({ top: 0 }); } catch (e) {}
    if (v.name === "lesson") setData((prev) => (prev ? { ...prev, lastLesson: v.id } : prev));
  }, []);
  const setTutor = useCallback((v) => setTutorS(v), []);
  if (!data) {
    return <div className="np" data-theme="dark" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{VARS_CSS + CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div className="disp" style={{ fontSize: 14, letterSpacing: ".24em", color: C.signal, animation: "np-pulse 1.4s ease infinite" }}>NEURALPATH</div>
        <div style={{ color: C.faint, fontSize: 12, marginTop: 8, fontFamily: "'JetBrains Mono',monospace" }}>loading your map…</div>
      </div>
    </div>;
  }
  const ctxVal = { data, up, addXp, nav, view, toast, celebrate, tutor, setTutor };
  const VIEWS = { dashboard: Dashboard, curriculum: CurriculumView, playgrounds: PlaygroundsView, lesson: LessonView, cards: CardsView, lanes: LanesView, papers: PapersView, glossary: GlossaryView };
  const Screen = VIEWS[view.name] || Dashboard;
  const lvl = levelOf(data.xp); const nextAt = 60 * lvl * lvl; const prevAt = 60 * (lvl - 1) * (lvl - 1);
  return (
    <NP.Provider value={ctxVal}>
      <div className="np" data-theme={data.theme || "dark"}>
        <style>{VARS_CSS + CSS}</style>
        <style>{`.np-mnav{display:none} @media(max-width:980px){.np-mnav{display:flex;gap:6px;overflow-x:auto;padding:8px 14px;border-bottom:1px solid var(--line);position:sticky;top:57px;z-index:35;background:var(--top-bg);backdrop-filter:blur(8px)}}`}</style>
        <Blobs />
        {!data.onboarded ? <Onboarding /> : (
          <div className="np-shell">
            <aside className="np-side">
              <div style={{ padding: "6px 12px 16px", display: "flex", alignItems: "center", gap: 9 }}>
                <svg width="26" height="26" viewBox="0 0 26 26"><path d="M2 4 C 6 22, 12 21, 15 15 S 22 8, 24 22" fill="none" stroke={C.signal} strokeWidth="2.4" strokeLinecap="round" /><circle cx="24" cy="22" r="2.4" fill={C.charge} /></svg>
                <div>
                  <div className="disp" style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: ".06em" }}>NEURALPATH</div>
                  <div style={{ fontSize: 9.5, color: C.faint, fontFamily: "'JetBrains Mono',monospace" }}>loss ↓ · mastery ↑</div>
                </div>
              </div>
              {NAV_ITEMS.map(([k, label, Icon]) => (
                <button key={k} className={"np-nav" + (view.name === k ? " on" : "")} onClick={() => nav({ name: k })}><Icon size={16} />{label}</button>
              ))}
              <div style={{ marginTop: "auto", padding: 12, fontSize: 10.5, color: C.faint, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.7 }}>
                {N_TOPICS} topics · 43 parts<br />13 playgrounds · {Object.keys(FLAGSHIP).length} flagships<br />{Object.keys(LABS).length} graded labs
              </div>
            </aside>
            <div className="np-main">
              <header className="np-top">
                <div className="disp" style={{ fontSize: 13, fontWeight: 700, marginRight: "auto", textTransform: "capitalize" }}>{view.name === "cards" ? "Review" : view.name}</div>
                <span className="badge" title="daily streak" style={{ color: liveStreak(data) > 0 ? C.charge : C.dim }}><Flame size={12} /> {liveStreak(data)}</span>
                <div style={{ width: 130 }} title={`${data.xp} XP — Level ${lvl}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, fontFamily: "'JetBrains Mono',monospace", color: C.faint, marginBottom: 3 }}><span><Zap size={9} style={{ verticalAlign: -1 }} /> L{lvl}</span><span>{data.xp}xp</span></div>
                  <div style={{ height: 5, borderRadius: 99, background: C.panel3, overflow: "hidden" }}><div style={{ width: `${clamp((data.xp - prevAt) / (nextAt - prevAt), 0, 1) * 100}%`, height: "100%", background: `linear-gradient(90deg,var(--signal),var(--charge))` }} /></div>
                </div>
                <button className="btn sm ghost" title="toggle light / dark" aria-label="toggle theme" onClick={() => { const nx = (data.theme || "dark") === "light" ? "dark" : "light"; setThemeRaw(nx); up((d) => { d.theme = nx; }); }}>{(data.theme || "dark") === "light" ? <Moon size={14} /> : <Sun size={14} />}</button>
                <button className="btn sm pri" onClick={() => setTutor({ open: !tutor.open })}><Bot size={14} />tutor</button>
              </header>
              <nav className="np-mnav">
                {NAV_ITEMS.map(([k, label, Icon]) => (
                  <span key={k} className={"chip" + (view.name === k ? " on" : "")} role="button" onClick={() => nav({ name: k })} style={{ flex: "none" }}><Icon size={12} />{label}</span>
                ))}
              </nav>
              <main className="np-content" key={view.name + (view.id || "") + (view.part || "") + (data.theme || "dark")}>
                <Screen />
              </main>
            </div>
          </div>
        )}
        <TutorDrawer />
        <div className="toasts">
          {toasts.map((tt) => <div key={tt.id} className={"toast " + (tt.kind || "")}>{tt.msg}</div>)}
        </div>
      </div>
    </NP.Provider>
  );
}
