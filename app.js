
// ── Constants ──────────────────────────────────────────────────────────────────
// lb/hr = width(in) × mil × fpm × density(g/cc) × LB_HR_CONSTANT
const LB_HR_CONSTANT = 0.0260115;

// ── PWA install ────────────────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("installBtn");
  if (btn) btn.style.display = "inline-flex";
});
async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installBtn").style.display = "none";
}

// ── Logo ───────────────────────────────────────────────────────────────────────
function initLogo() {
  const img = document.getElementById("logo");
  const saved = localStorage.getItem("logoUrl");
  if (saved) img.src = saved;
}
function saveLogoUrl() {
  const url = document.getElementById("logoUrl").value.trim();
  if (!url) return;
  localStorage.setItem("logoUrl", url);
  initLogo();
  showToast("Logo updated");
}

// ── Unit conversion helpers ────────────────────────────────────────────────────
function mmToIn(mm)    { return mm / 25.4; }
function inToMm(i)     { return i * 25.4; }
function micronToMil(u){ return u / 25.4; }
function milToMicron(m){ return m * 25.4; }
function fToC(f)       { return (f - 32) * 5 / 9; }
function cToF(c)       { return (c * 9 / 5) + 32; }
function mToFt(m)      { return m * 3.28084; }
function ftToM(ft)     { return ft / 3.28084; }
function kgToLb(kg)    { return kg * 2.2046226218; }
function lbToKg(lb)    { return lb / 2.2046226218; }
function gToOz(g)      { return g * 0.03527396195; }
function ozToG(oz)     { return oz / 0.03527396195; }

// ── UI helpers ─────────────────────────────────────────────────────────────────
// state: "" (neutral blue), "ok" (green), "bad" (red), "warn" (amber)
function setText(id, text, state) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = "result" + (state ? " " + state : "");
}

let _toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show";
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.className = "toast"; }, 2200);
}

// ── BUR calculator ─────────────────────────────────────────────────────────────
function calcBUR() {
  const layflat = parseFloat(document.getElementById("burLayflat").value);
  const die     = parseFloat(document.getElementById("burDie").value);
  if (!(layflat > 0) || !(die > 0)) {
    return setText("burOut", "Enter layflat and die diameter", "bad");
  }
  const bubbleD = (2 * layflat) / Math.PI;
  const bur     = bubbleD / die;
  setText("burOut", `BUR = ${bur.toFixed(3)}   Bubble Ø = ${bubbleD.toFixed(2)} in`, "ok");
}
function calcLayflatFromBUR() {
  const bur = parseFloat(document.getElementById("burValue").value);
  const die = parseFloat(document.getElementById("burDie2").value);
  if (!(bur > 0) || !(die > 0)) {
    return setText("burOut2", "Enter BUR and die diameter", "bad");
  }
  const layflat = (Math.PI * die * bur) / 2;
  setText("burOut2", `Layflat = ${layflat.toFixed(2)} in`, "ok");
}

// ── Throughput Mono ────────────────────────────────────────────────────────────
function calcLbHrMono() {
  const width = parseFloat(document.getElementById("monoWidth").value);
  const mil   = parseFloat(document.getElementById("monoMil").value);
  const fpm   = parseFloat(document.getElementById("monoFPM").value);
  const dens  = parseFloat(document.getElementById("monoDensity").value);
  if (!(width > 0) || !(mil > 0) || !(fpm > 0)) {
    return setText("monoOut", "Enter width, mil, and line speed", "bad");
  }
  const lbhr = width * mil * fpm * dens * LB_HR_CONSTANT;
  setText("monoOut", `${lbhr.toFixed(1)} lb/hr`, "ok");
}
function calcFPMFromLbHr() {
  const width = parseFloat(document.getElementById("monoWidth").value);
  const mil   = parseFloat(document.getElementById("monoMil").value);
  const dens  = parseFloat(document.getElementById("monoDensity").value);
  const lbhr  = parseFloat(document.getElementById("monoTargetLbHr").value);
  if (!(width > 0) || !(mil > 0) || !(dens > 0)) {
    return setText("monoOut2", "Enter width, mil, and density", "bad");
  }
  if (!(lbhr > 0)) {
    return setText("monoOut2", "Enter target lb/hr", "bad");
  }
  const fpm = lbhr / (width * mil * dens * LB_HR_CONSTANT);
  setText("monoOut2", `Required speed ≈ ${fpm.toFixed(1)} fpm`, "ok");
}

