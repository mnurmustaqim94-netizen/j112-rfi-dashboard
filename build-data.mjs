import fs from "node:fs";
import path from "node:path";

const dir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");
const csv = fs.readFileSync(path.join(dir, "sheet.csv"), "utf8");

function parseCSV(t) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); cur = ""; rows.push(row); row = []; }
    else if (c === "\r") { /* skip */ }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const rows = parseCSV(csv);
const header = rows[5].map(h => h.replace(/\s+/g, " ").trim());
const iOf = (n) => header.findIndex(h => h.toUpperCase() === n.toUpperCase());
const I = {
  station: 0, no: 1, type: 2, level: 3, part: 4, marking: 5, status: 11,
  cast: 13, doNo: 14, delivered: 15, workers: 16, remarks: 17,
  rfiNo: 19, revise: 20, postPlank: 21, delPlank: 22, delPap: 23, delPct: 24,
  vol: 9, weight: 10,
};

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function toISO(s) {
  s = (s || "").trim();
  if (!s) return "";
  let m = s.match(/^(\d{1,2})[-\/]([A-Za-z]{3,})[-\/](\d{2,4})$/);
  if (m) {
    const d = +m[1], mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    let y = +m[3]; if (y < 100) y += 2000;
    if (mo === undefined) return "";
    return `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return "";
}

const clean = (v) => {
  v = (v || "").replace(/\s+/g, " ").trim();
  return v.toUpperCase() === "N/A" ? "" : v;
};

const dataRows = rows.slice(6).filter(r => (r[0] || "").trim() && (r[1] || "").trim() !== "");
const parts = [];
for (const r of dataRows) {
  const type = clean(r[I.type]);
  const p = {
    st: clean(r[I.station]),
    no: clean(r[I.no]),
    ty: type,
    lv: clean(r[I.level]),
    mk: clean(r[I.marking]),
    stt: clean(r[I.status]),
    cd: toISO(r[I.cast]),
    dd: toISO(r[I.delivered]),
    wr: clean(r[I.workers]),
    rfi: clean(r[I.rfiNo]),
    rev: clean(r[I.revise]),
    post: clean(r[I.postPlank]),
    dlp: clean(r[I.delPlank]),
    dpp: clean(r[I.delPap]),
    dct: clean(r[I.delPct]),
    vol: parseFloat(String(r[I.vol]).replace(/,/g, "")) || 0,
    wt: parseFloat(String(r[I.weight]).replace(/,/g, "")) || 0,
    do: clean(r[I.doNo]),
    rm: clean(r[I.remarks]),
  };
  parts.push(p);
}

// metadata
const updatedRaw = rows[3][20] || "";
const updated = toISO(updatedRaw) || updatedRaw;

const out = {
  project: clean(rows[1][1]) || "J112",
  component: clean(rows[2][1]) || "",
  note: clean(rows[3][1]) || "",
  updatedLabel: updatedRaw.trim(),
  updatedISO: updated,
  generatedISO: new Date().toISOString(),
  parts,
};
fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify(out));
console.log("parts", parts.length, "size", fs.statSync(path.join(dir, "data.json")).size, "updated", updatedRaw);

// stats
const cnt = (arr, f) => arr.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {});
console.log("types", cnt(parts, p => p.ty));
console.log("status", cnt(parts, p => p.stt));
const catOf = (p) => p.ty === "Plank" || p.ty === "2nd beam" ? "PLANK" : p.ty === "Parapet" ? "PARAPET" : "CABLE";
console.log("cat", cnt(parts, catOf));
const withPrimary = parts.filter(p => p.rfi || p.rev || p.post || p.dlp || p.dpp || p.dct);
console.log("parts with any RFI", withPrimary.length);
console.log("cast date range", parts.map(p => p.cd).filter(Boolean).sort()[0], parts.map(p => p.cd).filter(Boolean).sort().slice(-1)[0]);
console.log("deliv date range", parts.map(p => p.dd).filter(Boolean).sort()[0], parts.map(p => p.dd).filter(Boolean).sort().slice(-1)[0]);
console.log("vol total", parts.reduce((s, p) => s + p.vol, 0).toFixed(1), "wt total", parts.reduce((s, p) => s + p.wt, 0).toFixed(1));
