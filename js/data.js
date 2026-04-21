
export const ERA_COLORS = {
  'Tobey':    '#e63946',
  'Andrew':   '#457b9d',
  'Tom':      '#e9c46a',
  'All Eras': '#9d4edd',
};

export const ERA_ORDER = ['Tobey', 'Andrew', 'Tom', 'All Eras'];

export async function loadMovies() {
  const res = await fetch('data/movies.json');
  if (!res.ok) throw new Error('Failed to load movie data');
  return res.json();
}

export function avg(movies, field) {
  if (!movies.length) return 0;
  return movies.reduce((s, m) => s + m[field], 0) / movies.length;
}

export function fmtBoxOffice(n, decimals = 0) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  return `$${n.toLocaleString()}`;
}

export function buildEraSummaries(movies) {
  return ERA_ORDER.slice(0, 3).map(era => {
    const films = movies.filter(m => m.era === era);
    return {
      era,
      films,
      avgImdb:      +avg(films, 'imdbRating').toFixed(2),
      avgMetascore: +avg(films, 'metascore').toFixed(1),
      avgRt:        +avg(films, 'rtScore').toFixed(1),
      totalBo:      films.reduce((s, m) => s + m.boxOffice, 0),
      avgBo:        avg(films, 'boxOffice'),
    };
  });
}
