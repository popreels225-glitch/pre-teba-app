# Pre teba – Netlify verzia

Táto verzia ukladá herné výsledky online cez Netlify Blobs a zobrazí ich v skrytom admin paneli.

## Nasadenie

1. Nahrajte celý obsah tohto priečinka do repozitára `pre-teba-app`.
2. V Netlify vyberte **Add new site → Import an existing project → GitHub** a zvoľte repozitár.
3. V **Project configuration → Environment variables** pridajte premennú `ADMIN_PIN` s hodnotou `d1234`.
4. Spustite **Deploy**.

Po nasadení hráč používa aplikáciu normálne. Keď zadá prezývku a niečo dokončí, stav sa odošle do Netlify Blobs. Admin otvorí panel piatimi ťuknutiami na „PRE TEBA“, zadá `d1234` a uvidí všetkých hráčov.

PIN je kontrolovaný na serveri; neuvádzajte ho vo verejnom JavaScripte.
