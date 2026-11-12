# J112 · RFI Dashboard

A live, mobile-friendly dashboard for the **J112** precast tracker (beam, plank, parapet and cable through), built around **RFI numbers**.

**Live data source:** the `CASTING_RECORD` tab of the project Google Sheet. The page fetches the sheet's CSV export directly in the browser every time it opens and auto-refreshes every 5 minutes — edit the sheet and the dashboard follows. No server, no build step, no login.

---

## What it shows

### Overview
- **RFI coverage ring** — how many parts are already covered by an RFI number (and how many are missing).
- **KPI cards** — total parts, distinct RFI numbers, missing RFI, delivered %.
- **Coverage by component** — cable through / parapet / plank & beam, RFI % and delivered %.
- **Fabrication status** — delivered / casted / not started.
- **Casting output** — parts cast per month over the last 14 months.
- **Biggest RFI batches** — which RFI numbers cover the most parts.

### RFI Register
Every RFI reference found in the sheet, one card each, grouped by role:

| Role | Sheet column |
| --- | --- |
| Casting RFI | `RFI_NO` |
| Revision | `REVISE RFI` |
| Post · Plank | `RFI_POST - PLANK` |
| Delivery · Plank | `RFI_DELIVERY - PLANK` |
| Delivery · Parapet | `RFI_DELIVERY_PAP` |
| Delivery · Cable | `RFI_DELIVERY_PCT` |

- Search by RFI number, level, station or marking.
- Filter by RFI role with the chips (tap a chip on the overview to jump straight into that role).
- Sort by RFI number, most parts, least delivered, or most recent cast.
- Tap a card to open a sheet with every part under that RFI and its delivery status.

### Parts
All 4,700+ parts with station, level, marking, status, casting date and RFI references.
- Search anything (marking, level, DO no., RFI).
- Filter by type, status, station, or the **Missing RFI** chip to see exactly what still needs a number.

---

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire dashboard (HTML + CSS + JS, no dependencies, works offline-ish) |
| `data.json` | Snapshot used as a fallback if Google Sheets is unreachable |
| `build-data.mjs` | Rebuilds `data.json` from `sheet.csv` |
| `sheet.csv` | Local copy of the `CASTING_RECORD` tab (not deployed) |

### Refresh the snapshot

```bash
curl -L "https://docs.google.com/spreadsheets/d/1lmOiNtfsaHI0tMx1BUngM6Ru9HIKx9pQwfBmnsLegIY/export?format=csv&gid=1579823960" -o sheet.csv
node build-data.mjs
```

The live fetch is the primary source; the snapshot only appears if the browser cannot reach Google.

---

## Notes

- The Google Sheet must stay shared as **"Anyone with the link — Viewer"**, otherwise the live fetch stops working and the dashboard falls back to the saved snapshot.
- The sheet layout is detected automatically: the dashboard looks for a header row containing `STATION` and `RFI_NO`, then maps columns by name. Adding columns on the right is safe; renaming these headers is not.
- Everything is client-side, so the dashboard is static-hostable anywhere (GitHub Pages, Netlify, Cloudflare Pages, or an internal web server).
