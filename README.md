# Meine Python-Übungs-App: Zusammenfassung 

Christian · Web-Development-Student an der DA Akademie · Stand 26.10.2026

## 1. Worum es geht

Meine Übungs-App trainiert die Python-Grundlagen aus dem Kurs BACKEND 02. Sie läuft lokal auf meinem Rechner im Browser und stellt 16 Aufgaben zu Variablen, Datentypen, Strings und Operatoren. Oben zeigt sie meinen Fortschritt („x von 16 gelöst“) mit einem Balken. Alle 16 Aufgaben sind gelöst. Das Projekt liegt auf GitHub unter CWhymann/python-uebungen.

## 2. Aufbau des Projekts

| Datei | Aufgabe |
|---|---|
| `app.py` | Server mit Flask: liefert die Seite und die Aufgaben aus |
| `index.html` | Die Seite im Browser mit Statusanzeige, Fortschrittsbalken und Aufgabenliste |
| `app.js` | Logik im Browser: baut die Aufgaben auf, prüft Antworten, führt Python-Code aus |
| `aufgaben/*.json` | Die Aufgabendaten, eine Datei pro Thema (`01_variablen.json` bis `07_logische_operatoren.json`) |
| `.vscode/settings.json` | Interpreter-Pfad für VS Code 

## 3. Wie die App funktioniert

### 3.1 Der Ablauf in sechs Schritten

1. Ich starte mit `python app.py`. Der Flask-Server läuft, und nach einer Sekunde öffnet sich der Browser auf `http://127.0.0.1:5000`.
2. Der Browser ruft `/` auf und bekommt `index.html`. Diese Seite lädt `app.js`.
3. `app.js` lädt Pyodide, also einen Python-Interpreter, der direkt im Browser läuft.
4. `app.js` fragt beim Server `/aufgaben` ab und bekommt alle Aufgaben als JSON.
5. Für jede Aufgabe baut `app.js` eine Karte mit Erklärung, Aufgabentext und Eingabe.
6. Beim Klick auf „Prüfen“ wird die Antwort ausgewertet. Gelöste Aufgaben werden grün markiert und im Browser gespeichert.

### 3.2 `app.py`: der Server

- **Flask** ist ein Webframework für Python. `Flask(__name__)` erzeugt die App.
- `ORDNER` ist der Pfad des Projektordners, ermittelt aus `__file__`. So findet die App ihre Dateien, egal von wo ich sie starte.
- Eine **Route** ordnet einer Adresse eine Funktion zu. Das passiert mit dem Decorator `@app.route(...)`. Die Route `/` liefert `index.html`, die Route `/app.js` liefert `app.js`. Dafür nutze ich `send_from_directory`.
- Die Route `/aufgaben` sammelt die Aufgaben: `glob` findet alle `*.json`-Dateien im Ordner `aufgaben`, `sorted` ordnet sie nach dem Dateinamen (die Nummer am Anfang bestimmt also die Reihenfolge), `json.load` liest jede Datei, `extend` fügt alle Listen zu einer zusammen, und `jsonify` schickt sie als JSON-Antwort an den Browser. Eine neue Aufgabendatei im Ordner reicht, am Code muss ich nichts ändern.
- `@app.after_request` setzt bei jeder Antwort `Cache-Control: no-store`. Der Browser speichert nichts zwischen, deshalb sehe ich Änderungen sofort.
- `threading.Timer(1.0, webbrowser.open ...)` öffnet nach einer Sekunde den Browser. Die Verzögerung gibt dem Server Zeit zu starten.
- `app.run(debug=True, use_reloader=False)` startet den Server im Debug-Modus. Den Reloader schalte ich aus, sonst würde das Programm zweimal starten und der Browser doppelt aufgehen.
- `if __name__ == "__main__":` sorgt dafür, dass der Startblock nur läuft, wenn ich die Datei direkt ausführe.

### 3.3 `app.js`: die Logik im Browser

