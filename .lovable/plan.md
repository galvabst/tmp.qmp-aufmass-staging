

# Contractor-Card: Pflichtprodukte statt Rohbestellungen anzeigen

## Problem
Die Contractor-Karten im Admin zeigen `7/13 bezahlt` — das sind alle Bestellversuche inkl. fehlgeschlagener. Der Admin will sehen: **wie viele Pflichtprodukte muss der Techniker haben** und **wie viele davon sind bezahlt**.

## Lösung

### 1. `useAdminContractorList.ts` — Pflichtprodukte mitzählen
- Die `contractor_produkte`-Tabelle wird bereits parallel gefetcht (existiert schon im Products-Hook). Wir fügen einen weiteren Parallel-Fetch hinzu: alle aktiven Pflichtprodukte (`ist_pflicht = true, ist_aktiv = true`).
- Pro Contractor berechnen: wie viele Pflicht-Produkt-Keys gibt es, und wie viele davon hat er bezahlt (`stripe_payment_status = 'paid'`).
- Neue Felder: `pflichtProdukteTotal: number`, `pflichtProdukteBezahlt: number`

### 2. `ContractorListView.tsx` — Anzeige anpassen
- Statt `bestellungenBezahlt/bestellungenTotal bezahlt` → `pflichtProdukteBezahlt/pflichtProdukteTotal Pflichtprodukte`
- Icon bleibt ShoppingBag, aber die Zahlen spiegeln den tatsächlichen Fortschritt wider

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/contractors/hooks/useAdminContractorList.ts` | Pflichtprodukte parallel laden, neue Felder berechnen |
| `src/features/contractors/ui/ContractorListView.tsx` | Anzeige auf Pflichtprodukte umstellen |

