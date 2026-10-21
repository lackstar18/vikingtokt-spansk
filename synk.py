"""Progreso compartido entre el PC y el iPhone (Elara, 20 oct: «el progreso DEBE compartirse»).

El juego guarda una copia en Firebase (Realtime Database del proyecto «vikingtokt», solo con el código de synk).
Aquí lo usan aviso20.py y duelo.py para ver también lo que jugó en el móvil. Solo librería estándar.
"""
import json
import socket
import time
import urllib.error
import urllib.request

BASE = "https://vikingtokt-66e19-default-rtdb.europe-west1.firebasedatabase.app/synk/"


def fusionar(a, b):
    """El más nuevo manda; los días jugados, las misiones y lo ganado se suman de los dos (igual que en juego.js)."""
    if not a:
        return b or {}
    if not b:
        return a
    nuevo, viejo = (a, b) if a.get("actualizado", 0) >= b.get("actualizado", 0) else (b, a)
    r = json.loads(json.dumps(nuevo))
    dias = dict(viejo.get("dias") or {})
    for d, n in (nuevo.get("dias") or {}).items():
        dias[d] = max(n, dias.get(d, 0))
    r["dias"] = dias
    mis = dict(viejo.get("misiones") or {})
    for k, n in (nuevo.get("misiones") or {}).items():
        mis[k] = max(n, mis.get(k, 0))
    r["misiones"] = mis
    r["semanasPerfectas"] = dict(viejo.get("semanasPerfectas") or {}, **(nuevo.get("semanasPerfectas") or {}))
    r["inv"] = list(dict.fromkeys((nuevo.get("inv") or []) + (viejo.get("inv") or [])))
    beste = dict(viejo.get("beste") or {})
    for k, n in (nuevo.get("beste") or {}).items():
        beste[k] = max(n, beste.get(k, 0))
    r["beste"] = beste
    return r


_cache = {}      # código -> (hora, datos): el duelo pregunta cada 20 s; a la nube, como mucho 1 vez por minuto


def remoto(codigo, timeout=6):
    if not codigo or len(codigo) < 12:
        return None
    t, d = _cache.get(codigo, (0, None))
    if time.time() - t < 60:
        return d
    try:
        with urllib.request.urlopen(BASE + codigo + ".json", timeout=timeout) as f:
            x = json.loads(f.read().decode("utf-8"))
        d = json.loads(x["d"]) if isinstance(x, dict) and x.get("d") else None    # en la nube va como texto (campo d)
    except (urllib.error.URLError, socket.timeout, OSError, ValueError):
        d = None
    _cache[codigo] = (time.time(), d)
    return d


def con_synk(p):
    """El progreso de este PC unido con el de la nube (si hay código de synk e internet)."""
    return fusionar(p, remoto((p or {}).get("synk"))) if p and p.get("synk") else (p or {})
