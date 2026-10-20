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
/* Economía (plan aprobado por Elena el 20-oct-2026): el mismo pueblo de A1 a B2, un capítulo por nivel de español.
   En A1 todo llega al nivel 5; los niveles de A2, B1 y B2 se calculan al llegar. El Langhuset manda: nadie lo pasa.
   Precios = subir al nivel 2, 3, 4 y 5. Ajustar cuando él lleve 2 semanas jugando. */
const KAPITTEL = "A1", MAKS_NIVEL = 5;
const PRECIOS = { salon: [500, 1200, 2000, 3000], empalizada: [300, 700, 1200, 1800], molino: [300, 800, 1400, 2000], forja: [400, 900, 1500, 2200] };
const MOLINO = [{ h: 6, max: 48 }, { h: 8, max: 80 }, { h: 10, max: 120 }, { h: 12, max: 160 }, { h: 15, max: 200 }];
const PRIS_DUP = { common: 15, rare: 40, epic: 120, legendary: 400 };     // lo que paga el Markedet por un duplicado
const coste = id => l => PRECIOS[id][l - 1];
const EDIFICIOS = {
  salon: { n: "Langhuset", ic: "viking-longhouse", coste: coste("salon"), efecto: l => l > 1 ? `+${10 * (l - 1)} % gull fra tokt` : "Hjemmet ditt. Oppgrader for mer gull.", max: MAKS_NIVEL },
  empalizada: { n: "Palisaden", ic: "palisade", coste: coste("empalizada"), efecto: l => l > 1 ? `Stopper ${l - 1} spansk${l > 2 ? "e" : "t"} angrep før de når gullet ditt` : "Oppgrader for å beskytte gullet ditt.", max: MAKS_NIVEL },
  molino: { n: "Mølla", ic: "coins-pile", coste: coste("molino"), efecto: l => `${MOLINO[l - 1].h} gull i timen, plass til ${MOLINO[l - 1].max}`, max: MAKS_NIVEL },
  forja: { n: "Smia", ic: "anvil", coste: coste("forja"), efecto: l => l > 1 ? `+${3 * (l - 1)} % sjanse for sjelden i kistene` : "Oppgrader for bedre kister.", max: MAKS_NIVEL },
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
  return { v: 1, nombre: "", creado: hoy(), revisado: masDias(hoy(), -1), oro: 30, lp: 0, edif: { salon: 1, empalizada: 1, molino: 1, forja: 1 }, mejora: null, dup: {}, taverna: { f: "", n: 0 },
    beste: {}, skjold: 0, vennetokt: { f: "", gjort: [] }, hevn: {}, angrepSett: [],
    dias: {}, misiones: {}, inv: [], equipo: { casco: null, arma: null, escudo: null, titulo: null },
    semanasPerfectas: {}, cuerno: { f: "", n: 0, prox: 0 }, ajustes: { volumen: 50, auto: true } };
}
let J, SERVIDOR = false, IA = false;
function completar(x) { const j = Object.assign(nueva(), x); j.ajustes = Object.assign(nueva().ajustes, x.ajustes || {}); j.edif = Object.assign(nueva().edif, x.edif || {}); return j; }
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
/* Rekke (Elena, 20 oct: «strikes de conexión a los 5 días, tiene recompensa»): días de clase seguidos con tokt.
   El finde ni cuenta ni rompe. Cada 5 días, una kiste episk o mejor; cada 20, legendarisk. */
function rachaHasta(f) {
  let n = 0;
  for (let d = f; d >= J.creado; d = masDias(d, -1)) { if (esFinde(d)) continue; if (J.dias[d] > 0) n++; else break; }
  return n;
}
const racha = () => { const t = hoy(); return rachaHasta(J.dias[t] > 0 || esFinde(t) ? t : masDias(t, -1)); };

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
    const r = Math.min(J.oro, 300, Math.max(10, Math.round(J.oro * 0.25)));
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
  else if (/^[1-4]$/.test(e.key) && TECLAS.num) { e.preventDefault(); TECLAS.num(+e.key - 1); }     // tecla 1 = primera opción
  else if (e.key === " " && TECLAS.espacio) { e.preventDefault(); TECLAS.espacio(); }
});

