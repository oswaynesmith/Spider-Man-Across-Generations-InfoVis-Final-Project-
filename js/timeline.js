
import { ERA_COLORS, fmtBoxOffice } from './data.js';

export function createTimeline(movies, selector) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = '';

  const margin = { top: 60, right: 40, bottom: 60, left: 40 };
  const totalW  = container.clientWidth || 900;
  const totalH  = 260;
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

  
  const xScale = d3.scaleLinear()
    .domain([2001, 2022])
    .range([0, width]);

  const maxBO = d3.max(movies, d => d.boxOffice);
  const rScale = d3.scaleSqrt()
    .domain([0, maxBO])
    .range([8, 36]);

  const cy = height / 2;

  
  g.append('line')
    .attr('x1', 0).attr('y1', cy)
    .attr('x2', width).attr('y2', cy)
    .attr('stroke', '#2a2a2a')
    .attr('stroke-width', 2);

  
  const years = [2002, 2004, 2007, 2012, 2014, 2017, 2019, 2021];
  g.selectAll('.year-tick')
    .data(years)
    .join('g')
    .attr('class', 'year-tick')
    .attr('transform', d => `translate(${xScale(d)},${cy})`)
    .call(g => {
      g.append('line')
        .attr('y1', -6).attr('y2', 6)
        .attr('stroke', '#2a2a2a');
      g.append('text')
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#8892a4')
        .attr('font-size', 11)
        .attr('font-family', 'Inter, sans-serif')
        .text(d => d);
    });

  
  const filmGroups = g.selectAll('.film-node')
    .data(movies)
    .join('g')
    .attr('class', 'film-node')
    .attr('transform', d => `translate(${xScale(d.year)}, ${cy})`)
    .style('cursor', 'pointer');

  
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', 'glow');
  filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
  filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

  filmGroups.append('circle')
    .attr('r', d => rScale(d.boxOffice))
    .attr('fill', d => ERA_COLORS[d.era])
    .attr('opacity', 0.85)
    .attr('stroke', '#0a0a0a')
    .attr('stroke-width', 2)
    
    .attr('cy', -80)
    .attr('cx', 0);

  filmGroups.append('text')
    .attr('y', d => -(rScale(d.boxOffice) + 8))
    .attr('text-anchor', 'middle')
    .attr('fill', '#8892a4')
    .attr('font-size', 10)
    .attr('font-family', 'Inter, sans-serif')
    .attr('pointer-events', 'none')
    .attr('opacity', 0)
    .text(d => d.year);

  
  filmGroups
    .on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .attr('stroke', ERA_COLORS[d.era])
        .attr('stroke-width', 3)
        .attr('opacity', 1);
      tooltip
        .classed('visible', true)
        .html(`
          <div class="tooltip-title">${d.title}</div>
          <div class="tooltip-row">Year: <span>${d.year}</span></div>
          <div class="tooltip-row">Era: <span style="color:${ERA_COLORS[d.era]}">${d.era === 'All Eras' ? 'All Eras' : d.actor}</span></div>
          <div class="tooltip-row">IMDb: <span>${d.imdbRating}/10</span></div>
          <div class="tooltip-row">RT: <span>${d.rtScore}%</span></div>
          <div class="tooltip-row">Box Office: <span>${fmtBoxOffice(d.boxOffice)}</span></div>
        `);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.clientX + 14) + 'px')
        .style('top',  (event.clientY - 20) + 'px');
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 2)
        .attr('opacity', 0.85);
      tooltip.classed('visible', false);
    });

  
  const legendSel = document.querySelector('#timeline-legend');
  if (legendSel) {
    legendSel.innerHTML = '';
    const eras = [...new Set(movies.map(m => m.era))];
    eras.forEach(era => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <div class="legend-dot" style="background:${ERA_COLORS[era]}"></div>
        <span>${era === 'All Eras' ? 'All Eras (No Way Home)' : era + ' Maguire' === era ? era : era + (era === 'Tom' ? ' Holland' : era === 'Andrew' ? ' Garfield' : ' Maguire')}</span>
      `;
      legendSel.appendChild(item);
    });
    
    const note = document.createElement('div');
    note.className = 'legend-item';
    note.innerHTML = '<span style="color:#8892a4;font-size:0.75rem">Circle size = box office gross</span>';
    legendSel.appendChild(note);
  }

  
  return function animate() {
    filmGroups.select('circle')
      .transition()
      .duration(600)
      .delay((d, i) => i * 100)
      .ease(d3.easeBounceOut)
      .attr('cy', 0);

    filmGroups.select('text')
      .transition()
      .duration(400)
      .delay((d, i) => i * 100 + 400)
      .attr('opacity', 1);
  };
}
