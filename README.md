# Nova Natie App

Interne bedrijfsapp voor Nova Natie (Antwerpse haven-natie: CFS, Forest, Transport, Warehousing).

## Demo openen

Open `Nova-App-Demo.html` in een browser, of gebruik de GitHub Pages-link. Op een smartphone: voeg de pagina toe aan het beginscherm voor de native app-ervaring.

> **Tip:** werk altijd via dezelfde toegangsweg (bv. de GitHub Pages-link). Gegevens worden lokaal in de browser bewaard (`localStorage`) en zijn dus per toestel/browser — niet gesynchroniseerd tussen apparaten.

De demo doorloopt deze flow:
1. **Login** — keuzelijst met testgebruikers (demo, geen wachtwoord)
2. **Startpagina** — afdelingskeuze (HSEQ actief, andere binnenkort) + persoonlijk **Takenbord**
3. **HSEQ-module**
   - Onveilige situatie melden (foto · locatie · beschrijving · automatische mail via EmailJS)
   - Inspecties & checklists (OK / NOK / N.v.t. met voortgangsbalk; NOK maakt automatisch een actie + mail)
   - Open meldingen opvolgen & sluiten
   - Mijn meldingen
4. **Takenbord** — kanban met kolommen Actief / Wacht / Ooit / Klaar; taken toevoegen, verplaatsen, afvinken, betrokkenen en bijlagen (max 2 MB)

## Projectstructuur

```
Nova-App-Demo.html      Alle schermen (HTML) + script-volgorde
css/app.css             Gedeelde stijlen (Nova huisstijl)
js/core.js              Navigatie & UI-helpers (go, toast, escapeHtml, …)
js/auth.js              Testgebruikers & login
js/data.js              localStorage-opslag & live tellers
js/modules/melding.js   Onveilige situatie melden
js/modules/inspecties.js Inspecties & checklists
js/modules/open-list.js Open meldingen, detail & mijn meldingen
js/modules/takenbord.js Kanban-takenbord
js/graph.js             Microsoft Graph login & mail (klaar, nog niet actief — wacht op Entra Client ID van IT)
```

**Nieuwe module toevoegen:** maak `js/modules/mijnmodule.js`, voeg de bijhorende schermen toe in `Nova-App-Demo.html` en zet er onderaan een `<script src="js/modules/mijnmodule.js">` bij.

## Fasering

| Fase | Status | Technologie |
|------|--------|-------------|
| Klikbare demo | ✅ Klaar | Modulaire HTML/CSS/JS — deelbaar via link/QR (GitHub Pages) |
| Automatische mails | ✅ Actief (demo) | EmailJS |
| M365-login & mail | 🔧 Code klaar, wacht op IT | Microsoft Graph / MSAL (`js/graph.js`) — Entra-registratie + Client ID nodig |
| Gedeelde database | 🔜 Gepland | SharePoint-lijst of Azure (i.p.v. localStorage per toestel) |
| Echte mobiele app | 🔜 Gepland | React Native / Expo (Android + iOS) |

## Huisstijl

Officiële Nova Natie kleuren: `#284532` (donkergroen) · `#C9833A` (oranje) · `#88A595` (tussengroen) · `#E1EAE4` (lichtgroen). Lettertype: Arial.

## Contact

QHSE: Quinten Brosens