**Pyodide.** Pyodide ist Python, nach WebAssembly übersetzt. Dadurch läuft mein eingetippter Python-Code im Browser und nicht auf dem Server. `loadPyodide` lädt es von einem CDN (Version 0.28.3).

**Das HARNESS.** Das ist ein kleiner Python-Text, den die App um meinen Code herum ausführt:

- `io.StringIO` und `contextlib.redirect_stdout` fangen alles ab, was mein Code mit `print` ausgibt, und legen es in einen Textpuffer.
- `exec(user_code, _g)` führt meinen Code in einem eigenen Namensraum (einem Dictionary) aus.
- Danach läuft `exec(pruefung_code, _g)`. Der Prüfcode aus der JSON-Datei arbeitet im selben Namensraum. Er kann also meine Variablen, den Quelltext (`code`) und die Ausgabe (`ausgabe`) prüfen und setzt am Ende `ok` und `hinweis`.
- Ein `try/except` fängt Fehler in meinem Code ab und zeigt sie als „Fehler: Typ: Meldung“, statt dass die App abstürzt.
- Zurück kommt eine Liste aus `ok`, Hinweistext und Ausgabe. `py.globals.set` übergibt Code und Prüfcode, `toJs()` wandelt das Ergebnis für JavaScript um, `destroy()` gibt den Speicher wieder frei.

**Die drei Aufgabentypen.** Die Funktion `karteBauen` entscheidet nach dem Feld `typ`:

| Typ | Was passiert |
|---|---|
| `auswahl` | Zu jeder Zeile gibt es zwei Radio-Buttons (True/False). Die Wahl wird mit `loesung` verglichen, richtige Zeilen werden grün, falsche rot. |
| `eingabe` | Ich tippe das Ergebnis in Textfelder. `norm()` entfernt Leerzeichen am Rand und macht aus `"` ein `'`, damit beide Anführungszeichen-Arten gelten. `antwort` ist eine Liste erlaubter Antworten (z. B. `Fehler` oder `TypeError`), geprüft mit `some`. Enter prüft ebenfalls. |
| Code (ohne `typ`) | Ich schreibe Code in eine Textarea mit Starter-Code. Der Button führt ihn über das HARNESS aus. Tab rückt mit vier Leerzeichen ein, Strg+Enter führt aus. |
| `info` | Nur Erklärung, ohne Aufgabe. Zählt nicht zum Fortschritt. |

**Fortschritt.** Gelöste Aufgaben werden mit ihrem Titel in einem `Set` gesammelt und als JSON im `localStorage` gespeichert. Dadurch bleibt der Stand nach dem Neuladen erhalten. Ein `try/catch` fängt den Fall ab, dass der Speicher nicht verfügbar ist. Der Balken ist so breit wie der Anteil gelöster Aufgaben.

**Aufbau der Seite.** Die Hilfsfunktion `el()` erzeugt HTML-Elemente. Mit `textContent` setze ich Texte als reinen Text, sie werden also nicht als HTML interpretiert. Wechselt das Feld `kapitel`, setzt die App eine neue Kapitelüberschrift.

**Aufbau einer Aufgabe in der JSON-Datei.** `kapitel`, `titel`, `erklaerung`, `aufgabe` und je nach Typ `items` mit `loesung`, `felder` mit `antwort` oder `starter` mit `pruefung`. Dazu optional `hinweis_falsch`.

## 4. Umgebung

- Ich arbeite in einer virtuellen Umgebung (`venv`, das ist eine isolierte Python-Umgebung pro Projekt). Sie liegt bei mir im Ordner `.venv`, im Terminal erkenne ich sie an `(.venv)`.
- In `.vscode/settings.json` steht der Interpreter-Pfad: `${workspaceFolder}/.venv/Scripts/python.exe`.
- Der erste Pfad war falsch: `${workspaceFolder}/python_uebungen/venv/...`. `${workspaceFolder}` ist schon der Projektordner, einen Unterordner `python_uebungen` gibt es nicht, und der Ordner heißt `.venv` statt `venv`. Deshalb meldete VS Code, dass der Interpreterpfad nicht aufgelöst werden kann.
- Gestartet wird die App mit `python app.py`.

