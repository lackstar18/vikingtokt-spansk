"""Duelo por la red de casa (LAN): él con el español, Elena con el noruego. Solo librería estándar de Python.

Cada PC lo tiene en marcha en segundo plano:
- Lee su propio progreso y cuenta las lecciones / asaltos de esta semana (lunes a viernes, mínimo 5).
- Lo anuncia a la red de casa cada 20 s (UDP broadcast, puerto 47777) y escucha el del otro PC.
  No hace falta escribir direcciones: los dos PC se encuentran solos si están en la misma wifi o router.
- Lo sirve en http://127.0.0.1:8770/duelo (solo en este PC) para que el juego y la app lo enseñen.
- Guarda el marcador de semanas ganadas en duelo.json (junto a este archivo).
- LIGA por internet (pedido de Elena, 20 oct): con un código (K7M4-QX2P) juegan amigos de otras casas.
  Usa ntfy.sh (gratis, sin cuentas): el código es la «contraseña» del canal. Solo se envía nombre,
  idioma y lecciones de la semana. ntfy.sh guarda los mensajes 12 h: cada PC se vuelve a anunciar cada 3 h.

Uso:
  pythonw duelo.py --app es --progreso "D:/ElaraAI/Elara/espanol/progreso.json"      (el juego de español)
  pythonw duelo.py --app no --nombre Elena --progreso "D:/ElaraAI/Elara/noruego/progreso.json"
  --solo-local: prueba en un solo PC (no sale a la red)
"""
import argparse
import json
import os
import random
import re
import socket
import threading
import time
import urllib.error
import urllib.request
import uuid
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PUERTO_UDP = 47777
PUERTO_HTTP = 8770
APP = "duelo-vikingo-1"
CARPETA = os.path.dirname(os.path.abspath(__file__))
ESTADO = os.path.join(CARPETA, "duelo.json")
MINIMO = 5
APP_LIGA = "liga-vikingo-1"
NTFY = "https://ntfy.sh"
ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"      # sin 0/O, 1/I/L: se leen mal
ANUNCIO_CADA = 3 * 3600
MIRAR_CADA = 5 * 60


def lunes(d):
    return d - timedelta(days=d.weekday())


def leer(ruta):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def minimo_de(inicio, lun):
    """La semana en la que empiezas solo pide los días de clase que quedaban (igual que las dos apps)."""
    if inicio and inicio > lun:
        return max(0, MINIMO - (inicio - lun).days)
    return MINIMO


def semanas_cumplidas(app, p, ini, hoy):
    """Semanas ya terminadas en las que llegó al mínimo (para la clasificación de la liga)."""
    if not ini:
        return 0
    if app == "es":
        dias = p.get("dias") or {}
        cuenta = lambda lun: sum(1 for i in range(5) if (dias.get((lun + timedelta(days=i)).isoformat()) or 0) > 0)
    else:
        fechas = list((p.get("completados") or {}).values())
        cuenta = lambda lun: sum(1 for f in fechas if lun.isoformat() <= f <= (lun + timedelta(days=6)).isoformat())
    n, lun = 0, lunes(ini)
    while lun < lunes(hoy):
        m = minimo_de(ini, lun)
        if m > 0 and cuenta(lun) >= m:
            n += 1
        lun += timedelta(days=7)
    return n


def mis_datos(app, ruta, nombre):
    """Lo de esta semana de este PC: {nombre, idioma, semana, hechos, minimo}."""
    p, hoy = leer(ruta), date.today()
    lun = lunes(hoy)
    if app == "es":
        dias = p.get("dias") or {}
        hechos = sum(1 for i in range(5) if (dias.get((lun + timedelta(days=i)).isoformat()) or 0) > 0)
        inicio = p.get("creado")
        nombre = nombre or p.get("nombre") or "Viking"
    else:
        fechas = list((p.get("completados") or {}).values())
        hechos = sum(1 for f in fechas if lun.isoformat() <= f <= (lun + timedelta(days=6)).isoformat())
        inicio = p.get("inicio")
        nombre = nombre or "Elena"
    try:
        ini = date.fromisoformat(inicio) if inicio else None
    except ValueError:
        ini = None
    return {"nombre": nombre, "idioma": app, "semana": lun.isoformat(), "hechos": hechos,
            "minimo": minimo_de(ini, lun) if p else MINIMO, "uker": semanas_cumplidas(app, p, ini, hoy)}


def tema(codigo):
    return "vikingtokt_liga_" + codigo.replace("-", "").lower()


def codigo_nuevo():
    c = "".join(random.SystemRandom().choice(ALFABETO) for _ in range(8))
    return c[:4] + "-" + c[4:]


def codigo_valido(c):
    c = re.sub(r"[^A-Z0-9]", "", (c or "").upper())
    return c[:4] + "-" + c[4:] if len(c) == 8 and all(x in ALFABETO for x in c) else None


