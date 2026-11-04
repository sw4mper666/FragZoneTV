/* FragZoneTV player ranking. Import and call renderFragZoneLeaderboard(container, players).
   players: [{ nickname|username, rating|points, prize_usd }].
   No external dependencies. */
export function renderFragZoneLeaderboard(container, players = []) {
  if (!(container instanceof Element)) throw new TypeError('Container element required');
  const sorted = [...players].sort((a, b) =>
    (Number(b.rating ?? b.points) || 0) - (Number(a.rating ?? a.points) || 0) ||
    String(a.nickname ?? a.username ?? '').localeCompare(String(b.nickname ?? b.username ?? ''), 'ru')
  );
  const list = document.createElement('ol');
  list.className = 'fztv-leaderboard';
  list.setAttribute('aria-label', 'Топ игроков по рейтингу');
  for (const [index, player] of sorted.entries()) {
    const row = document.createElement('li');
    row.className = 'fztv-leaderboard__row';
    const name = String(player.nickname ?? player.username ?? 'Игрок');
    const rating = Number(player.rating ?? player.points) || 0;
    const rank = document.createElement('strong');
    rank.textContent = 'ТОП-' + (index + 1);
    const title = document.createElement('span');
    title.textContent = name;
    const score = document.createElement('span');
    score.textContent = 'Рейтинг: ' + rating.toLocaleString('ru-RU');
    const prize = document.createElement('span');
    prize.textContent = 'Призовые: $0';
    row.append(rank, title, score, prize);
    list.append(row);
  }
  container.replaceChildren(list);
}
