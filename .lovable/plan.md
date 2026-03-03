

# Fix: Forum doppelter "Frage stellen"-Button + Header-Layout

## Probleme

1. **Doppelter Button**: Im leeren Zustand gibt es "Frage stellen" sowohl im Header (Zeile 47-54) als auch im Empty-State (Zeile 103-105). Der Header-Button ist auf kleinen Screens zusammen mit dem Logo zu eng.

2. **Header-Layout**: "Frage stellen"-Button + GalvanekLogo rechts nebeneinander ist zu voll und wird abgeschnitten (Logo wird angeschnitten wie im Screenshot).

## Lösung

### `ForumView.tsx` anpassen:

1. **Header vereinfachen**: Logo entfernen, nur Titel + kompakter "+" Icon-Button (ohne Text) rechts oben. Das Forum ist jetzt ein Sub-Tab unter "Nachrichten", braucht kein eigenes Logo mehr.

2. **Empty-State Button behalten**: Der "Frage stellen"-Button im leeren Zustand bleibt als einziger prominenter CTA.

3. **Header kompakter**: Da ForumView jetzt innerhalb von MessagesAndForumView lebt (unter Sub-Tabs), braucht es keinen eigenen sticky gradient Header mehr. Stattdessen ein schlichtes Design mit Filterleiste.

### Konkrete Änderungen in `ForumView.tsx`:
- Großen gradient Header entfernen (ist redundant, da Sub-Tab-Header bereits von MessagesAndForumView kommt)
- Stattdessen: Kompakte Toolbar mit Filter-Pills + "+" FAB-Button
- GalvanekLogo entfernen (nicht nötig im Sub-Tab-Kontext)
- Empty-State "Frage stellen" Button bleibt als einziger CTA