## 5. Die 16 Aufgaben mit Lösung und Begründung

### Kapitel Variablen

**Aufgabe 1: Gültige Variablennamen** (Typ `auswahl`)

Ich entscheide bei zehn Namen, ob sie gültig sind. Die Regel: Ein Name beginnt mit Buchstabe oder Unterstrich, danach folgen Buchstaben, Ziffern und Unterstriche. Leerzeichen, Sonderzeichen und reservierte Keywords sind nicht erlaubt, und Groß-/Kleinschreibung zählt.

| Name | Gültig? | Warum |
|---|---|---|
| `python123` | True | Ziffern sind am Ende erlaubt |
| `0815` | False | beginnt mit einer Ziffer |
| `__python__` | True | Unterstriche sind erlaubt |
| `Fehler` | True | ganz normaler Name |
| `false` | True | klein geschrieben ist es kein Keyword, nur `False` ist reserviert |
| `hallo_welt` | True | Unterstrich statt Leerzeichen |
| `True` | False | reserviertes Keyword |
| `nicht-richtig` | False | der Bindestrich ist ein Sonderzeichen (Minus) |
| `tmp.2` | False | der Punkt ist ein Sonderzeichen |
| `yield` | False | reserviertes Keyword |

**Aufgabe 2: Werte tauschen** (Typ Code)

Ich soll die Werte von `vorname` und `nachname` tauschen, ohne die Texte neu zu schreiben. Meine Lösung:

```python
vorname, nachname = nachname, vorname
```

Warum: Eine Zuweisung wie `b = a` kopiert nur den Wert. Klassisch tauscht man deshalb mit einer Hilfsvariable. Python wertet bei dieser Schreibweise erst die rechte Seite komplett aus und weist dann zu, deshalb geht der Tausch in einer Zeile. Die Prüfung kontrolliert, dass `vorname` jetzt `Max` und `nachname` `Mustermann` ist und dass in meinem Code keine Anführungszeichen vorkommen.

**Aufgabe 3: Welche Werte werden ausgegeben?** (Typ `eingabe`)

Programm: `a = 42`, `b = a`, `c = a`, `a = 10`, `b = c`.

| Ausgabe | Ergebnis | Warum |
|---|---|---|
| `print(a)` | `10` | `a` wurde zuletzt auf 10 gesetzt |
| `print(b)` | `42` | `b = c` holt den Wert 42 |
| `print(c)` | `42` | `c` blieb bei 42, als `a` geändert wurde |

Warum: `b = a` kopiert nur den aktuellen Wert und stellt keine dauerhafte Verbindung her. Ändert sich `a` später, bleiben `b` und `c` beim alten Wert. Ich habe die Zeilen einzeln durchgegangen und mir nach jeder Zeile die Werte notiert.

**Aufgabe 4: Mehrzeiliger f-String** (Typ Code)

Ich soll zwei Zeilen Text mit den Variablen ausgeben. Meine Lösung:

```python
print(f"""Mein Name ist {vorname} {nachname}.
Ich bin {geschlecht} und wurde am {tag}. {monat} {jahr} geboren.""")
```

Warum: Ein f-String (`f"..."`) setzt Variablen direkt in geschweiften Klammern ein. Dreifache Anführungszeichen erlauben Text über mehrere Zeilen, der echte Zeilenumbruch im Code ist dann auch ein Umbruch in der Ausgabe. Die Prüfung vergleicht die Ausgabe exakt und kontrolliert, dass ich einen f-String mit drei Anführungszeichen und `{vorname}` benutzt habe.

### Kapitel Datentypen

**Aufgabe 5: Datentypen umwandeln** (Typ `eingabe`)

Ich schreibe das Ergebnis so hin, wie Python es anzeigt. Strings stehen in einfachen Anführungszeichen, bei einem Fehler schreibe ich `Fehler`.

