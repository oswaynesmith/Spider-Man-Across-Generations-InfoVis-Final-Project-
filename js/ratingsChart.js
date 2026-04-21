// ratingsChart.js — grouped bar chart comparing IMDb/Metascore/RT per film
// Used for each era section and for the comparison bars in head-to-head

import { ERA_COLORS } from './data.js';

const METRICS = [
  { key: 'imdbRating', label: 'IMDb',      scale: 10,  color: '#f4d35e' },
  { key: 'metascore',  label: 'Metascore', scale: 1,   color: '#70c1b3' },
  { key: 'rtScore',    label: 'RT Score',  scale: 1,   color: '#e63946' },
];

/**
 * Creates a grouped bar chart for a set of films.
 * @param {object[]} films  - array of movie objects filtered to one era
 * @param {string}   selector - CSS selector for the container element
 * @param {string}   era    - era name for color accent
 * @returns {function} animate — call to trigger scroll-in animation
 */
export function createRatingsChart(films, selector, era) {
  const container = document.querySelector(selector);
  if (!container) return () => {};
  container.innerHTML = '';

  const margin = { top: 30, right: 20, bottom: 80, left: 40 };
  const totalW  = container.clientWidth || 700;
  const totalH  = 320;
  const width   = totalW - margin.left - margin.right;
  const height  = totalH - margin.top - margin.bottom;

  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${totalW} ${totalH}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select('body')
    .selectAll('.tooltip')
    .data([null])
    .join('div')
    .attr('class', 'tooltip');

  const x0 = d3.scaleBand()
    .domain(films.map(f => f.title))
    .range([0, width])
    .paddingInner(0.25)
    .paddingOuter(0.1);

  const x1 = d3.scaleBand()
    .domain(METRICS.map(m => m.key))
    .range([0, x0.bandwidth()])
    .padding(0.08);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  g.append('g')
    .attr('class', 'grid')
    .call(
      d3.axisLeft(y)
        .tickValues([20, 40, 60, 80, 100])
        .tickSize(-width)
        .tickFormat('')
    );


  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickSize(0))
    .selectAll('text')
    .attr('dy', '1em')
    .attr('font-size', 11)
    .attr('fill', '#8892a4')
    .style('text-anchor', 'middle')
    .text(d => {
      const film = films.find(f => f.title === d);
    
      return film.title
        .replace('Spider-Man: ', '')
        .replace('Spider-Man ', 'SM ')
        .replace('The Amazing Spider-Man', 'TASM');
    });

  g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickSize(4));

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -35)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8892a4')
    .attr('font-size', 10)
    .attr('font-family', 'Inter, sans-serif')
    .text('Score (out of 100)');

  const filmGroups = g.selectAll('.film-group')
    .data(films)
    .join('g')
    .attr('class', 'film-group')
    .attr('transform', d => `translate(${x0(d.title)},0)`);

  filmGroups.selectAll('rect')
    .data(d => METRICS.map(m => ({
      key:   m.key,
      label: m.label,
      color: m.color,
      raw:   m.key === 'imdbRating' ? d[m.key] * 10 : d[m.key],
      rawVal: d[m.key],
      title: d.title,
    })))
    .join('rect')
    .attr('x', d => x1(d.key))
    .attr('width', x1.bandwidth())
    .attr('y', height)        
    .attr('height', 0)        
    .attr('fill', d => d.color)
    .attr('rx', 3)
    .attr('opacity', 0.85)
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 1);
      tooltip
        .classed('visible', true)
        .html(`
          <div class="tooltip-title">${d.title}</div>
          <div class="tooltip-row">${d.label}: <span>${d.label === 'IMDb' ? d.rawVal + '/10' : d.rawVal + (d.label === 'RT Score' ? '%' : '/100')}</span></div>
          ${d.label === 'IMDb' ? '<div class="tooltip-row" style="font-size:0.75rem;color:#8892a4">Normalized to /100 for comparison</div>' : ''}
        `);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.clientX + 14) + 'px')
        .style('top',  (event.clientY - 20) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 0.85);
      tooltip.classed('visible', false);
    });

  filmGroups.selectAll('.bar-label')
    .data(d => METRICS.map(m => ({
      key:   m.key,
      raw:   m.key === 'imdbRating' ? d[m.key] * 10 : d[m.key],
      rawVal: d[m.key],
      label: m.label,
    })))
    .join('text')
    .attr('class', 'bar-label')
    .attr('x', d => x1(d.key) + x1.bandwidth() / 2)
    .attr('text-anchor', 'middle')
    .attr('font-size', 9)
    .attr('font-family', 'Inter, sans-serif')
    .attr('fill', '#f1faee')
    .attr('opacity', 0)
    .attr('y', height)
    .text(d => d.label === 'IMDb' ? d.rawVal : d.rawVal);

  const legendG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${totalH - 22})`);

  METRICS.forEach((m, i) => {
    const lx = i * 110;
    legendG.append('rect')
      .attr('x', lx).attr('y', 0)
      .attr('width', 10).attr('height', 10)
      .attr('fill', m.color).attr('rx', 2);
    legendG.append('text')
      .attr('x', lx + 14).attr('y', 9)
      .attr('fill', '#8892a4')
      .attr('font-size', 10)
      .attr('font-family', 'Inter, sans-serif')
      .text(m.key === 'imdbRating' ? 'IMDb ×10' : m.label);
  });

  return function animate() {
    filmGroups.selectAll('rect')
      .transition()
      .duration(700)
      .delay((d, i) => i * 80)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.raw))
      .attr('height', d => height - y(d.raw));

    filmGroups.selectAll('.bar-label')
      .transition()
      .duration(700)
      .delay((d, i) => i * 80 + 400)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.raw) - 4)
      .attr('opacity', 0.9);
  };
}

export function createComparisonBars(eraSummaries, selector) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = '';

  const metricConfigs = {
    imdb:      { label: 'IMDb Rating',  getValue: d => d.avgImdb,      format: v => v.toFixed(1) + '/10', max: 10  },
    metascore: { label: 'Metascore',    getValue: d => d.avgMetascore, format: v => v.toFixed(0) + '/100', max: 100 },
    rt:        { label: 'RT Score',     getValue: d => d.avgRt,        format: v => v.toFixed(0) + '%',    max: 100 },
    boxOffice: { label: 'Avg Box Office', getValue: d => d.avgBo / 1e6, format: v => '$' + v.toFixed(0) + 'M', max: null },
  };

  let currentMetric = 'imdb';

  const margin = { top: 20, right: 80, bottom: 30, left: 90 };
  const totalW  = container.clientWidth || 480;
  const totalH  = 200;
  const width   = totalW - margin.left - margin.right;
  const height  = totalH - margin.top - margin.bottom;

  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${totalW} ${totalH}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select('body')
    .selectAll('.tooltip')
    .data([null])
    .join('div')
    .attr('class', 'tooltip');

  const y = d3.scaleBand()
    .domain(eraSummaries.map(d => d.era))
    .range([0, height])
    .padding(0.35);

  function buildX(metric) {
    const cfg = metricConfigs[metric];
    const vals = eraSummaries.map(cfg.getValue);
    return d3.scaleLinear()
      .domain([0, cfg.max || d3.max(vals) * 1.15])
      .range([0, width]);
  }

  g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll('text')
    .attr('fill', d => ERA_COLORS[d])
    .attr('font-size', 12)
    .attr('font-weight', 600)
    .attr('dx', -6);

  const bars = g.selectAll('.comp-bar')
    .data(eraSummaries)
    .join('rect')
    .attr('class', 'comp-bar')
    .attr('y', d => y(d.era))
    .attr('height', y.bandwidth())
    .attr('x', 0)
    .attr('width', 0)
    .attr('fill', d => ERA_COLORS[d.era])
    .attr('rx', 4)
    .attr('opacity', 0.85)
    .on('mouseenter', function(event, d) {
      const cfg = metricConfigs[currentMetric];
      d3.select(this).attr('opacity', 1);
      tooltip.classed('visible', true).html(`
        <div class="tooltip-title">${d.era} Era</div>
        <div class="tooltip-row">${cfg.label}: <span>${cfg.format(cfg.getValue(d))}</span></div>
        <div class="tooltip-row">Films: <span>${d.films.length}</span></div>
      `);
    })
    .on('mousemove', event => {
      tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 20) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 0.85);
      tooltip.classed('visible', false);
    });

  const labels = g.selectAll('.comp-label')
    .data(eraSummaries)
    .join('text')
    .attr('class', 'comp-label')
    .attr('y', d => y(d.era) + y.bandwidth() / 2 + 4)
    .attr('x', 4)
    .attr('fill', '#f1faee')
    .attr('font-size', 11)
    .attr('font-weight', 700)
    .attr('font-family', 'Inter, sans-serif')
    .attr('opacity', 0);

  function update(metric, animated = true) {
    currentMetric = metric;
    const cfg = metricConfigs[metric];
    const x = buildX(metric);

    bars.transition()
      .duration(animated ? 600 : 0)
      .ease(d3.easeCubicOut)
      .attr('width', d => x(cfg.getValue(d)));

    labels.transition()
      .duration(animated ? 600 : 0)
      .ease(d3.easeCubicOut)
      .attr('x', d => x(cfg.getValue(d)) + 6)
      .attr('opacity', 1)
      .text(d => cfg.format(cfg.getValue(d)));
  }

  const btnContainer = document.querySelector('#era-filter-buttons');
  if (btnContainer) {
    btnContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btnContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        update(btn.dataset.metric);
      });
    });
  }

  return function animate() { update(currentMetric, true); };
}
