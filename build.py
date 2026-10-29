#!/usr/bin/env python3
"""
Baut die Website in den Ordner dist/.

Was passiert:
1. Alle Dateien der Website werden nach dist/ kopiert
   (ohne Werkzeuge wie tools/, partials/ und dieses Skript).
2. In jeder HTML-Datei wird jeder Platzhalter  <!-- @include name -->
   durch den Inhalt von partials/name.html ersetzt.

Cloudflare Pages führt dieses Skript bei jedem Push automatisch aus
(Build command: python3 build.py, Build output directory: dist).
Schlägt es fehl, bleibt die bisherige Version live.

Lokal testen:
    python3 build.py
    python3 -m http.server 8000 --directory dist
    -> http://localhost:8000
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
PARTIALS = ROOT / "partials"

# Wird nicht veröffentlicht (nur oberste Ebene des Repos)
EXCLUDE_TOP = {".git", ".github", "dist", "partials", "tools", "build.py",
               ".gitignore", "README.md"}
# Wird nirgends veröffentlicht
EXCLUDE_ANY = {".DS_Store"}

INCLUDE = re.compile(r"<!--\s*@include\s+([\w-]+)\s*-->")


def ignore(directory, names):
    skip = {n for n in names if n in EXCLUDE_ANY}
    if Path(directory).resolve() == ROOT:
        skip |= {n for n in names if n in EXCLUDE_TOP}
    return skip


def main():
    partials = {p.stem: p.read_text(encoding="utf-8")
                for p in sorted(PARTIALS.glob("*.html"))}

    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT, OUT, ignore=ignore)

    errors = []
    pages = 0
    for page in sorted(OUT.rglob("*.html")):
        text = page.read_text(encoding="utf-8")

        def insert(match):
            name = match.group(1)
            if name not in partials:
                errors.append(f"{page.relative_to(OUT)}: Partial '{name}' fehlt")
                return match.group(0)
            return partials[name]

        new = INCLUDE.sub(insert, text)
        if new != text:
            page.write_text(new, encoding="utf-8")
        pages += 1

    if errors:
        print("BUILD FEHLGESCHLAGEN:")
        for e in errors:
            print("  -", e)
        sys.exit(1)

    print(f"OK: {pages} HTML-Seiten gebaut, {len(partials)} Partials -> dist/")


if __name__ == "__main__":
    main()
