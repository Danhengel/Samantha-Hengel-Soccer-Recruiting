// Serve fresh match data on the site's own domain so browser privacy tools do not block it.
module.exports = async function handler(request, response) {
  const upstream = 'https://raw.githubusercontent.com/Danhengel/Samantha-Hengel-Soccer-Recruiting/main/data/latest-game.json';
  try {
    const result = await fetch(upstream, {
      headers: { 'User-Agent': 'Samantha-Hengel-Recruiting/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!result.ok) throw new Error('Upstream returned ' + result.status);
    const game = await result.json();
    if (
      typeof game.title !== 'string' ||
      !/^https:\/\/app\.veo\.co\/matches\//.test(game.url) ||
      !/^https:\/\/c\.veocdn\.com\//.test(game.thumbnail) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(game.date)
    ) throw new Error('Invalid match data');
    response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.status(200).json(game);
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store');
    response.status(503).json({ error: 'Latest game temporarily unavailable' });
  }
};
