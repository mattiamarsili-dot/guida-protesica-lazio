# Guida Assistenza Protesica Lazio — release finale

Servizio a cura di **Altra Mobilità**.

## Pubblicazione web
La cartella mantiene interfaccia e database separati:
- index.html
- styles.css
- app.js
- assets/logo-altra-mobilita.png
- data/lazio_protesica_db.js
- data/lazio_protesica_db.json

Pubblicata su GitHub Pages: basta caricare l'intera cartella su un hosting statico
per ottenere un link condivisibile via chat o e-mail, senza bisogno di installare nulla.

## Aggiornamenti
Telefono, e-mail, indirizzi e orari sono nel database, non nel codice dell'interfaccia.

## Ricerca CAP
La release include un quarto percorso: ricerca per CAP di residenza.
La funzione usa un dataset open aggiornato al 2026 e richiede connessione internet per il primo caricamento.
Il CAP viene usato solo come filtro:
- CAP univoco → apre il Comune corrispondente;
- CAP condiviso → chiede di scegliere il Comune;
- CAP di Roma → chiede sempre il Municipio, perché il CAP non determina in modo affidabile il distretto sanitario.

## Condivisione scheda specifica
Ogni ufficio dispone del pulsante `Condividi scheda`.
Su smartphone usa il menu di condivisione nativo.
Quando la guida è pubblicata online viene incluso anche un deep-link che riapre direttamente
il territorio e porta in testa l'ufficio selezionato. In apertura locale (`file://`) viene condiviso
solo il testo della scheda, perché un link locale non sarebbe apribile dal paziente.
