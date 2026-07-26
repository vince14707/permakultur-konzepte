// config.local.example.js
// ==========================================================
// Vorlage für config.local.js — echte Datei mit deinen echten
// Daten anlegen und NICHT committen (steht in .gitignore).
//
// Einmalig einrichten:
//   cp config.local.example.js config.local.js
//   dann in config.local.js die echten Werte eintragen
// ==========================================================

module.exports = {
  absender: {
    name: "Vorname Nachname",
    strasse: "Musterstraße 1",
    plzOrt: "12345 Musterstadt",
    email: "name@example.de",
  },
  iban: "DE00 0000 0000 0000 0000 00",
  bic: "XXXXXXXXXXX (Bank, Ort)",
  steuernummer: "000/000/00000",
  finanzamt: "Finanzamt Musterstadt",
};
