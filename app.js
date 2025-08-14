
// PWA install
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); deferredPrompt = e;
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

// Logo swapping via local storage
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
}

// Helpers
function mmToIn(mm){ return mm / 25.4; }
function inToMm(i){ return i * 25.4; }
function micronToMil(u){ return u / 25.4; } // 1 mil = 25.4 micron
function milToMicron(m){ return m * 25.4; }
function fToC(f){ return (f - 32) * 5/9; }
function cToF(c){ return (c * 9/5) + 32; }
function mToFt(m){ return m * 3.28084; }
function ftToM(ft){ return ft / 3.28084; }
function kgToLb(kg){ return kg * 2.2046226218; }
function lbToKg(lb){ return lb / 2.2046226218; }
function gToOz(g){ return g * 0.03527396195; }
function ozToG(oz){ return oz / 0.03527396195; }

// Density conversion
function gccToLbPerIn3(gcc){ return gcc * 0.036127; }

// BUR calculator
function calcBUR() {
  const layflat = parseFloat(document.getElementById("burLayflat").value || "0"); // inches
  const die = parseFloat(document.getElementById("burDie").value || "0"); // inches
  if (layflat <= 0 || die <= 0) return setText("burOut", "Enter layflat and die diameter");
  const bubbleD = (2 * layflat) / Math.PI;
  const bur = bubbleD / die;
  setText("burOut", `BUR = ${bur.toFixed(3)}  Bubble Dia = ${bubbleD.toFixed(2)} in`);
}
function calcLayflatFromBUR() {
  const bur = parseFloat(document.getElementById("burValue").value || "0");
  const die = parseFloat(document.getElementById("burDie2").value || "0");
  if (bur <= 0 || die <= 0) return setText("burOut2", "Enter BUR and die diameter");
  const layflat = (Math.PI * die * bur) / 2;
  setText("burOut2", `Layflat = ${layflat.toFixed(2)} in`);
}

// Lb per hour mono
function calcLbHrMono() {
  const width = parseFloat(document.getElementById("monoWidth").value || "0");
  const mil = parseFloat(document.getElementById("monoMil").value || "0");
  const fpm = parseFloat(document.getElementById("monoFPM").value || "0");
  const dens = parseFloat(document.getElementById("monoDensity").value || "0.92");
  const lbhr = width * mil * fpm * dens * 0.0260115; // derived constant
  setText("monoOut", `${lbhr.toFixed(1)} lb/hr`);
}
function calcFPMFromLbHr() {
  const width = parseFloat(document.getElementById("monoWidth").value || "0");
  const mil = parseFloat(document.getElementById("monoMil").value || "0");
  const dens = parseFloat(document.getElementById("monoDensity").value || "0.92");
  const lbhr = parseFloat(document.getElementById("monoTargetLbHr").value || "0");
  if (width <= 0 || mil <= 0 || dens <= 0) return setText("monoOut2", "Enter width, mil, density");
  const fpm = lbhr / (width * mil * dens * 0.0260115);
  setText("monoOut2", `Required speed ≈ ${fpm.toFixed(1)} fpm`);
}

