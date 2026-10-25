const HARNESS = `
import io, contextlib
_buf = io.StringIO()
_g = {'code': user_code}
try:
    with contextlib.redirect_stdout(_buf):
        exec(user_code, _g)
    _g['ausgabe'] = _buf.getvalue()
    exec(pruefung_code, _g)
except Exception as _e:
    _g['ok'] = False
    _g['hinweis'] = 'Fehler: ' + type(_e).__name__ + ': ' + str(_e)
[bool(_g.get('ok', False)), str(_g.get('hinweis', '')), _buf.getvalue()]
`;

const SPEICHER = "python-uebungen-geloest";
const aufgabenBox = document.getElementById("aufgaben");
const statusEl = document.getElementById("status");
const zaehlerEl = document.getElementById("zaehler");
const balkenEl = document.getElementById("balken");

let py;
let liste = [];
let geloest = ladeGeloest();

function ladeGeloest() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SPEICHER) || "[]"));
  } catch (e) {
    return new Set();
  }
}

function speichereGeloest() {
  try {
    localStorage.setItem(SPEICHER, JSON.stringify([...geloest]));
  } catch (e) {}
}

function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

function fortschritt() {
  const aufgaben = liste.filter((a) => a.typ !== "info");
  const fertig = aufgaben.filter((a) => geloest.has(a.titel)).length;
  zaehlerEl.textContent = fertig + " von " + aufgaben.length + " gelöst";
  balkenEl.style.width =
    (aufgaben.length ? (fertig / aufgaben.length) * 100 : 0) + "%";
}

function ergebnis(karte, a, ok) {
  karte.classList.toggle("geloest", ok || geloest.has(a.titel));
  if (ok) {
    geloest.add(a.titel);
    speichereGeloest();
    fortschritt();
  }
}

function norm(s) {
  return s.trim().replace(/"/g, "'");
}

function auswahlBauen(karte, a, nr) {
  const box = el("div", "auswahl-liste");
  const zeilen = {};

  a.items.forEach((item) => {
    const zeile = el("div", "auswahl-zeile");
    zeilen[item] = zeile;
    zeile.appendChild(el("span", "auswahl-name", item));

    const gruppe = el("div", "auswahl-optionen");
    ["True", "False"].forEach((wert) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "auswahl_" + nr + "_" + item;
      input.value = wert;
      label.append(input, wert);
      gruppe.appendChild(label);
    });
    zeile.appendChild(gruppe);
    box.appendChild(zeile);
  });

  const btn = el("button", "", "Prüfen");
  const res = el("p", "res");

  btn.onclick = () => {
    let alle = true;
    a.items.forEach((item) => {
      const gewaehlt = karte.querySelector(
        `input[name="auswahl_${nr}_${item}"]:checked`,
      );
      const richtig =
        !!gewaehlt && (gewaehlt.value === "True") === a.loesung[item];
      zeilen[item].classList.remove("richtig", "falsch");
      zeilen[item].classList.add(richtig ? "richtig" : "falsch");
      if (!richtig) alle = false;
    });
    res.className = "res " + (alle ? "ok" : "falsch");
    res.textContent = alle
      ? "✔ Alle richtig!"
      : "✘ Noch nicht alle richtig, rot markierte Zeilen prüfen.";
    ergebnis(karte, a, alle);
  };

  karte.append(box, btn, res);
}

