"""Genera las voces en español (mp3) de las misiones con voces neuronales de Microsoft (edge-tts).

Uso:  python generar_audio.py
- Voz «m» (mujer): palabras y frases. Voz «h» (hombre): el capitán y los gritos.
- Si se corta, vuelve a ejecutarlo: solo hace los que faltan.
- Escribe audio/lista.js, que el juego lee para saber qué audios hay.
"""
import asyncio
import glob
import json
import os
import sys
import unicodedata

try:
    import edge_tts
except ImportError:
    print("Falta edge-tts. Instálalo con:  py -m pip install edge-tts")
    sys.exit(1)

CARPETA = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(CARPETA, "audio")
VOCES = {"m": ("es-ES-ElviraNeural", "-5%", "+0Hz"), "h": ("es-ES-AlvaroNeural", "-5%", "-6Hz")}
EXTRA = [("¡Hola, vikingo!", "h"), ("¡Vikingo! ¡A la batalla!", "h")]   # prueba de volumen y cuerno de las 20:00
PARALELO = 6


def limpio(t):
    return unicodedata.normalize("NFC", t or "").strip()


def clave(t, voz):
    """Igual que claveAudio() en juego.js: FNV-1a de 32 bits sobre UTF-8 de «voz|texto» + longitud en bytes."""
    b = (voz + "|" + limpio(t)).encode("utf-8")
    x = 0x811C9DC5
    for c in b:
        x ^= c
        x = (x * 0x01000193) & 0xFFFFFFFF
    return f"{x:08x}_{len(b)}"


def misiones():
    for ruta in sorted(glob.glob(os.path.join(CARPETA, "misiones", "mision*.js"))):
        with open(ruta, encoding="utf-8") as f:
            t = f.read()
        yield json.loads(t[t.index("{"):t.rindex("}") + 1])


def textos():
    out, vistos = [], set()

    def add(t, voz):
        t = limpio(t)
        if t and "{" not in t and (t, voz) not in vistos:
            vistos.add((t, voz))
            out.append((t, voz))

    for m in misiones():
        for o in m["oleadas"]:
            for es, _ in o.get("items", []) + o.get("ejemplos", []):
                add(es, "m")
        j = m["jefe"]
        for t in [j["entra"], j["gana"], j["pierde"], (j.get("bonus") or {}).get("dice")] + [r["dice"] for r in j["rondas"]]:
            add(t, "h")
        add(m.get("burla"), "h")
    for t, v in EXTRA:
        add(t, v)
    return out


def ruta(t, voz):
    k = clave(t, voz)
    return os.path.join(AUDIO, k[:2], k + ".mp3")


async def uno(t, voz, sem, estado):
    destino = ruta(t, voz)
    if os.path.exists(destino) and os.path.getsize(destino) > 0:
        estado["ya"] += 1
        return
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    nombre, vel, tono = VOCES[voz]
    async with sem:
        ultimo = None
        for intento in range(4):
            try:
                tmp = destino + ".part"
                await edge_tts.Communicate(t, nombre, rate=vel, pitch=tono).save(tmp)
                os.replace(tmp, destino)
                estado["nuevos"] += 1
                return
            except Exception as e:  # red, límite del servicio…
                ultimo = e
                await asyncio.sleep(2 + intento * 3)
        estado["fallos"].append((t, str(ultimo)))


def escribir_lista():
    claves = []
    for d in sorted(os.listdir(AUDIO)):
        sub = os.path.join(AUDIO, d)
        if len(d) == 2 and os.path.isdir(sub):
            claves += [f[:-4] for f in sorted(os.listdir(sub)) if f.endswith(".mp3")]
    with open(os.path.join(AUDIO, "lista.js"), "w", encoding="utf-8") as f:
        f.write('ES.audio = "' + " ".join(claves) + '";\n')
    return len(claves)


async def main():
    lista = textos()
    print(f"Frases para el audio: {len(lista)}")
    os.makedirs(AUDIO, exist_ok=True)
    sem = asyncio.Semaphore(PARALELO)
    estado = {"ya": 0, "nuevos": 0, "fallos": []}
    await asyncio.gather(*(uno(t, v, sem, estado) for t, v in lista))
    total = escribir_lista()
    print(f"Ya estaban: {estado['ya']} · Nuevos: {estado['nuevos']} · Fallos: {len(estado['fallos'])} · En lista: {total}")
    for t, e in estado["fallos"][:10]:
        print("  Falló:", t[:60], "→", e[:80])


if __name__ == "__main__":
    asyncio.run(main())
