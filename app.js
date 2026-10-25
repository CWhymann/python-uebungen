const HARNESS = `
import io, contextlib
_buf = io.StringIO()
_g = {}
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

let py;
const aufgabenBox = document.getElementById("aufgaben");
const statusEl = document.getElementById("status");

async function start() {
  try {
    statusEl.textContent = "Python wird geladen …";

    py = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
    });
    statusEl.textContent = "Bereit.";

    const response = await fetch("/aufgaben");
    if (!response.ok) {
      throw new Error("Server antwortete mit Status " + response.status);
    }
    const liste = await response.json();

    liste.forEach((a, i) => {
      const div = document.createElement("div");
      div.className = "aufgabe" + (a.typ === "info" ? " info" : "");

      const nr = document.createElement("div");
      nr.className = "nr";
      nr.textContent = "Aufgabe " + (i + 1);
      const h = document.createElement("h2");
      h.textContent = a.titel;
      div.append(nr, h);

      if (a.erklaerung) {
        const erk = document.createElement("div");
        erk.className = "erklaerung";
        erk.textContent = a.erklaerung;
        div.appendChild(erk);
      }

      if (a.typ === "info") {
        aufgabenBox.appendChild(div);
        return;
      }

      if (a.typ === "auswahl") {
        const p = document.createElement("p");
        p.className = "aufgabetext";
        p.textContent = a.aufgabe;
        div.appendChild(p);

        const liste = document.createElement("div");
        liste.className = "auswahl-liste";
        const zeilenMap = {};

        a.items.forEach((item) => {
          const zeile = document.createElement("div");
          zeile.className = "auswahl-zeile";
          zeilenMap[item] = zeile;

          const label = document.createElement("span");
          label.className = "auswahl-name";
          label.textContent = item;
          zeile.appendChild(label);

          const gruppe = document.createElement("div");
          gruppe.className = "auswahl-optionen";

          ["True", "False"].forEach((wert) => {
            const optionLabel = document.createElement("label");
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "auswahl_" + i + "_" + item;
            input.value = wert;
            optionLabel.append(input, " " + wert);
            gruppe.appendChild(optionLabel);
          });

          zeile.appendChild(gruppe);
          liste.appendChild(zeile);
        });

        div.appendChild(liste);

        const btn = document.createElement("button");
        btn.textContent = "Prüfen";
        const res = document.createElement("p");
        res.className = "res";

        btn.onclick = () => {
          let alleRichtig = true;
          a.items.forEach((item) => {
            const gewaehlt = div.querySelector(
              `input[name="auswahl_${i}_${item}"]:checked`,
            );
            const richtig =
              gewaehlt && (gewaehlt.value === "True") === a.loesung[item];
            const zeile = zeilenMap[item];
            zeile.classList.remove("richtig", "falsch");
            zeile.classList.add(richtig ? "richtig" : "falsch");
            if (!richtig) alleRichtig = false;
          });
          res.className = "res " + (alleRichtig ? "ok" : "falsch");
          res.textContent = alleRichtig
            ? "✔ Alle richtig!"
            : "✘ Noch nicht alle richtig, rot markierte Zeilen prüfen.";
        };

        div.append(btn, res);
        aufgabenBox.appendChild(div);
        return;
      }

      const p = document.createElement("p");
      p.className = "aufgabetext";
      p.textContent = a.aufgabe;
      const ta = document.createElement("textarea");
      ta.rows = 8;
      ta.value = a.starter;
      const btn = document.createElement("button");
      btn.textContent = "Ausführen und prüfen";
      const res = document.createElement("p");
      res.className = "res";
      const out = document.createElement("pre");

      btn.onclick = async () => {
        btn.disabled = true;
        res.className = "res";
        res.textContent = "läuft …";
        out.textContent = "";
        py.globals.set("user_code", ta.value);
        py.globals.set("pruefung_code", a.pruefung);
        const r = await py.runPythonAsync(HARNESS);
        const [ok, hinweis, ausgabe] = r.toJs();
        r.destroy();
        res.className = "res " + (ok ? "ok" : "falsch");
        res.textContent = (ok ? "✔ " : "✘ ") + hinweis;
        if (ausgabe) out.textContent = "Ausgabe:\n" + ausgabe;
        btn.disabled = false;
      };

      div.append(p, ta, btn, res, out);
      aufgabenBox.appendChild(div);
    });
  } catch (err) {
    statusEl.textContent = "Fehler beim Start: " + err.message;
    console.error(err);
  }
}
start();