function eingabeBauen(karte, a) {
  if (a.code) karte.appendChild(el("pre", "codeblock", a.code));

  const raster = el("div", "felder");
  raster.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
  const felder = a.felder.map((f) => {
    const zeile = el("div", "feld");
    const input = document.createElement("input");
    input.type = "text";
    input.spellcheck = false;
    input.autocomplete = "off";
    const label = el("span", "feld-label", f.label);
    label.style.whiteSpace = "normal";
    label.style.wordBreak = "break-word";
    input.style.width = "100%";
    zeile.style.flexDirection = "column";
    zeile.style.alignItems = "stretch";
    zeile.style.gap = "0.4rem";
    zeile.append(label, input);
    raster.appendChild(zeile);
    return { zeile, input, f };
  });

  const btn = el("button", "", "Prüfen");
  const res = el("p", "res");

  const pruefen = () => {
    let alle = true;
    felder.forEach(({ zeile, input, f }) => {
      const wert = norm(input.value);
      const richtig = f.antwort.some((x) => norm(x) === wert);
      zeile.classList.remove("richtig", "falsch");
      zeile.classList.add(richtig ? "richtig" : "falsch");
      if (!richtig) alle = false;
    });
    res.className = "res " + (alle ? "ok" : "falsch");
    res.textContent = alle
      ? "✔ Alle richtig!"
      : "✘ " + (a.hinweis_falsch || "Noch nicht alle richtig.");
    ergebnis(karte, a, alle);
  };

  btn.onclick = pruefen;
  felder.forEach(({ input }) =>
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") pruefen();
    }),
  );

  karte.append(raster, btn, res);
}

function codeBauen(karte, a) {
  const ta = document.createElement("textarea");
  ta.value = a.starter;
  ta.rows = Math.max(7, a.starter.split("\n").length + 3);
  ta.spellcheck = false;

  const btn = el("button", "", "Ausführen und prüfen");
  const res = el("p", "res");
  const out = el("pre", "ausgabe");

  btn.onclick = async () => {
    btn.disabled = true;
    res.className = "res";
    res.textContent = "läuft …";
    out.textContent = "";
    try {
      py.globals.set("user_code", ta.value);
      py.globals.set("pruefung_code", a.pruefung);
      const r = await py.runPythonAsync(HARNESS);
      const [ok, hinweis, ausgabe] = r.toJs();
      r.destroy();
      res.className = "res " + (ok ? "ok" : "falsch");
      res.textContent = (ok ? "✔ " : "✘ ") + hinweis;
      if (ausgabe) out.textContent = "Ausgabe:\n" + ausgabe;
      ergebnis(karte, a, ok);
    } catch (err) {
      res.className = "res falsch";
      res.textContent = "✘ Fehler: " + err.message;
    }
    btn.disabled = false;
  };

  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end");
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      btn.click();
    }
  });

  karte.append(
    ta,
    btn,
    el("p", "tipp", "Tab rückt ein, Strg+Enter führt aus."),
    res,
    out,
  );
}

function karteBauen(a, nr) {
  const karte = el("section", "aufgabe");
  if (a.typ !== "info" && geloest.has(a.titel)) karte.classList.add("geloest");

  const kopf = el("div", "kopf");
  kopf.append(
    el("span", "badge", a.typ === "info" ? "i" : String(nr)),
    el("h2", "", a.titel),
    el("span", "haken", "✔"),
  );
  karte.appendChild(kopf);

  if (a.erklaerung) karte.appendChild(el("div", "erklaerung", a.erklaerung));
  if (a.typ === "info") return karte;

  karte.appendChild(el("p", "aufgabetext", a.aufgabe));

  if (a.typ === "auswahl") auswahlBauen(karte, a, nr);
  else if (a.typ === "eingabe") eingabeBauen(karte, a);
  else codeBauen(karte, a);

  return karte;
}

async function start() {
  try {
    statusEl.textContent = "Python wird geladen …";
    py = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
    });
    statusEl.textContent = "Bereit. Viel Erfolg!";

    const response = await fetch("/aufgaben");
    if (!response.ok) {
      throw new Error("Server antwortete mit Status " + response.status);
    }
    liste = await response.json();

    let nr = 0;
    let letztesKapitel = null;
    liste.forEach((a) => {
      if (a.kapitel && a.kapitel !== letztesKapitel) {
        aufgabenBox.appendChild(el("h3", "kapitel", a.kapitel));
        letztesKapitel = a.kapitel;
      }
      if (a.typ !== "info") nr++;
      aufgabenBox.appendChild(karteBauen(a, nr));
    });
    fortschritt();
  } catch (err) {
    statusEl.textContent = "Fehler beim Start: " + err.message;
    console.error(err);
  }
}
start();