class Duelo:
    def __init__(self, app, ruta, nombre, solo_local, estado=ESTADO, udp_escucha=PUERTO_UDP, udp_envio=PUERTO_UDP):
        self.app, self.ruta, self.nombre, self.solo_local = app, ruta, nombre, solo_local
        self.archivo, self.udp_escucha, self.udp_envio = estado, udp_escucha, udp_envio
        self.estado = leer(estado) or {}
        self.id = self.estado.get("id") or uuid.uuid4().hex
        self.estado["id"] = self.id
        self.estado.setdefault("marcador", {"yo": 0, "rival": 0, "empates": 0})
        self.estado.setdefault("rival", None)
        self.estado.setdefault("liga", None)       # {codigo, miembros: {id: datos}, ultimo, publicado, firma}
        self.ntfy = NTFY
        self.ya_mirado = 0
        self.despertar = threading.Event()
        self.cand = threading.Lock()
        self.guardar()

    def guardar(self):
        tmp = self.archivo + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.estado, f, ensure_ascii=False)
        os.replace(tmp, self.archivo)

    def yo(self):
        return mis_datos(self.app, self.ruta, self.nombre)

    def cerrar_semana(self, yo):
        """Al empezar una semana nueva, apunta quién ganó la anterior (con lo último que se vio de cada uno)."""
        ultima = self.estado.get("ultima_semana")
        previa = self.estado.get("yo_previa")
        if ultima and ultima != yo["semana"] and previa and previa.get("semana") == ultima:
            r = self.estado.get("rival") or {}
            if r.get("semana") == ultima:
                a = previa["hechos"] >= previa["minimo"]
                b = r["hechos"] >= r["minimo"]
                m = self.estado["marcador"]
                if a and not b:
                    m["yo"] += 1
                elif b and not a:
                    m["rival"] += 1
                else:
                    m["empates"] += 1
        self.estado["ultima_semana"] = yo["semana"]
        self.estado["yo_previa"] = yo

    def respuesta(self):
        with self.cand:
            yo = self.yo()
            self.cerrar_semana(yo)
            self.guardar()
            r = self.estado.get("rival")
            if r and r.get("semana") != yo["semana"]:
                r = dict(r, hechos=0, minimo=MINIMO, semana=yo["semana"])   # aún no ha anunciado esta semana
            return {"yo": yo, "rival": r, "visto_hace_s": int(time.time() - r["ts"]) if r else None,
                    "marcador": self.estado["marcador"], "liga": self.tabla_liga(yo)}

    # ---------------- liga por internet ----------------
    def tabla_liga(self, yo):
        L = self.estado.get("liga")
        if not L:
            return None
        if time.time() - self.ya_mirado > 60:      # alguien mira la tabla: refrescar ya (como mucho 1 vez por minuto)
            self.ya_mirado = 0
            self.despertar.set()
        filas = []
        for i, m in (L.get("miembros") or {}).items():
            if i == self.id:
                continue
            f = dict(m, yo=False)
            if f.get("semana") != yo["semana"]:
                f.update(hechos=0, semana=yo["semana"])    # aún no ha jugado esta semana (o no se ha visto)
            filas.append(f)
        filas.append(dict(yo, yo=True, visto=time.time()))
        filas.sort(key=lambda f: (-min(1, f["hechos"] / max(1, f["minimo"])), -f["hechos"], -f.get("uker", 0), f["nombre"]))
        return {"codigo": L["codigo"], "miembros": filas, "en_linea": L.get("en_linea", False)}

    def liga(self, accion, codigo=""):
        with self.cand:
            if accion == "crear":
                self.estado["liga"] = {"codigo": codigo_nuevo(), "miembros": {}, "ultimo": None, "publicado": 0, "firma": ""}
            elif accion == "unirse":
                c = codigo_valido(codigo)
                if not c:
                    return {"ok": False, "error": "codigo"}
                self.estado["liga"] = {"codigo": c, "miembros": {}, "ultimo": None, "publicado": 0, "firma": ""}
            elif accion == "salir":
                self.estado["liga"] = None
            self.guardar()
        self.ya_mirado = 0
        self.despertar.set()
        return {"ok": True, "codigo": (self.estado.get("liga") or {}).get("codigo")}

    def _http(self, url, datos=None):
        req = urllib.request.Request(url, data=datos, headers={"User-Agent": "vikingtokt-liga"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8")

    def bucle_liga(self):
        while True:
            self.despertar.wait(30)
            self.despertar.clear()
            L = self.estado.get("liga")
            if not L:
                continue
            try:
                yo = self.yo()
                firma = json.dumps([yo["semana"], yo["hechos"], yo["minimo"], yo["uker"], yo["nombre"]])
                if firma != L.get("firma") or time.time() - L.get("publicado", 0) > ANUNCIO_CADA:
                    msg = json.dumps(dict(yo, app=APP_LIGA, id=self.id), ensure_ascii=False).encode("utf-8")
                    self._http(f"{self.ntfy}/{tema(L['codigo'])}", msg)
                    with self.cand:
                        L["firma"], L["publicado"] = firma, time.time()
                        self.guardar()
                if time.time() - self.ya_mirado > MIRAR_CADA:
                    desde = L.get("ultimo") or "12h"
                    texto = self._http(f"{self.ntfy}/{tema(L['codigo'])}/json?poll=1&since={desde}")
                    self.ya_mirado = time.time()
                    with self.cand:
                        for linea in texto.splitlines():
                            try:
                                ev = json.loads(linea)
                                d = json.loads(ev.get("message", "")) if ev.get("event") == "message" else None
                            except ValueError:
                                continue
                            L["ultimo"] = ev.get("id") or L.get("ultimo")
                            if not d or d.get("app") != APP_LIGA or not d.get("id"):
                                continue
                            L.setdefault("miembros", {})[str(d["id"])[:40]] = {
                                "nombre": str(d.get("nombre", "?"))[:30], "idioma": d.get("idioma") if d.get("idioma") in ("es", "no") else "?",
                                "semana": str(d.get("semana", ""))[:10], "hechos": int(d.get("hechos", 0)), "minimo": int(d.get("minimo", MINIMO)),
                                "uker": int(d.get("uker", 0)), "visto": ev.get("time", time.time())}
                        viejo = time.time() - 21 * 86400      # quien no aparece en 3 semanas sale de la tabla
                        L["miembros"] = {k: v for k, v in L.get("miembros", {}).items() if v.get("visto", 0) > viejo}
                        L["en_linea"] = True
                        self.guardar()
            except (urllib.error.URLError, socket.timeout, OSError, ValueError):
                with self.cand:
                    if self.estado.get("liga"):
                        self.estado["liga"]["en_linea"] = False

    def anunciar(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        destino = "127.0.0.1" if self.solo_local else "255.255.255.255"
        while True:
            try:
                with self.cand:      # apunta la semana aunque nadie abra la app (para el marcador)
                    yo = self.yo()
                    self.cerrar_semana(yo)
                    self.guardar()
                d = dict(yo, app=APP, id=self.id)
                s.sendto(json.dumps(d).encode("utf-8"), (destino, self.udp_envio))
            except OSError:
                pass
            time.sleep(20)

    def escuchar(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("127.0.0.1" if self.solo_local else "", self.udp_escucha))
        while True:
            try:
                datos, _ = s.recvfrom(4096)
                d = json.loads(datos.decode("utf-8"))
            except (OSError, ValueError):
                continue
            if d.get("app") != APP or d.get("id") == self.id:
                continue
            if self.app == d.get("idioma"):
                continue        # el rival es quien aprende el otro idioma
            with self.cand:
                self.estado["rival"] = {"nombre": str(d.get("nombre", "?"))[:30], "idioma": d.get("idioma"),
                                        "semana": d.get("semana"), "hechos": int(d.get("hechos", 0)),
                                        "minimo": int(d.get("minimo", MINIMO)), "ts": time.time()}
                self.guardar()


def servir(duelo, puerto):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _json(self, obj, code=200):
            cuerpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(cuerpo)))
            self.end_headers()
            self.wfile.write(cuerpo)

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

        def do_GET(self):
            if self.path.split("?")[0] != "/duelo":
                return self._json({"error": "no"}, 404)
            self._json(duelo.respuesta())

        def do_POST(self):
            if self.path.split("?")[0] != "/liga":
                return self._json({"error": "no"}, 404)
            try:
                d = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)).decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self._json({"error": "formato"}, 400)
            if d.get("accion") not in ("crear", "unirse", "salir"):
                return self._json({"error": "accion"}, 400)
            self._json(duelo.liga(d["accion"], str(d.get("codigo", ""))))

    ThreadingHTTPServer(("127.0.0.1", puerto), H).serve_forever()


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--app", choices=["es", "no"], required=True)
    a.add_argument("--progreso", required=True)
    a.add_argument("--nombre", default="")
    a.add_argument("--puerto", type=int, default=PUERTO_HTTP)
    a.add_argument("--solo-local", action="store_true")
    a.add_argument("--estado", default=ESTADO)                       # pruebas: dos duelos en un mismo PC
    a.add_argument("--udp-escucha", type=int, default=PUERTO_UDP)
    a.add_argument("--udp-envio", type=int, default=PUERTO_UDP)
    a.add_argument("--ntfy", default=NTFY)                              # pruebas: servidor ntfy falso
    o = a.parse_args()
    try:   # ¿ya hay un duelo en marcha en este PC?
        socket.create_connection(("127.0.0.1", o.puerto), timeout=1).close()
        return
    except OSError:
        pass
    d = Duelo(o.app, o.progreso, o.nombre, o.solo_local, o.estado, o.udp_escucha, o.udp_envio)
    threading.Thread(target=d.anunciar, daemon=True).start()
    threading.Thread(target=d.escuchar, daemon=True).start()
    d.ntfy = o.ntfy.rstrip("/")
    threading.Thread(target=d.bucle_liga, daemon=True).start()
    servir(d, o.puerto)


if __name__ == "__main__":
    main()
