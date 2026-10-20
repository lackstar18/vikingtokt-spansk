"""Servidor local del juego de español (Spansk A1 · Vikingtokt). Solo librería estándar de Python.

- Sirve la carpeta en http://127.0.0.1:8766 y abre el navegador (con --tokt empieza un asalto nada más abrir).
- GET/POST api/progreso -> progreso.json (copia diaria en copias/, guarda 14). Lo leen el aviso de las 20:00 y el duelo.
- POST api/ia            -> DeepSeek corrige una frase libre. La clave va en clave_deepseek.txt (nunca en el juego).
- GET api/version / POST api/oppdater -> actualizar desde dentro del juego (version.json local contra GitHub;
  lanza actualizar.ps1, que copia lo nuevo sin tocar el progreso y vuelve a abrir este servidor).
- Arranca también el duelo (duelo.py) si no está ya en marcha.
- Se cierra solo 4 horas después de cerrar la pestaña (el juego hace ping cada 30 s).
"""
import json
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from datetime import date
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

CARPETA = os.path.dirname(os.path.abspath(__file__))
PROGRESO = os.path.join(CARPETA, "progreso.json")
COPIAS = os.path.join(CARPETA, "copias")
CLAVE_IA = os.path.join(CARPETA, "clave_deepseek.txt")
USO_IA = os.path.join(CARPETA, "uso_ia.json")
VERSION = os.path.join(CARPETA, "version.json")
REPO = "lackstar18/vikingtokt-spansk"
PUERTO = 8766
ESPERA_CIERRE = 4 * 3600
IA_BASE = os.environ.get("ESPANOL_IA_BASE", "https://api.deepseek.com").rstrip("/")
IA_MODELO = os.environ.get("ESPANOL_IA_MODELO", "deepseek-flash")
IA_TOPE_DIA = 80            # llamadas al día como mucho (el coste es de céntimos, pero por si acaso)

ultimo_ping = time.time()

SISTEMA_IA = (
    "Du er en vennlig spansklærer for en voksen nordmann på nivå A1. Han skriver en kort setning på spansk. "
    "Svar KUN med JSON: {\"ok\": true/false, \"corregida\": \"...\", \"forklaring\": \"...\", \"ros\": \"...\"}. "
    "Regler: ok=true hvis setningen er forståelig og uten feil (store/små bokstaver og manglende ¿ ¡ eller aksenter teller ikke). "
    "\"corregida\" = den rettede setningen på enkelt spansk (A1), så lik hans som mulig. "
    "\"forklaring\" = på norsk, maks 2 korte setninger, bare de 1-2 viktigste feilene, ingen grammatikkord som er vanskelige. Tom hvis ok. "
    "\"ros\" = 3-6 ord på norsk, oppmuntrende, gjerne med vikingtema. "
    "Hvis teksten ikke er spansk eller er tom/useriøs: ok=false, corregida = en enkel A1-setning om ham (Me llamo ... Soy de Noruega.), forklaring sier vennlig at han skal prøve på spansk."
)


