

# Akademie-Tabs: Besseres Design + unnoetigen Button entfernen

## Probleme (aus Screenshots)

1. **Lerninhalt-Tab**: Reiner Plain-Text ohne visuelle Struktur. Nummerierte Abschnitte, Fettschrift und Aufzaehlungen gehen in einer Textwand unter.
2. **Key Takeaways (Zusammenfassung)**: Hat eine leichte Karte, wirkt aber trotzdem sehr farblos und "nackt".
3. **Dritter Tab-Button (Material/ExternalLink-Icon)**: Hat keinen Inhalt/Funktion, verwirrt den User.

## Loesung

### 1. Material-Tab entfernen

- `grid-cols-3` auf `grid-cols-2` aendern
- Den dritten `TabsTrigger` (Material) und den zugehoerigen `TabsContent` komplett entfernen
- Import von `ExternalLink` entfernen (wenn sonst nicht verwendet)

### 2. Lerninhalt-Tab visuell aufwerten

Den Markdown-Container mit strukturierten Styles versehen:

- Uebergeordnete Abschnitte (H2/H3 Headings) bekommen einen farbigen Akzent-Balken links (border-l-4 in Primary-Orange)
- Nummerierte Top-Level-Punkte in Cards mit leichtem Hintergrund und Schatten
- Bessere Prose-Styles: groessere Zeilenhoehe, klare Trennung zwischen Abschnitten
- Bold-Text bekommt `text-foreground` statt grau, damit er sich deutlich abhebt
- Listen bekommen Einrueckung und Abstand

Konkret: Die bestehende `prose`-Klasse erweitern um:
```text
prose-headings:border-l-4 prose-headings:border-primary prose-headings:pl-3
prose-headings:py-1 prose-headings:mt-6 prose-headings:mb-3
prose-p:leading-relaxed prose-ul:space-y-1
```

Zusaetzlich den gesamten Inhalt in eine Karte mit leichtem Hintergrund und Padding packen (aehnlich wie Zusammenfassung).

### 3. Key Takeaways visuell aufwerten

- Staerkerer Hintergrund: von `bg-primary/5` auf `bg-gradient-to-br from-primary/10 to-primary/5`
- Dickere linke Akzent-Border: `border-l-4 border-primary` statt `border border-primary/20`
- Icon bekommt volle Primary-Farbe und leichten Hintergrund-Kreis
- Etwas mehr Padding und Schatten (`shadow-sm`)
- Markdown-Content erbt die gleichen verbesserten Prose-Styles

## Betroffene Datei

`src/pages/AkademieModul.tsx` -- Tabs vereinfachen + Styling aufwerten