// Coex calculator up to 5 layers
function updateLayerRows() {
  const n = parseInt(document.getElementById("coexLayers").value || "3");
  const tbody = document.getElementById("coexTbody");
  tbody.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${String.fromCharCode(65+i)}</td>
      <td><input type="number" step="0.1" value="${(100/n).toFixed(1)}" class="coexPct"></td>
      <td><input type="number" step="0.001" value="0.92" class="coexDens"></td>
      <td class="coexLbHr">0</td>`;
    tbody.appendChild(tr);
  }
}
function calcCoex() {
  const width = parseFloat(document.getElementById("coexWidth").value || "0");
  const mil = parseFloat(document.getElementById("coexMil").value || "0");
  const fpm = parseFloat(document.getElementById("coexFPM").value || "0");
  const rows = Array.from(document.querySelectorAll("#coexTbody tr"));
  let total = 0;
  rows.forEach((tr) => {
    const pct = parseFloat(tr.querySelector(".coexPct").value || "0") / 100;
    const dens = parseFloat(tr.querySelector(".coexDens").value || "0.92");
    const lbhr = width * (mil * pct) * fpm * dens * 0.0260115;
    tr.querySelector(".coexLbHr").textContent = lbhr.toFixed(1);
    total += lbhr;
  });
  setText("coexTotal", `${total.toFixed(1)} lb/hr total`);
}

// Unit converter
function convertUnits() {
  const kind = document.getElementById("convKind").value;
  const val = parseFloat(document.getElementById("convIn").value || "0");
  let out = "";
  switch(kind){
    case "mm_in": out = `${val} mm = ${(mmToIn(val)).toFixed(4)} in`; break;
    case "in_mm": out = `${val} in = ${(inToMm(val)).toFixed(3)} mm`; break;
    case "m_ft": out = `${val} m = ${(mToFt(val)).toFixed(3)} ft`; break;
    case "ft_m": out = `${val} ft = ${(ftToM(val)).toFixed(3)} m`; break;
    case "mic_mil": out = `${val} micron = ${(micronToMil(val)).toFixed(4)} mil`; break;
    case "mil_mic": out = `${val} mil = ${(milToMicron(val)).toFixed(1)} micron`; break;
    case "c_f": out = `${val} °C = ${(cToF(val)).toFixed(1)} °F`; break;
    case "f_c": out = `${val} °F = ${(fToC(val)).toFixed(1)} °C`; break;
    case "kg_lb": out = `${val} kg = ${(kgToLb(val)).toFixed(3)} lb`; break;
    case "lb_kg": out = `${val} lb = ${(lbToKg(val)).toFixed(3)} kg`; break;
    case "g_oz": out = `${val} g = ${(gToOz(val)).toFixed(3)} oz`; break;
    case "oz_g": out = `${val} oz = ${(ozToG(val)).toFixed(1)} g`; break;
  }
  setText("convOut", out);
}

// Roll OD from length and thickness
function calcRollOD() {
  const length = parseFloat(document.getElementById("rollLength").value || "0"); // feet
  const mil = parseFloat(document.getElementById("rollMil").value || "0");
  const coreOD = parseFloat(document.getElementById("rollCoreOD").value || "3");
  if (length <= 0 || mil <= 0 || coreOD <= 0) return setText("rollOut", "Enter length, mil, core OD");
  const t_in = mil * 0.001;
  const L_in = length * 12;
  const r_core = coreOD / 2;
  const R = Math.sqrt(r_core*r_core + (t_in * L_in) / Math.PI);
  const od = 2 * R;
  setText("rollOut", `Estimated OD ≈ ${od.toFixed(2)} in`);
}

// Gram weight calculator
function calcGramWeight() {
  const width = parseFloat(document.getElementById("gwWidth").value || "0"); // inches
  const length = parseFloat(document.getElementById("gwLength").value || "0"); // inches
  const mil = parseFloat(document.getElementById("gwMil").value || "0");
  const dens = parseFloat(document.getElementById("gwDensity").value || "0.92"); // g/cc
  const panels = parseInt(document.getElementById("gwPanels").value || "1"); // 1 for sheet, 2 for tube laid flat
  const area_in2 = width * length * panels;
  const vol_cm3 = area_in2 * (mil * 0.001) * 16.387064;
  const grams = vol_cm3 * dens;
  setText("gwOut", `${grams.toFixed(2)} g per piece`);
}

// Resin blend calculator
function calcBlend() {
  const total = parseFloat(document.getElementById("blendTotal").value || "0");
  const rows = Array.from(document.querySelectorAll("#blendTbody tr"));
  let sumPct = 0;
  rows.forEach((tr)=>{ sumPct += parseFloat(tr.querySelector(".blendPct").value || "0"); });
  if (Math.abs(sumPct - 100) > 0.01) {
    setText("blendOut", "Layer percents must total 100");
    return;
  }
  const lines = [];
  rows.forEach((tr)=>{
    const name = tr.querySelector(".blendName").value || "Resin";
    const pct = parseFloat(tr.querySelector(".blendPct").value || "0");
    const lbs = total * pct / 100;
    lines.push(`${name}: ${lbs.toFixed(1)} lb`);
  });
  setText("blendOut", lines.join("  |  "));
}
function addBlendRow() {
  const tbody = document.getElementById("blendTbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `<td><input class="blendName" placeholder="Resin name" value="Resin ${tbody.children.length+1}"></td>
  <td><input type="number" class="blendPct" step="0.1" value="0"></td>`;
  tbody.appendChild(tr);
}

// Small utility
function setText(id, txt){ document.getElementById(id).textContent = txt; }

// Initialize dynamic bits
window.addEventListener("DOMContentLoaded", () => {
  initLogo();
  updateLayerRows();
});
