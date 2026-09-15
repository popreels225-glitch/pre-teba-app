import { getStore } from '@netlify/blobs';

const store = getStore('pre-teba-players');
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function playerKey(playerId) {
  return `player:${String(playerId || '').replace(/[^a-z0-9-]/gi, '')}`;
}

export default async (request) => {
  if (request.method === 'POST') {
    try {
      const player = await request.json();
      if (!player || typeof player !== 'object' || !String(player.name || '').trim() || !String(player.playerId || '').trim()) return json({ error: 'Chýba prezývka alebo identifikátor hráča.' }, 400);
      const safePlayer = {
        name: String(player.name).trim().slice(0, 24),
        completed: player.completed || {},
        quiz: player.quiz || { answers: [], score: null },
        either: Array.isArray(player.either) ? player.either.slice(0, 10) : [],
        game: player.game || { best: 0, combo: 0 },
        gift: Boolean(player.gift),
        updatedAt: new Date().toISOString()
      };
      await store.setJSON(playerKey(player.playerId), safePlayer);
      return json({ ok: true });
    } catch {
      return json({ error: 'Neplatné dáta.' }, 400);
    }
  }

  if (request.method === 'GET') {
    const expectedPin = process.env.ADMIN_PIN;
    const suppliedPin = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!expectedPin || suppliedPin !== expectedPin) return json({ error: 'Zakázané.' }, 403);
    const { blobs } = await store.list({ prefix: 'player:' });
    const players = await Promise.all(blobs.map(blob => store.get(blob.key, { type: 'json' })));
    return json(players.filter(Boolean).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }

  return json({ error: 'Metóda nie je podporovaná.' }, 405);
};
