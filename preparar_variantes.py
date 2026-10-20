"""Crea los colores alternativos del mapa a partir del arte de Kenney (arte/kenney/, CC0).

Uso:  python preparar_variantes.py
- Edificios: 3 tonos (el original, _c1 y _c2). Solo cambia el color del tejado (y lo que es de ese color).
- Temas del mapa: _host (otoño) y _vinter (invierno) para la hierba y los árboles.
Necesita Pillow (py -m pip install pillow).
"""
import colorsys
import os

from PIL import Image

CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "arte", "kenney")

# edificio -> (banda de tono del tejado (0-1), tono destino 1, tono destino 2)
VERDE, NARANJA, AMARILLO = (0.22, 0.50), (0.0, 0.07), (0.09, 0.17)
EDIFICIOS = {
    "salon": (VERDE, 0.58, 0.98), "forja": (VERDE, 0.58, 0.98), "taberna": (VERDE, 0.58, 0.98),
    "casa1": (VERDE, 0.58, 0.98), "casa2": (VERDE, 0.58, 0.98), "casa3": (VERDE, 0.58, 0.98),
    "granero": (VERDE, 0.58, 0.98), "choza": (VERDE, 0.58, 0.98), "tienda": (VERDE, 0.58, 0.98),
    "muralla": (NARANJA, 0.60, 0.78), "molino": (AMARILLO, 0.0, 0.58), "mercado": (NARANJA, 0.60, 0.78),
}
ARBOLES = ["arbol", "arbol2", "pino", "pino2", "arbusto", "arbusto2", "hierba", "campo", "campo2"]


def recolorear(im, banda, destino, sat=None, luz=None):
    """Mueve al tono «destino» los píxeles cuyo tono cae en la banda (conserva luces y sombras)."""
    centro = (banda[0] + banda[1]) / 2
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.22 or v < 0.15 or not (banda[0] <= h <= banda[1]):
                continue
            h2 = (destino + (h - centro)) % 1.0
            s2 = s if sat is None else min(1, s * sat)
            v2 = v if luz is None else min(1, v * luz)
            r2, g2, b2 = colorsys.hsv_to_rgb(h2, s2, v2)
            px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return im


def invierno(im):
    """Árboles y hierba con nieve: verdes más apagados y aclarados hacia el blanco."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if VERDE[0] <= h <= VERDE[1] and s > 0.2:
                k = 0.55 if y < im.height * 0.6 else 0.35       # más nieve arriba
                r, g, b = [int(c + (235 - c) * k) for c in (r, g, b)]
            px[x, y] = (r, g, b, a)
    return im


def main():
    n = 0
    for nombre, (banda, d1, d2) in EDIFICIOS.items():
        base = Image.open(os.path.join(CARPETA, nombre + ".png")).convert("RGBA")
        for i, d in ((1, d1), (2, d2)):
            recolorear(base.copy(), banda, d, sat=1.05).save(os.path.join(CARPETA, f"{nombre}_c{i}.png"), optimize=True)
            n += 1
    for nombre in ARBOLES:
        base = Image.open(os.path.join(CARPETA, nombre + ".png")).convert("RGBA")
        recolorear(base.copy(), VERDE, 0.08, sat=1.1, luz=1.05).save(os.path.join(CARPETA, f"{nombre}_host.png"), optimize=True)
        (Image.open(os.path.join(CARPETA, "nieve.png")).convert("RGBA") if nombre == "hierba" else invierno(base.copy())).save(
            os.path.join(CARPETA, f"{nombre}_vinter.png"), optimize=True)
        n += 2
    print(f"{n} variantes en arte/kenney/")


if __name__ == "__main__":
    main()