| Ausdruck | Ergebnis | Warum |
|---|---|---|
| `int(42.5)` | `42` | `int()` schneidet die Nachkommastellen ab, es rundet nicht |
| `float(-1)` | `-1.0` | aus der Ganzzahl wird eine Kommazahl |
| `str(0.5)` | `'0.5'` | wird zu Text, deshalb mit Anführungszeichen |
| `bool(0.001)` | `True` | nur `0`, `0.0` und der leere String sind `False` |
| `str("False")` | `'False'` | ist schon Text und bleibt Text |
| `int(False)` | `0` | `False` entspricht der Zahl 0 |
| `float("10")` | `10.0` | Text, der eine Zahl enthält, lässt sich umwandeln |
| `bool('0')` | `True` | der String ist nicht leer, sein Inhalt ist egal |
| `int("False")` | `Fehler` | der Text ist keine Zahl (ValueError) |
| `float("True")` | `Fehler` | gleicher Grund (ValueError) |

**Aufgabe 6: Datentyp einer Variable bestimmen** (Typ Code)

```python
print(type(name))
print(type(alter))
print(type(BMI))
print(type(ledig))
```

Ausgabe: `<class 'str'>`, `<class 'int'>`, `<class 'float'>`, `<class 'bool'>`.

Warum: `type()` liefert den Datentyp eines Werts. Text ist `str`, Ganzzahl `int`, Kommazahl `float`, Wahrheitswert `bool`. Die Prüfung vergleicht meine vier Ausgabezeilen mit der erwarteten Reihenfolge.

### Kapitel Strings

**Aufgabe 7: Slicing, was wird ausgegeben?** (Typ `eingabe`)

Gegeben: `a = "Buchhaltung"` (Stellen: B0 u1 c2 h3 h4 a5 l6 t7 u8 n9 g10) und `b = "Python ist toll!"`.

| Ausgabe | Ergebnis | Warum |
|---|---|---|
| `print(a[5])` | `a` | gezählt wird ab 0 |
| `print(b[-1])` | `!` | −1 ist das letzte Zeichen |
| `print(a[:4])` | `Buch` | von Anfang bis Stelle 4, die 4 selbst ist nicht mehr dabei |
| `print(b[11:16])` | `toll!` | ab Stelle 11 bis zum Ende |
| `print(a[-100:100])` | `Buchhaltung` | zu große Grenzen beim Slicing werden abgeschnitten |
| `print(a[-5])` | `l` | fünftes Zeichen von hinten |
| `print(a[-12])` | `Fehler` | der String hat nur 11 Zeichen, ein einzelner Index außerhalb ergibt einen IndexError |
| `print(a[4:8])` | `halt` | Stellen 4 bis 7 |

**Aufgabe 8: Substrings ausschneiden** (Typ Code)

Aus `wort = "Maximilian"` (M0 a1 x2 i3 m4 i5 l6 i7 a8 n9) schneide ich fünf Teilstücke aus:

```python
print(wort[:3])
print(wort[:4])
print(wort[3:5])
print(wort[4:8])
print(wort[7:])
```

Ausgabe: `Max`, `Maxi`, `im`, `mili`, `ian`.

Warum: Bei `wort[von:bis]` fehlt der Anfang oder das Ende, wenn ich eine Grenze weglasse. Die Prüfung kontrolliert die fünf Zeilen und dass `wort[` mindestens fünfmal im Code steht. So kann ich die Teilstücke nicht einfach hinschreiben.

**Aufgabe 9: Strings addieren und multiplizieren** (Typ `eingabe`)

Gegeben: `a = "Developer"`, `b = "Akademie"`, `c = '.'`, `d = "com"`.