// ── Throughput Coex ────────────────────────────────────────────────────────────
function updateLayerRows() {
  const n     = parseInt(document.getElementById("coexLayers").value) || 3;
  const tbody = document.getElementById("coexTbody");
  tbody.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const ltr = String.fromCharCode(65 + i);
    const tr  = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:6px 10px;font-weight:600;color:var(--accent2)">${ltr}</td>
      <td><input type="number" step="0.1" min="0" max="100"
           value="${(100 / n).toFixed(1)}" class="coexPct"
           aria-label="Layer ${ltr} thickness percent"></td>
      <td><input type="number" step="0.001" min="0" value="0.920" class="coexDens"
           aria-label="Layer ${ltr} density"></td>
      <td class="coexLbHr td-result">—</td>`;
    tbody.appendChild(tr);
  }
}
function calcCoex() {
  const width = parseFloat(document.getElementById("coexWidth").value);
  const mil   = parseFloat(document.getElementById("coexMil").value);
  const fpm   = parseFloat(document.getElementById("coexFPM").value);
  if (!(width > 0) || !(mil > 0) || !(fpm > 0)) {
    return setText("coexTotal", "Enter width, mil, and line speed", "bad");
  }
  let total = 0;
  document.querySelectorAll("#coexTbody tr").forEach((tr) => {
    const pct  = (parseFloat(tr.querySelector(".coexPct").value) || 0) / 100;
    const dens = parseFloat(tr.querySelector(".coexDens").value) || 0.920;
    const lbhr = width * (mil * pct) * fpm * dens * LB_HR_CONSTANT;
    tr.querySelector(".coexLbHr").textContent = lbhr.toFixed(1);
    total += lbhr;
  });
  setText("coexTotal", `${total.toFixed(1)} lb/hr total`, "ok");
}

// ── Unit converter (live) ──────────────────────────────────────────────────────
function convertUnits() {
  const kind = document.getElementById("convKind").value;
  const val  = parseFloat(document.getElementById("convIn").value);
  const el   = document.getElementById("convOut");
  if (isNaN(val)) { el.textContent = ""; el.className = "result"; return; }
  let out = "";
  switch (kind) {
    case "mm_in":  out = `${val} mm = ${mmToIn(val).toFixed(4)} in`; break;
    case "in_mm":  out = `${val} in = ${inToMm(val).toFixed(3)} mm`; break;
    case "m_ft":   out = `${val} m = ${mToFt(val).toFixed(3)} ft`; break;
    case "ft_m":   out = `${val} ft = ${ftToM(val).toFixed(4)} m`; break;
    case "mic_mil":out = `${val} micron = ${micronToMil(val).toFixed(4)} mil`; break;
    case "mil_mic":out = `${val} mil = ${milToMicron(val).toFixed(1)} micron`; break;
    case "c_f":    out = `${val} °C = ${cToF(val).toFixed(1)} °F`; break;
    case "f_c":    out = `${val} °F = ${fToC(val).toFixed(1)} °C`; break;
    case "kg_lb":  out = `${val} kg = ${kgToLb(val).toFixed(3)} lb`; break;
    case "lb_kg":  out = `${val} lb = ${lbToKg(val).toFixed(3)} kg`; break;
    case "g_oz":   out = `${val} g = ${gToOz(val).toFixed(3)} oz`; break;
    case "oz_g":   out = `${val} oz = ${ozToG(val).toFixed(1)} g`; break;
  }
  el.textContent = out;
  el.className = "result";
}

// ── Roll OD ────────────────────────────────────────────────────────────────────
function calcRollOD() {
  const length = parseFloat(document.getElementById("rollLength").value);
  const mil    = parseFloat(document.getElementById("rollMil").value);
  const coreOD = parseFloat(document.getElementById("rollCoreOD").value);
  if (!(length > 0) || !(mil > 0) || !(coreOD > 0)) {
    return setText("rollOut", "Enter length, mil, and core OD", "bad");
  }
  const t_in   = mil * 0.001;
  const L_in   = length * 12;
  const r_core = coreOD / 2;
  // Derived from roll volume: π(R²-r²)L = film area × thickness
  const R  = Math.sqrt(r_core * r_core + (t_in * L_in) / Math.PI);
  const od = 2 * R;
  setText("rollOut", `Estimated OD ≈ ${od.toFixed(2)} in`, "ok");
}

// ── Gram Weight ────────────────────────────────────────────────────────────────
function calcGramWeight() {
  const width  = parseFloat(document.getElementById("gwWidth").value);
  const length = parseFloat(document.getElementById("gwLength").value);
  const mil    = parseFloat(document.getElementById("gwMil").value);
  const dens   = parseFloat(document.getElementById("gwDensity").value) || 0.920;
  const panels = parseInt(document.getElementById("gwPanels").value) || 1;
  if (!(width > 0) || !(length > 0) || !(mil > 0)) {
    return setText("gwOut", "Enter width, length, and thickness", "bad");
  }
  const area_in2 = width * length * panels;
  // 1 in² × 1 in = 16.387064 cm³
  const vol_cm3  = area_in2 * (mil * 0.001) * 16.387064;
  const grams    = vol_cm3 * dens;
  setText("gwOut", `${grams.toFixed(2)} g per piece`, "ok");
}

// ── Resin Blend ────────────────────────────────────────────────────────────────
function calcBlend() {
  const total = parseFloat(document.getElementById("blendTotal").value);
  if (!(total > 0)) return setText("blendOut", "Enter total pounds", "bad");
  const rows = document.querySelectorAll("#blendTbody tr");
  let sumPct = 0;
  rows.forEach((tr) => { sumPct += parseFloat(tr.querySelector(".blendPct").value) || 0; });
  if (Math.abs(sumPct - 100) > 0.01) {
    return setText("blendOut", `Resin percents must total 100  (current: ${sumPct.toFixed(1)}%)`, "bad");
  }
  const lines = [];
  rows.forEach((tr) => {
    const name = tr.querySelector(".blendName").value.trim() || "Resin";
    const pct  = parseFloat(tr.querySelector(".blendPct").value) || 0;
    const lbs  = total * pct / 100;
    lines.push(`${name}: ${lbs.toFixed(1)} lb  (${pct}%)`);
  });
  setText("blendOut", lines.join("\n"), "ok");
}
function addBlendRow() {
  const tbody = document.getElementById("blendTbody");
  const count = tbody.children.length + 1;
  const tr    = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="blendName" placeholder="Resin name" value="Resin ${count}" aria-label="Resin name"></td>
    <td><input type="number" class="blendPct" step="0.1" min="0" max="100" value="0" aria-label="Percent"></td>`;
  tbody.appendChild(tr);
}

