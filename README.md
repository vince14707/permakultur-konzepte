# permakultur-konzepte.de

Statische Website, gehostet auf Cloudflare Pages. Kein Framework.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | Startseite |
| `leistungen/`, `kurse/`, `ueber-mich/`, `kontakt/`, `impressum/`, `datenschutz/` | Unterseiten, je eine `index.html` |
| `blog/` | Blog-Übersicht und Artikel (eigenes CSS je Datei) |
| `404.html` | Fehlerseite |
| `assets/style.css` | Gemeinsames CSS aller Hauptseiten (nicht Blog) |
| `assets/main.js` | Gemeinsames JavaScript (Cookie-Banner, Navigation, Formular, Galerie, FAQ-Bot) |
| `partials/` | Bausteine, die auf mehreren Seiten gleich sind |
| `build.py` | Setzt die Bausteine ein und baut alles nach `dist/` |

## Bausteine (partials)

In den Seiten steht z. B. `<!-- @include nav -->`. Beim Build wird das durch den Inhalt von `partials/nav.html` ersetzt.

| Datei | Wo eingesetzt |
|---|---|
| `head.html` | `<head>` aller Hauptseiten: CSP, Favicons, Schriften, CSS, Cal.eu |
| `nav.html` | Navigation der Hauptseiten |
| `footer.html` | Footer der Hauptseiten |
| `cookie-banner.html` | Cookie-Banner der Hauptseiten |
| `scripts.html` | FAQ-Bot und `main.js`, ganz unten auf den Hauptseiten |
| `blog-nav.html` | Navigation der Blogartikel ("Permakultur-Blog") |
| `blog-footer.html` | Footer aller Blogseiten |

**Header oder Footer ändern = genau eine Datei in `partials/` ändern.**

## Deploy

Push auf `main` = live. Cloudflare führt automatisch aus:

- Build command: `python3 build.py`
- Build output directory: `dist`

Schlägt der Build fehl (z. B. Baustein fehlt), bleibt die bisherige Version online.
Nicht veröffentlicht werden: `tools/`, `partials/`, `build.py`, `README.md`.

## Lokal ansehen

```
python3 build.py
python3 -m http.server 8000 --directory dist
```

Dann http://localhost:8000 öffnen.

## Neue Unterseite anlegen

1. Ordner anlegen, z. B. `obstbaumschnitt/index.html` – eine bestehende Unterseite als Vorlage kopieren.
2. Title, Description, Canonical, OG-Tags und genau eine `<h1>` anpassen.
3. In `sitemap.xml` eintragen.

## Alte Links

Früher lief alles über eine Seite mit Hash-Links (`/#leistungen`, `/#analyse-planung`).
Ein kleines Skript ganz oben in `index.html` leitet diese auf die neuen Unterseiten um.