| Ausgabe | Ergebnis | Warum |
|---|---|---|
| `print(a + b)` | `DeveloperAkademie` | `+` hängt Strings aneinander |
| `print(a + b + c + d)` | `DeveloperAkademie.com` | vier Strings verbunden |
| `print(a + b - b)` | `Fehler` | Minus gibt es bei Strings nicht (TypeError) |
| `print(5 * c)` | `.....` | `*` mit einer ganzen Zahl wiederholt den String |
| `print(3d)` | `Fehler` | schon vom Aufbau her ungültig (SyntaxError) |
| `print(a + d)` | `Developercom` | verbunden ohne Leerzeichen |
| `print(a + b + d)` | `DeveloperAkademiecom` | verbunden |
| `print(d**2)` | `Fehler` | Potenzieren geht bei Strings nicht (TypeError) |
| `print(2 * (c + d))` | `.com.com` | die Klammer wird zuerst verbunden, dann zweimal wiederholt |
| `print(3 * c + 2 * d)` | `...comcom` | Punkt vor Strich: drei Punkte plus zweimal `com` |

**Aufgabe 10: String-Methoden, was wird ausgegeben?** (Typ `eingabe`)

Gegeben: `passwort1 = "abc123"`, `passwort2 = "Pass Wort"`, `passwort3 = "u1tr4g3h31m "` (mit Leerzeichen am Ende). Methoden liefern ein neues Ergebnis, der Original-String bleibt unverändert.

| Ausgabe | Ergebnis | Warum |
|---|---|---|
| `print(passwort1.upper())` | `ABC123` | alles groß, Ziffern bleiben |
| `print(passwort2.lower())` | `pass wort` | alles klein |
| `print(passwort3.islower())` | `True` | prüft nur die Buchstaben, Ziffern und Leerzeichen zählen nicht |
| `print(passwort2.isupper())` | `False` | enthält Kleinbuchstaben |
| `print(passwort1.zfill(8))` | `00abc123` | füllt links mit Nullen auf die Länge 8 auf |
| `print(passwort2.strip())` | `Pass Wort` | entfernt nur Leerzeichen am Rand, das Leerzeichen in der Mitte bleibt |
| `print(len(passwort3))` | `12` | 11 Zeichen plus das Leerzeichen am Ende |
| `print(passwort1.isalpha())` | `False` | enthält Ziffern |
| `print(passwort1[3:].isnumeric())` | `True` | der Ausschnitt ist `123` |
| `print("a;b;c;d;e".split(';'))` | `['a', 'b', 'c', 'd', 'e']` | trennt am Semikolon und liefert eine Liste |
| `print("01.23.45.67.89".split(';'))` | `['01.23.45.67.89']` | kein Semikolon, also wird nichts getrennt |
| `print(passwort2.replace("Pass",'.'))` | `. Wort` | ersetzt `Pass` durch einen Punkt |
| `print(passwort3.count('3'))` | `2` | zwei Dreier im String |
| `print(passwort2.count('s'))` | `2` | nur kleine `s` zählen, in „Pass“ sind es zwei |
| `print(passwort3.find(2+2))` | `Fehler` | `find` erwartet einen String, keine Zahl (TypeError) |
| `print(passwort1.index("4"))` | `Fehler` | `index` löst einen ValueError aus, wenn nichts gefunden wird |

**Aufgabe 11: Strings umwandeln** (Typ Code)

Ich wandle `s1` bis `s5` in `e1` bis `e5` um, ohne die Ziele einzutippen:

```python
e1 = s1[:4].upper() + s1[4:]
e2 = s2.zfill(11)
e3 = s3.capitalize()
e4 = s4.lower()
e5 = s5[::-1]
```

| Variable | Ziel | Warum |
|---|---|---|
| `e1` | `PASSw0r7` | die ersten vier Zeichen groß, der Rest bleibt |
| `e2` | `000000Anime` | `zfill(11)` füllt `Anime` (5 Zeichen) mit 6 Nullen auf |
| `e3` | `Florian` | `capitalize()` macht den ersten Buchstaben groß |
| `e4` | `kaguya` | `lower()` macht alles klein |
| `e5` | `9876543210` | `[::-1]` dreht den String um |

Die Prüfung vergleicht `e1` bis `e5` mit den Zielen und kontrolliert, dass die Zielstrings nicht im Code stehen. Es gibt keine Ausgabe, weil die Aufgabe nur das Speichern verlangt. Mit zusätzlichen `print`-Zeilen kann ich mir die Werte anzeigen lassen.

