/* FragZoneTV player ranking. Import and call renderFragZoneLeaderboard(container, players).
   players: [{ nickname|username, rating|points, prize_usd }].
   No external dependencies. */
export function renderFragZoneLeaderboard(container, players = []) {
  if (!(container instanceof Element)) throw new TypeError('Container element required');
  const sorted = [...players].sort((a, b) =>
    (Number(b.rating ?? b.points) || 0) - (Number(a.rating ?? a.points) || 0) ||
    String(a.nickname ?? a.username ?? '').localeCompare(String(b.nickname ?? b.username ?? ''), 'ru')
  );
  if (!document.getElementById('fztv-top-three-style')) {
    const style = document.createElement('style');
    style.id = 'fztv-top-three-style';
    style.textContent = '.fztv-leaderboard__row.fztv-podium-1{border:2px solid #e9bd44!important;box-shadow:0 0 18px #e9bd4433;background:linear-gradient(90deg,#80631c25,transparent)}.fztv-leaderboard__row.fztv-podium-2{border:2px solid #acbed3!important;box-shadow:0 0 16px #b8c6d333;background:linear-gradient(90deg,#8c9cad25,transparent)}.fztv-leaderboard__row.fztv-podium-3{border:2px solid #bb7950!important;box-shadow:0 0 16px #b77b4b33;background:linear-gradient(90deg,#ab674025,transparent)}';
    document.head.append(style);
  }
  const list = document.createElement('ol');
  list.className = 'fztv-leaderboard';
  list.setAttribute('aria-label', 'Топ игроков по рейтингу');
  for (const [index, player] of sorted.entries()) {
    const row = document.createElement('li');
    row.className = 'fztv-leaderboard__row' + (index < 3 ? ' fztv-podium-' + (index + 1) : '');
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
