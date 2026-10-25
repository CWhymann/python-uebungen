import json
from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route("/")
def start():
    return "Server läuft"


@app.route("/aufgaben", methods=["GET"])
def aufgaben():
    with open("aufgaben.json", "r", encoding="utf-8") as datei:
        daten = json.load(datei)
    return jsonify(daten)


@app.route("/aufgaben", methods=["POST"])
def aufgabe_speichern():
    neue_aufgabe = request.get_json()
    with open("aufgaben.json", "r", encoding="utf-8") as datei:
        daten = json.load(datei)
    daten.append(neue_aufgabe)
    with open("aufgaben.json", "w", encoding="utf-8") as datei:
        json.dump(daten, datei, ensure_ascii=False, indent=2)
    return jsonify(neue_aufgabe), 201


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)