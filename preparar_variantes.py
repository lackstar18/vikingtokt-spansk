"""Crea los colores alternativos del mapa a partir del arte de Kenney (arte/kenney/, CC0).

Uso:  python preparar_variantes.py
- Edificios: 3 tonos (el original, _c1 y _c2). Solo cambia el color del tejado (y lo que es de ese color).
- La låve usa el mismo dibujo que la taberna (medievalStructure_16), pero en rojo (låve noruega) y con
  otros tonos, para que nunca se vean iguales.
- Temas del mapa: _host (otoño) y _vinter (invierno) para la hierba y los árboles.
- Pynt especial del Markedet: estatua y pozo de Kenney en oro, y banderas dibujadas aquí con los colores y
  bordes de Kenney (no hay banderas CC0 de ese estilo; se buscó en OpenGameArt el 20-oct-2026).
Necesita Pillow (py -m pip install pillow).
"""
import colorsys
import os

from PIL import Image, ImageDraw

CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "arte", "kenney")

# edificio -> (banda de tono del tejado (0-1), tono destino 1, tono destino 2)
VERDE, NARANJA, AMARILLO = (0.22, 0.50), (0.0, 0.07), (0.09, 0.17)
EDIFICIOS = {
    "salon": (VERDE, 0.58, 0.98), "forja": (VERDE, 0.58, 0.98), "taberna": (VERDE, 0.58, 0.78),
    "casa1": (VERDE, 0.58, 0.98), "casa2": (VERDE, 0.58, 0.98), "casa3": (VERDE, 0.58, 0.98),
    "choza": (VERDE, 0.58, 0.98), "tienda": (VERDE, 0.58, 0.98),
    "muralla": (NARANJA, 0.60, 0.78), "molino": (AMARILLO, 0.0, 0.58), "mercado": (VERDE, 0.58, 0.98),
}
LAVE = (0.98, 0.08, 0.14)      # låve: roja, marrón y ocre (sale del dibujo verde de la taberna)
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


def oro(im):
    """Lo gris (piedra) pasa a oro, con sus luces y sombras."""
    tramos = [(0.0, (90, 66, 18)), (0.35, (138, 106, 34)), (0.65, (224, 176, 79)), (1.0, (255, 232, 150))]
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.25:
                continue
            for (v0, c0), (v1, c1) in zip(tramos, tramos[1:]):
                if v <= v1:
                    k = (v - v0) / (v1 - v0)
                    px[x, y] = tuple(int(c0[i] + (c1[i] - c0[i]) * k) for i in range(3)) + (a,)
                    break
    return im


def bandera(tela, borde):
    """Bandera vikinga de 128 px: palo de madera, pomo de oro y tela con cola de golondrina."""
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((60, 16, 68, 112), fill=(154, 106, 53), outline=(92, 58, 26), width=3)
    d.polygon([(68, 24), (108, 24), (108, 78), (88, 66), (68, 78)], fill=tela, outline=borde, width=4)
    d.ellipse((80, 36, 96, 52), fill=(255, 247, 224), outline=borde, width=3)
    d.ellipse((56, 8, 72, 24), fill=(224, 176, 79), outline=(138, 106, 34), width=3)
    return im


def main():
    n = 0
    for nombre, (banda, d1, d2) in EDIFICIOS.items():
        base = Image.open(os.path.join(CARPETA, nombre + ".png")).convert("RGBA")
        for i, d in ((1, d1), (2, d2)):
            recolorear(base.copy(), banda, d, sat=1.05).save(os.path.join(CARPETA, f"{nombre}_c{i}.png"), optimize=True)
            n += 1
    verde = Image.open(os.path.join(CARPETA, "taberna.png")).convert("RGBA")
    for suf, d in zip(("", "_c1", "_c2"), LAVE):
        recolorear(verde.copy(), VERDE, d, sat=1.05).save(os.path.join(CARPETA, f"granero{suf}.png"), optimize=True)
        n += 1
    for nombre in ARBOLES:
        base = Image.open(os.path.join(CARPETA, nombre + ".png")).convert("RGBA")
        recolorear(base.copy(), VERDE, 0.08, sat=1.1, luz=1.05).save(os.path.join(CARPETA, f"{nombre}_host.png"), optimize=True)
        (Image.open(os.path.join(CARPETA, "nieve.png")).convert("RGBA") if nombre == "hierba" else invierno(base.copy())).save(
            os.path.join(CARPETA, f"{nombre}_vinter.png"), optimize=True)
        n += 2
    oro(Image.open(os.path.join(CARPETA, "estatua.png")).convert("RGBA")).save(os.path.join(CARPETA, "gullstatue.png"), optimize=True)
    oro(Image.open(os.path.join(CARPETA, "pozo.png")).convert("RGBA")).save(os.path.join(CARPETA, "gullbronn.png"), optimize=True)
    for nombre, tela, borde in (("banner_r", (217, 83, 79), (143, 45, 42)), ("banner_b", (76, 141, 255), (42, 79, 153)), ("banner_g", (46, 158, 91), (29, 107, 60))):
        bandera(tela, borde).save(os.path.join(CARPETA, nombre + ".png"), optimize=True)
    n += 5
    print(f"{n} variantes en arte/kenney/")


if __name__ == "__main__":
    main()