def leer_progreso():
    try:
        with open(PROGRESO, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def guardar_progreso(datos):
    tmp = PROGRESO + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False)
    os.replace(tmp, PROGRESO)
    os.makedirs(COPIAS, exist_ok=True)
    with open(os.path.join(COPIAS, f"progreso_{date.today().isoformat()}.json"), "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False)
    for n in sorted(n for n in os.listdir(COPIAS) if n.startswith("progreso_"))[:-14]:
        os.remove(os.path.join(COPIAS, n))


def clave_ia():
    k = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not k and os.path.exists(CLAVE_IA):
        with open(CLAVE_IA, encoding="utf-8") as f:
            k = f.read().strip()
    return k


def contar_uso():
    """True si hoy aún quedan llamadas a la IA."""
    try:
        with open(USO_IA, encoding="utf-8") as f:
            u = json.load(f)
    except (OSError, ValueError):
        u = {}
    hoy = date.today().isoformat()
    n = u.get(hoy, 0)
    if n >= IA_TOPE_DIA:
        return False
    u = {hoy: n + 1}
    with open(USO_IA, "w", encoding="utf-8") as f:
        json.dump(u, f)
    return True


def corregir(texto, contexto=""):
    clave = clave_ia()
    if not clave:
        return {"error": "sin_clave"}
    if not contar_uso():
        return {"error": "tope"}
    cuerpo = {
        "model": IA_MODELO,
        "messages": [{"role": "system", "content": SISTEMA_IA},
                     {"role": "user", "content": f"Oppgave: {contexto}\nHans setning: {texto[:300]}"}],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 300,
    }
    req = urllib.request.Request(IA_BASE + "/chat/completions", data=json.dumps(cuerpo).encode("utf-8"),
                                 headers={"Authorization": "Bearer " + clave, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            d = json.loads(r.read().decode("utf-8"))
        res = json.loads(d["choices"][0]["message"]["content"])
        return {"ok": bool(res.get("ok")), "corregida": str(res.get("corregida", ""))[:300],
                "forklaring": str(res.get("forklaring", ""))[:400], "ros": str(res.get("ros", ""))[:80]}
    except (urllib.error.URLError, socket.timeout, KeyError, ValueError, TypeError) as e:
        return {"error": "red", "detalle": str(e)[:200]}


def pythonw():
    py = sys.executable.replace("python.exe", "pythonw.exe")
    return py if os.path.exists(py) else sys.executable


def version_local():
    try:
        with open(VERSION, encoding="utf-8") as f:
            return int(json.load(f).get("v", 0))
    except (OSError, ValueError, TypeError, AttributeError):
        return 0


_remota = {"t": 0, "v": 0}


def version_remota(fresca=False):
    """Versión que hay en GitHub (0 si no hay internet). Se mira como mucho cada 10 minutos."""
    if not fresca and time.time() - _remota["t"] < 600:
        return _remota["v"]
    try:
        url = f"https://raw.githubusercontent.com/{REPO}/main/version.json?t={int(time.time())}"
        with urllib.request.urlopen(url, timeout=8) as r:
            v = int(json.loads(r.read().decode("utf-8")).get("v", 0))
        _remota.update(t=time.time(), v=v)
        return v
    except (urllib.error.URLError, socket.timeout, OSError, ValueError, TypeError, AttributeError):
        return 0


def oppdatere():
    """Lanza actualizar.ps1 escondido; al acabar, él mismo vuelve a abrir el servidor."""
    try:
        subprocess.Popen(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden",
                          "-File", os.path.join(CARPETA, "actualizar.ps1"), "-FraSpillet", "-Python", pythonw()],
                         cwd=CARPETA, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return True
    except OSError:
        return False


def lanzar_duelo():
    """El duelo (duelo.py) en segundo plano, si no está ya en marcha."""
    try:
        urllib.request.urlopen("http://127.0.0.1:8770/duelo", timeout=1).close()
        return
    except (urllib.error.URLError, socket.timeout, OSError):
        pass
    try:
        subprocess.Popen([pythonw(), os.path.join(CARPETA, "duelo.py"), "--app", "es", "--progreso", PROGRESO],
                         cwd=CARPETA, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except OSError:
        pass


class Manejador(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=CARPETA, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store" if self.path.startswith("/api/") else "no-cache")
        super().end_headers()

    def _json(self, obj, code=200):
        cuerpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        global ultimo_ping
        ruta = self.path.split("?")[0]
        if ruta == "/api/progreso":
            return self._json(leer_progreso())
        if ruta == "/api/ping":
            ultimo_ping = time.time()
            return self._json({"ok": True, "ia": bool(clave_ia())})
        if ruta == "/api/version":
            return self._json({"local": version_local(), "remoto": version_remota("fresca" in self.path)})
        if ruta.endswith((".txt", ".json")) or ruta.startswith("/copias"):
            return self._json({"error": "no"}, 404)      # la clave y el progreso no se sirven como archivos
        return super().do_GET()

    def do_POST(self):
        global ultimo_ping
        ruta = self.path.split("?")[0]
        n = int(self.headers.get("Content-Length") or 0)
        try:
            datos = json.loads(self.rfile.read(n).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return self._json({"error": "formato"}, 400)
        if ruta == "/api/progreso":
            if not isinstance(datos, dict) or "v" not in datos:
                return self._json({"error": "formato"}, 400)
            if leer_progreso().get("actualizado", 0) > datos.get("actualizado", 0):
                return self._json({"ok": False, "motivo": "hay una versión más nueva"}, 409)
            guardar_progreso(datos)
            ultimo_ping = time.time()
            return self._json({"ok": True})
        if ruta == "/api/oppdater":
            if version_remota(True) <= version_local():
                return self._json({"ok": False, "motivo": "ingen ny versjon"})
            return self._json({"ok": oppdatere()})
        if ruta == "/api/ia":
            return self._json(corregir(str(datos.get("texto", "")), str(datos.get("contexto", ""))))
        return self._json({"error": "no existe"}, 404)


def vigilar(srv):
    while True:
        time.sleep(20)
        if time.time() - ultimo_ping > ESPERA_CIERRE:
            srv.shutdown()
            return


def main():
    abrir = "--sin-navegador" not in sys.argv
    url = f"http://127.0.0.1:{PUERTO}/" + ("?tokt=1" if "--tokt" in sys.argv else "")
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", PUERTO), Manejador)
    except OSError:
        if abrir:   # ya está abierto: solo abrir la pestaña
            webbrowser.open(url)
        return
    threading.Thread(target=vigilar, args=(srv,), daemon=True).start()
    if "--sin-duelo" not in sys.argv:
        threading.Thread(target=lanzar_duelo, daemon=True).start()
    if abrir:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    srv.serve_forever()


if __name__ == "__main__":
    main()
