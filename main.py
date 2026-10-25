import json
import uuid
from dataclasses import dataclass, asdict
from pathlib import Path

DATEI = Path("notizen.json")


@dataclass
class Notiz:
    id: str
    title: str
    text: str


def laden() -> list[Notiz]:
    if not DATEI.exists():
        return []
    daten = json.loads(DATEI.read_text(encoding="utf-8"))
    return [Notiz(**eintrag) for eintrag in daten]


def speichern(notizen: list[Notiz]) -> None:
    daten = [asdict(notiz) for notiz in notizen]
    DATEI.write_text(json.dumps(daten, ensure_ascii=False, indent=2), encoding="utf-8")


def hinzufuegen(notizen: list[Notiz], title: str, text: str) -> Notiz:
    notiz = Notiz(id=str(uuid.uuid4()), title=title, text=text)
    notizen.append(notiz)
    return notiz


if __name__ == "__main__":
    notizen = laden()
    hinzufuegen(notizen, "Einkauf", "Milch, Brot, Eier")
    speichern(notizen)
    for n in notizen:
        print(n)