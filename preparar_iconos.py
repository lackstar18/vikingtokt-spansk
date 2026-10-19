"""Convierte los SVG de game-icons.net (arte/svg/) en arte/iconos.js para la app.

Uso:  python preparar_iconos.py
- Quita el cuadrado negro de fondo y deja el dibujo, que la app pinta del color que quiera.
- Iconos de https://game-icons.net (CC BY 3.0). Los autores salen en los créditos del juego.
"""
import json
import os
import re

CARPETA = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(CARPETA, "arte", "svg")
AUTORES = {  # icono -> autor (para los créditos)
    "viking-head": "Delapouite", "viking-helmet": "Delapouite", "viking-shield": "Delapouite",
    "viking-longhouse": "Delapouite", "drakkar": "Delapouite", "battle-axe": "Lorc", "crossed-axes": "Lorc",
    "palisade": "Delapouite", "chest": "Delapouite", "open-treasure-chest": "Skoll", "two-coins": "Delapouite",
    "coins-pile": "Delapouite", "beer-stein": "Lorc", "anvil": "Lorc", "shop": "Delapouite",
    "crowned-skull": "Lorc", "campfire": "Lorc", "burning-embers": "Lorc", "horned-helm": "Lorc",
    "warlord-helmet": "Caro Asercion", "hunting-horn": "Lorc", "spain": "Delapouite", "rune-stone": "Lorc",
    "hourglass": "Lorc", "padlock": "Lorc", "crested-helmet": "Lorc", "crossed-swords": "Lorc",
    "laurels-trophy": "Delapouite", "thor-fist": "Lorc", "shield-impact": "Delapouite", "barbarian": "Delapouite",
}


def main():
    iconos = {}
    for f in sorted(os.listdir(SVG)):
        if not f.endswith(".svg"):
            continue
        with open(os.path.join(SVG, f), encoding="utf-8") as fh:
            t = fh.read()
        trazos = [d for d in re.findall(r'<path[^>]*\sd="([^"]+)"', t) if d != "M0 0h512v512H0z"]
        iconos[f[:-4]] = " ".join(trazos)
    faltan = sorted(set(AUTORES) - set(iconos))
    with open(os.path.join(CARPETA, "arte", "iconos.js"), "w", encoding="utf-8") as fh:
        fh.write("// Iconos de https://game-icons.net (CC BY 3.0). Generado por preparar_iconos.py\n")
        fh.write("const ICONOS = " + json.dumps(iconos) + ";\n")
        fh.write("const AUTORES_ICONOS = " + json.dumps(AUTORES, ensure_ascii=False) + ";\n")
    print(f"{len(iconos)} iconos en arte/iconos.js", "· faltan: " + ", ".join(faltan) if faltan else "")


if __name__ == "__main__":
    main()