### Kapitel Operatoren

**Aufgabe 12: Arithmetische Operatoren, Rechnen** (Typ `eingabe`)

Es gilt Punkt vor Strich, Klammern gehen vor. `/` liefert immer einen float, `//` rundet ab, `%` liefert den Rest, `**` potenziert und bindet stärker als `*`.

| Rechnung | Ergebnis | Warum |
|---|---|---|
| `12 * 12` | `144` | einfache Multiplikation |
| `2.5 + 3.5` | `6.0` | mit float bleibt es ein float |
| `20 / 5` | `4.0` | `/` liefert immer einen float |
| `15 - 3 * 5` | `0` | Punkt vor Strich: 15 − 15 |
| `8 + 10//4` | `10` | `10//4` ist 2, dann 8 + 2 |
| `8 + 10/4` | `10.5` | `10/4` ist 2.5 |
| `20 / (5 - 4)` | `20.0` | Klammer zuerst, dann float |
| `4 * 2.5 / 4` | `2.5` | 10.0 geteilt durch 4 |
| `1//2 - 3//4` | `0` | beide Divisionen runden auf 0 ab |
| `(12 % 5) * (5 % 12)` | `10` | Rest 2 mal Rest 5 |
| `2**3` | `8` | 2 hoch 3 |
| `4**(8 - 5)` | `64` | 4 hoch 3 |
| `2**(8 // 2)` | `16` | 2 hoch 4 |
| `5**2 * 3` | `75` | `**` zuerst: 25 mal 3 |
| `(8 - 5)**(27 // 9)` | `27` | 3 hoch 3 |

**Aufgabe 13: Arithmetische Operatoren mit Strings und Zahlen** (Typ `eingabe`)

| Ausdruck | Ergebnis | Warum |
|---|---|---|
| `"apfel" + "baum"` | `'apfelbaum'` | `+` verbindet |
| `5 * ("a" + "b")` | `'ababababab'` | erst verbinden, dann fünfmal wiederholen |
| `"x" * 2**3` | `'xxxxxxxx'` | `2**3` ist 8, also achtmal `x` |
| `12 % 5` | `2` | Rest der Division |
| `42 % 43` | `42` | 43 passt nicht in 42, der ganze Wert bleibt als Rest |
| `2**10 % 2` | `0` | 1024 ist gerade |
| `5 * 4 * 3 * 2 * 1.0` | `120.0` | der float macht das ganze Ergebnis zum float |
| `0 * "Florian"` | `''` | nullmal wiederholt ergibt den leeren String |
| `"xyz" * (12 % 5)` | `'xyzxyz'` | `12 % 5` ist 2, also zweimal wiederholt |

### Kapitel Logische Operatoren

Die Rangfolge, die ich anwende: erst Rechnungen, dann `^`, dann Vergleiche, dann `not`, `and`, `or`. Klammern gehen immer vor.

**Aufgabe 14: Logische Operatoren, Wahrheitswerte** (Typ `auswahl`)

| Ausdruck | Ergebnis | Warum |
|---|---|---|
| `True and False and True or False` | False | `and` vor `or`: (True and False and True) ist False, dann False or False |
| `not False or not True` | True | True or False |
| `True and (False or not False)` | True | Klammer zuerst: False or True ist True, dann True and True |
| `not (not False ^ True or not False)` | False | innen `^` zuerst: False ^ True ist True, davon `not` ist False. Dann False or True ist True. Das äußere `not` macht daraus False |
| `True and False ^ True and False` | False | `^` vor `and`: False ^ True ist True, dann True and True and False |

**Aufgabe 15: Der Unterschied zwischen ^ und or** (Typ `auswahl`)

`or` ist das einschließende Oder, `^` das exklusive Oder (XOR). Der Unterschied zeigt sich, wenn beide Seiten True sind. Ich entscheide, ob die Aussage stimmt:

| Aussage | Stimmt? | Warum |
|---|---|---|
| `True ^ True` ergibt False | True | XOR ist nur True, wenn genau eine Seite True ist |
| `True or True` ergibt False | False | `or` ergibt True |
| `^` ist ein exklusives Oder | True | entweder das eine oder das andere |
| `or` ergibt nur dann False, wenn beide Seiten False sind | True | sobald eine Seite True ist, ist das Ergebnis True |
| `False ^ False` ergibt True | False | keine Seite ist True, also False |

**Aufgabe 16: Logische Operatoren, Vergleiche und Rechnen** (Typ `eingabe`)

| Ausdruck | Ergebnis | Warum |
|---|---|---|
| `2 < 3 and not 2 > 5` | `True` | True and (not False) |
| `not True ^ False or 3 == 2 + 1` | `True` | `^` zuerst: True ^ False ist True, `not` davon False. `3 == 2 + 1` ist True, also False or True |
| `not not not 2 % 5 == 7 % 5` | `False` | beide Reste sind 2, der Vergleich ist True, dreimal `not` ergibt False |
| `True and False ^ True and False` | `False` | `^` vor `and`, wie in Aufgabe 14 |
| `True ^ False ^ 0 ^ 1 ^ (2 > 3)` | `0` | von links nach rechts: True ^ False ist True, True ^ 0 ist 1, 1 ^ 1 ist 0, 0 ^ False ist 0. Mit Zahlen rechnet `^` bitweise, deshalb kommt eine Zahl heraus |

## 6. Fachbegriffe kurz erklärt

| Begriff | Bedeutung |
|---|---|
| Variable | benannter Speicherplatz für einen Wert |
| Zuweisung | `a = 5` legt einen Wert in einer Variable ab, kopiert ihn aber nur |
| Datentyp | Art eines Werts, z. B. `int`, `float`, `str`, `bool` |
| Typumwandlung | Wert in einen anderen Datentyp umwandeln, z. B. mit `int()` |
| String | Text |
| f-String | String mit `f` davor, in dem `{variable}` direkt eingesetzt wird |
| Index | Position eines Zeichens, gezählt ab 0 |
| Slicing | Teilstück ausschneiden mit `text[von:bis]` |
| Methode | Funktion, die zu einem Wert gehört, z. B. `text.upper()` |
| Operator | Zeichen für eine Verknüpfung, z. B. `+`, `//`, `and` |
| Rangfolge | Reihenfolge, in der Operatoren ausgewertet werden |
| XOR (`^`) | exklusives Oder: nur True, wenn genau eine Seite True ist |
| TypeError | Operation passt nicht zum Datentyp |
| ValueError | Datentyp passt, aber der Wert nicht (z. B. `int("False")`) |
| IndexError | Index liegt außerhalb des Strings |
| SyntaxError | Der Code ist vom Aufbau her ungültig |
| Flask / Route | Webframework und die Zuordnung einer Adresse zu einer Funktion |
| JSON | Textformat für strukturierte Daten, hier für die Aufgaben |
| Pyodide | Python im Browser (WebAssembly) |
| Namensraum | Sammlung aller Variablen, in der ein Code läuft |
| `localStorage` | Speicher im Browser, in dem der Fortschritt liegt |

## 7. Was ich daraus gelernt habe

Bei den Variablen habe ich verstanden, dass eine Zuweisung nur den Wert kopiert und keine Verbindung herstellt. Bei den Datentypen waren die Sonderfälle wichtig: `bool('0')` ist `True`, `int(42.5)` schneidet ab, und `int("False")` ist ein Fehler. Beim Slicing zählt das Ende nicht mit, und zu große Grenzen werden abgeschnitten, ein einzelner Index außerhalb dagegen nicht. Bei den Operatoren hilft mir die Rangfolge, auch lange Ausdrücke Schritt für Schritt aufzulösen. Und an der App selbst habe ich gesehen, wie Server (Flask), Browser (JavaScript) und Python im Browser (Pyodide) zusammenarbeiten und wie ein Prüfcode meine Antworten automatisch bewertet.