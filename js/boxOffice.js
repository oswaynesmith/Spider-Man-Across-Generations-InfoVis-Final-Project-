import { ERA_COLORS, fmtBoxOffice } from './data.js';

export function createBoxOfficeChart(movies, selector) {
  const container = document.querySelector(selector);
  if (!container) return () => {};
  container.innerHTML = '';

  const sorted = [...movies].sort((a, b) => b.boxOffice - a.boxOffice);

  const margin = { top: 20, right: 120, bottom: 40, left: 220 };
  const totalW  = container.clientWidth || 900;
  const rowH    = 52;
  const totalH  = sorted.length * rowH + margin.top + margin.bottom;
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

  const x = d3.scaleLinear()
    .domain([0, d3.max(sorted, d => d.boxOffice) * 1.05])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(sorted.map(d => d.title))
    .range([0, height])
    .padding(0.4);

  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(5)
        .tickSize(-height)
        .tickFormat('')
    );

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(5)
        .tickFormat(d => fmtBoxOffice(d, 0))
    );

  const yAxis = g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).tickSize(0));

  yAxis.selectAll('text')
    .attr('fill', d => {
      const film = sorted.find(f => f.title === d);
      return ERA_COLORS[film.era];
    })
    .attr('font-size', 11)
    .attr('font-weight', 600)
    .attr('dx', -8)
    .text(d => {
      if (d.length > 28) return d.slice(0, 26) + '…';
      return d;
    });

  yAxis.select('.domain').remove();

  const stems = g.selectAll('.stem')
    .data(sorted)
    .join('line')
    .attr('class', 'stem')
    .attr('y1', d => y(d.title) + y.bandwidth() / 2)
    .attr('y2', d => y(d.title) + y.bandwidth() / 2)
    .attr('x1', 0)
    .attr('x2', 0)           
    .attr('stroke', '#2a2a2a')
    .attr('stroke-width', 2);

  const dots = g.selectAll('.lollipop-dot')
    .data(sorted)
    .join('circle')
    .attr('class', 'lollipop-dot')
    .attr('cy', d => y(d.title) + y.bandwidth() / 2)
    .attr('cx', 0)        
    .attr('r', 10)
    .attr('fill', d => ERA_COLORS[d.era])
    .attr('stroke', '#0a0a0a')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('r', 13);
      tooltip.classed('visible', true).html(`
        <div class="tooltip-title">${d.title}</div>
        <div class="tooltip-row">Era: <span style="color:${ERA_COLORS[d.era]}">${d.actor}</span></div>
        <div class="tooltip-row">Year: <span>${d.year}</span></div>
        <div class="tooltip-row">Box Office: <span>${fmtBoxOffice(d.boxOffice)}</span></div>
        <div class="tooltip-row">IMDb: <span>${d.imdbRating}/10</span></div>
      `);
    })
    .on('mousemove', event => {
      tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 20) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).attr('r', 10);
      tooltip.classed('visible', false);
    });

  const valueLabels = g.selectAll('.bo-label')
    .data(sorted)
    .join('text')
    .attr('class', 'bo-label')
    .attr('y', d => y(d.title) + y.bandwidth() / 2 + 4)
    .attr('x', 0) 
    .attr('fill', '#8892a4')
    .attr('font-size', 11)
    .attr('font-family', 'Inter, sans-serif')
    .attr('opacity', 0)
    .text(d => fmtBoxOffice(d.boxOffice));

  return function animate() {
    stems.transition()
      .duration(700)
      .delay((d, i) => i * 60)
      .ease(d3.easeCubicOut)
      .attr('x2', d => x(d.boxOffice));

    dots.transition()
      .duration(700)
      .delay((d, i) => i * 60)
      .ease(d3.easeCubicOut)
      .attr('cx', d => x(d.boxOffice));

    valueLabels.transition()
      .duration(700)
      .delay((d, i) => i * 60 + 400)
      .ease(d3.easeCubicOut)
      .attr('x', d => x(d.boxOffice) + 16)
      .attr('opacity', 1);
  };
}