// ── Tool filter ────────────────────────────────────────────────────────────────
function filterTools(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll(".card").forEach((card) => {
    if (!q) { card.classList.remove("hidden"); return; }
    const title = card.querySelector("h2")?.textContent.toLowerCase() || "";
    const desc  = card.querySelector("p")?.textContent.toLowerCase() || "";
    const tags  = (card.dataset.tool || "").toLowerCase();
    const match = title.includes(q) || desc.includes(q) || tags.includes(q);
    card.classList.toggle("hidden", !match);
  });
}

// ── Click-to-copy results ──────────────────────────────────────────────────────
function initCopyOnClick() {
  document.addEventListener("click", (e) => {
    const result = e.target.closest(".result[title]");
    if (!result || !result.textContent.trim()) return;
    navigator.clipboard.writeText(result.textContent.trim())
      .then(() => showToast("Copied to clipboard"))
      .catch(() => showToast("Copy failed"));
  });
}

// ── Initialize ─────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  initLogo();
  updateLayerRows();
  initCopyOnClick();

  // Button/control bindings (no inline onclick in HTML)
  document.getElementById("installBtn").addEventListener("click", installApp);
  document.getElementById("refreshBtn").addEventListener("click", () => location.reload());
  document.getElementById("btnBUR").addEventListener("click", calcBUR);
  document.getElementById("btnLayflatFromBUR").addEventListener("click", calcLayflatFromBUR);
  document.getElementById("btnLbHrMono").addEventListener("click", calcLbHrMono);
  document.getElementById("btnFPMFromLbHr").addEventListener("click", calcFPMFromLbHr);
  document.getElementById("coexLayers").addEventListener("change", updateLayerRows);
  document.getElementById("btnCalcCoex").addEventListener("click", calcCoex);
  document.getElementById("btnRollOD").addEventListener("click", calcRollOD);
  document.getElementById("btnGramWeight").addEventListener("click", calcGramWeight);
  document.getElementById("btnCalcBlend").addEventListener("click", calcBlend);
  document.getElementById("btnAddBlendRow").addEventListener("click", addBlendRow);
  document.getElementById("btnSaveLogo").addEventListener("click", saveLogoUrl);

  // Live unit converter
  document.getElementById("convIn").addEventListener("input", convertUnits);
  document.getElementById("convKind").addEventListener("change", convertUnits);

  // Tool filter
  document.getElementById("filterInput").addEventListener("input", (e) => filterTools(e.target.value));
});
