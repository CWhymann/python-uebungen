import glob
import json
import os
import threading
import webbrowser
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__)
ORDNER = os.path.dirname(os.path.abspath(__file__))
AUFGABEN_ORDNER = os.path.join(ORDNER, "aufgaben")


@app.after_request
def kein_cache(antwort):
    antwort.headers["Cache-Control"] = "no-store"
    return antwort


@app.route("/")
def start():
    return send_from_directory(ORDNER, "index.html")


@app.route("/app.js")
def appjs():
    return send_from_directory(ORDNER, "app.js")


@app.route("/aufgaben", methods=["GET"])
def aufgaben():
    alle = []
    for pfad in sorted(glob.glob(os.path.join(AUFGABEN_ORDNER, "*.json"))):
        with open(pfad, "r", encoding="utf-8") as datei:
            alle.extend(json.load(datei))
    return jsonify(alle)


if __name__ == "__main__":
    threading.Timer(1.0, lambda: webbrowser.open("http://127.0.0.1:5000")).start()
    app.run(debug=True, use_reloader=False)