// Online admin panel for the Netlify deployment. The PIN is verified server-side.
(() => {
  syncRemote = async function () {
    const playerId = localStorage.getItem('pre-teba-player-id') || crypto.randomUUID();
    localStorage.setItem('pre-teba-player-id', playerId);
    try {
      await fetch('/.netlify/functions/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, playerId })
      });
    } catch {
      // Hra funguje aj bez internetu; odoslanie sa zopakuje pri ďalšom uložení.
    }
  };
  admin = async function () {
    const pin = prompt('PIN administrátora:');
    if (!pin) return;
    try {
      const response = await fetch('/.netlify/functions/progress', {
        headers: { Authorization: `Bearer ${pin}` }
      });
      if (!response.ok) {
        alert('Nesprávny PIN alebo sa nepodarilo načítať údaje.');
        return;
      }
      const players = await response.json();
      shell(`<div class="eyebrow">Online výsledky</div><h1>Admin panel</h1><p>${players.length ? 'Vyber hráča pre detailné štatistiky.' : 'Zatiaľ nikto hru nedokončil.'}</p><div class="choices">${players.map((player, index) => `<button class="choice" data-player="${index}">👤 ${esc(player.name || 'Bez prezývky')}<br><small>Aktualizované: ${new Date(player.updatedAt).toLocaleString('sk-SK')}</small></button>`).join('')}</div>`, true);
      document.querySelectorAll('[data-player]').forEach(button => button.onclick = () => {
        const player = players[Number(button.dataset.player)];
        const answers = (player.quiz?.answers || []).map((answer, index) => `${index + 1}. ${'ABCD'[answer] || '–'}`).join('<br>');
        shell(`<div class="eyebrow">Online výsledky</div><h1>${esc(player.name || 'Bez prezývky')}</h1><div class="admin-table"><section><b>KVÍZ</b><br>${player.quiz?.score ?? '–'}/10<br>${answers || '–'}</section><section><b>THIS OR THAT</b><br>${(player.either || []).map((answer, index) => `${index + 1}. ${esc(answer)}`).join('<br>') || '–'}</section><section><b>MINIHRA</b><br>Najlepšie skóre: ${player.game?.best || 0}<br>Najlepšie combo: ×${player.game?.combo || 0}</section><section><b>MYSTERY</b><br>Dokončené: ${player.completed?.mystery ? 'Áno' : 'Nie'}</section><section><b>GIFT</b><br>Odomknutý: ${player.gift ? 'Áno' : 'Nie'}</section></div>`, true);
      });
    } catch (error) {
      alert('Online databáza ešte nie je dostupná. Po nasadení skontroluj Netlify Functions.');
    }
  };
})();
