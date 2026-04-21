// radarChart.js — Spider/ radar chart comparing era averages across 4 metrics

import { ERA_COLORS } from './data.js';

const AXES = [
  { key: 'avgImdb',      label: 'IMDb',      max: 10,  format: v => v.toFixed(1) },
  { key: 'avgRt',        label: 'RT Score',  max: 100, format: v => v.toFixed(0) + '%' },
  { key: 'avgMetascore', label: 'Metascore', max: 100, format: v => v.toFixed(0) },
  { key: 'boNorm',       label: 'Box Office',max: 100, format: v => v.toFixed(0) },
];

export function createRadarChart(eraSummaries, selector) {
  const container = document.querySelector(selector);
  if (!container) return () => {};
  container.innerHTML = '';

  const maxBo = Math.max(...eraSummaries.map(d => d.avgBo));
  const data = eraSummaries.map(d => ({
    ...d,
    boNorm: (d.avgBo / maxBo) * 100,
  }));

  const size    = Math.min(container.clientWidth || 400, 400);
  const margin  = 60;
  const radius  = size / 2 - margin;
  const cx      = size / 2;
  const cy      = size / 2;
  const levels  = 5;
  const angleStep = (Math.PI * 2) / AXES.length;

  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${size} ${size}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g');

  // Tooltip
  const tooltip = d3.select('body')
    .selectAll('.tooltip')
    .data([null])
    .join('div')
    .attr('class', 'tooltip');

  function coord(angle, r) {
    return {
      x: cx + r * Math.cos(angle - Math.PI / 2),
      y: cy + r * Math.sin(angle - Math.PI / 2),
    };
  }

  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (lvl / levels) * radius;
    const pts = AXES.map((_, i) => coord(i * angleStep, r));
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
    g.append('path')
      .attr('d', pathD)
      .attr('fill', 'none')
      .attr('stroke', '#2a2a2a')
      .attr('stroke-width', lvl === levels ? 1.5 : 0.8);

    const labelPt = coord(0, r);
    g.append('text')
      .attr('x', labelPt.x + 4)
      .attr('y', labelPt.y)
      .attr('fill', '#444')
      .attr('font-size', 8)
      .attr('font-family', 'Inter, sans-serif')
      .text(Math.round((lvl / levels) * 100) + '%');
  }

  AXES.forEach((axis, i) => {
    const angle = i * angleStep;
    const outer = coord(angle, radius);
    g.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', outer.x).attr('y2', outer.y)
      .attr('stroke', '#2a2a2a')
      .attr('stroke-width', 1);

    const labelDist = radius + 20;
    const lp = coord(angle, labelDist);
    g.append('text')
      .attr('x', lp.x)
      .attr('y', lp.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#8892a4')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('font-family', 'Inter, sans-serif')
      .text(axis.label);
  });

  const visible = {};
  data.forEach(d => { visible[d.era] = true; });

  const polygons = {};
  const dotGroups = {};

  data.forEach(d => {
    const pts = AXES.map((axis, i) => {
      const val = d[axis.key];
      const norm = val / axis.max;
      return coord(i * angleStep, norm * radius);
    });
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
    const color = ERA_COLORS[d.era];

    const poly = g.append('path')
      .attr('d', pathD)
      .attr('fill', color)
      .attr('fill-opacity', 0.12)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0)   
      .attr('fill-opacity', 0);    

    polygons[d.era] = poly;


    const dotG = g.append('g');
    AXES.forEach((axis, i) => {
      const pt = pts[i];
      dotG.append('circle')
        .attr('cx', pt.x)
        .attr('cy', pt.y)
        .attr('r', 4)
        .attr('fill', color)
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0)
        .style('cursor', 'pointer')
        .on('mouseenter', function(event) {
          const val = d[axis.key];
          tooltip.classed('visible', true).html(`
            <div class="tooltip-title">${d.era} Era</div>
            <div class="tooltip-row">${axis.label}: <span>${axis.format(val)}</span></div>
          `);
        })
        .on('mousemove', event => {
          tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 20) + 'px');
        })
        .on('mouseleave', () => tooltip.classed('visible', false));
    });
    dotGroups[d.era] = dotG;
  });


  const legendContainer = document.createElement('div');
  legendContainer.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:0.75rem;';
  container.appendChild(legendContainer);

  data.forEach(d => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.dataset.era = d.era;
    item.innerHTML = `
      <div class="legend-dot" style="background:${ERA_COLORS[d.era]}"></div>
      <span>${d.era}</span>
    `;
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      visible[d.era] = !visible[d.era];
      const opacity = visible[d.era] ? 1 : 0;
      polygons[d.era]
        .transition().duration(300)
        .attr('stroke-opacity', opacity)
        .attr('fill-opacity', visible[d.era] ? 0.12 : 0);
      dotGroups[d.era].selectAll('circle')
        .transition().duration(300)
        .attr('opacity', opacity);
      item.style.opacity = visible[d.era] ? '1' : '0.35';
    });
    legendContainer.appendChild(item);
  });

  return function animate() {
    data.forEach(d => {
      polygons[d.era]
        .transition().duration(800).delay(200)
        .attr('stroke-opacity', 1)
        .attr('fill-opacity', 0.12);
      dotGroups[d.era].selectAll('circle')
        .transition().duration(600).delay(600)
        .attr('opacity', 1);
    });
  };
}