/* ================= capas: avisos y modales ================= */
function modal(contenido, clase) {
  const capa = $("#capa"), f = h("div", { class: "fondo" }, h("div", { class: "modal " + (clase || "") }, contenido));
  if (!/rojo|fija/.test(clase || "")) f.addEventListener("pointerdown", e => { if (e.target === f) f.remove(); });   // clic fuera = cerrar (los avisos rojos, no)
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
/* Colores (Elena, 20 oct: «3 colores de mapa y 3 tonos de cada edificio, que elijan»). */
const TEMAS = [{ k: "sommer", n: "Sommer", suf: "", fondo: "#4caf50" }, { k: "host", n: "Høst", suf: "_host", fondo: "#c49a2c" }, { k: "vinter", n: "Vinter", suf: "_vinter", fondo: "#e8f4fb" }];
const TONOS = ["", "_c1", "_c2"];
const CON_TONO = new Set(["salon", "forja", "taberna", "casa1", "casa2", "casa3", "granero", "choza", "tienda", "muralla", "molino", "mercado"]);
const CON_TEMA = new Set(["arbol", "arbol2", "pino", "pino2", "arbusto", "arbusto2", "hierba", "campo", "campo2"]);
const HUS = new Set(["casa1", "casa2", "casa3", "granero", "choza", "tienda"]);     // las casas de adorno comparten un color
const tema = () => TEMAS.find(t => t.k === J.tema) || TEMAS[0];
function arte(n, id) {
  if (CON_TEMA.has(n)) return K(n + tema().suf);
  if (CON_TONO.has(n)) return K(n + TONOS[(J.colores || {})[id || (HUS.has(n) ? "hus" : n)] || 0]);
  return K(n);
}
/* Pueblo en cuadrícula (Elena, 20 oct: «la cuadrícula es el pueblo entero: ellos eligen dónde colocar las cosas, como Clash of Clans»).
   Cada cosa tiene una base de casillas; el dibujo mide justo lo ancho de su base y lo alto sube hacia atrás.
   Lo que está más abajo tapa a lo que tiene detrás. No se giran. */
const CELDA = 40, REJ = { x: 200, y: 80, cols: 40, filas: 20 };     // zona edificable: x 200-1800, y 80-880
const MUNDO = { w: 2000, h: 1250 };
const PARCELAS = [
  { id: "salon", img: "salon", n: "Langhuset" }, { id: "empalizada", img: "muralla", n: "Palisaden" },
  { id: "forja", img: "forja", n: "Smia" }, { id: "molino", img: "molino", n: "Mølla" },
  { id: "taberna", img: "taberna", n: "Tavernaen", bloq: 3, txt: "mat og drikke" }, { id: "mercado", img: "mercado", n: "Markedet", bloq: 5, txt: "tall og priser" },
];
// q = lo que cuesta quitarlo cuando sale como obstáculo (Elena: «no tan caros como Clash of Clans»; la economía se ajusta al final)
const TIPOS = {
  salon: { w: 5, h: 5, edif: "salon" }, puerta: { w: 5, h: 2, edif: "empalizada" },
  forja: { w: 4, h: 4, edif: "forja" }, molino: { w: 4, h: 4, edif: "molino" },
  taberna: { w: 3, h: 3, edif: "taberna" }, mercado: { w: 3, h: 3, edif: "mercado" },
  muro: { muro: true, n: "Palisade" },
  casa1: { w: 2, h: 2, n: "Hus", p: 120 }, casa2: { w: 2, h: 2, n: "Hus", p: 120 }, casa3: { w: 2, h: 2, n: "Steinhus", p: 160 },
  granero: { w: 3, h: 3, n: "Låve", p: 140 }, tienda: { w: 2, h: 2, n: "Telt", p: 70 }, choza: { w: 2, h: 2, n: "Hytte", p: 100 },
  campo: { w: 2, h: 2, plano: true, n: "Åker", p: 40 }, campo2: { w: 2, h: 2, plano: true, n: "Kornåker", p: 40 },
  pino: { n: "Gran", p: 30, q: 10 }, arbol: { n: "Tre", p: 30, q: 10 }, arbusto: { n: "Busk", p: 20, q: 5 }, arbusto2: { n: "Bærbusk", p: 24, q: 5 },
  roca2: { n: "Stein", p: 20, q: 5 }, roca: { n: "Steinrøys", p: 40, q: 10 }, tronco: { n: "Tømmerstokk", p: 20, q: 5 },
  pozo: { n: "Brønn", p: 80 }, fuego: { n: "Bål", p: 50 }, cobre: { n: "Kobberåre", p: 80 }, oro: { n: "Gullåre", p: 120 }, estatua: { n: "Statue", p: 160 },
  // pynt especial: solo se compra en el Markedet
  gullstatue: { n: "Gullstatue", p: 300 }, banner_r: { n: "Rødt banner", p: 300 }, banner_b: { n: "Blått banner", p: 300 }, banner_g: { n: "Grønt banner", p: 300 },
  gullbronn: { n: "Gullbrønn", p: 600 }, storstatue: { w: 2, h: 2, img: "gullstatue", n: "Stor gullstatue", p: 1000 },
};
const ESPECIALES = ["gullstatue", "banner_r", "banner_b", "banner_g", "gullbronn", "storstatue"];
/* Lo que ocupa cada dibujo de Kenney (x0, y0, x1, y1 dentro de sus 128 px): se recorta para que lo ancho sea justo su base. */
const CAJA = {
  salon: [8, 4, 120, 124], muralla: [4, 52, 124, 128], forja: [4, 4, 124, 124], molino: [12, 4, 116, 124], taberna: [20, 4, 108, 124],
  mercado: [32, 24, 96, 104], granero: [20, 4, 108, 124], casa1: [20, 4, 108, 124], casa2: [20, 16, 108, 112], casa3: [12, 16, 116, 112],
  tienda: [20, 48, 108, 128], choza: [20, 56, 108, 128], campo: [0, 0, 128, 128], campo2: [0, 0, 128, 128], pino: [37, 16, 90, 112],
  arbol: [46, 20, 84, 112], arbusto: [44, 40, 84, 86], arbusto2: [44, 37, 84, 84], roca: [26, 32, 102, 96], roca2: [32, 36, 96, 92],
  tronco: [28, 50, 100, 80], pozo: [32, 24, 96, 104], fuego: [43, 0, 86, 96], cobre: [26, 30, 102, 100], oro: [26, 30, 102, 100], estatua: [44, 28, 84, 100],
  gullstatue: [44, 28, 84, 100], gullbronn: [32, 24, 96, 104], banner_r: [56, 8, 109, 113], banner_b: [56, 8, 109, 113], banner_g: [56, 8, 109, 113],
};
function dibujo(n, src, W) {     // devuelve [elemento, alto]: el dibujo recortado, W px de ancho
  const [x0, y0, x1, y1] = CAJA[n] || [0, 0, 128, 128], k = W / (x1 - x0), H = Math.round((y1 - y0) * k);
  return [h("div", { class: "recorte", style: `width:${W}px;height:${H}px` },
    h("img", { src, alt: "", draggable: "false", style: `width:${128 * k}px;left:${-x0 * k}px;top:${-y0 * k}px` })), H];
}
const TIENDA = ["muro", "pino", "arbol", "arbusto", "arbusto2", "roca2", "roca", "tronco", "campo", "campo2", "pozo", "fuego", "tienda", "choza", "casa1", "casa2", "casa3", "granero", "cobre", "oro", "estatua"];
const tipo = t => Object.assign({ w: 1, h: 1, img: t }, TIPOS[t], TIPOS[t] && TIPOS[t].edif ? { img: PARCELAS.find(p => p.id === TIPOS[t].edif).img } : {});
const tipoEdif = id => Object.keys(TIPOS).find(k => TIPOS[k].edif === id);
const bloqueado = P => !!(P.bloq && P.bloq > 1 && !(J.misiones[P.bloq - 1] > 0));
let modoBygg = false, pyntValgt = null, seleccion = null;
function pynt() { J.pynt = J.pynt || { lager: {}, plassert: [] }; return J.pynt; }
/* Pueblo de partida ordenado. Tavernaen y Markedet no salen: los coloca él cuando se desbloquean. */
function mapaInicial() {
  const o = [["salon", 17, 5], ["puerta", 17, 12], ["forja", 9, 5], ["molino", 26, 5], ["pozo", 16, 11],
    ["casa1", 9, 10], ["casa2", 11, 10], ["casa3", 26, 10], ["granero", 28, 10], ["campo", 32, 5], ["campo2", 32, 7]];
  // anillo de palisade alrededor del Langhuset, con la puerta hacia la playa (29 tramos)
  for (let c = 15; c <= 23; c++) o.push(["muro", c, 4]);
  for (let r = 5; r <= 12; r++) o.push(["muro", 15, r], ["muro", 23, r]);
  for (const c of [15, 16, 22, 23]) o.push(["muro", c, 13]);
  const objs = o.map(([t, c, r], i) => ({ u: i + 1, t, c, r }));
  // obstáculos: árboles y piedras que se quitan con un poco de oro
  [["pino", 2, 2], ["roca", 5, 3], ["arbol", 10, 2], ["arbusto", 16, 2], ["pino", 23, 2], ["roca2", 29, 3], ["arbol", 35, 2], ["pino", 38, 5],
    ["roca2", 1, 12], ["arbol", 4, 15], ["tronco", 9, 17], ["arbusto2", 14, 17], ["roca", 25, 17], ["pino", 31, 17], ["arbusto", 36, 14], ["roca2", 38, 18], ["pino", 2, 18]]
    .forEach(([t, c, r]) => objs.push({ u: objs.length + 1, t, c, r, hind: 1 }));
  return { v: 2, sig: objs.length + 1, objs };
}
function mapa() {
  if (!J.mapa || J.mapa.v !== 2) {
    // mapa de antes: sus adornos comprados van al lager (los que traía el mapa viejo de regalo, no)
    const P = pynt(), regalo = { casa1: 1, casa2: 1, casa3: 1, granero: 1, campo: 1, campo2: 1, pozo: 1, arbusto: 1, pino: 1, arbol: 1 };
    const guardarEn = t => { P.lager[t] = (P.lager[t] || 0) + 1; };
    for (const o of (J.mapa && J.mapa.objs) || []) { const T = tipo(o.t); if (T.edif || T.muro || o.hind) continue; if (regalo[o.t]) regalo[o.t]--; else guardarEn(o.t); }
    for (const x of P.plassert || []) guardarEn(x.id);
    P.plassert = [];
    J.mapa = mapaInicial(); guardar();
  }
  return J.mapa;
}
const limiteMuro = () => 30 + 10 * ((J.edif.empalizada || 1) - 1);
const murosPuestos = () => mapa().objs.filter(o => o.t === "muro").length;
function ocupadas(excepto) {
  const s = new Set();
  for (const o of mapa().objs) {
    if (o === excepto) continue;
    const T = tipo(o.t);
    for (let i = 0; i < T.w; i++) for (let j = 0; j < T.h; j++) s.add((o.c + i) + "," + (o.r + j));
  }
  return s;
}
function cabe(t, c, r, excepto) {
  const T = tipo(t);
  if (c < 0 || r < 0 || c + T.w > REJ.cols || r + T.h > REJ.filas) return false;
  const s = ocupadas(excepto);
  for (let i = 0; i < T.w; i++) for (let j = 0; j < T.h; j++) if (s.has((c + i) + "," + (r + j))) return false;
  return true;
}
/* dónde va cada cosa: su base pegada abajo a sus casillas; lo de más abajo, delante */
function situar(el, t, c, r) {
  const T = tipo(t), pie = REJ.y + (r + T.h) * CELDA;
  el.style.left = REJ.x + c * CELDA + "px";
  el.style.top = (T.muro ? REJ.y + r * CELDA : pie - (+el.dataset.h || T.h * CELDA)) + "px";
  el.style.zIndex = T.plano ? 1 : pie;
}
const molinoNivel = () => MOLINO[Math.min(MOLINO.length, J.edif.molino || 1) - 1];      // oro por hora y tope del molino
function semilla(n) { return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }
function bosque() {     // árboles alrededor de la zona edificable (no estorban)
  const out = [], r = semilla(7);
  for (let i = 0; i < 160; i++) {
    const x = 20 + r() * 1960, y = 30 + r() * 870;
    if (x > REJ.x - 20 && x < REJ.x + REJ.cols * CELDA + 20 && y > REJ.y - 10) continue;
    out.push({ img: ["pino", "arbol", "pino2", "arbol2", "pino"][Math.floor(r() * 5)], x, y, t: 64 + r() * 40 });
  }
  return out.sort((a, b) => a.y - b.y);
}
function oroMolino() {
  if (!J.molino) { J.molino = { t: Date.now() }; guardar(); }
  const M = molinoNivel();
  return Math.min(M.max, Math.floor((Date.now() - J.molino.t) / 3600e3 * M.h));
}
function recogerMolino(cerca) {
  const n = oroMolino(); if (n < 1) return 0;
  J.oro += n; J.molino.t = Date.now(); guardar(); SFX.moneda(); SFX.moneda();
  if (cerca) flotaMapa(cerca, `+${n}`);
  return n;
}
let vistaMapa = null;    // {s, x, y}: se recuerda al volver al campamento
function flotaMapa(el, txt) { const f = h("div", { class: "flota oro", style: "left:50%;top:0" }, txt); el.append(f); setTimeout(() => f.remove(), 950); }
function aviso2(txt) { const a = h("div", { class: "aviso-mapa" }, txt); document.body.append(a); setTimeout(() => a.remove(), 2400); }

function pintarCampamento() {
  terminarMejoras();
  const r = rango(J.lp), t = hoy(), finde = esFinde(t), hecho = hechasHoy() > 0;
  const titulo = J.equipo.titulo ? BOTIN.find(b => b.id === J.equipo.titulo).titulo : "Vikingkriger";
  const lun = lunesDe(t), hechasSemana = [0, 1, 2, 3, 4].filter(i => J.dias[masDias(lun, i)] > 0).length;
  const m = ES.misiones[1], M = mapa();

  // ---- el mundo ----
  const mundo = h("div", { class: "mundo" + (modoBygg ? " bygg" : ""), style: `width:${MUNDO.w}px;height:${MUNDO.h}px;background-color:${tema().fondo};background-image:url(${arte("hierba")})` },
    h("div", { class: "playa", style: "top:905px" }), h("div", { class: "mar", style: "top:975px" }));
  if (modoBygg) mundo.append(h("div", { class: "rejilla-bygg", style: `left:${REJ.x}px;top:${REJ.y}px;width:${REJ.cols * CELDA}px;height:${REJ.filas * CELDA}px` }));
  for (const o of bosque()) mundo.append(h("img", { class: "objeto-mapa", src: arte(o.img), alt: "", draggable: "false", style: `left:${o.x}px;top:${o.y}px;width:${o.t}px` }));
  mundo.append(h("div", { class: "barco", style: "left:640px;top:1070px" }, ic("drakkar", "", "#6b4a2b")));
  if (!finde && !hecho) {
    const avance = Math.min(1, (new Date().getHours() + new Date().getMinutes() / 60) / 24);
    mundo.append(h("div", { class: "barco enemigo", style: `left:${1900 - avance * 480}px;top:${1090 + avance * 10}px`, title: "Capitán Rodrigo kommer ved midnatt" }, ic("drakkar", "", "#c2413a")));
  }
  const salon = M.objs.find(o => o.t === "salon");
  if (hecho && !finde && salon) {
    const cx = REJ.x + (salon.c + 2.5) * CELDA, cy = REJ.y + (salon.r + 2.5) * CELDA;
    mundo.append(h("div", { class: "escudo-mapa", style: `left:${cx - 600}px;top:${cy - 400}px;width:1200px;height:800px`, title: "Skjold: leiren er trygg i dag" }));
  }
  const rotulos = h("div", { class: "rotulos" }), muros = celdasMuro();
  for (const o of M.objs) mundo.append(objetoMapa(o, rotulos, muros));
  mundo.append(rotulos);
  if (modoBygg && pyntValgt) prepararColocar(mundo);
  // aldeanos y guerreros que pasean por casillas libres
  const caminantes = ["aldeano", "aldeana", "vikingo", "vikingo2"].map(img => { const el = h("img", { class: "aldeano", src: K(img), alt: "", draggable: "false" }); mundo.append(el); return el; });

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
    modoBygg ? null : h("div", { class: "hud-centro" }, estado),
    h("div", { class: "hud-der" }, h("div", { class: "pastilla", title: "Gull" }, ic("two-coins", "", "#e0b04f"), " " + J.oro),
      h("div", { class: "pastilla", title: "Denne uka (man–fre)" }, "📅 " + hechasSemana + "/5"),
      h("div", { class: "pastilla racha", title: `${racha()} ukedager på rad. Kiste hver 5. dag. Helgen bryter ikke rekka.` }, "🔥 " + racha()),
      h("button", { class: "btn icono", title: "Innstillinger", onclick: ajustes }, "⚙️", nyVersjon() ? h("i", { class: "punto", title: "Ny versjon" }) : null)),
    h("div", { class: "hud-abajo-izq" }, h("button", { class: "btn redondo", onclick: abrirVenner, title: "Venner og liga" }, "👥", h("small", null, "Venner")),
      h("button", { class: "btn redondo", onclick: inventario, title: "Smia: byttet ditt" }, "🎒", h("small", null, "Bytte")),
      h("button", { class: "btn redondo" + (modoBygg ? " activo" : ""), onclick: () => { modoBygg = !modoBygg; pyntValgt = null; seleccion = null; pintarCampamento(); }, title: "Bygg: flytt alt i leiren" }, "🛠️", h("small", null, "Bygg"),
        porColocar().some(P => !bloqueado(P)) ? h("i", { class: "punto", title: "Ny bygning å plassere" }) : null),
      h("button", { class: "btn redondo", onclick: abrirFarger, title: "Farger" }, "🎨", h("small", null, "Farger")),
      h("a", { href: "#", class: "faint", onclick: e => { e.preventDefault(); creditos(); } }, "Kreditter")),
    modoBygg ? null : h("div", { class: "hud-abajo-der" }, h("button", { class: "btn-tokt", onclick: () => cartaTokt(m) }, "⚔️", h("span", null, hecho ? "NYTT TOKT" : "TOKT"))));

  const vista = h("div", { class: "mapa" + (modoBygg ? " modo-bygg" : "") }, mundo);
  if (modoBygg) hud.append(catalogoBygg());
  pantalla(vista, hud);
  $("#app").classList.add("pantalla-mapa");
  montarVista(vista, mundo);
  pasear(caminantes);
  TECLAS.enter = modoBygg ? () => { modoBygg = false; pyntValgt = null; seleccion = null; pintarCampamento(); } : () => cartaTokt(m);
}
/* Un objeto del pueblo: edificio, tramo de empalizada, adorno u obstáculo. */
function celdasMuro() {     // casillas con palisade o con la puerta (para unir los tramos)
  const s = new Set();
  for (const o of mapa().objs) { const T = tipo(o.t); if (T.muro || T.edif === "empalizada") for (let i = 0; i < T.w; i++) for (let j = 0; j < T.h; j++) s.add((o.c + i) + "," + (o.r + j)); }
  return s;
}
function muroDibujo(izq, der) {     // poste y, si hay vecino a un lado, tablas hasta él (como en Clash of Clans)
  return h("div", { class: "muro-mapa" + (J.fuego === "empalizada" ? " quemado" : ""), style: `--madera:${["#9a6a35", "#5b6f9f", "#8a5a9a"][(J.colores || {}).empalizada || 0]}` },
    izq ? h("i", { class: "tabla izq" }) : null, der ? h("i", { class: "tabla der" }) : null, h("b", { class: "poste" }));
}
function objetoMapa(o, rotulos, muros) {
  const T = tipo(o.t), W = T.w * CELDA;
  let el;
  if (T.edif) {
    const P = PARCELAS.find(p => p.id === T.edif), nivel = J.edif[P.id], bloq = bloqueado(P);
    const [dib, H] = dibujo(P.img, arte(P.img, P.id), W);
    el = h("div", { class: "edificio" + (bloq ? " bloq" : ""), style: `width:${W}px;height:${H}px` }, dib);
    el.dataset.h = H;
    if (P.id === "molino") el.append(h("img", { class: "aspas", src: K("aspas"), alt: "", draggable: "false" }));
    if (J.fuego === P.id) el.append(h("img", { class: "fuego-mapa", src: K("fuego"), alt: "", draggable: "false" }), h("img", { class: "fuego-mapa f2", src: K("fuego"), alt: "", draggable: "false" }));
    el.addEventListener("click", e => { if (modoBygg || (vistaMapa && vistaMapa.arrastrado)) return; e.stopPropagation(); SFX.madera(); abrirEdificio(P, el); });
    // cartel siempre visible: va en su propia capa, encima de todo (el de la puerta, debajo, para no tapar el Langhuset)
    const pie = REJ.y + (o.r + T.h) * CELDA, abajo = P.id === "empalizada";
    const ro = h("div", { class: "rotulo" + (abajo ? " abajo" : ""), style: `left:${REJ.x + o.c * CELDA + W / 2}px;top:${abajo ? pie + 6 : pie - H - 4}px` },
      P.id === "molino" && oroMolino() >= molinoNivel().h ? h("div", { class: "burbuja-oro", title: "Samle inn" }, ic("two-coins", "", "#e0b04f"), " +" + oroMolino()) : null,
      h("div", { class: "cartel" }, bloq ? `🔒 ${P.n}` : nivel ? `${P.n} · nv. ${nivel}` : P.n),
      J.mejora && J.mejora.id === P.id ? h("div", { class: "obra" }, "🔨 ", cuenta(J.mejora.fin - Date.now())) : null);
    rotulos.append(ro); el._rotulo = ro;
  } else if (T.muro) {
    el = muroDibujo(muros.has((o.c - 1) + "," + o.r), muros.has((o.c + 1) + "," + o.r));
  } else {
    const [dib, H] = dibujo(T.img, arte(T.img), W);
    el = h("div", { class: "adorno" + (T.plano ? " plano" : "") + (o.hind ? " hind" : ""), style: `width:${W}px;height:${H}px` }, dib);
    el.dataset.h = H;
    if (o.hind) el.addEventListener("click", e => { if (modoBygg || (vistaMapa && vistaMapa.arrastrado)) return; e.stopPropagation(); abrirHindring(o); });
  }
  el.classList.add("obj");
  if (seleccion === o.u) el.classList.add("seleccionado");
  situar(el, o.t, o.c, o.r);
  if (modoBygg) el.addEventListener("pointerdown", e => {
    if (e.button !== 0) return; e.stopPropagation(); e.preventDefault();
    if (o.hind) { seleccion = seleccion === o.u ? null : o.u; pyntValgt = null; return pintarCampamento(); }     // los obstáculos no se mueven: se quitan
    arrastrarObjeto(o, el, e);
  });
  return el;
}
/* Obstáculo (árbol o piedra dentro del pueblo): se quita pagando un poco de oro. */
function abrirHindring(o) {
  const T = tipo(o.t);
  let cerrar;
  cerrar = modal(plano(h("img", { src: arte(o.t), alt: "", style: "width:96px" }), h("h2", null, T.n),
    h("p", { class: "dim" }, "Den står i veien. Fjern den for å få plass."),
    J.oro < T.q ? h("p", { class: "faint" }, `Du trenger ${T.q - J.oro} gull til. Dra på tokt!`) : null,
    h("div", { class: "fila centro", style: "margin-top:14px" },
      h("button", { class: "btn oro", disabled: J.oro < T.q, onclick: () => { cerrar(); fjernHindring(o); } }, ic("two-coins", "", "#2a1d05"), ` ${T.q} · Fjern`),
      h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"))));
  TECLAS.enter = () => cerrar();
}
function fjernHindring(o) {
  const T = tipo(o.t), M = mapa(), i = M.objs.indexOf(o);
  if (i < 0) return;
  if (J.oro < T.q) { SFX.mal(); aviso2(`Du trenger ${T.q - J.oro} gull til.`); return; }
  J.oro -= T.q; M.objs.splice(i, 1); seleccion = null; guardar(); SFX.moneda(); SFX.madera(); pintarCampamento();
}
/* Modo Bygg: arrastrar cualquier cosa a otra casilla (verde = cabe, rojo = no). */
function arrastrarObjeto(o, el, e0) {
  const T = tipo(o.t), v = vistaMapa, mundo = el.parentNode;
  const huella = h("div", { class: "huella", style: `width:${T.w * CELDA}px;height:${T.h * CELDA}px` });
  mundo.append(huella);
  if (el._rotulo) el._rotulo.style.visibility = "hidden";
  const aMundo = (cx, cy) => [(cx - v.x) / v.s, (cy - v.y) / v.s];
  const [wx0, wy0] = aMundo(e0.clientX, e0.clientY);
  const offC = (wx0 - REJ.x) / CELDA - o.c, offR = (wy0 - REJ.y) / CELDA - o.r;
  let c = o.c, r = o.r, ok = true, movido = false;
  const pintar = () => { huella.style.left = REJ.x + c * CELDA + "px"; huella.style.top = REJ.y + r * CELDA + "px"; ok = cabe(o.t, c, r, o); huella.classList.toggle("mal", !ok); situar(el, o.t, c, r); el.style.zIndex = 5000; };
  pintar();
  el.classList.add("arrastrado");
  const mover = e => {
    if (!movido && Math.hypot(e.clientX - e0.clientX, e.clientY - e0.clientY) < 5) return;
    movido = true;
    const [wx, wy] = aMundo(e.clientX, e.clientY);
    const c2 = Math.round((wx - REJ.x) / CELDA - offC), r2 = Math.round((wy - REJ.y) / CELDA - offR);
    if (c2 !== c || r2 !== r) { c = c2; r = r2; pintar(); }
  };
  const soltar = () => {
    removeEventListener("pointermove", mover); removeEventListener("pointerup", soltar);
    if (!movido) { seleccion = seleccion === o.u ? null : o.u; pyntValgt = null; return pintarCampamento(); }
    if (ok) { o.c = c; o.r = r; guardar(); SFX.madera(); } else { SFX.mal(); aviso2("Det er ikke plass der."); }
    seleccion = o.u; pintarCampamento();
  };
  addEventListener("pointermove", mover); addEventListener("pointerup", soltar);
}
/* Con algo elegido en la tienda: una sombra sigue al ratón; clic para ponerlo. */
function prepararColocar(mundo) {
  const t = pyntValgt, T = tipo(t), v = () => vistaMapa;
  const vista = T.muro ? muroDibujo(false, false) : dibujo(T.img, T.edif ? arte(T.img, T.edif) : arte(T.img), T.w * CELDA)[0];
  vista.classList.add("vista");
  const huella = h("div", { class: "huella fantasma", style: `width:${T.w * CELDA}px;height:${T.h * CELDA}px` }, vista);
  mundo.append(huella);
  let c = -1, r = -1;
  const celda = e => { const s = v(); const wx = (e.clientX - s.x) / s.s, wy = (e.clientY - s.y) / s.s; return [Math.round((wx - REJ.x) / CELDA - T.w / 2), Math.round((wy - REJ.y) / CELDA - T.h / 2)]; };
  mundo.addEventListener("pointermove", e => {
    [c, r] = celda(e);
    huella.style.left = REJ.x + c * CELDA + "px"; huella.style.top = REJ.y + r * CELDA + "px";
    huella.classList.toggle("mal", !cabe(t, c, r));
  });
  mundo.addEventListener("click", e => {
    if (vistaMapa && vistaMapa.arrastrado) return;
    [c, r] = celda(e);
    colocar(t, c, r);
  });
}
function colocar(t, c, r) {
  const T = tipo(t), P = pynt();
  if (!cabe(t, c, r)) { SFX.mal(); aviso2("Det er ikke plass der."); return; }
  if (T.edif) { if (bloqueado(PARCELAS.find(p => p.id === T.edif)) || mapa().objs.some(o => o.t === t)) return; pyntValgt = null; }     // edificio nuevo: gratis
  else if (T.muro) { if (murosPuestos() >= limiteMuro()) { aviso2("Ingen flere palisader. Oppgrader Palisaden for 10 til."); return; } }
  else if (P.lager[t] > 0) P.lager[t]--;
  else if (J.oro >= T.p) J.oro -= T.p;
  else { aviso2(`Du trenger ${T.p - J.oro} gull til. Dra på tokt!`); return; }
  const M = mapa(); M.objs.push({ u: M.sig++, t, c, r }); guardar(); SFX.moneda(); SFX.madera();
  pintarCampamento();
}
function aLager(u) {
  const M = mapa(), i = M.objs.findIndex(o => o.u === u); if (i < 0) return;
  const o = M.objs[i], T = tipo(o.t); if (T.edif || o.hind) return;
  M.objs.splice(i, 1);
  if (!T.muro) { const P = pynt(); P.lager[o.t] = (P.lager[o.t] || 0) + 1; }
  seleccion = null; guardar(); SFX.madera(); pintarCampamento();
}
/* Bygninger que aún no están en el pueblo: bloqueadas (🔒) o nuevas, para colocarlas gratis. */
const porColocar = () => PARCELAS.filter(P => !mapa().objs.some(o => o.t === tipoEdif(P.id)));
function catalogoBygg() {
  const P = pynt(), sel = seleccion && mapa().objs.find(o => o.u === seleccion), T = sel && tipo(sel.t);
  const barra = sel
    ? h("div", { class: "fila entre seleccion-bygg" }, h("b", null, "Valgt: ", T.edif ? PARCELAS.find(p => p.id === T.edif).n : T.n || sel.t),
        T.edif ? h("span", { class: "faint" }, "Dra den dit du vil. Bygninger kan ikke fjernes.")
          : sel.hind ? h("button", { class: "btn chico oro", disabled: J.oro < T.q, onclick: () => fjernHindring(sel) }, ic("two-coins", "", "#2a1d05"), ` ${T.q} · Fjern`)
            : h("button", { class: "btn chico", onclick: () => aLager(sel.u) }, T.muro ? "Fjern" : "↩ Til lageret"))
    : h("div", { class: "faint" }, pyntValgt ? "Klikk der du vil sette den. Rødt = ikke plass." : "Dra alt i leiren dit du vil. Eller velg noe nedenfor og klikk på kartet.");
  const nuevos = porColocar().map(E => {
    const t = tipoEdif(E.id), b = bloqueado(E);
    return h("button", { class: "pieza" + (b ? " bloq" : "") + (pyntValgt === t ? " elegida" : ""),
      onclick: () => { if (b) { aviso2(`🔒 Låses opp når du har klart oppdrag ${E.bloq - 1}: ${E.txt}.`); return; } pyntValgt = pyntValgt === t ? null : t; seleccion = null; pintarCampamento(); } },
      h("img", { src: arte(E.img, E.id), alt: "", draggable: "false" }), h("span", null, E.n), h("small", null, b ? `🔒 Oppdrag ${E.bloq - 1}` : "Ny! Gratis"));
  });
  return h("div", { class: "catalogo" },
    h("div", { class: "fila entre" }, h("b", null, "🛠️ Bygg leiren din"), h("button", { class: "btn chico oro", onclick: () => { modoBygg = false; pyntValgt = null; seleccion = null; pintarCampamento(); } }, "Ferdig ✓ ⏎")),
    barra,
    h("div", { class: "catalogo-lista" }, nuevos, [...TIENDA, ...ESPECIALES.filter(t => P.lager[t] > 0)].map(t => {
      const D = tipo(t), quedan = limiteMuro() - murosPuestos();
      return h("button", { class: "pieza" + (pyntValgt === t ? " elegida" : ""), onclick: () => { pyntValgt = pyntValgt === t ? null : t; seleccion = null; pintarCampamento(); } },
        D.muro ? h("span", { class: "pieza-muro" }, ic("palisade", "", "#c9a26b")) : h("img", { src: arte(D.img), alt: "", draggable: "false" }),
        h("span", null, D.n),
        D.muro ? h("small", null, `${quedan} igjen`) : P.lager[t] ? h("small", null, `${P.lager[t]} på lager`) : h("small", null, ic("two-coins", "", "#e0b04f"), " " + D.p));
    })));
}
/* Arrastrar para moverse y rueda (o pellizco) para el zoom. */
function montarVista(vp, mundo) {
  const W = MUNDO.w, H = MUNDO.h;
  const minS = () => Math.max(vp.clientWidth / W, vp.clientHeight / H);
  let v = vistaMapa || (() => {
    const s = Math.max(minS(), Math.min(vp.clientWidth / 1300, vp.clientHeight / 950, 1.2)), sal = mapa().objs.find(o => o.t === "salon") || { c: 17, r: 7 };
    return { s, x: vp.clientWidth / 2 - (REJ.x + (sal.c + 2.5) * CELDA) * s, y: vp.clientHeight / 2 - (REJ.y + (sal.r + 4) * CELDA) * s };
  })();
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
  const libres = () => { const s = ocupadas(); const out = []; for (let c = 2; c < REJ.cols - 2; c++) for (let r = 2; r < REJ.filas - 1; r++) if (!s.has(c + "," + r)) out.push([REJ.x + (c + .5) * CELDA, REJ.y + (r + 1) * CELDA]); return out; };
  const puntos = libres();
  if (!puntos.length) return;
  for (const el of caminantes) {
    const [x0, y0] = puntos[Math.floor(Math.random() * puntos.length)];
    el.style.transition = "none"; el.style.left = x0 + "px"; el.style.top = y0 + "px"; el.style.zIndex = Math.round(y0);
    const mover = () => {
      if (!el.isConnected) return;
      el.style.transition = "";
      const [x, y] = puntos[Math.floor(Math.random() * puntos.length)], xa = parseFloat(el.style.left);
      el.style.transform = `translate(-50%,-100%) scaleX(${x < xa ? -1 : 1})`;
      el.style.left = x + "px"; el.style.top = y + "px"; el.style.zIndex = Math.round(y);
      setTimeout(mover, 5200 + Math.random() * 2500);
    };
    setTimeout(mover, 300 + Math.random() * 2000);
  }
}
/* ---------- colores ---------- */
function selectorTono(img, id, despues) {
  const clave = id || (HUS.has(img) ? "hus" : img), actual = (J.colores || {})[clave] || 0;
  return h("div", { class: "fila centro tonos" }, h("span", { class: "faint" }, "Farge:"),
    TONOS.map((suf, i) => h("button", { class: "tono" + (i === actual ? " elegido" : ""), title: `Farge ${i + 1}`,
      onclick: () => { J.colores = J.colores || {}; J.colores[clave] = i; guardar(); SFX.madera(); despues(); } }, h("img", { src: K(img + suf), alt: "", draggable: "false" }))));
}
function abrirFarger() {
  const caja = h("div");
  const pintar = () => {
    caja.innerHTML = "";
    caja.append(...plano(h("h2", null, "🎨 Farger"), h("h3", null, "Kartet"),
      h("div", { class: "fila centro" }, TEMAS.map(t => h("button", { class: "tema-boton" + (tema().k === t.k ? " elegido" : ""), onclick: () => { J.tema = t.k; guardar(); SFX.madera(); pintarCampamento(); pintar(); } },
        h("img", { src: K("hierba" + t.suf), alt: "" }), h("img", { class: "arbol-muestra", src: K("pino" + t.suf), alt: "" }), h("span", null, t.n)))),
      h("h3", { style: "margin-top:14px" }, "Bygningene"),
      [["salon", "salon", "Langhuset"], ["muralla", "empalizada", "Palisaden"], ["forja", "forja", "Smia"], ["molino", "molino", "Mølla"], ["taberna", "taberna", "Tavernaen"], ["mercado", "mercado", "Markedet"], ["casa1", "hus", "Husene"]]
        .map(([img, id, n]) => h("div", { class: "fila entre fila-tono" }, h("b", null, n), selectorTono(img, id, () => { pintarCampamento(); pintar(); }))),
      h("div", { class: "fila centro", style: "margin-top:12px" }, h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"))));
  };
  const cerrar = modal([caja], "ancho");
  pintar();
}
/* Ficha de un edificio (como en Clash of Clans). */
function abrirEdificio(P, el) {
  const E = EDIFICIOS[P.id], nivel = J.edif[P.id], bloq = bloqueado(P);
  const cuerpo = [h("img", { src: arte(P.img, P.id), alt: "", style: "width:120px" }), h("h2", null, P.n + (E ? ` · nivå ${nivel}` : ""))];
  const fila = h("div", { class: "fila centro", style: "margin-top:14px" });
  let cerrar;
  const otraVez = () => { cerrar(); pintarCampamento(); abrirEdificio(P, el); };
  if (bloq) cuerpo.push(h("p", { class: "dim" }, `🔒 Låses opp når du har klart oppdrag ${P.bloq - 1}: ${P.txt}.`));
  else {
    if (P.id === "molino") {
      const n = oroMolino(), M = molinoNivel();
      cuerpo.push(h("p", null, `Mølla lager ${M.h} gull i timen (maks ${M.max}). Kom tilbake og samle inn!`), h("p", { class: "botin-cuenta" }, ic("two-coins", "", "#e0b04f"), ` ${n} klar`));
      fila.append(h("button", { class: "btn oro", disabled: n < 1, onclick: () => { recogerMolino(el); cerrar(); pintarCampamento(); } }, `Samle inn ${n} gull`));
    }
    if (P.id === "forja") {
      cuerpo.push(h("p", null, `Her ligger byttet fra kistene: ${J.inv.length} ting. Kle deg ut som en ekte viking!`));
      fila.append(h("button", { class: "btn oro", onclick: () => { cerrar(); inventario(); } }, "Åpne smia"));
    }
    if (P.id === "taberna") taverna(cuerpo, fila, () => cerrar);
    if (P.id === "mercado") markedet(cuerpo, () => cerrar, otraVez);
    if (E) {
      if (P.id !== "molino") cuerpo.push(h("p", null, E.efecto(nivel)));
      if (J.fuego === P.id) cuerpo.push(h("p", { style: "color:#ff8a80" }, "🔥 Capitán Rodrigo satte fyr på den. Dra på tokt for å slukke brannen!"));
      const c = E.coste(nivel);
      if (J.mejora && J.mejora.id === P.id) cuerpo.push(h("p", { class: "dim" }, `🔨 Byggerne jobber. Klar om ${cuenta(J.mejora.fin - Date.now())}.`));
      else if (nivel >= E.max) cuerpo.push(h("p", { class: "dim" }, `Maks nivå i kapittel ${KAPITTEL}. Flere nivåer kommer i neste kapittel.`));
      else if (P.id !== "salon" && nivel >= J.edif.salon) cuerpo.push(h("p", { class: "dim" }, `🔒 Oppgrader Langhuset til nivå ${nivel + 1} først. Langhuset bestemmer.`));
      else {
        cuerpo.push(h("p", { class: "faint" }, `Neste nivå: ${E.efecto(nivel + 1)}. Ferdig kl. 20:00.`));
        fila.append(h("button", { class: "btn oro", disabled: !!J.mejora || J.oro < c, title: J.mejora ? "Byggerne dine er opptatt" : "",
          onclick: () => { J.oro -= c; J.mejora = { id: P.id, fin: proximas20() }; guardar(); SFX.madera(); cerrar(); pintarCampamento(); } },
          ic("two-coins", "", "#2a1d05"), ` ${c} · Oppgrader`));
        if (J.mejora) cuerpo.push(h("p", { class: "faint" }, "Byggerne dine er opptatt med en annen bygning."));
        else if (J.oro < c) cuerpo.push(h("p", { class: "faint" }, `Du trenger ${c - J.oro} gull til. Dra på tokt!`));
      }
    }
  }
  fila.append(h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"));
  cuerpo.push(selectorTono(P.img, P.id, otraVez));
  cerrar = modal(plano(cuerpo, fila), P.id === "mercado" ? "ancho" : "");
  TECLAS.enter = () => { cerrar(); pintarCampamento(); };
}
/* Tavernaen (plan de economía): kister por oro, como mucho 3 al día. Nunca dinero real. */
const TAVERNA_KISTER = [{ n: "Kiste", p: 150, tipo: { min: null, titulo: "TAVERNA-KISTE" } },
  { n: "Stor kiste", p: 600, tipo: { min: "rare", titulo: "STOR KISTE", texto: "Sjelden eller bedre garantert!" } }];
const tavernaHoy = () => (J.taverna && J.taverna.f === hoy() ? J.taverna.n : 0);
function taverna(cuerpo, fila, cerrar) {
  const igjen = 3 - tavernaHoy();
  cuerpo.push(h("p", null, "Kjøp kister for gullet fra toktene dine. Maks 3 om dagen."), h("p", { class: "faint" }, igjen > 0 ? `${igjen} igjen i dag` : "Tavernaen er stengt til i morgen."));
  for (const K of TAVERNA_KISTER)
    fila.append(h("button", { class: "btn oro", disabled: igjen < 1 || J.oro < K.p, onclick: () => { cerrar()(); kjopKiste(K); } }, ic("chest", "", "#2a1d05"), ` ${K.n} · ${K.p}`));
  if (igjen > 0 && J.oro < TAVERNA_KISTER[0].p) cuerpo.push(h("p", { class: "faint" }, `Du trenger ${TAVERNA_KISTER[0].p - J.oro} gull til. Dra på tokt!`));
}
async function kjopKiste(K) {
  if (J.oro < K.p || tavernaHoy() >= 3) return;
  J.oro -= K.p; J.taverna = { f: hoy(), n: tavernaHoy() + 1 }; guardar(); SFX.moneda();
  try { await abrirCofre(K.tipo); } catch (e) { }
  pintarCampamento();
}
/* Markedet (plan de economía): compra los duplicados y vende pynt especial. */
function markedet(cuerpo, cerrar, otraVez) {
  const dup = Object.entries(J.dup || {}).filter(([, n]) => n > 0);
  cuerpo.push(h("h3", null, "Selg duplikater"),
    dup.length ? h("div", { class: "lista-dup" }, dup.map(([id, n]) => {
      const b = BOTIN.find(x => x.id === id), pris = PRIS_DUP[b.r];
      return h("div", { class: "fila entre fila-dup" }, h("span", null, ic(b.ic, "", b.color || RAREZAS[b.r].c), ` ${b.n} ×${n}`),
        h("button", { class: "btn chico oro", onclick: () => { J.dup[id]--; J.oro += pris; guardar(); SFX.moneda(); otraVez(); } }, ic("two-coins", "", "#2a1d05"), ` Selg · ${pris}`));
    })) : h("p", { class: "faint" }, "Ingen duplikater ennå. De kommer fra kistene."),
    h("h3", null, "Spesiell pynt"),
    h("div", { class: "catalogo-lista" }, ESPECIALES.map(t => {
      const D = tipo(t);
      return h("button", { class: "pieza", disabled: J.oro < D.p, onclick: () => {
        if (J.oro < D.p) return;
        J.oro -= D.p; const L = pynt().lager; L[t] = (L[t] || 0) + 1; guardar(); SFX.moneda(); cerrar()(); pintarCampamento(); aviso2(`${D.n} ligger på lageret. Sett den ut i 🛠️ Bygg.`);
      } }, h("img", { src: arte(D.img), alt: "", draggable: "false" }), h("span", null, D.n), h("small", null, ic("two-coins", "", "#e0b04f"), " " + D.p));
    })));
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
      A.lista.length ? A.lista.map(x => x.visto ? h("div", { class: "fila", style: "gap:6px" }, h("div", { style: "flex:1" }, fila(`${x.nombre} · ${x.idioma === "no" ? "norsk" : "spansk"}`, x, ` · 🏆 ${x.uker || 0}`),
            x.tokt && x.idioma === "es" ? h("div", { class: "faint" }, `🪙 ${x.tokt.gull} · Palisade nv. ${x.tokt.pal} · beste ${x.tokt.beste[String(felles(x))] || 0} %`) : null),
          angripKnapp(x),
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
  const versjon = h("div", { class: "fila centro", style: "margin-top:10px" });
  const pintarVersjon = () => {
    versjon.replaceChildren(...plano(!SERVIDOR ? h("span", { class: "faint" }, "Start spillet med Jugar.bat for å kunne oppdatere.")
      : nyVersjon() ? h("button", { class: "btn oro", onclick: () => { cerrar(); oppdater(); } }, `⬇️ Oppdater til versjon ${OPPD.remoto}`)
        : [h("span", { class: "faint" }, OPPD ? `Versjon ${OPPD.local}` : ""), h("button", { class: "btn chico", onclick: async e => { e.target.textContent = "…"; await sjekkOppdatering(true); pintarVersjon(); } }, "Se etter oppdatering")]));
  };
  pintarVersjon();
  let prueba = null;
  const cerrar = modal([h("h2", null, "⚙️ Innstillinger"),
    h("label", { class: "fila centro", style: "margin-top:14px" }, "🔉 Volum",
      h("input", { type: "range", min: 0, max: 100, step: 5, value: J.ajustes.volumen, oninput: e => {
        J.ajustes.volumen = +e.target.value; vol.textContent = J.ajustes.volumen + " %"; guardar();
        clearTimeout(prueba); prueba = setTimeout(() => { SFX.moneda(); decir("¡Hola, vikingo!", "h"); }, 300);
      } }), vol),
    h("label", { class: "fila centro" }, h("input", { type: "checkbox", checked: J.ajustes.auto, onchange: e => { J.ajustes.auto = e.target.checked; guardar(); } }), "Spill spansk lyd automatisk"),
    versjon,
    h("div", { class: "fila centro", style: "margin-top:16px" },
      h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"),
      h("button", { class: "btn chico rojo", onclick: () => { if (confirm("Slette leiren din og begynne på nytt?") && confirm("Sikker? Dette kan ikke angres.")) { localStorage.removeItem(CLAVE); location.reload(); } } }, "Nullstill"))]);
}
/* ================= VENNETOKT (plan aprobado por Elena, 20 oct) =================
   Atacar a un amigo = examen de 10 preguntas de las misiones que han hecho los dos (2:30).
   Gana si saca más que la mejor nota de su amigo en esa misión (o 10/10). Se lleva el 10 % de su oro (máx. 150),
   menos 1 % por cada nivel de Palisaden del amigo. Si pierde, el amigo gana 20 por defenderse. Nunca se rompen
   edificios. Un ataque por amigo y día. Quien pierde oro tiene escudo 24 h y una venganza gratis («Hevn»). */
const VT_SEG = 150;
async function hentDuelo() {
  try { const c = new AbortController(); setTimeout(() => c.abort(), 1500); return await (await fetch(DUELO + "/duelo", { cache: "no-store", signal: c.signal })).json(); }
  catch (e) { return null; }
}
const felles = x => Math.max(1, Math.min(x.tokt ? x.tokt.oppdrag || 1 : 1, Math.max(1, ...Object.keys(J.misiones).filter(k => J.misiones[k] > 0).map(Number), 1)));
function vtStatus(x) {
  const t = x.tokt, ahora = Date.now();
  if (!t || x.idioma !== "es") return null;
  const hevn = J.hevn && J.hevn[x.codigo] && J.hevn[x.codigo].til > ahora;
  if (hevn) return { ok: true, hevn: true };
  if (Math.max(t.skjold || 0, x.skjold_visto || 0) * 1000 > ahora) return { ok: false, txt: "🛡️ Skjold" };
  if (J.vennetokt && J.vennetokt.f === hoy() && J.vennetokt.gjort.includes(x.codigo)) return { ok: false, txt: "✓ I dag" };
  return { ok: true };
}
function angripKnapp(x) {
  const v = vtStatus(x);
  if (!v) return null;
  if (!v.ok) return h("span", { class: "faint", style: "white-space:nowrap" }, v.txt);
  return h("button", { class: "btn chico " + (v.hevn ? "rojo" : "oro"), onclick: () => { document.querySelectorAll(".fondo").forEach(f => f.remove()); vennetokt(x, v.hevn); } }, v.hevn ? "⚔️ HEVN" : "⚔️ Angrip");
}
function vtSporsmal(k) {     // 10 preguntas: la mitad español → noruego, la otra mitad al revés
  const pares = new Map();
  for (let i = 1; i <= k; i++) { const m = ES.misiones[i]; if (!m) continue; for (const o of m.oleadas) for (const p of (o.items || o.ejemplos || [])) if (Array.isArray(p) && p[0] && p[1]) pares.set(p[0], p); }
  const todos = [...pares.values()];
  return azar(todos, 10).map((p, i) => {
    const es = i % 2 === 0, q = es ? p[0] : p[1], ok = es ? p[1] : p[0];
    const parecidos = todos.filter(x => x !== p && (es ? x[1] : x[0]) !== ok).sort((a, b) => Math.abs((es ? a[1] : a[0]).length - ok.length) - Math.abs((es ? b[1] : b[0]).length - ok.length));
    return { q, ok, es, ops: barajar([ok, ...azar(parecidos.slice(0, 8), 3).map(x => es ? x[1] : x[0])]) };
  });
}
async function vennetokt(x, hevn) {
  const k = felles(x), beste = x.tokt.beste[String(k)] || 0, maks = Math.min(150, Math.round(x.tokt.gull * (10 - Math.min(5, x.tokt.pal - 1)) / 100));
  // 1) presentación
  const empezar = await new Promise(res => {
    pantalla(h("div", { class: "escena runa" }, ic("crossed-swords", "xxg", hevn ? "#ff6b5e" : "#e0b04f"), h("h1", null, hevn ? `HEVN mot ${x.nombre}!` : `Vennetokt mot ${x.nombre}`),
      h("p", null, `10 spørsmål · ${Math.floor(VT_SEG / 60)}:${String(VT_SEG % 60).padStart(2, "0")} min`),
      h("p", { class: "dim" }, `Slå ${x.nombre}s beste: mer enn ${beste} % riktig (eller 10 av 10).`),
      h("p", { class: "botin-cuenta" }, ic("two-coins", "", "#e0b04f"), ` Bytte: opptil ${maks} gull`),
      h("div", { class: "fila centro", style: "margin-top:14px" }, h("button", { class: "btn oro grande", onclick: () => res(true) }, "START ⏎"), h("button", { class: "btn", onclick: () => res(false) }, "Tilbake"))));
    TECLAS.enter = () => res(true);
  });
  if (!empezar) return pintarCampamento();
  // 2) el examen
  enAsalto = true; SFX.cuerno();
  const preg = vtSporsmal(k), fin = Date.now() + VT_SEG * 1000;
  let riktige = 0;
  for (let i = 0; i < preg.length && Date.now() < fin; i++) {
    const P = preg[i];
    const bien = await new Promise(res => {
      const reloj = h("i", { style: `width:${(fin - Date.now()) / (VT_SEG * 10)}%` });
      const botones = P.ops.map((o, j) => h("button", { class: "op", onclick: () => elegir(j) }, h("span", { class: "k" }, j + 1), o));
      pantalla(h("div", { class: "hud" }, h("span", { class: "oleada" }, `⚔️ ${x.nombre} · ${i + 1}/10`), h("span", { style: "flex:1" }), h("span", { class: "botin-cuenta" }, `✓ ${riktige}`)),
        h("div", { class: "barra vt-reloj" }, reloj),
        h("div", { class: "escena" }, h("div", { class: "fila centro" }, h("div", { class: "palabra" }, P.q), P.es ? bAudio(P.q, "h") : null),
          h("div", { class: "traduccion" }, P.es ? "Hva betyr det?" : "Hvordan sier man det på spansk?"), h("div", { class: "opciones" }, botones)));
      let hecho = false;
      const tic = setInterval(() => { const q = fin - Date.now(); reloj.style.width = Math.max(0, q / (VT_SEG * 10)) + "%"; if (q <= 0) { clearInterval(tic); if (!hecho) { hecho = true; res(false); } } }, 250);
      function elegir(j) {
        if (hecho || j >= P.ops.length) return; hecho = true; clearInterval(tic);
        const b = P.ops[j] === P.ok;
        botones.forEach((bt, n) => { bt.disabled = true; if (P.ops[n] === P.ok) bt.classList.add("bien"); else if (n === j) bt.classList.add("mal"); });
        if (b) { SFX.golpe(); SFX.moneda(); } else SFX.mal();
        setTimeout(() => res(b), b ? 450 : 1100);
      }
      TECLAS.num = elegir;
      if (P.es) { TECLAS.espacio = () => decir(P.q, "h"); if (J.ajustes.auto) setTimeout(() => decir(P.q, "h"), 150); }
    });
    if (bien) riktige++;
  }
  enAsalto = false;
  // 3) resultado: se manda al amigo; sin internet no cuenta (nadie gana ni pierde)
  const pct = riktige * 10, vant = pct > beste || riktige === 10, bytte = vant ? maks : 0;
  pantalla(h("div", { class: "escena runa" }, h("h2", null, "Sender…")));
  let r = { ok: false };
  try { r = await (await fetch(DUELO + "/vennetokt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kode: x.codigo, vant, gull: vant ? bytte : 20, hevn: !!hevn }) })).json(); } catch (e) { }
  if (r.ok) {
    if (vant) J.oro += bytte;
    if (hevn) delete J.hevn[x.codigo];
    else { if (!J.vennetokt || J.vennetokt.f !== hoy()) J.vennetokt = { f: hoy(), gjort: [] }; J.vennetokt.gjort.push(x.codigo); }
    guardar();
  }
  await new Promise(res => {
    if (r.ok && vant) SFX.victoria(); else if (r.ok) SFX.derrota();
    pantalla(h("div", { class: "escena runa" }, ic(vant ? "laurels-trophy" : "viking-shield", "xg", vant ? "#e0b04f" : "#9aa5b1"),
      h("h1", null, !r.ok ? "Fikk ikke sendt angrepet" : vant ? "SEIER!" : `${x.nombre} holdt stand`),
      h("p", null, `${riktige} av 10 riktig (${pct} %). ${x.nombre}s beste: ${beste} %.`),
      !r.ok ? h("p", { class: "dim" }, "Ingen internett, eller duellen er ikke i gang. Ingenting er tapt: prøv igjen senere.")
        : vant ? h("p", { class: "botin-cuenta" }, `+${bytte} gull fra ${x.nombre}`)
          : h("p", { class: "dim" }, `${x.nombre} får 20 gull for forsvaret. Øv mer og prøv i morgen!`),
      h("button", { class: "btn oro grande", onclick: res }, "Tilbake til leiren ⏎")));
    TECLAS.enter = res;
  });
  pintarCampamento();
}
/* Ataques recibidos (los trae duelo.py): se quita o se da el oro una sola vez y se avisa. */
async function sjekkAngrep() {
  if (!J.nombre || enAsalto || $(".fondo")) return;
  const d = await hentDuelo(), L = (d && d.amigos && d.amigos.angrep) || [];
  J.angrepSett = J.angrepSett || [];
  const nye = L.filter(a => !J.angrepSett.includes(a.id));
  if (!nye.length || enAsalto || $(".fondo")) return;
  J.hevn = J.hevn || {};
  for (const a of nye) {
    J.angrepSett.push(a.id);
    if (a.vant) {
      a.tap = Math.min(a.gull, J.oro); J.oro -= a.tap;
      J.skjold = Math.max(J.skjold || 0, (a.t + 86400) * 1000);
      if (!a.hevn) J.hevn[a.fra] = { navn: a.navn, til: (a.t + 86400) * 1000 };
    } else J.oro += a.gull;
  }
  J.angrepSett = J.angrepSett.slice(-60); guardar(); pintarCampamento();
  const tapt = nye.some(a => a.vant);
  if (tapt) SFX.derrota(); else SFX.victoria();
  const cerrar = modal(plano(ic("crossed-swords", "xg"), h("h2", null, "⚔️ Vennetokt!"),
    nye.map(a => h("div", { class: "evento" }, a.vant ? `${a.navn} angrep leiren din${a.hevn ? " (hevn)" : ""} og tok ${a.tap} gull.` : `${a.navn} angrep, men du holdt stand! +${a.gull} gull.`)),
    tapt ? h("p", { class: "dim" }, "🛡️ Du har skjold i 24 timer.") : null,
    h("div", { class: "fila centro", style: "margin-top:14px" },
      nye.some(a => a.vant && !a.hevn) ? h("button", { class: "btn rojo grande", onclick: () => { cerrar(); abrirVenner(); } }, "⚔️ HEVN") : null,
      h("button", { class: "btn", onclick: () => cerrar() }, "Lukk"))));
  TECLAS.enter = () => cerrar();
}
/* Oppdatering inne i spillet (Elena, 20 oct): el servidor mira version.json en GitHub y lanza actualizar.ps1. */
let OPPD = null;     // { local, remoto }
async function sjekkOppdatering(fresca) {
  if (!SERVIDOR) return null;
  try { OPPD = await (await fetch("api/version" + (fresca ? "?fresca=1" : ""), { cache: "no-store" })).json(); } catch (e) { OPPD = null; }
  return OPPD;
}
const nyVersjon = () => !!(OPPD && OPPD.remoto > OPPD.local);
function tilbyOppdatering() {
  const cerrar = modal([h("div", { style: "font-size:3em" }, "⬇️"), h("h2", null, "Ny versjon av spillet!"),
    h("p", { class: "dim" }, "Fremgangen din, gullet og leiren blir de samme."),
    h("div", { class: "fila centro", style: "margin-top:14px" },
      h("button", { class: "btn oro grande", onclick: () => { cerrar(); oppdater(); } }, "Oppdater nå ⏎"),
      h("button", { class: "btn", onclick: () => cerrar() }, "Senere"))]);
  TECLAS.enter = () => { cerrar(); oppdater(); };
}
async function oppdater() {
  const meta = OPPD && OPPD.remoto;
  const cerrar = modal([ic("hourglass", "xg"), h("h2", null, "Oppdaterer…"), h("p", { class: "dim" }, "Ikke lukk vinduet. Det tar under ett minutt.")], "fija");
  let ok = false;
  try { ok = (await (await fetch("api/oppdater", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json()).ok; } catch (e) { }
  for (let i = 0; ok && i < 60; i++) {
    await espera(3000);
    try {
      const v = await (await fetch("api/version", { cache: "no-store" })).json();
      if (v.local >= meta) {     // ya está: recarga sin caché
        for (const u of ["index.html", "juego.js", "estilo.css", "arte/iconos.js", ...Object.keys(ES.misiones).map(n => `misiones/mision${String(n).padStart(2, "0")}.js`)])
          await fetch(u, { cache: "reload" }).catch(() => { });
        location.reload(); return;
      }
    } catch (e) { }     // el servidor se está reiniciando
  }
  cerrar();
  aviso("Kunne ikke oppdatere nå. Sjekk internett og prøv igjen senere.", "hourglass");
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
  const mitad = (J.dias[t] || 0) >= 3;      // desde el 4.º tokt del día, la mitad (que no se queme)
  const oro = Math.round(st.oro * (1 + 0.1 * (J.edif.salon - 1)) * (mitad ? 0.5 : 1));
  J.dias[t] = (J.dias[t] || 0) + 1; J.misiones[m.id] = (J.misiones[m.id] || 0) + 1;
  J.beste = J.beste || {}; J.beste[m.id] = Math.max(J.beste[m.id] || 0, Math.round(pct * 100));     // su defensa en el vennetokt
  J.oro += oro; J.lp += lp; if (primera) J.fuego = null; guardar();
  const rDespues = rango(J.lp), sube = rDespues.i > rAntes.i;
  // semana perfecta: 5 de 5 de lunes a viernes (cuenta para la liga)
  const lun = lunesDe(t), perfecta = !esFinde(t) && [0, 1, 2, 3, 4].every(i => J.dias[masDias(lun, i)] > 0) && !J.semanasPerfectas[lun];
  if (perfecta) { J.semanasPerfectas[lun] = true; guardar(); }
  // rekke: con el primer tokt del día se ve si toca kiste (cada 5 días seguidos)
  const rk = racha(), premioRacha = primera && !esFinde(t) && rk > 0 && rk % 5 === 0;
  const bonusRacha = premioRacha ? (rk % 20 === 0 ? 200 : 50) : 0;
  if (bonusRacha) { J.oro += bonusRacha; guardar(); }
  await esperarSalida(new Promise(res => {
    if (sube) SFX.victoria();
    pantalla(h("div", { class: "escena runa" }, ic("laurels-trophy", "xg", rDespues.c), h("h1", null, "Toktet er ferdig"),
      h("p", null, `Treff ${Math.round(pct * 100)} % · beste kombo x${st.comboMax}`),
      h("p", { class: "botin-cuenta" }, `+${oro} gull · +${lp} LP`),
      sube ? h("h2", { style: `color:${rDespues.c}` }, `⬆ NY RANG: ${rDespues.n}!`) : h("p", { class: "dim" }, `${rDespues.n} · ${J.lp} LP`),
      primera && !esFinde(t) ? h("p", { style: "color:var(--verde);font-weight:700" }, "🛡️ Leiren din er trygg i dag.") : null,
      primera && !esFinde(t) ? h("p", { class: "racha-txt" }, `🔥 ${rk} på rad`, premioRacha ? ` · REKKEKISTE + ${bonusRacha} gull!` : ` · ${5 - rk % 5} til neste kiste`) : null,
      mitad ? h("p", { class: "faint" }, "Tokt nr. 4 eller mer i dag: halvt gull. Hjernen trenger hvile også!") : null,
      lpAntes === J.lp && !primera ? h("p", { class: "faint" }, "Ekstra tokt i dag gir fortsatt gull og kister.") : null,
      h("button", { class: "btn oro grande", onclick: res }, "ÅPNE KISTEN ⏎")));
    TECLAS.enter = res;
  }));
  await abrirCofre(null);
  if (premioRacha) {
    const leg = rk % 20 === 0;
    await abrirCofre({ min: leg ? "legendary" : "epic", titulo: "REKKEKISTE", texto: `🔥 ${rk} ukedager på rad: ${leg ? "legendarisk garantert" : "episk eller bedre garantert"}!` });
  }
}
function sjanser() {     // la Smia sube la suerte: +3 % de sjelden por nivel (sale de vanlig)
  const k = 3 * ((J.edif.forja || 1) - 1);
  return { common: RAREZAS.common.p - k, rare: RAREZAS.rare.p + k, epic: RAREZAS.epic.p, legendary: RAREZAS.legendary.p };
}
function tirar(minimo) {
  const orden = ["common", "rare", "epic", "legendary"], S = sjanser();
  let r, x = Math.random() * 100;
  for (const k of orden) { if (x < S[k]) { r = k; break; } x -= S[k]; }
  if (minimo && orden.indexOf(r) < orden.indexOf(minimo)) r = minimo;
  const pool = BOTIN.filter(b => b.r === r);
  return pool[Math.floor(Math.random() * pool.length)];
}
function abrirCofre(especial) {     // especial = { min, titulo, texto }: kiste de la rekke o de la Tavernaen
  const perfecto = !!especial;
  return esperarSalida(new Promise(res => {
    const premio = tirar(perfecto ? especial.min : null);
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
      else if (J.inv.includes(premio.id)) { J.dup = J.dup || {}; J.dup[premio.id] = (J.dup[premio.id] || 0) + 1; extra = `Duplikat → selg den på Markedet for ${PRIS_DUP[premio.r]} gull`; }
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
      h("h1", null, perfecto ? especial.titulo : "Tokt-kiste"),
      perfecto && especial.texto ? h("p", { style: `color:${especial.min ? RAREZAS[especial.min].c : "var(--oro)"};font-weight:700` }, especial.texto) : null,
      caja, info, zona,
      h("div", { class: "probabilidades" }, "Sjanser: ", Object.entries(RAREZAS).map(([k, v], i) => [i ? " · " : "", h("b", { style: `color:${v.c}` }, NOMBRE_RAREZA[k]), ` ${sjanser()[k]} %`]),
        perfecto && especial.min ? (especial.min === "legendary" ? " (denne kisten: legendarisk)" : ` (denne kisten: ${NOMBRE_RAREZA[especial.min]} eller bedre)`) : "", h("br"), "Aldri ekte penger. Gullet kommer bare fra tokt.")));
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
    racha() > 0 ? h("p", { class: "racha-txt" }, `🔥 Ikke mist rekka di: ${racha()} på rad!`) : null,
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
      rachaHasta(masDias(ev[0].d, -1)) > 0 ? h("p", { class: "racha-txt" }, `🔥 Rekka di på ${rachaHasta(masDias(ev[0].d, -1))} dager er brutt.`) : null,
      h("p", { class: "dim" }, "Dra på tokt i dag og oppgrader palisaden for å stoppe ham."),
      h("button", { class: "btn rojo grande", onclick: () => { cerrar(); pintarCampamento(); } }, "HEVN ⏎")], "rojo");
    TECLAS.enter = () => { cerrar(); pintarCampamento(); };
  }
  if (/[?&]tokt=1/.test(location.search) && !ev.length) { history.replaceState(null, "", location.pathname); asaltar(ES.misiones[1]); return; }   // viene del aviso de las 20:00
  setTimeout(cuerno, 1500);
  if (await sjekkOppdatering() && nyVersjon() && !enAsalto && !$(".fondo")) { pintarCampamento(); tilbyOppdatering(); }
  sjekkAngrep();
  setInterval(sjekkAngrep, 5 * 60e3);
}
arrancar();

})();
