# Pre teba

Statická webová aplikácia s odomykaním Kľúča a súkromným admin panelom.

## Pred nasadením

1. V Supabase vytvor nový projekt.
2. V **SQL Editor** spusti obsah súboru `supabase-schema.sql` a zmeň `admin@example.com` na svoj e-mail.
3. V **Authentication → Users** si vytvor používateľa s týmto e-mailom a silným heslom.
4. V **Connect → App Frameworks → JavaScript** skopíruj Project URL a Publishable key do `supabase-config.js`.
5. Po nasadení otvor `https://tvoja-adresa.netlify.app/#admin` a prihlás sa vytvoreným účtom.

Odpovede sa odosielajú do databázy pri dokončení každej hry. Verejná aplikácia môže iba pridávať záznamy; prečítať ich môže iba e-mail správcu nastavený v RLS pravidle.

Nikdy nepoužívaj ani nezverejňuj Supabase `service_role` kľúč.
