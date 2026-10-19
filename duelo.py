"""Duelo por la red de casa (LAN): él con el español, Elena con el noruego. Solo librería estándar de Python.

Cada PC lo tiene en marcha en segundo plano:
- Lee su propio progreso y cuenta las lecciones / asaltos de esta semana (lunes a viernes, mínimo 5).
- Lo anuncia a la red de casa cada 20 s (UDP broadcast, puerto 47777) y escucha el del otro PC.
  No hace falta escribir direcciones: los dos PC se encuentran solos si están en la misma wifi o router.
- Lo sirve en http://127.0.0.1:8770/duelo (solo en este PC) para que el juego y la app lo enseñen.
- Guarda el marcador de semanas ganadas en duelo.json (junto a este archivo).

Uso:
  pythonw duelo.py --app es --progreso "D:/ElaraAI/Elara/espanol/progreso.json"      (el juego de español)
  pythonw duelo.py --app no --nombre Elena --progreso "D:/ElaraAI/Elara/noruego/progreso.json"
  --solo-local: prueba en un solo PC (no sale a la red)
"""
import argparse
import json
import os
import socket
import threading
import time
import uuid
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PUERTO_UDP = 47777
PUERTO_HTTP = 8770
APP = "duelo-vikingo-1"
CARPETA = os.path.dirname(os.path.abspath(__file__))
ESTADO = os.path.join(CARPETA, "duelo.json")
MINIMO = 5


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
            "minimo": minimo_de(ini, lun) if p else MINIMO}


class Duelo:
    def __init__(self, app, ruta, nombre, solo_local, estado=ESTADO, udp_escucha=PUERTO_UDP, udp_envio=PUERTO_UDP):
        self.app, self.ruta, self.nombre, self.solo_local = app, ruta, nombre, solo_local
        self.archivo, self.udp_escucha, self.udp_envio = estado, udp_escucha, udp_envio
        self.estado = leer(estado) or {}
        self.id = self.estado.get("id") or uuid.uuid4().hex
        self.estado["id"] = self.id
        self.estado.setdefault("marcador", {"yo": 0, "rival": 0, "empates": 0})
        self.estado.setdefault("rival", None)
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
                    "marcador": self.estado["marcador"]}

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

        def do_GET(self):
            if self.path.split("?")[0] != "/duelo":
                self.send_response(404)
                self.end_headers()
                return
            cuerpo = json.dumps(duelo.respuesta(), ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(cuerpo)))
            self.end_headers()
            self.wfile.write(cuerpo)

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
    o = a.parse_args()
    try:   # ¿ya hay un duelo en marcha en este PC?
        socket.create_connection(("127.0.0.1", o.puerto), timeout=1).close()
        return
    except OSError:
        pass
    d = Duelo(o.app, o.progreso, o.nombre, o.solo_local, o.estado, o.udp_escucha, o.udp_envio)
    threading.Thread(target=d.anunciar, daemon=True).start()
    threading.Thread(target=d.escuchar, daemon=True).start()
    servir(d, o.puerto)


if __name__ == "__main__":
    main()
