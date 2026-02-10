

# Leere Lektionen ausblenden, inhaltsreiche sind Pflicht

## Ziel
Lektionen ohne Inhalt (weder Video noch Text) werden im Frontend komplett ausgeblendet. Sobald Inhalt hinzugefuegt wird, erscheint die Lektion automatisch und ist Pflicht fuer den Fortschritt.

## Umsetzung

### Einzige betroffene Datei: `src/hooks/useAkademieContent.ts`

**1. Lektion-Filter beim Laden (Zeile ~205)**

Nach dem Filtern der Lektionen pro Modul wird ein zusaetzlicher Filter eingefuegt:

```
.filter(lek => lek.video_url || lek.text_inhalt)
```

Dadurch tauchen nur Lektionen mit mindestens Video oder Text auf. Sobald in der Datenbank Inhalt ergaenzt wird, erscheint die Lektion beim naechsten Laden automatisch — und zaehlt dann zum Pflicht-Fortschritt.

**2. Gruppen-Bereinigung in `buildHierarchicalUnterpunkte` (Zeile ~98)**

Nach dem Aufbau der Hierarchie werden Gruppen-Eltern entfernt, deren Kinder alle herausgefiltert wurden:

```
result.filter(item => !(item.isGroup && item.children?.length === 0))
```

**3. Modul-Bereinigung (Zeile ~215)**

Module ohne verbleibende Unterpunkte werden aus der Liste entfernt:

```
.filter(mod => mod.unterpunkte.length > 0)
```

## Warum das automatisch "Pflicht" bedeutet

Die Fortschrittsberechnung in `AcademyStep.tsx` (`countLeafUnterpunkte`, `getTotalAkademieProgress`) zaehlt alle sichtbaren Lektionen. Was angezeigt wird, muss abgeschlossen werden — es gibt keinen optionalen Status. Neue Inhalte erhoehen also automatisch die Gesamtzahl und senken den Fortschrittsprozentsatz, bis sie abgeschlossen sind.

