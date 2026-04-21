
import { loadMovies, buildEraSummaries, fmtBoxOffice, avg } from './data.js';
import { initScrollObserver, initWebCanvas }               from './scrollytelling.js';
import { createTimeline }                                   from './timeline.js';
import { createRatingsChart, createComparisonBars }        from './ratingsChart.js';
import { createBoxOfficeChart }                            from './boxOffice.js';
import { createRadarChart }                                from './radarChart.js';

(async function main() {
  initWebCanvas();

  let movies;
  try {
    movies = await loadMovies();
  } catch (e) {
    console.error('Could not load movie data:', e);
    return;
  }

  const eraSummaries = buildEraSummaries(movies);

  const eraMap = { tobey: 'Tobey', andrew: 'Andrew', tom: 'Tom' };
  Object.entries(eraMap).forEach(([slug, era]) => {
    const films = movies.filter(m => m.era === era);
    const totalBo = films.reduce((s, m) => s + m.boxOffice, 0);
    const el = (id) => document.getElementById(id);
    if (el(`${slug}-avg-imdb`))  el(`${slug}-avg-imdb`).textContent  = avg(films, 'imdbRating').toFixed(1);
    if (el(`${slug}-avg-rt`))    el(`${slug}-avg-rt`).textContent    = avg(films, 'rtScore').toFixed(0) + '%';
    if (el(`${slug}-total-bo`))  el(`${slug}-total-bo`).textContent  = fmtBoxOffice(totalBo);
  });

  const tbody = document.getElementById('verdict-table-body');
  if (tbody) {
    const ERA_COLORS_MAP = { Tobey: '#e63946', Andrew: '#457b9d', Tom: '#e9c46a', 'All Eras': '#9d4edd' };
    movies.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.title}</td>
        <td><span class="era-tag" style="background:${ERA_COLORS_MAP[m.era]}22;color:${ERA_COLORS_MAP[m.era]};border:1px solid ${ERA_COLORS_MAP[m.era]}44">${m.era}</span></td>
        <td>${m.year}</td>
        <td>${m.imdbRating}/10</td>
        <td>${m.rtScore}%</td>
        <td>${m.metascore}/100</td>
        <td>${fmtBoxOffice(m.boxOffice)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  const animateTimeline       = createTimeline(movies, '#timeline-chart');
  const animateTobeyRatings   = createRatingsChart(movies.filter(m => m.era === 'Tobey'),  '#ratings-tobey',  'Tobey');
  const animateAndrewRatings  = createRatingsChart(movies.filter(m => m.era === 'Andrew'), '#ratings-andrew', 'Andrew');
  const animateTomRatings     = createRatingsChart(movies.filter(m => m.era === 'Tom'),    '#ratings-tom',    'Tom');
  const animateRadar          = createRadarChart(eraSummaries, '#radar-chart');
  const animateCompBars       = createComparisonBars(eraSummaries, '#comparison-bars');
  const animateBoxOffice      = createBoxOfficeChart(movies, '#box-office-chart');

  const sectionHandlers = {
    'timeline':    animateTimeline,
    'era-tobey':   animateTobeyRatings,
    'era-andrew':  animateAndrewRatings,
    'era-tom':     animateTomRatings,
    'comparison':  () => { animateRadar?.(); animateCompBars?.(); },
    'box-office':  animateBoxOffice,
    'no-way-home': revealNwhCards,
    'verdict':     revealVerdictCards,
  };

  document.querySelectorAll('.scroll-section').forEach(section => {
    section.addEventListener('section:entered', () => {
      const handler = sectionHandlers[section.id];
      if (handler) handler();
    });
  });

  initScrollObserver();

})();

function revealNwhCards() {
  document.querySelectorAll('.nwh-score-card').forEach((card, i) => {
    setTimeout(() => card.classList.add('revealed'), i * 150);
  });
}

function revealVerdictCards() {
  document.querySelectorAll('.verdict-card').forEach((card, i) => {
    setTimeout(() => card.classList.add('revealed'), i * 150);
  });
}
