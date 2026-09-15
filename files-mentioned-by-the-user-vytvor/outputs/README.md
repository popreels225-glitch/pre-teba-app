# Pre teba – mobilná aplikácia

Otvorte `index.html` v mobilnom prehliadači alebo ju nasadzte ako statický web. Aplikácia je navrhnutá pre úzke mobilné displeje, ukladá postup lokálne a funguje bez build procesu.

## Online ukladanie pred nasadením

Zadanie vyžaduje bezpečnú online databázu, ale neprinieslo žiadne prístupové údaje ani konkrétnu službu. V `app.js` je pripravený adaptér: pred načítaním aplikácie nastavte `window.APP_SYNC_ENDPOINT` na vlastný autentifikovaný HTTPS endpoint. Endpoint musí identifikovať používateľa na serveri, overovať prístupové práva a ukladať dáta mimo klienta. Neverejné údaje a administrátorské výsledky nesmú byť chránené iba JavaScriptom v prehliadači.

Pre aktuálne lokálne testovanie sa údaje ukladajú do `localStorage`.

## Admin

Admin panel je skrytý: päťkrát rýchlo ťuknite na nápis **PRE TEBA** a zadajte PIN `2580`. Pred produkčným použitím PIN presuňte na server; PIN v klientskom kóde nie je bezpečnostná ochrana.
