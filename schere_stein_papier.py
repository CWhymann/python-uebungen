import random

optionen = ["Schere", "Stein", "Papier"]
punkte_spieler = 0
punkte_computer = 0

while True:
    eingabe = input("Schere, Stein oder Papier? (Ende zum Beenden) ").strip().capitalize()

    if eingabe == "Ende":
        break

    if eingabe not in optionen:
        print("Ungültige Eingabe. Bitte Schere, Stein oder Papier eingeben.")
        continue

    computer = random.choice(optionen)
    print("Du wählst:", eingabe)
    print("Der Computer wählt:", computer)

    if eingabe == computer:
        print("Unentschieden!")
    elif (
        (eingabe == "Schere" and computer == "Papier")
        or (eingabe == "Stein" and computer == "Schere")
        or (eingabe == "Papier" and computer == "Stein")
    ):
        print("Du gewinnst!")
        punkte_spieler += 1
    else:
        print("Der Computer gewinnt!")
        punkte_computer += 1

    print("Stand - Du:", punkte_spieler, "Computer:", punkte_computer)

print("Endstand - Du:", punkte_spieler, "Computer:", punkte_computer)