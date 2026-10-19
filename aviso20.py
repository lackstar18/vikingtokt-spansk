"""Aviso de las 20:00 (lunes a viernes) del juego de español. Lo lanza una tarea de Windows (Instalar.bat).

- Si hoy ya hizo un asalto, o es fin de semana, no hace nada.
- Si no: ventana encima de todo con el cuerno: «⚔️ TOKT NÅ» abre el juego y empieza el asalto.
- «+10 min (jeg er i et spill)» solo 2 veces al día. Después, solo queda «TOKT NÅ».
Solo librería estándar (tkinter, winsound).
Prueba sin ventana:  python aviso20.py --prueba
"""
import json
import math
import os
import struct
import subprocess
import sys
import time
import wave
from datetime import date, datetime

CARPETA = os.path.dirname(os.path.abspath(__file__))
PROGRESO = os.path.join(CARPETA, "progreso.json")
ESTADO = os.path.join(CARPETA, "aviso_estado.json")
CUERNO = os.path.join(CARPETA, "cuerno.wav")
APLAZAR_MIN = 10
APLAZAR_VECES = 2


def leer(ruta):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def debe_avisar(p, hoy, hora=None):
    """True si hoy es lunes-viernes, son las 20:00 o más y aún no hay ningún asalto hoy."""
    hora = datetime.now().hour if hora is None else hora
    if hoy.weekday() >= 5 or hora < 20:    # si el PC estaba apagado a las 20:00, Windows lo lanza al encenderlo: por la mañana no
        return False
    return not ((p.get("dias") or {}).get(hoy.isoformat(), 0) > 0)


def aplazados(hoy):
    e = leer(ESTADO)
    return e.get("n", 0) if e.get("fecha") == hoy.isoformat() else 0


def aplazar(hoy):
    n = aplazados(hoy) + 1
    with open(ESTADO, "w", encoding="utf-8") as f:
        json.dump({"fecha": hoy.isoformat(), "n": n}, f)
    return n


def hacer_cuerno(volumen):
    """Cuerno de guerra sintetizado (wav), al volumen del juego (barra 0-100, curva suave)."""
    v = max(0.0, min(1.0, volumen / 100.0)) ** 2
    sr, dur = 22050, 1.6
    with wave.open(CUERNO, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        datos = bytearray()
        for i in range(int(sr * dur)):
            t = i / sr
            env = min(1.0, t / 0.12) * min(1.0, (dur - t) / 0.4)
            f = 98 + 18 * min(1.0, t / 0.5)
            x = sum(math.sin(2 * math.pi * f * k * t) / k for k in (1, 2, 3, 4, 5)) * 0.35
            datos += struct.pack("<h", int(max(-1, min(1, x * env)) * 32767 * 0.6 * v))
        w.writeframes(bytes(datos))


def sonar(p):
    vol = (p.get("ajustes") or {}).get("volumen", 50)
    if not vol:
        return
    try:
        import winsound
        hacer_cuerno(vol)
        winsound.PlaySound(CUERNO, winsound.SND_FILENAME | winsound.SND_ASYNC)
    except (ImportError, RuntimeError, OSError):
        pass


def abrir_juego():
    subprocess.Popen([sys.executable, os.path.join(CARPETA, "servidor.py"), "--tokt"], cwd=CARPETA,
                     creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))


def ventana(hoy, p):
    """Enseña el aviso. Devuelve "tokt" o "aplazar"."""
    import tkinter as tk
    quedan = APLAZAR_VECES - aplazados(hoy)
    nombre = p.get("nombre") or "viking"
    r = tk.Tk()
    r.title("Krigshornet lyder!")
    r.configure(bg="#161b22")
    r.attributes("-topmost", True)
    w, h = 560, 330
    r.geometry(f"{w}x{h}+{(r.winfo_screenwidth() - w) // 2}+{(r.winfo_screenheight() - h) // 3}")
    r.resizable(False, False)
    resultado = {"v": None}

    def fin(v):
        resultado["v"] = v
        r.destroy()

    def cerrar():
        if quedan > 0:
            fin("aplazar")
        else:
            r.bell()

    r.protocol("WM_DELETE_WINDOW", cerrar)
    tk.Label(r, text="⚔️  Krigshornet lyder!", font=("Georgia", 24, "bold"), fg="#f5d27a", bg="#161b22").pack(pady=(26, 6))
    tk.Label(r, text=f"Klokka er 20:00, {nombre}. Tid for dagens tokt (20–30 min).", font=("Segoe UI", 13),
             fg="#ece6d8", bg="#161b22").pack()
    tk.Label(r, text="Hopper du over i dag, brenner Capitán Rodrigo leiren din ved midnatt.", font=("Segoe UI", 11),
             fg="#ff8a80", bg="#161b22").pack(pady=(4, 18))
    tk.Button(r, text="⚔️  TOKT NÅ", font=("Georgia", 18, "bold"), fg="#2a1d05", bg="#e0b04f", activebackground="#f5d27a",
              relief="flat", padx=26, pady=8, command=lambda: fin("tokt")).pack()
    if quedan > 0:
        tk.Button(r, text=f"+{APLAZAR_MIN} min (jeg er i et spill) · {quedan} igjen", font=("Segoe UI", 11),
                  fg="#ece6d8", bg="#2d3642", activebackground="#3a4656", relief="flat", padx=14, pady=6,
                  command=lambda: fin("aplazar")).pack(pady=(14, 0))
    else:
        tk.Label(r, text="Ingen flere utsettelser i dag.", font=("Segoe UI", 10), fg="#a9a294", bg="#161b22").pack(pady=(14, 0))

    def arriba():   # que no se quede debajo de otra ventana
        try:
            r.lift()
            r.attributes("-topmost", True)
            r.after(1500, arriba)
        except tk.TclError:
            pass

    r.after(200, lambda: (r.focus_force(), arriba()))
    sonar(p)
    r.mainloop()
    return resultado["v"] or "aplazar"


def main():
    if "--prueba" in sys.argv:
        hoy = date.today()
        p = leer(PROGRESO)
        print(json.dumps({"hoy": hoy.isoformat(), "avisar": debe_avisar(p, hoy), "aplazados": aplazados(hoy)}))
        return
    dia = date.today()
    while True:
        hoy = date.today()
        if hoy != dia:      # pasada la medianoche ya no avisa (el capitán ya atacó)
            return
        p = leer(PROGRESO)
        if not debe_avisar(p, hoy):
            return
        if ventana(hoy, p) == "tokt":
            abrir_juego()
            return
        aplazar(hoy)
        time.sleep(APLAZAR_MIN * 60)


if __name__ == "__main__":
    main()
