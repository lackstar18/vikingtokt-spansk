/* Spansk A1 · Vikingtokt — prototipo (misión 1). Pantallas en noruego, se aprende español. Sin servidor: todo se guarda en este navegador. */
"use strict";
(function () {

const CLAVE = "vikingo-es-v1";
const RANGOS = [
  { n: "Jern", lp: 0, c: "#8a8f98" }, { n: "Bronse", lp: 100, c: "#c07a3e" }, { n: "Sølv", lp: 250, c: "#c9d1d9" },
  { n: "Gull", lp: 450, c: "#e0b04f" }, { n: "Platina", lp: 700, c: "#5fd3c6" }, { n: "Diamant", lp: 1000, c: "#7fb3ff" },
];   // Legende = A1 terminado (más adelante)
const NOMBRE_RAREZA = { common: "vanlig", rare: "sjelden", epic: "episk", legendary: "legendarisk" };
const RAREZAS = { common: { p: 70, c: "#9aa5b1" }, rare: { p: 22, c: "#4c8dff" }, epic: { p: 7, c: "#b264ff" }, legendary: { p: 1, c: "#ffb020" } };
const BOTIN = [
  { id: "oro25", r: "common", n: "Pose med sølv", oro: 25, ic: "two-coins" },
  { id: "oro35", r: "common", n: "Pung med sølv", oro: 35, ic: "two-coins" },
  { id: "oro50", r: "common", n: "Haug med mynter", oro: 50, ic: "coins-pile" },
  { id: "casco-hierro", r: "rare", n: "Jernhjelm", tipo: "casco", ic: "viking-helmet", color: "#c9d1d9" },
  { id: "hacha-barba", r: "rare", n: "Skjeggøks", tipo: "arma", ic: "battle-axe", color: "#c9d1d9" },
  { id: "escudo-rojo", r: "rare", n: "Rødt skjold", tipo: "escudo", ic: "viking-shield", color: "#d9534f" },
  { id: "escudo-azul", r: "rare", n: "Blått skjold", tipo: "escudo", ic: "viking-shield", color: "#4c8dff" },
  { id: "t-berserker", r: "epic", n: "Tittel: Berserker", tipo: "titulo", titulo: "Berserker", ic: "barbarian", color: "#b264ff" },
  { id: "t-jarl", r: "epic", n: "Tittel: Havnens jarl", tipo: "titulo", titulo: "Havnens jarl", ic: "crowned-skull", color: "#b264ff" },
  { id: "casco-guerra", r: "epic", n: "Krigsherrehjelm", tipo: "casco", ic: "warlord-helmet", color: "#b264ff" },
  { id: "casco-cuernos", r: "legendary", n: "Hornhjelm", tipo: "casco", ic: "horned-helm", color: "#ffb020",
    dato: "Morsomt faktum: ekte vikinger brukte aldri hornhjelmer. Hornene kommer fra operaer og malerier på 1800-tallet." },
  { id: "hacha-odin", r: "legendary", n: "Odins gyldne økser", tipo: "arma", ic: "crossed-axes", color: "#ffb020" },
];
const EDIFICIOS = {
  salon: { n: "Langhuset", ic: "viking-longhouse", coste: l => 150 * l, efecto: l => l > 1 ? `+${10 * (l - 1)} % gull fra tokt` : "Hjemmet ditt. Oppgrader for mer gull.", max: 5 },
  empalizada: { n: "Palisaden", ic: "palisade", coste: l => 100 * l, efecto: l => l > 1 ? `Stopper ${l - 1} spansk${l > 2 ? "e" : "t"} angrep før de når gullet ditt` : "Oppgrader for å beskytte gullet ditt.", max: 5 },
};
const BLOQUEADOS = [
  { n: "Tavernaen", ic: "beer-stein", txt: "Oppdrag 3: mat og drikke" },
  { n: "Markedet", ic: "shop", txt: "Oppdrag 5: tall og priser" },
];

/* ================= utilidades ================= */
const $ = s => document.querySelector(s);
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
}
function ic(nombre, clase, color) {
  const ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"), p = document.createElementNS(ns, "path");
  s.setAttribute("viewBox", "0 0 512 512"); s.setAttribute("class", "ic " + (clase || "")); s.setAttribute("aria-hidden", "true");
  if (color) s.style.color = color;
  p.setAttribute("d", ICONOS[nombre] || ""); s.append(p);
  return s;
}
const barajar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const azar = (a, n) => barajar(a).slice(0, n);
const espera = ms => new Promise(r => setTimeout(r, ms));
function fecha(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function hoy() { return fecha(new Date()); }
function masDias(f, n) { const [y, m, d] = f.split("-").map(Number); return fecha(new Date(y, m - 1, d + n)); }
function diaSem(f) { const [y, m, d] = f.split("-").map(Number); return (new Date(y, m - 1, d).getDay() + 6) % 7; }   // 0 = lunes
const esFinde = f => diaSem(f) >= 5;
function norm(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[¿?¡!.,;:"'()]/g, " ").replace(/\s+/g, " ").trim();
}
function lev(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/* ================= partida ================= */
function nueva() {
  return { v: 1, nombre: "", creado: hoy(), revisado: masDias(hoy(), -1), oro: 30, lp: 0, edif: { salon: 1, empalizada: 1 }, mejora: null,
    dias: {}, misiones: {}, inv: [], equipo: { casco: null, arma: null, escudo: null, titulo: null },
    semanasPerfectas: {}, cuerno: { f: "", n: 0, prox: 0 }, ajustes: { volumen: 50, auto: true } };
}
let J, SERVIDOR = false, IA = false;
function completar(x) { const j = Object.assign(nueva(), x); j.ajustes = Object.assign(nueva().ajustes, x.ajustes || {}); return j; }
/* Con el servidor (Jugar.bat) el progreso va a progreso.json: lo leen el aviso de las 20:00 y el duelo. Sin él, solo este navegador. */
async function cargar() {
  let local = null, remoto = null;
  try { const x = JSON.parse(localStorage.getItem(CLAVE)); if (x && x.v) local = x; } catch (e) { }
  if (location.protocol.startsWith("http")) {
    try {
      const r = await fetch("api/ping", { cache: "no-store" }); const pg = await r.json(); SERVIDOR = !!pg.ok; IA = !!pg.ia;
      const x = await (await fetch("api/progreso", { cache: "no-store" })).json(); if (x && x.v) remoto = x;
    } catch (e) { SERVIDOR = false; }
  }
  const mejor = [local, remoto].filter(Boolean).sort((a, b) => (b.actualizado || 0) - (a.actualizado || 0))[0];
  J = mejor ? completar(mejor) : nueva();
}
let envio = null;
function guardar() {
  J.actualizado = Date.now();
  try { localStorage.setItem(CLAVE, JSON.stringify(J)); } catch (e) { }
  if (SERVIDOR) { clearTimeout(envio); envio = setTimeout(enviar, 300); }
}
function enviar() { if (SERVIDOR) fetch("api/progreso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(J), keepalive: true }).catch(() => { }); }
addEventListener("pagehide", () => { if (SERVIDOR && navigator.sendBeacon) navigator.sendBeacon("api/progreso", new Blob([JSON.stringify(J)], { type: "application/json" })); });
const hechasHoy = () => J.dias[hoy()] || 0;
function rango(lp) {
  let i = 0; while (i + 1 < RANGOS.length && lp >= RANGOS[i + 1].lp) i++;
  const sig = RANGOS[i + 1];
  return { ...RANGOS[i], i, sig, pct: sig ? (lp - RANGOS[i].lp) / (sig.lp - RANGOS[i].lp) : 1 };
}
function lunesDe(f) { return masDias(f, -diaSem(f)); }

/* Días de clase (lun-vie) sin asalto: viene un español y destruye algo. */
function revisarAusencias() {
  const ayer = masDias(hoy(), -1), ev = [];
  for (let d = masDias(J.revisado, 1); d <= ayer; d = masDias(d, 1)) {
    if (!esFinde(d) && !(J.dias[d] > 0) && d >= J.creado) ev.push(ataque(d));
  }
  if (J.revisado < ayer) J.revisado = ayer;
  if (ev.length) guardar();
  return ev;
}
function ataque(d) {
  let txt;
  if (J.edif.empalizada > 1) { J.edif.empalizada--; J.fuego = "empalizada"; txt = `brente palisaden din (nivå ${J.edif.empalizada + 1} → ${J.edif.empalizada}).`; }
  else {
    const r = Math.min(J.oro, Math.max(10, Math.round(J.oro * 0.4)));
    J.oro -= r; J.fuego = "salon"; txt = r ? `brøt seg inn i langhuset ditt og stjal ${r} gull.` : "knuste døra til det tomme langhuset ditt.";
  }
  const lp = Math.min(J.lp, 15); J.lp -= lp;
  return { d, txt, lp };
}
function terminarMejoras() {
  if (J.mejora && Date.now() >= J.mejora.fin) {
    const id = J.mejora.id; J.edif[id]++; J.mejora = null; guardar();
    aviso(`${EDIFICIOS[id].n} er oppgradert til nivå ${J.edif[id]}!`, EDIFICIOS[id].ic);
    return true;
  }
  return false;
}
function proximas20() {
  const n = new Date(), t = new Date(n); t.setHours(20, 0, 0, 0);
  if (t - n < 2 * 3600e3) t.setDate(t.getDate() + 1);
  return t.getTime();
}
function cuenta(ms) { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} t ${m % 60} min` : `${m} min`; }

/* ================= sonido ================= */
let AC = null;
function volumen() { const v = Math.max(0, Math.min(100, +J.ajustes.volumen || 0)) / 100; return v * v; }   // barra 0-100, curva suave
function ac() {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; }
  return AC;
}
function tono(f, dur, tipo, vol, f2, retraso) {
  const a = ac(); if (!a || !volumen()) return;
  const t0 = a.currentTime + (retraso || 0), o = a.createOscillator(), g = a.createGain();
  o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime((vol || .3) * volumen(), t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
function ruido(dur, vol, frec) {
  const a = ac(); if (!a || !volumen()) return;
  const b = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = b; f.type = "lowpass"; f.frequency.value = frec || 1200; g.gain.value = (vol || .4) * volumen();
  s.connect(f).connect(g).connect(a.destination); s.start();
}
const SFX = {
  golpe() { ruido(0.16, 0.6, 900); tono(120, 0.2, "sine", 0.6, 45); },
  moneda() { tono(1320, 0.07, "square", 0.08); tono(1980, 0.12, "square", 0.08, null, 0.06); },
  mal() { tono(160, 0.28, "sawtooth", 0.16, 80); },
  combo(n) { tono(330 * Math.pow(1.122, Math.min(n, 12)), 0.14, "triangle", 0.22); },
  cuerno() { tono(98, 1.3, "sawtooth", 0.2, 116); tono(147, 1.3, "sawtooth", 0.1, 174); },
  madera() { ruido(0.07, 0.5, 500); tono(200, 0.08, "square", 0.08, 140); },
  victoria() { [523, 659, 784, 1047].forEach((f, i) => tono(f, 0.3, "triangle", 0.22, null, i * 0.11)); },
  derrota() { [392, 330, 262].forEach((f, i) => tono(f, 0.35, "sawtooth", 0.12, null, i * 0.16)); },
  premio(r) { const base = { common: 523, rare: 659, epic: 784, legendary: 988 }[r] || 523; [1, 1.25, 1.5, 2].forEach((m, i) => tono(base * m, 0.4, "triangle", 0.2, null, i * 0.09)); },
};

/* Voces en español: mp3 de audio/ (voz «m» mujer, «h» hombre). Si falta, la voz española de Windows. */
const AUD = new Set((ES.audio || "").split(/\s+/).filter(Boolean));
function claveAudio(t, voz) {
  const b = new TextEncoder().encode(voz + "|" + t.normalize("NFC").trim());
  let x = 0x811c9dc5; for (const c of b) { x ^= c; x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(16).padStart(8, "0") + "_" + b.length;
}
let vozES = null, audioActual = null;
function buscarVoz() { if ("speechSynthesis" in window) { const vs = speechSynthesis.getVoices(); vozES = vs.find(v => /^es-ES/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null; } }
if ("speechSynthesis" in window) { buscarVoz(); speechSynthesis.onvoiceschanged = buscarVoz; }
function decir(texto, voz) {
  texto = (texto || "").normalize("NFC").trim(); if (!texto) return Promise.resolve();
  if (audioActual) { audioActual.pause(); audioActual = null; }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  const k = claveAudio(texto, voz || "m");
  return new Promise(res => {
    if (AUD.has(k)) {
      const a = new Audio(`audio/${k.slice(0, 2)}/${k}.mp3`); a.volume = volumen(); audioActual = a;
      a.onended = a.onerror = () => res(); a.play().catch(() => res());
    } else if (vozES) {
      const u = new SpeechSynthesisUtterance(texto); u.voice = vozES; u.lang = vozES.lang; u.rate = 0.9; u.volume = volumen();
      u.onend = u.onerror = () => res(); speechSynthesis.speak(u);
    } else res();
  });
}
function bAudio(texto, voz) { return h("button", { class: "btn icono", title: "Hør (mellomrom)", onclick: e => { e.stopPropagation(); decir(texto, voz); } }, "🔊"); }

/* ================= teclado ================= */
let TECLAS = {};
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" && e.key !== "Enter") return;
  if (e.key === "Enter" && TECLAS.enter) { e.preventDefault(); TECLAS.enter(); }
  else if (/^[1-4]$/.test(e.key) && TECLAS.num) { e.preventDefault(); TECLAS.num(+e.key); }
  else if (e.key === " " && TECLAS.espacio) { e.preventDefault(); TECLAS.espacio(); }
});

/* ================= capas: avisos y modales ================= */
function modal(contenido, clase) {
  const capa = $("#capa"), f = h("div", { class: "fondo" }, h("div", { class: "modal " + (clase || "") }, contenido));
  if (!(clase || "").includes("rojo")) f.addEventListener("pointerdown", e => { if (e.target === f) f.remove(); });   // clic fuera = cerrar (los avisos rojos, no)
  capa.append(f);
  return () => f.remove();
}
function aviso(txt, icono) {
  const cerrar = modal([ic(icono || "laurels-trophy", "xg"), h("h2", null, txt), h("div", { class: "fila centro", style: "margin-top:16px" },
    h("button", { class: "btn oro", onclick: () => { cerrar(); pintarCampamento(); } }, "Flott!"))]);
}

/* ================= CAMPAMENTO ================= */
function pantalla(...kids) { const a = $("#app"); a.classList.remove("pantalla-mapa"); a.innerHTML = ""; a.append(...kids); window.scrollTo(0, 0); TECLAS = {}; }
function avatar() {
  const e = J.equipo, it = id => BOTIN.find(b => b.id === id);
  const c = it(e.casco), a = it(e.arma), s = it(e.escudo);
  return h("div", { class: "avatar" }, ic("viking-head", "xg", "#d8cfc0"),
    c ? ic(c.ic, "casco", c.color) : null, a ? ic(a.ic, "arma", a.color) : null, s ? ic(s.ic, "escudo", s.color) : null);
}
/* ================= CAMPAMENTO: mapa tipo Clash of Clans (arte: Kenney «Medieval RTS», CC0) ================= */
const K = n => `arte/kenney/${n}.png`;
const MUNDO = { w: 1600, h: 1150 };
const PARCELAS = [   // x, y = pie del edificio; t = ancho en px del mundo
  { id: "salon", img: "salon", n: "Langhuset", x: 800, y: 560, t: 240 },
  { id: "empalizada", img: "muralla", n: "Palisaden", x: 800, y: 845, t: 220 },
  { id: "forja", img: "forja", n: "Smia", x: 495, y: 640, t: 165 },
  { id: "molino", img: "molino", n: "Mølla", x: 430, y: 390, t: 165 },
  { id: "taberna", img: "taberna", n: "Tavernaen", x: 1100, y: 650, t: 150, bloq: 3, txt: "mat og drikke" },
  { id: "mercado", img: "mercado", n: "Markedet", x: 1120, y: 400, t: 165, bloq: 5, txt: "tall og priser" },
];
const MOLINO_HORA = 6, MOLINO_MAX = 48;      // oro por hora y tope del molino
function semilla(n) { return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }
function decorado() {
  const out = [], r = semilla(7);
  const fijos = [["casa1", 640, 400, 105], ["casa2", 975, 470, 105], ["casa3", 640, 780, 110], ["choza", 965, 790, 95], ["pozo", 700, 690, 70],
    ["granero", 300, 600, 120], ["roca", 1270, 760, 90], ["oro", 1300, 520, 90], ["tronco", 560, 860, 70], ["arbusto", 900, 300, 55], ["arbusto", 720, 320, 50]];
  for (const [img, x, y, t] of fijos) out.push({ img, x, y, t });
  for (const [x, y] of [[300, 430], [360, 430], [300, 490], [360, 490]]) out.push({ img: "campo", x, y, t: 64, tile: true });
  for (let i = 0; i < 70; i++) {      // bosque alrededor, fuera del pueblo y del mar
    const x = 40 + r() * 1520, y = 60 + r() * 800, dx = (x - 800) / 560, dy = (y - 560) / 360;
    if (dx * dx + dy * dy < 1 || y > 830) continue;
    out.push({ img: ["pino", "arbol", "pino2", "arbol2", "pino"][Math.floor(r() * 5)], x, y, t: 70 + r() * 40 });
  }
  return out.sort((a, b) => a.y - b.y);
}
function oroMolino() {
  if (!J.molino) { J.molino = { t: Date.now() }; guardar(); }
  return Math.min(MOLINO_MAX, Math.floor((Date.now() - J.molino.t) / 3600e3 * MOLINO_HORA));
}
function recogerMolino(cerca) {
  const n = oroMolino(); if (n < 1) return 0;
  J.oro += n; J.molino.t = Date.now(); guardar(); SFX.moneda(); SFX.moneda();
  if (cerca) flotaMapa(cerca, `+${n}`);
  return n;
}
let vistaMapa = null;    // {s, x, y}: se recuerda al volver al campamento
function flotaMapa(el, txt) { const f = h("div", { class: "flota oro", style: "left:50%;top:0" }, txt); el.append(f); setTimeout(() => f.remove(), 950); }

function pintarCampamento() {
  terminarMejoras();
  const r = rango(J.lp), t = hoy(), finde = esFinde(t), hecho = hechasHoy() > 0;
  const titulo = J.equipo.titulo ? BOTIN.find(b => b.id === J.equipo.titulo).titulo : "Vikingkriger";
  const lun = lunesDe(t), hechasSemana = [0, 1, 2, 3, 4].filter(i => J.dias[masDias(lun, i)] > 0).length;
  const m = ES.misiones[1];

  // ---- el mundo ----
  const mundo = h("div", { class: "mundo", style: `width:${MUNDO.w}px;height:${MUNDO.h}px` },
    h("div", { class: "playa" }), h("div", { class: "mar" }));
  const pon = (o, clase) => { const el = h("img", { class: "objeto-mapa " + (clase || ""), src: K(o.img), alt: "", draggable: "false",
    style: `left:${o.x}px;top:${o.y}px;width:${o.t}px` + (o.tile ? ";transform:translate(-50%,-50%)" : "") }); mundo.append(el); return el; };
  decorado().forEach(o => pon(o));
  // barco vikingo en la playa y, si hoy toca y no ha jugado, el barco del capitán acercándose
  mundo.append(h("div", { class: "barco", style: "left:470px;top:960px" }, ic("drakkar", "", "#6b4a2b")));
  if (!finde && !hecho) {
    const avance = Math.min(1, (new Date().getHours() + new Date().getMinutes() / 60) / 24);
    mundo.append(h("div", { class: "barco enemigo", style: `left:${1480 - avance * 420}px;top:${960 + avance * 10}px`, title: "Capitán Rodrigo kommer ved midnatt" }, ic("drakkar", "", "#c2413a")));
  }
  // escudo (hoy ya jugó) o fuego (te atacaron y aún no te has vengado)
  if (hecho && !finde) mundo.append(h("div", { class: "escudo-mapa", style: "left:340px;top:280px;width:920px;height:640px", title: "Skjold: leiren er trygg i dag" }));
  // edificios
  for (const P of PARCELAS) {
    const nivel = J.edif[P.id], bloq = P.bloq && !(J.misiones[P.bloq - 1] > 0) && P.bloq > 1;
    const el = h("div", { class: "edificio" + (bloq ? " bloq" : ""), style: `left:${P.x}px;top:${P.y}px;width:${P.t}px;z-index:${Math.round(P.y)}` },
      h("img", { src: K(P.img), alt: P.n, draggable: "false" }));
    if (P.id === "molino") el.append(h("img", { class: "aspas", src: K("aspas"), alt: "", draggable: "false" }));
    const etiqueta = bloq ? `🔒 ${P.n}` : nivel ? `${P.n} · nv. ${nivel}` : P.n;
    el.append(h("div", { class: "cartel" }, etiqueta));
    if (J.mejora && J.mejora.id === P.id) el.append(h("div", { class: "obra" }, "🔨 ", cuenta(J.mejora.fin - Date.now())));
    if (J.fuego === P.id) el.append(h("img", { class: "fuego-mapa", src: K("fuego"), alt: "", draggable: "false" }), h("img", { class: "fuego-mapa f2", src: K("fuego"), alt: "", draggable: "false" }));
    if (P.id === "molino" && oroMolino() >= MOLINO_HORA) el.append(h("div", { class: "burbuja-oro", title: "Samle inn" }, ic("two-coins", "", "#e0b04f"), " +" + oroMolino()));
    el.addEventListener("click", e => { if (vistaMapa && vistaMapa.arrastrado) return; e.stopPropagation(); SFX.madera(); abrirEdificio(P, el); });
    mundo.append(el);
  }
  // aldeanos y guerreros que pasean
  const caminantes = [["aldeano", 640, 600], ["aldeana", 900, 640], ["vikingo", 780, 760], ["vikingo2", 560, 480]].map(([img, x, y]) => {
    const el = h("img", { class: "aldeano", src: K(img), alt: "", draggable: "false", style: `left:${x}px;top:${y}px` }); mundo.append(el); return el; });

  // ---- HUD encima del mapa ----
  const estado = finde
    ? h("div", { class: "estado finde" }, ic("campfire", "g"), "Helg. Ingen angrep. Hvil ved bålet, kriger.")
    : hecho
      ? h("div", { class: "estado seguro" }, ic("viking-shield", "g"), `Leiren er trygg i dag. ${hechasHoy()} tokt gjort.`)
      : h("div", { class: "estado peligro" }, ic("burning-embers", "g"), "Ingen tokt i dag! Ved midnatt angriper Capitán Rodrigo.");
  const hud = h("div", { class: "hud-mapa" },
    h("div", { class: "hud-izq" }, avatar(), h("div", null, h("div", { class: "nombre" }, J.nombre), h("div", { class: "dim", style: "font-size:.85em" }, titulo),
      h("div", { class: "rango", style: `color:${r.c}` }, ic("laurels-trophy", "", r.c), `${r.n} · ${J.lp} LP`),
      h("div", { class: "barra", style: "width:150px", title: r.sig ? `${r.sig.lp - J.lp} LP til ${r.sig.n}` : "Høyeste rang" }, h("i", { style: `width:${Math.round(r.pct * 100)}%` })))),
    h("div", { class: "hud-centro" }, estado),
    h("div", { class: "hud-der" }, h("div", { class: "pastilla", title: "Gull" }, ic("two-coins", "", "#e0b04f"), " " + J.oro),
      h("div", { class: "pastilla", title: "Denne uka (man–fre)" }, "📅 " + hechasSemana + "/5"),
      h("button", { class: "btn icono", title: "Innstillinger", onclick: ajustes }, "⚙️")),
    h("div", { class: "hud-abajo-izq" }, h("button", { class: "btn redondo", onclick: abrirVenner, title: "Venner og liga" }, "👥", h("small", null, "Venner")),
      h("button", { class: "btn redondo", onclick: inventario, title: "Smia: byttet ditt" }, "🎒", h("small", null, "Bytte")),
      h("a", { href: "#", class: "faint", onclick: e => { e.preventDefault(); creditos(); } }, "Kreditter")),
    h("div", { class: "hud-abajo-der" }, h("button", { class: "btn-tokt", onclick: () => cartaTokt(m) }, "⚔️", h("span", null, hecho ? "NYTT TOKT" : "TOKT"))));

  const mapa = h("div", { class: "mapa" }, mundo);
  pantalla(mapa, hud);
  $("#app").classList.add("pantalla-mapa");
  montarVista(mapa, mundo);
  pasear(caminantes);
  TECLAS.enter = () => cartaTokt(m);
}
/* Arrastrar para moverse y rueda (o pellizco) para el zoom. */
function montarVista(vp, mundo) {
  const W = MUNDO.w, H = MUNDO.h;
  const minS = () => Math.max(vp.clientWidth / W, vp.clientHeight / H);
  let v = vistaMapa || (() => { const s = Math.max(minS(), Math.min(vp.clientWidth / 1300, vp.clientHeight / 1000, 1.2)); return { s, x: vp.clientWidth / 2 - 800 * s, y: vp.clientHeight / 2 - 570 * s }; })();
  vistaMapa = v;
  function aplicar() {
    v.s = Math.min(1.8, Math.max(minS(), v.s));
    v.x = Math.min(0, Math.max(vp.clientWidth - W * v.s, v.x)); v.y = Math.min(0, Math.max(vp.clientHeight - H * v.s, v.y));
    mundo.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.s})`;
  }
  function zoom(f, cx, cy) { const s0 = v.s; v.s = v.s * f; aplicar(); const k = v.s / s0; v.x = cx - (cx - v.x) * k; v.y = cy - (cy - v.y) * k; aplicar(); }
  const punteros = new Map(); let ini = null, dist0 = 0;
  vp.addEventListener("pointerdown", e => {
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    if (punteros.size === 1) { ini = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y }; v.arrastrado = false; }
    if (punteros.size === 2) { const [a, b] = [...punteros.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  });
  vp.addEventListener("pointermove", e => {
    if (!punteros.has(e.pointerId)) return;
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    if (punteros.size === 2) { const [a, b] = [...punteros.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dist0) zoom(d / dist0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); dist0 = d; v.arrastrado = true; return; }
    if (!ini) return;
    const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
    if (!v.arrastrado && Math.hypot(dx, dy) > 6) { v.arrastrado = true; vp.classList.add("arrastrando"); try { vp.setPointerCapture(e.pointerId); } catch (err) { } }
    if (v.arrastrado) { v.x = ini.vx + dx; v.y = ini.vy + dy; aplicar(); }
  });
  const soltar = e => { punteros.delete(e.pointerId); if (!punteros.size) { ini = null; vp.classList.remove("arrastrando"); setTimeout(() => { v.arrastrado = false; }, 0); } };
  vp.addEventListener("pointerup", soltar); vp.addEventListener("pointercancel", soltar);
  vp.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY); }, { passive: false });
  window.__aplicarMapa = aplicar;
  if (!window.__resizeMapa) { window.__resizeMapa = true; addEventListener("resize", () => { if (window.__aplicarMapa && $(".mapa")) window.__aplicarMapa(); }); }
  aplicar();
}
function pasear(caminantes) {
  const puntos = [[620, 600], [700, 700], [900, 650], [980, 560], [820, 700], [560, 520], [760, 640], [880, 760], [520, 700], [1000, 700]];
  for (const el of caminantes) {
    const mover = () => {
      if (!el.isConnected) return;
      const [x, y] = puntos[Math.floor(Math.random() * puntos.length)], x0 = parseFloat(el.style.left);
      el.style.transform = `translate(-50%,-100%) scaleX(${x < x0 ? -1 : 1})`;
      el.style.left = x + "px"; el.style.top = y + "px"; el.style.zIndex = Math.round(y);
      setTimeout(mover, 5200 + Math.random() * 2500);
    };
    setTimeout(mover, 300 + Math.random() * 2000);
  }
}
/* Ficha de un edificio (como en Clash of Clans). */
function abrirEdificio(P, el) {
  const nivel = J.edif[P.id], bloq = P.bloq && !(J.misiones[P.bloq - 1] > 0) && P.bloq > 1;
  const cuerpo = [h("img", { src: K(P.img), alt: "", style: "width:120px" }), h("h2", null, P.n + (nivel ? ` · nivå ${nivel}` : ""))];
  const fila = h("div", { class: "fila centro", style: "margin-top:14px" });
  let cerrar;
  if (bloq) cuerpo.push(h("p", { class: "dim" }, `🔒 Låses opp når du har klart oppdrag ${P.bloq - 1}: ${P.txt}.`));
  else if (P.id === "molino") {
    const n = oroMolino();
    cuerpo.push(h("p", null, `Mølla lager ${MOLINO_HORA} gull i timen (maks ${MOLINO_MAX}). Kom tilbake og samle inn!`), h("p", { class: "botin-cuenta" }, ic("two-coins", "", "#e0b04f"), ` ${n} klar`));
    fila.append(h("button", { class: "btn oro", disabled: n < 1, onclick: () => { recogerMolino(el); cerrar(); pintarCampamento(); } }, `Samle inn ${n} gull`));
  } else if (P.id === "forja") {
    cuerpo.push(h("p", null, `Her ligger byttet fra kistene: ${J.inv.length} ting. Kle deg ut som en ekte viking!`));
    fila.append(h("button", { class: "btn oro", onclick: () => { cerrar(); inventario(); } }, "Åpne smia"));
  } else if (EDIFICIOS[P.id]) {
    const E = EDIFICIOS[P.id], coste = E.coste(nivel);
    cuerpo.push(h("p", null, E.efecto(nivel)));
    if (J.fuego === P.id) cuerpo.push(h("p", { style: "color:#ff8a80" }, "🔥 Capitán Rodrigo satte fyr på den. Dra på tokt for å slukke brannen!"));
    if (J.mejora && J.mejora.id === P.id) cuerpo.push(h("p", { class: "dim" }, `🔨 Byggerne jobber. Klar om ${cuenta(J.mejora.fin - Date.now())}.`));
    else if (nivel >= E.max) cuerpo.push(h("p", { class: "dim" }, "Maks nivå."));
    else {
      cuerpo.push(h("p", { class: "faint" }, `Neste nivå: ${E.efecto(nivel + 1)}. Ferdig kl. 20:00.`));
      fila.append(h("button", { class: "btn oro", disabled: !!J.mejora || J.oro < coste, title: J.mejora ? "Byggerne dine er opptatt" : "",
        onclick: () => { J.oro -= coste; J.mejora = { id: P.id, fin: proximas20() }; guardar(); SFX.madera(); cerrar(); pintarCampamento(); } },
        ic("two-coins", "", "#2a1d05"), ` ${coste} · Oppgrader`));
      if (J.mejora) cuerpo.push(h("p", { class: "faint" }, "Byggerne dine er opptatt med en annen bygning."));
      else if (J.oro < coste) cuerpo.push(h("p", { class: "faint" }, `Du trenger ${coste - J.oro} gull til. Dra på tokt!`));
    }
  }
  fila.append(h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"));
  cerrar = modal([...cuerpo, fila]);
  TECLAS.enter = () => { cerrar(); pintarCampamento(); };
  // en el molino, tocarlo con oro listo también lo recoge directamente
  if (P.id === "molino" && oroMolino() >= MOLINO_HORA && !bloq) { /* la ficha ya ofrece el botón */ }
}
function cartaTokt(m) {
  const t = hoy(), lun = lunesDe(t);
  const semana = h("div", { class: "semana" }, ["Man", "Tir", "Ons", "Tor", "Fre"].map((n, i) => {
    const d = masDias(lun, i), ok = J.dias[d] > 0, pasado = d < t, antes = d < J.creado;
    const cl = ok ? "hecho" : d === t ? "hoy" : pasado && !antes ? "fallo" : "";
    return h("div", { class: "dia " + cl }, h("b", null, ok ? "✓" : pasado && !antes ? "✗" : ""), n);
  }));
  const ir = () => { cerrar(); asaltar(m); };
  const cerrar = modal([ic("crossed-axes", "xg"), h("div", { class: "dim" }, `Oppdrag ${m.id} · ${m.tema}`), h("h1", null, `${m.titulo}`), h("h2", { style: "color:var(--dim)" }, m.es),
    h("p", { class: "dim" }, "3 bølger + boss · ca. 8 minutter"), h("div", { class: "fila centro" }, semana), h("p", { class: "faint" }, "5/5 denne uka = kiste for perfekt uke"),
    h("div", { class: "fila centro", style: "margin-top:12px" }, h("button", { class: "btn oro grande", onclick: ir }, "⚔️ KJØR ⏎"), h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"))]);
  TECLAS.enter = ir;
}
async function abrirVenner() {
  const caja = h("div", null, h("div", { class: "dim" }, "Laster…"));
  const cerrar = modal([caja, h("div", { class: "fila centro", style: "margin-top:14px" }, h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"))], "ancho");
  pintarDuelo(caja);
}

/* Duelo por la red de casa: duelo.py (en este PC) dice cómo va cada uno esta semana. */
const DUELO = "http://127.0.0.1:8770";
async function amigoAccion(accion, codigo) {
  try { return await (await fetch(DUELO + "/amigo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion, codigo: codigo || "" }) })).json(); }
  catch (e) { return { ok: false, error: "red" }; }
}
async function ligaAccion(accion, codigo) {
  try { return await (await fetch(DUELO + "/liga", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion, codigo: codigo || "" }) })).json(); }
  catch (e) { return { ok: false, error: "red" }; }
}
/* Duelo en casa (LAN) y liga por internet con un código (duelo.py en este PC). */
const plano = (...x) => x.flat(Infinity).filter(y => y != null && y !== false);
async function pintarDuelo(caja, otraVez) {
  let d = null;
  try { const c = new AbortController(); setTimeout(() => c.abort(), 1500); d = await (await fetch(DUELO + "/duelo", { cache: "no-store", signal: c.signal })).json(); } catch (e) { }
  const info = caja.lastChild; info.innerHTML = "";
  const repintar = () => pintarDuelo(caja, true);
  const fila = (n, x, der) => h("div", { style: "margin-top:6px" }, h("div", { class: "fila entre" }, h("b", null, n), h("span", null, `${x.hechos}/${x.minimo}`, x.hechos >= x.minimo ? " ✅" : "", der || "")),
    h("div", { class: "barra" }, h("i", { style: `width:${Math.min(100, x.hechos / Math.max(1, x.minimo) * 100)}%` })));
  if (!d) { info.append(...plano(h("h2", null, "Duell og liga"), h("div", { class: "dim" }, "Duellen er ikke i gang. Åpne spillet med «Vikingtokt» på skrivebordet."))); return; }
  if (d.amigos) {
    const A = d.amigos, kode = h("input", { class: "resp", placeholder: "Vennens kode", maxlength: 12, style: "max-width:200px;font-size:1em;padding:8px 12px", autocomplete: "off" }), feilA = h("span", { class: "faint" });
    const kopierA = h("button", { class: "btn chico", onclick: async e => { try { await navigator.clipboard.writeText(A.mi_codigo); e.target.textContent = "Kopiert ✓"; } catch (err) { } } }, "📋 Kopier");
    const legg = async () => { const r = await amigoAccion("anadir", kode.value); if (r.ok) pintarDuelo(caja); else feilA.textContent = r.error === "tuyo" ? "Det er din egen kode 😄" : r.error === "codigo" ? "Feil kode (8 tegn, f.eks. K7M4-QX2P)." : "Fikk ikke koblet til."; };
    info.append(...plano(h("h3", { style: "margin-top:0" }, "👥 Venner"),
      h("div", { class: "fila" }, h("span", { class: "faint" }, "Din vennekode:"), h("b", { class: "liga-kode" }, A.mi_codigo), kopierA),
      h("div", { class: "fila", style: "margin-top:6px" }, kode, h("button", { class: "btn chico oro", onclick: legg }, "Legg til venn"), feilA),
      A.lista.length ? A.lista.map(x => x.visto ? h("div", { class: "fila", style: "gap:6px" }, h("div", { style: "flex:1" }, fila(`${x.nombre} · ${x.idioma === "no" ? "norsk" : "spansk"}`, x, ` · 🏆 ${x.uker || 0}`)),
          h("button", { class: "btn chico", title: "Fjern venn", onclick: async () => { if (confirm(`Fjerne ${x.nombre}?`)) { await amigoAccion("quitar", x.codigo); pintarDuelo(caja); } } }, "✕"))
        : h("p", { class: "dim" }, `Venter på ${x.codigo}… (vennen må ha spillet åpent minst én gang)`))
        : h("p", { class: "dim" }, "Ingen venner ennå. Gi dem koden din, så legger de deg til!"),
      h("hr", { style: "border-color:var(--borde);margin:14px 0" })));
  }
  if (d.liga) {
    const L = d.liga;
    const kopier = h("button", { class: "btn chico", onclick: async e => { try { await navigator.clipboard.writeText(L.codigo); e.target.textContent = "Kopiert ✓"; } catch (err) { } } }, "📋 Kopier");
    info.append(...plano(h("div", { class: "fila entre" }, h("h2", null, "🏆 Liga"), h("span", { class: "fila" }, h("b", { class: "liga-kode" }, L.codigo), kopier)),
      h("div", { class: "faint" }, "Gi koden til vennene dine. De skriver den inn i sitt spill (Duell → «Bli med i en liga»). Alle som når ukeminimumet vinner uka."),
      L.miembros.map((x, i) => fila(`${["🥇", "🥈", "🥉"][i] || (i + 1) + "."} ${x.nombre}${x.yo ? " (deg)" : ""} · ${x.idioma === "no" ? "norsk" : "spansk"}`, x, ` · 🏆 ${x.uker || 0}`)),
      L.miembros.length < 2 ? h("p", { class: "dim" }, "Ingen andre ennå. Del koden!") : null,
      L.en_linea === false ? h("p", { class: "faint" }, "⚠️ Ingen internett akkurat nå: viser det siste vi vet.") : null,
      h("div", { class: "fila", style: "margin-top:10px" }, h("span", { class: "faint" }, "🏆 = uker der de nådde minimumet."),
        h("button", { class: "btn chico", onclick: async () => { if (confirm("Forlate ligaen?")) { await ligaAccion("salir"); repintar(); } } }, "Forlat ligaen"))));
    if (!otraVez) setTimeout(repintar, 4000);   // la primera vez trae a los demás en unos segundos
    return;
  }
  const m = d.marcador || { yo: 0, rival: 0 };
  info.append(...plano(h("div", { class: "fila entre" }, h("h2", null, `Duell: du mot ${d.rival ? d.rival.nombre : "Elena"}`), h("span", { class: "dim", title: "Uker vunnet" }, `Stilling ${m.yo}–${m.rival}`)),
    h("div", { class: "faint" }, "Hjemme (samme wifi). Den som når ukeminimumet (5/5) vinner uka."),
    fila(J.nombre, d.yo), d.rival ? fila(d.rival.nombre, d.rival)
      : h("p", { class: "dim" }, "Elena er ikke sett ennå. Begge PC-ene må være på samme wifi, med appen hennes eller duellen i gang.")));
  const kode = h("input", { class: "resp", placeholder: "Kode, f.eks. K7M4-QX2P", maxlength: 12, style: "max-width:240px;font-size:1em;padding:8px 12px", autocomplete: "off" });
  const feil = h("span", { class: "faint" });
  info.append(...plano(h("h3", { style: "margin-top:14px" }, "🏆 Liga med venner (over internett)"),
    h("div", { class: "fila" }, h("button", { class: "btn chico oro", onclick: async () => { const r = await ligaAccion("crear"); if (r.ok) pintarDuelo(caja); else feil.textContent = "Fikk ikke laget ligaen."; } }, "Lag en liga"),
      kode, h("button", { class: "btn chico", onclick: async () => { const r = await ligaAccion("unirse", kode.value); if (r.ok) pintarDuelo(caja); else feil.textContent = r.error === "codigo" ? "Feil kode. Den har 8 tegn, f.eks. K7M4-QX2P." : "Fikk ikke koblet til."; } }, "Bli med i en liga"), feil)));
}
function inventario() {
  const lista = J.inv.map(id => BOTIN.find(b => b.id === id)).filter(Boolean);
  const cerrar = modal([ic("anvil", "xg"), h("h2", null, "Smia · byttet ditt"),
    lista.length ? h("p", { class: "dim" }, "Klikk på en ting for å ta den på.") : h("p", { class: "dim" }, "Ikke noe bytte ennå. Åpne kister etter tokt!"),
    h("div", { class: "inventario" }, lista.map(b => {
      const puesto = J.equipo[b.tipo] === b.id;
      return h("div", { class: "objeto" + (puesto ? " puesto" : ""), style: `--rc:${RAREZAS[b.r].c};--ic:${b.color || "#fff"};cursor:pointer`,
        onclick: () => { J.equipo[b.tipo] = puesto ? null : b.id; guardar(); cerrar(); inventario(); pintarCampamento(); } },
        ic(b.ic, "g"), h("div", null, b.n), h("div", { class: "faint" }, puesto ? "Har på" : NOMBRE_RAREZA[b.r]));
    })),
    h("div", { class: "fila centro", style: "margin-top:16px" }, h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"))]);
}
function ajustes() {
  const vol = h("span", { class: "dim" }, J.ajustes.volumen + " %");
  let prueba = null;
  const cerrar = modal([h("h2", null, "⚙️ Innstillinger"),
    h("label", { class: "fila centro", style: "margin-top:14px" }, "🔉 Volum",
      h("input", { type: "range", min: 0, max: 100, step: 5, value: J.ajustes.volumen, oninput: e => {
        J.ajustes.volumen = +e.target.value; vol.textContent = J.ajustes.volumen + " %"; guardar();
        clearTimeout(prueba); prueba = setTimeout(() => { SFX.moneda(); decir("¡Hola, vikingo!", "h"); }, 300);
      } }), vol),
    h("label", { class: "fila centro" }, h("input", { type: "checkbox", checked: J.ajustes.auto, onchange: e => { J.ajustes.auto = e.target.checked; guardar(); } }), "Spill spansk lyd automatisk"),
    h("div", { class: "fila centro", style: "margin-top:16px" },
      h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"),
      h("button", { class: "btn chico rojo", onclick: () => { if (confirm("Slette leiren din og begynne på nytt?") && confirm("Sikker? Dette kan ikke angres.")) { localStorage.removeItem(CLAVE); location.reload(); } } }, "Nullstill"))]);
}
function creditos() {
  const autores = {};
  for (const [icono, a] of Object.entries(AUTORES_ICONOS)) (autores[a] = autores[a] || []).push(icono);
  const cerrar = modal([h("h2", null, "Kreditter"), h("div", { class: "creditos" },
    h("p", null, "Ikoner fra ", h("a", { href: "https://game-icons.net", target: "_blank", style: "color:var(--oro)" }, "game-icons.net"), " (CC BY 3.0):"),
    h("ul", null, Object.entries(autores).map(([a, l]) => h("li", null, `Ikoner laget av ${a}: ${l.join(", ")}`))),
    h("p", null, "Kart og bygninger: Kenney «Medieval RTS» (CC0, kenney.nl). Skrifter: Cinzel og Lexend (SIL Open Font License). Spanske stemmer: Microsoft Edge tekst-til-tale.")),
  h("button", { class: "btn", onclick: () => cerrar() }, "Lukk")]);
}

/* ================= ASALTO ================= */
let enAsalto = false;
async function asaltar(m) {
  if (enAsalto) return; enAsalto = true;
  const st = { aciertos: 0, total: 0, combo: 0, comboMax: 0, oro: 0 };
  SFX.cuerno();
  try {
    for (let i = 0; i < m.oleadas.length; i++) {
      const o = m.oleadas[i], etiqueta = o.tipo === "runa" ? "Rune" : `Bølge ${m.oleadas.slice(0, i + 1).filter(x => x.tipo !== "runa").length}/3`;
      if (o.tipo === "grito") await olaGrito(o, st, etiqueta);
      else if (o.tipo === "runa") await olaRuna(o, st);
      else if (o.tipo === "carrera") await olaCarrera(o, st, etiqueta);
      else if (o.tipo === "forja") await olaForja(o, st, etiqueta);
    }
    await jefe(m, st);
    if (IA && m.jefe.bonus) await bonusIA(m.jefe, st);
    await resultado(m, st);
  } catch (e) { if (e !== "salir") console.error(e); }
  finally { enAsalto = false; }
  pintarCampamento();
}
function hud(etiqueta, st, extra) {
  const combo = h("span", { class: "combo" + (st.combo >= 3 ? " caliente" : "") }, st.combo >= 2 ? `x${st.combo} KOMBO` : "");
  const oro = h("span", { class: "botin-cuenta", title: "Gull på dette toktet" }, ic("two-coins", "", "#e0b04f"), " " + st.oro);
  return h("div", { class: "hud" },
    h("button", { class: "btn chico", onclick: () => { if (confirm("Forlate toktet? Du mister byttet.")) salir(); } }, "✕"),
    h("span", { class: "oleada" }, etiqueta), extra || null, h("span", { style: "flex:1" }), combo, oro);
}
let salirRaid = null;
function salir() { if (salirRaid) salirRaid(); }
function esperarSalida(p) { return Promise.race([p, new Promise((_, rej) => { salirRaid = () => rej("salir"); })]); }
function flota(escena, txt, clase, x, y) {
  const f = h("div", { class: "flota " + clase, style: `left:${x ?? 50}%;top:${y ?? 40}%` }, txt);
  escena.append(f); setTimeout(() => f.remove(), 950);
}
function acierto(st, escena, x, y, oro) {
  st.aciertos++; st.total++; st.combo++; st.comboMax = Math.max(st.comboMax, st.combo);
  const g = (oro || 2) + (oro === 1 ? 0 : st.combo >= 5 ? 2 : st.combo >= 3 ? 1 : 0); st.oro += g;   // en la byttejakt, 1 fijo
  SFX.golpe(); SFX.moneda(); if (st.combo >= 2) SFX.combo(st.combo);
  const bc = $(".hud .botin-cuenta"), cb = $(".hud .combo");
  if (bc) bc.lastChild.textContent = " " + st.oro;
  if (cb) { cb.textContent = st.combo >= 2 ? `x${st.combo} KOMBO` : ""; cb.classList.toggle("caliente", st.combo >= 3); }
  if (escena) {
    escena.classList.remove("destello"); void escena.offsetWidth; escena.classList.add("destello");
    flota(escena, `+${g}`, "oro", x, y);
    if (st.combo === 3 || st.combo === 5 || st.combo % 10 === 0) flota(escena, st.combo >= 5 ? "BERSERK!" : `x${st.combo}!`, "combo", 50, 22);
  }
}
function fallo(st, escena) {
  st.total++; st.combo = 0; SFX.mal();
  const cb = $(".hud .combo"); if (cb) cb.textContent = "";
  if (escena) { escena.classList.remove("temblor"); void escena.offsetWidth; escena.classList.add("temblor"); }
}

/* Pregunta con 2-4 opciones. Pasa sola al acertar (rápido) o al fallar (enseña la buena). */
function pregunta({ etiqueta, st, grande, sub, audio, ops, ok }) {
  return new Promise(res => {
    const escena = h("div", { class: "escena" });
    const botones = ops.map((o, i) => h("button", { class: "op", onclick: () => elegir(i) }, h("span", { class: "k" }, i + 1), o));
    escena.append(h("div", { class: "fila centro" }, h("div", { class: "palabra" }, grande), audio ? bAudio(audio[0], audio[1]) : null),
      h("div", { class: "traduccion" }, sub || ""), h("div", { class: "opciones" }, botones));
    pantalla(hud(etiqueta, st), escena);
    let hecho = false;
    function elegir(i) {
      if (hecho || i >= ops.length) return; hecho = true;
      const bien = ops[i] === ok;
      botones.forEach((b, j) => { b.disabled = true; if (ops[j] === ok) b.classList.add("bien"); else if (j === i) b.classList.add("mal"); });
      if (bien) acierto(st, escena); else fallo(st, escena);
      setTimeout(() => res(bien), bien ? 650 : 1500);
    }
    TECLAS.num = elegir;
    if (audio) { TECLAS.espacio = () => decir(audio[0], audio[1]); if (J.ajustes.auto) setTimeout(() => decir(audio[0], audio[1]), 150); }
  });
}

async function olaGrito(o, st, etiqueta) {
  await cartel(o.titulo, o.info, "hunting-horn", st, etiqueta);
  const cola = azar(o.items, o.cuantos || 8).map(x => ({ x, rep: false })), todas = o.items.map(x => x[1]);
  let n = 0;
  while (cola.length) {
    const { x: [es, en], rep } = cola.shift(); n++;
    const ok = await esperarSalida(pregunta({ etiqueta: `${etiqueta} · ${o.titulo}${rep ? " · igjen" : ""}`, st, grande: es, audio: [es, "m"],
      ops: barajar([en, ...azar(todas.filter(t => t !== en), 3)]), ok: en }));
    if (!ok && !rep) cola.push({ x: [es, en], rep: true });
  }
}
async function olaRuna(o, st) {
  await esperarSalida(new Promise(res => {
    pantalla(hud("Rune", st), h("div", { class: "escena runa" }, ic("rune-stone", "xg"), h("h1", null, o.titulo),
      o.texto.map(p => h("p", null, p)),
      h("div", null, o.ejemplos.map(([es, en]) => h("div", { class: "ejemplo", onclick: () => decir(es, "m") }, "🔊", h("b", null, es), h("span", { class: "en" }, en)))),
      h("div", { class: "fila centro", style: "margin-top:18px" }, h("button", { class: "btn oro", onclick: res }, "Skjønner ⏎"))));
    TECLAS.enter = res;
    if (J.ajustes.auto) decir(o.ejemplos[0][0], "m");
  }));
}
async function olaCarrera(o, st, etiqueta) {
  await cartel(o.titulo, o.info, "coins-pile", st, etiqueta);
  const fin = Date.now() + (o.segundos || 45) * 1000, todas = o.items.map(x => x[1]);
  let cola = barajar(o.items), cogidas = 0;
  const barraT = h("i", { style: "width:100%" });
  while (Date.now() < fin) {
    if (!cola.length) cola = barajar(o.items);
    const [es, en] = cola.shift();
    const ok = await esperarSalida(new Promise(res => {
      const escena = h("div", { class: "escena" });
      const ops = barajar([en, ...azar(todas.filter(t => t !== en), 2)]);
      const botones = ops.map((op, i) => h("button", { class: "op", onclick: () => elegir(i) }, h("span", { class: "k" }, i + 1), op));
      escena.append(h("div", { class: "tiempo" }, barraT), h("div", { class: "fila centro", style: "margin-top:10px" }, h("span", { class: "botin-cuenta" }, `Tatt: ${cogidas}`)),
        h("div", { class: "palabra" }, es), h("div", { class: "opciones" }, botones));
      pantalla(hud(`${etiqueta} · ${o.titulo}`, st), escena);
      let hecho = false;
      const reloj = setInterval(() => { const q = fin - Date.now(); barraT.style.width = Math.max(0, q / ((o.segundos || 45) * 10)) + "%"; if (q <= 0) { clearInterval(reloj); if (!hecho) { hecho = true; res(null); } } }, 100);
      function elegir(i) {
        if (hecho || i >= ops.length) return; hecho = true; clearInterval(reloj);
        const bien = ops[i] === en;
        botones.forEach((b, j) => { b.disabled = true; if (ops[j] === en) b.classList.add("bien"); else if (j === i) b.classList.add("mal"); });
        if (bien) acierto(st, escena, 50, 30, 1); else fallo(st, escena);
        setTimeout(() => res(bien), bien ? 250 : 700);
      }
      TECLAS.num = elegir;
    }));
    if (ok === null) break;
    if (ok) cogidas++; else cola.push([es, en]);
  }
  SFX.victoria();
  await esperarSalida(new Promise(res => {
    pantalla(hud(etiqueta, st), h("div", { class: "escena runa" }, ic("coins-pile", "xg", "#e0b04f"), h("h1", null, `${cogidas} ord tatt!`),
      h("p", null, `Du forstår allerede ${cogidas} spanske ord. Ikke verst for første dag, viking.`),
      h("button", { class: "btn oro", onclick: res }, "Neste ⏎")));
    TECLAS.enter = res;
  }));
}
async function olaForja(o, st, etiqueta) {
  await cartel(o.titulo, o.info, "anvil", st, etiqueta);
  const items = azar(o.items, o.cuantos || 4);
  for (let n = 0; n < items.length; n++) {
    const [es, en] = items[n];
    const palabras = es.replace(/[¿?¡!.,]/g, "").split(/\s+/).filter(Boolean);
    await esperarSalida(new Promise(res => {
      const escena = h("div", { class: "escena" }), destino = h("div", { class: "fichas destino" }), origen = h("div", { class: "fichas" });
      let orden = barajar(palabras.map((_, i) => i)); if (orden.length > 1 && orden.every((x, i) => x === i)) orden.reverse();
      const puestas = [];
      function pintar() {
        destino.innerHTML = ""; origen.innerHTML = "";
        puestas.forEach((idx, k) => destino.append(h("button", { class: "ficha", onclick: () => { puestas.splice(k, 1); pintar(); } }, palabras[idx])));
        orden.filter(i => !puestas.includes(i)).forEach(i => origen.append(h("button", { class: "ficha", onclick: () => { puestas.push(i); SFX.madera(); pintar(); if (puestas.length === palabras.length) comprobar(); } }, palabras[i])));
      }
      function comprobar() {
        const frase = puestas.map(i => palabras[i]).join(" "), bien = norm(frase) === norm(es);
        origen.innerHTML = "";
        if (bien) acierto(st, escena, 50, 30, 4); else fallo(st, escena);
        escena.append(h("div", { class: "fila centro", style: "margin-top:10px" }, h("b", { style: `color:${bien ? "var(--verde)" : "#ff8a80"}` }, bien ? "✓ " : "✗ Riktig: "), h("b", null, es), bAudio(es, "m")));
        decir(es, "m");
        setTimeout(res, bien ? 1300 : 2600);
      }
      escena.append(h("div", { class: "traduccion" }, `${n + 1}/${items.length}`), h("div", { class: "palabra", style: "font-size:1.6em" }, en), destino, origen);
      pantalla(hud(`${etiqueta} · ${o.titulo}`, st), escena);
      pintar();
    }));
  }
}
function cartel(titulo, info, icono, st, etiqueta) {
  return esperarSalida(new Promise(res => {
    pantalla(hud(etiqueta, st), h("div", { class: "escena runa" }, ic(icono, "xg", "#e0b04f"), h("div", { class: "dim" }, etiqueta), h("h1", null, titulo),
      h("p", null, info), h("button", { class: "btn oro grande", onclick: res }, "KJØR ⏎")));
    TECLAS.enter = res;
  }));
}

/* ================= JEFE ================= */
async function jefe(m, st) {
  const J0 = m.jefe;
  for (;;) {
    const gano = await combate(J0, st);
    if (gano) return;
    const otra = await esperarSalida(new Promise(res => {
      SFX.derrota(); decir(J0.pierde, "h");
      pantalla(hud("Boss", st), h("div", { class: "escena runa" }, ic("shield-impact", "xg", "#c2413a"), h("h1", null, "Kastet tilbake til skipet!"),
        h("p", null, `«${J0.pierde}» — ${J0.pierde_no}`), h("button", { class: "btn rojo grande", onclick: () => res(true) }, "KJEMP IGJEN ⏎")));
      TECLAS.enter = () => res(true);
    }));
    if (!otra) return;
  }
}
async function combate(B, st) {
  let vida = B.vida, escudos = 3;
  const golpe = Math.ceil(B.vida / B.rondas.length);
  const cola = B.rondas.map(r => r);
  // Entrada del capitán
  await esperarSalida(new Promise(res => {
    pantalla(hud("BOSS", st), h("div", { class: "escena runa" }, ic("crested-helmet", "xxg", "#c2413a"), h("div", { class: "dim" }, B.titulo), h("h1", null, B.nombre),
      h("div", { class: "bocadillo", style: "display:inline-block" }, B.entra, h("span", { class: "en" }, B.entra_no)),
      h("div", { style: "margin-top:16px" }, h("button", { class: "btn rojo grande", onclick: res }, "KJEMP ⏎"))));
    TECLAS.enter = res; SFX.cuerno(); decir(B.entra, "h");
  }));
  while (vida > 0 && escudos > 0 && cola.length) {
    const r = cola.shift();
    const bien = await esperarSalida(new Promise(res => {
      const retrato = ic("crested-helmet", "xxg retrato");
      const barraV = h("i", { style: `width:${vida / B.vida * 100}%` });
      const esc = h("div", { class: "escudos", title: "Skjoldene dine" }, [0, 1, 2].map(i => ic(i < escudos ? "viking-shield" : "shield-impact", "g " + (i < escudos ? "" : "roto"))));
      const escena = h("div", { class: "escena" });
      const zona = h("div", { style: "margin-top:16px" });
      escena.append(h("div", { class: "jefe" }, retrato, h("div", null,
        h("div", { class: "fila entre" }, h("h2", null, B.nombre), esc),
        h("div", { class: "vida", title: `${vida} HP` }, barraV),
        h("div", { class: "bocadillo" }, h("span", null, r.dice, " ", bAudio(r.dice, "h")), h("span", { class: "en" }, r.no)))), zona);
      pantalla(hud("BOSS", st), escena);
      TECLAS.espacio = () => decir(r.dice, "h");
      if (J.ajustes.auto) setTimeout(() => decir(r.dice, "h"), 200);
      let hecho = false;
      function final(ok) {
        if (hecho) return; hecho = true;
        if (ok) {
          vida = Math.max(0, vida - golpe); barraV.style.width = (vida / B.vida * 100) + "%";
          retrato.classList.add("golpe"); acierto(st, escena, 25, 35, 6); flota(escena, `-${golpe}`, "dano", 18, 18);
        } else {
          escudos--; fallo(st, escena); esc.children[escudos] && esc.children[escudos].replaceWith(ic("shield-impact", "g roto"));
          cola.push(r);
        }
        setTimeout(() => res(ok), ok ? 900 : 1700);
      }
      if (r.escribe) {
        const inp = h("input", { class: "resp", placeholder: r.pista, autocomplete: "off", spellcheck: "false" });
        const enviar = () => {
          if (hecho || !inp.value.trim()) return;
          const u = norm(inp.value), mm = u.match(/^(?:yo )?(me llamo|soy|mi nombre es)\s+\S+/), casi = !mm && lev(u.split(" ").slice(0, 2).join(" "), "me llamo") <= 2 && u.split(" ").length >= 3;
          const ok = !!mm || casi;
          inp.disabled = true;
          zona.append(h("p", { style: `color:${ok ? "var(--verde)" : "#ff8a80"};font-weight:700` }, ok ? (casi ? "≈ Nesten perfekt: «Me llamo ...»" : "✓ ¡Muy bien!") : `✗ Si: «Me llamo ${J.nombre}.»`));
          final(ok);
        };
        zona.append(inp, h("div", { class: "fila", style: "margin-top:10px" }, h("button", { class: "btn oro", onclick: enviar }, "Svar ⏎")));
        TECLAS.enter = enviar; setTimeout(() => inp.focus(), 50);
      } else {
        const ok = r.ok.replace("{nombre}", J.nombre), ops = barajar([ok, ...r.malas]);
        const botones = ops.map((o, i) => h("button", { class: "op", onclick: () => elegir(i) }, h("span", { class: "k" }, i + 1), o));
        function elegir(i) {
          if (hecho || i >= ops.length) return;
          botones.forEach((b, j) => { b.disabled = true; if (ops[j] === ok) b.classList.add("bien"); else if (j === i) b.classList.add("mal"); });
          final(ops[i] === ok);
        }
        zona.append(h("div", { class: "opciones" }, botones));
        TECLAS.num = elegir;
      }
    }));
    void bien;
  }
  if (vida > 0) return false;
  st.oro += 30;
  await esperarSalida(new Promise(res => {
    SFX.victoria(); decir(B.gana, "h");
    pantalla(hud("SEIER", st), h("div", { class: "escena runa" }, ic("crossed-axes", "xxg", "#e0b04f"), h("h1", null, "¡VICTORIA!"),
      h("div", { class: "bocadillo", style: "display:inline-block" }, B.gana, h("span", { class: "en" }, B.gana_no)),
      h("p", { class: "botin-cuenta" }, "+30 gull fra bossen"), h("button", { class: "btn oro grande", onclick: res }, "HENT BYTTET ⏎")));
    TECLAS.enter = res;
  }));
  return true;
}

/* ================= BONUS: frase libre corregida por DeepSeek ================= */
async function preguntarIA(texto, contexto) {
  try {
    const c = new AbortController(); setTimeout(() => c.abort(), 30000);
    const r = await fetch("api/ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto, contexto }), signal: c.signal });
    return await r.json();
  } catch (e) { return { error: "red" }; }
}
function bonusIA(B, st) {
  const b = B.bonus;
  return esperarSalida(new Promise(res => {
    const escena = h("div", { class: "escena" }), zona = h("div", { style: "margin-top:14px" });
    const inp = h("input", { class: "resp", placeholder: "Me llamo … Soy de …", autocomplete: "off", spellcheck: "false", maxlength: 200 });
    const enviarB = h("button", { class: "btn oro", onclick: mandar }, "Send ⏎");
    escena.append(h("div", { class: "jefe" }, ic("crested-helmet", "xg retrato"), h("div", null,
      h("div", { class: "fila entre" }, h("h2", null, "Bonus: +20 gull"), h("span", { class: "faint" }, "DeepSeek retter")),
      h("div", { class: "bocadillo" }, h("span", null, b.dice, " ", bAudio(b.dice, "h")), h("span", { class: "en" }, b.no)))),
      h("p", null, b.tarea), inp, h("div", { class: "fila", style: "margin-top:10px" }, enviarB,
        h("button", { class: "btn chico", onclick: () => res() }, "Hopp over")), zona);
    pantalla(hud("BONUS", st), escena);
    TECLAS.enter = mandar; setTimeout(() => inp.focus(), 50);
    if (J.ajustes.auto) setTimeout(() => decir(b.dice, "h"), 200);
    async function mandar() {
      const t = inp.value.trim(); if (!t || inp.disabled) return;
      inp.disabled = true; enviarB.disabled = true; TECLAS.enter = null;
      zona.replaceChildren(h("p", { class: "dim" }, "Kapteinen leser… ⏳"));
      const r = await preguntarIA(t, b.contexto);
      zona.innerHTML = "";
      if (r.error) {
        zona.append(h("p", { class: "dim" }, r.error === "sin_clave" ? "DeepSeek er ikke satt opp (mangler nøkkel). Ingen fare!" : "Kapteinen svarer ikke nå (ingen forbindelse). Ingen fare!"),
          h("button", { class: "btn oro", onclick: () => res() }, "Fortsett ⏎"));
        TECLAS.enter = () => res(); return;
      }
      if (r.ok) {
        acierto(st, escena, 50, 30, 20); SFX.victoria();
        zona.append(h("p", { style: "color:var(--verde);font-weight:700;font-size:1.2em" }, "✓ ¡Perfecto! ", r.ros || ""),
          h("button", { class: "btn oro", onclick: () => res() }, "Fortsett ⏎"));
        TECLAS.enter = () => res(); return;
      }
      fallo(st, escena);
      const rep = h("input", { class: "resp", placeholder: "Skriv den riktige setningen", autocomplete: "off", spellcheck: "false" });
      const ok2 = h("button", { class: "btn oro", onclick: repetir }, "Svar ⏎");
      zona.append(h("div", { class: "evento", style: "border-color:var(--oro)" }, h("div", { class: "faint" }, "Riktig:"), h("b", { style: "font-size:1.2em" }, r.corregida), " ", bAudio(r.corregida, "m"),
        r.forklaring ? h("div", { style: "margin-top:6px" }, r.forklaring) : null), h("p", null, "Skriv den riktige setningen for å få gullet:"), rep, h("div", { class: "fila", style: "margin-top:10px" }, ok2));
      TECLAS.enter = repetir; setTimeout(() => rep.focus(), 50);
      function repetir() {
        if (rep.disabled || !rep.value.trim()) return;
        rep.disabled = true; ok2.disabled = true;
        const bien = lev(norm(rep.value), norm(r.corregida)) <= 2;
        if (bien) acierto(st, escena, 50, 30, 15); else fallo(st, escena);
        zona.append(h("p", { style: `font-weight:700;color:${bien ? "var(--verde)" : "#ff8a80"}` }, bien ? "✓ ¡Muy bien! +15 gull" : "Nesten! Neste gang klarer du det."),
          h("button", { class: "btn oro", onclick: () => res() }, "Fortsett ⏎"));
        TECLAS.enter = () => res();
      }
    }
  }));
}

/* ================= RESULTADO Y COFRE ================= */
async function resultado(m, st) {
  const t = hoy(), primera = !(J.dias[t] > 0), extras = Math.max(0, (J.dias[t] || 0) - 1);
  const pct = st.total ? st.aciertos / st.total : 1;
  const lpAntes = J.lp, rAntes = rango(J.lp);
  const lp = primera ? 15 + Math.round(pct * 10) : extras < 3 ? 5 : 0;
  const oro = Math.round(st.oro * (1 + 0.1 * (J.edif.salon - 1)));
  J.dias[t] = (J.dias[t] || 0) + 1; J.misiones[m.id] = (J.misiones[m.id] || 0) + 1;
  J.oro += oro; J.lp += lp; if (primera) J.fuego = null; guardar();
  const rDespues = rango(J.lp), sube = rDespues.i > rAntes.i;
  // semana perfecta: 5 de 5 de lunes a viernes
  const lun = lunesDe(t), perfecta = !esFinde(t) && [0, 1, 2, 3, 4].every(i => J.dias[masDias(lun, i)] > 0) && !J.semanasPerfectas[lun];
  if (perfecta) { J.semanasPerfectas[lun] = true; guardar(); }
  await esperarSalida(new Promise(res => {
    if (sube) SFX.victoria();
    pantalla(h("div", { class: "escena runa" }, ic("laurels-trophy", "xg", rDespues.c), h("h1", null, "Toktet er ferdig"),
      h("p", null, `Treff ${Math.round(pct * 100)} % · beste kombo x${st.comboMax}`),
      h("p", { class: "botin-cuenta" }, `+${oro} gull · +${lp} LP`),
      sube ? h("h2", { style: `color:${rDespues.c}` }, `⬆ NY RANG: ${rDespues.n}!`) : h("p", { class: "dim" }, `${rDespues.n} · ${J.lp} LP`),
      primera && !esFinde(t) ? h("p", { style: "color:var(--verde);font-weight:700" }, "🛡️ Leiren din er trygg i dag.") : null,
      lpAntes === J.lp && !primera ? h("p", { class: "faint" }, "Ekstra tokt i dag gir fortsatt gull og kister.") : null,
      h("button", { class: "btn oro grande", onclick: res }, "ÅPNE KISTEN ⏎")));
    TECLAS.enter = res;
  }));
  await abrirCofre(false);
  if (perfecta) await abrirCofre(true);
}
function tirar(minimo) {
  const orden = ["common", "rare", "epic", "legendary"];
  let r, x = Math.random() * 100;
  for (const k of orden) { if (x < RAREZAS[k].p) { r = k; break; } x -= RAREZAS[k].p; }
  if (minimo && orden.indexOf(r) < orden.indexOf(minimo)) r = minimo;
  const pool = BOTIN.filter(b => b.r === r);
  return pool[Math.floor(Math.random() * pool.length)];
}
function abrirCofre(perfecto) {
  return esperarSalida(new Promise(res => {
    const premio = tirar(perfecto ? "epic" : null);
    const caja = h("div", { class: "caja" }, ic("chest", "xxg"));
    const zona = h("div");
    let golpes = 0;
    const info = h("p", { class: "dim" }, "Klikk på kisten 3 ganger for å knuse den!");
    caja.onclick = () => {
      if (golpes >= 3) return; golpes++;
      caja.classList.remove("sacude"); void caja.offsetWidth; caja.classList.add("sacude"); SFX.madera();
      info.textContent = golpes < 3 ? `${3 - golpes} til…` : "";
      if (golpes === 3) {
        caja.style.setProperty("--brillo", RAREZAS[premio.r].c); caja.classList.add("brilla");
        setTimeout(revelar, 450);
      }
    };
    function revelar() {
      caja.replaceChildren(ic("open-treasure-chest", "xxg"));
      SFX.premio(premio.r);
      let extra = "";
      if (premio.oro) { J.oro += premio.oro; extra = `+${premio.oro} gull`; }
      else if (J.inv.includes(premio.id)) { J.oro += 30; extra = "Duplikat → +30 gull"; }
      else { J.inv.push(premio.id); extra = "Lagt i smia di"; }
      guardar();
      const c = RAREZAS[premio.r].c;
      zona.append(h("div", { class: "premio", style: `--rc:${c};--ic:${premio.color || c}` }, h("div", { class: "rareza" }, NOMBRE_RAREZA[premio.r]), ic(premio.ic, "xg"),
        h("h2", { style: "color:var(--texto)" }, premio.n), h("div", { class: "dim" }, extra), premio.dato ? h("p", { class: "faint", style: "max-width:360px" }, premio.dato) : null),
        h("div", { class: "fila centro", style: "margin-top:16px" },
          premio.tipo && !premio.oro && J.inv.includes(premio.id) && J.equipo[premio.tipo] !== premio.id
            ? h("button", { class: "btn", onclick: e => { J.equipo[premio.tipo] = premio.id; guardar(); e.target.remove(); } }, "Ta på") : null,
          h("button", { class: "btn oro", onclick: res }, "Fortsett ⏎")));
      TECLAS.enter = res;
    }
    pantalla(h("div", { class: "escena cofre" },
      h("h1", null, perfecto ? "KISTE FOR PERFEKT UKE" : "Tokt-kiste"), perfecto ? h("p", { style: "color:var(--epico);font-weight:700" }, "5/5 denne uka: episk eller bedre garantert!") : null,
      caja, info, zona,
      h("div", { class: "probabilidades" }, "Sjanser: ", Object.entries(RAREZAS).map(([k, v], i) => [i ? " · " : "", h("b", { style: `color:${v.c}` }, NOMBRE_RAREZA[k]), ` ${v.p} %`]),
        perfecto ? " (denne kisten: episk eller bedre)" : "", h("br"), "Aldri ekte penger. Kister får du bare fra tokt.")));
    TECLAS.enter = () => caja.click(); TECLAS.espacio = () => caja.click();
  }));
}

/* ================= el cuerno de las 20:00 ================= */
function cuerno() {
  const t = hoy(), ahora = new Date();
  if (esFinde(t) || hechasHoy() > 0 || ahora.getHours() < 20 || enAsalto || $(".fondo")) return;
  if (J.cuerno.f !== t) J.cuerno = { f: t, n: 0, prox: 0 };
  if (Date.now() < J.cuerno.prox) return;
  SFX.cuerno(); decir("¡Vikingo! ¡A la batalla!", "h");
  const cerrar = modal([ic("hunting-horn", "xg"), h("h1", null, "Krigshornet lyder!"), h("p", null, "Klokka er 20:00. Tid for tokt, viking. Hopper du over, brenner Capitán Rodrigo leiren din ved midnatt."),
    h("div", { class: "fila centro", style: "margin-top:14px" },
      h("button", { class: "btn oro grande", onclick: () => { cerrar(); asaltar(ES.misiones[1]); } }, "⚔️ TOKT NÅ"),
      J.cuerno.n < 2 ? h("button", { class: "btn", onclick: () => { J.cuerno.n++; J.cuerno.prox = Date.now() + 10 * 60e3; guardar(); cerrar(); } }, `+10 min (jeg er i et spill) · ${2 - J.cuerno.n} igjen`) : null)], "rojo");
  if (J.cuerno.n >= 2) J.cuerno.prox = Infinity;
  guardar();
}

/* ================= arranque ================= */
function bienvenida() {
  const inp = h("input", { class: "resp", placeholder: "Vikingnavnet ditt", maxlength: 20, autocomplete: "off" });
  const empezar = () => {
    const n = inp.value.trim(); if (!n) { inp.focus(); return; }
    J.nombre = n.charAt(0).toUpperCase() + n.slice(1); guardar(); SFX.cuerno(); pintarCampamento(); setTimeout(cuerno, 4000);
  };
  pantalla(h("div", { class: "panel runa", style: "margin-top:8vh" }, ic("drakkar", "xxg", "#e0b04f"), h("h1", null, "Skipet ditt når Spania"),
    h("p", null, "Du er en viking. Leiren din står på stranden. For å erobre Spania må du snakke spansk."),
    h("p", { class: "dim" }, "Dra på tokt hver ukedag (man–fre), så mange ganger du vil. Hopper du over en ukedag, brenner spanjolene leiren din."),
    h("div", { style: "max-width:360px;margin:16px auto" }, inp), h("button", { class: "btn oro grande", onclick: empezar }, "GÅ I LAND ⏎")));
  TECLAS.enter = empezar; setTimeout(() => inp.focus(), 50);
}
async function arrancar() {
  await cargar();
  if (SERVIDOR) setInterval(() => fetch("api/ping", { cache: "no-store" }).catch(() => { }), 30000);
  setInterval(() => { if (!J.nombre) return; if (!enAsalto && !$(".fondo")) terminarMejoras(); cuerno(); }, 30000);
  if (!J.nombre) return bienvenida();
  const ev = revisarAusencias();
  pintarCampamento();
  if (ev.length) {
    SFX.derrota();
    decir(ES.misiones[1].burla, "h");
    const cerrar = modal([ic("burning-embers", "xg"), h("h1", null, "Mens du var borte…"),
      ev.map(e => h("div", { class: "evento" }, h("b", null, new Date(e.d + "T12:00").toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "short" })), ": Capitán Rodrigo ", e.txt, e.lp ? ` (−${e.lp} LP)` : "")),
      h("div", { class: "bocadillo" }, ES.misiones[1].burla, h("span", { class: "en" }, ES.misiones[1].burla_no)),
      h("p", { class: "dim" }, "Dra på tokt i dag og oppgrader palisaden for å stoppe ham."),
      h("button", { class: "btn rojo grande", onclick: () => { cerrar(); pintarCampamento(); } }, "HEVN ⏎")], "rojo");
    TECLAS.enter = () => { cerrar(); pintarCampamento(); };
  }
  if (/[?&]tokt=1/.test(location.search) && !ev.length) { history.replaceState(null, "", location.pathname); asaltar(ES.misiones[1]); return; }   // viene del aviso de las 20:00
  setTimeout(cuerno, 1500);
}
arrancar();

})();
