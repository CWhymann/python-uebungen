import json
import os
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)
ORDNER = os.path.dirname(os.path.abspath(__file__))
DATEI = os.path.join(ORDNER, "aufgaben.json")


@app.route("/")
def start():
    return send_from_directory(ORDNER, "index.html")


@app.route("/aufgaben", methods=["GET"])
def aufgaben():
    with open(DATEI, "r", encoding="utf-8") as datei:
        daten = json.load(datei)
    return jsonify(daten)


@app.route("/aufgaben", methods=["POST"])
def aufgabe_speichern():
    neue_aufgabe = request.get_json()
    with open(DATEI, "r", encoding="utf-8") as datei:
        daten = json.load(datei)
    daten.append(neue_aufgabe)
    with open(DATEI, "w", encoding="utf-8") as datei:
        json.dump(daten, datei, ensure_ascii=False, indent=2)
    return jsonify(neue_aufgabe), 201


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)