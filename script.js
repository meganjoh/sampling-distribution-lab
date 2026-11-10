import { POPULATION_MEAN, POPULATION_SD, SAMPLE_SIZES, PLOT_MAX_X, BIN_COUNT, drawSample, summarize, histogram, theoreticalStandardError } from './math.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const state = Object.fromEntries(SAMPLE_SIZES.map(n => [n, { means: [], last: null }]));
let selectedN = 1;
let revealed = false;

const $ = id => document.getElementById(id);
const fmt = value => value === null ? '—' : value.toFixed(2);
const compactCount = count => count.toLocaleString('en-US');

function svgEl(tag, attributes = {}, text = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== null) node.textContent = text;
  return node;
}

function svgPlot(container, options = {}) {
  const { kind = 'sample', values = [], mini = false, n = 1 } = options;
  const W = mini ? 360 : 610;
  const H = mini ? 145 : 263;
  const left = mini ? 14 : 35;
  const right = mini ? 9 : 14;
  const top = mini ? 8 : 17;
  const bottom = mini ? 24 : 39;
  const width = W - left - right;
  const height = H - top - bottom;
  const yMax = kind === 'population' ? 0.15 : mini ? 0.36 : n === 36 ? 0.38 : n === 4 ? 0.18 : 0.20;
  const xPx = x => left + x / PLOT_MAX_X * width;
  const yPx = y => top + height - y / yMax * height;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, xmlns: SVG_NS, 'aria-hidden': 'true', focusable: 'false' });

  // Guide lines and shared axis: all plots show wait times from 0 to 40 minutes.
  for (const v of [0, 8, 16, 24, 32, 40]) {
    const x = xPx(v);
    svg.appendChild(svgEl('line', { x1:x, y1:top, x2:x, y2:top+height, stroke:'#e6edef', 'stroke-width':1 }));
    if (!mini || v === 0 || v === 16 || v === 32 || v === 40) {
      svg.appendChild(svgEl('text', { x, y:top+height+17, fill:'#5e747e', 'text-anchor':'middle', 'font-size':mini?11:12 }, String(v)));
    }
  }
  svg.appendChild(svgEl('line', { x1:left,y1:top+height,x2:left+width,y2:top+height,stroke:'#718e97','stroke-width':1.3 }));

  if (kind === 'population') {
    const points = [];
    for (let x = 0; x <= PLOT_MAX_X; x += 0.25) {
      const density = Math.exp(-x / POPULATION_MEAN) / POPULATION_MEAN;
      points.push([xPx(x), yPx(density)]);
    }
    let d = `M ${left} ${top+height} `;
    d += points.map(([x,y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
    d += ` L ${xPx(PLOT_MAX_X)} ${top+height} Z`;
    svg.appendChild(svgEl('path', { d, fill:'#efd3bf', opacity:.88 }));
    svg.appendChild(svgEl('polyline', { points:points.map(([x,y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '), fill:'none',stroke:'#b95f32','stroke-width':3,'stroke-linejoin':'round' }));
  } else if (values.length) {
    const { densities } = histogram(values);
    const bw = width / BIN_COUNT;
    for (let i=0;i<densities.length;i++) {
      const density = Math.min(densities[i], yMax);
      const barHeight = density / yMax * height;
      if (barHeight > 0) {
        svg.appendChild(svgEl('rect', {x:left+i*bw+.55,y:top+height-barHeight,width:Math.max(0,bw-1.1),height:barHeight,fill:mini?'#6faeb4':'#4f98a4',rx:1}));
      }
    }
  } else {
    svg.appendChild(svgEl('text',{x:left+width/2,y:top+height/2,fill:'#718590','text-anchor':'middle','font-size':mini?12:15},'No samples yet'));
  }
  // Show target population mean (the center of the sampling distributions).
  svg.appendChild(svgEl('line',{x1:xPx(8),y1:top,x2:xPx(8),y2:top+height,stroke:'#1e766b','stroke-width':2,'stroke-dasharray':'5 5'}));
  if (!mini) {
    svg.appendChild(svgEl('text',{x:xPx(8)+5,y:top+11,fill:'#1a7168','font-size':11,'font-weight':700},'μ = 8'));
    svg.appendChild(svgEl('text',{x:left+width/2,y:H-5,fill:'#5e747e','text-anchor':'middle','font-size':12},kind === 'population'?'Individual wait time (minutes)':'Sample mean wait time (minutes)'));
  }
  container.replaceChildren(svg);
}

function updatePopulation() { svgPlot($('population-plot'), { kind:'population' }); }

function updateSampling() {
  const data = state[selectedN];
  const stats = summarize(data.means);
  const count = stats.count;
  svgPlot($('sampling-plot'), { values:data.means,n:selectedN });
  $('sampling-plot').setAttribute('aria-label', count ? `Histogram of ${count} sample means from samples of size ${selectedN}, centered approximately at ${fmt(stats.mean)} minutes.` : `No sample means generated yet for samples of size ${selectedN}.`);
  $('active-count').textContent = `${compactCount(count)} sample mean${count===1?'':'s'}`;
  $('observed-mean').textContent = fmt(stats.mean);
  $('observed-sd').textContent = fmt(stats.sd);
  $('reset-active').textContent = `↺ Clear samples for n = ${selectedN}`;
  const outOfRange = histogram(data.means).outOfRange;
  $('plot-note').textContent = !count ? 'Choose a button above to start your sampling distribution.' : outOfRange ? `${compactCount(outOfRange)} unusually large sample mean${outOfRange===1?' is':'s are'} beyond the 40-minute plotting range; all are included in the statistics.` : 'The dashed line marks the population mean: 8 minutes.';
  if (data.last) {
    const shown = data.last.values.slice(0,6).map(x=>x.toFixed(1)).join(', ');
    const suffix = data.last.values.length > 6 ? ', …' : '';
    $('last-sample-text').textContent = `Wait times: ${shown}${suffix} min. Sample mean: ${fmt(data.last.mean)} min.`;
  } else {
    $('last-sample-text').textContent = "You haven't drawn a sample for this sample size yet.";
  }
  $('theory-line').textContent = `For n = ${selectedN}, the predicted standard deviation of the sample mean is ${fmt(theoreticalStandardError(selectedN))} minutes.`;
}

function updateComparisons() {
  for (const n of SAMPLE_SIZES) {
    const stats = summarize(state[n].means);
    svgPlot($(`compare-plot-${n}`), {values:state[n].means,n,mini:true});
    $(`compare-plot-${n}`).setAttribute('aria-label', stats.count ? `Histogram of ${stats.count} sample means for n equals ${n}; simulated mean ${fmt(stats.mean)} minutes, simulated standard deviation ${fmt(stats.sd)} minutes.` : `No samples generated for sample size ${n}.`);
    $(`compare-count-${n}`).textContent = stats.count ? `${compactCount(stats.count)} sample${stats.count===1?'':'s'}` : 'No samples yet';
    $(`compare-mean-${n}`).textContent = fmt(stats.mean);
    $(`compare-sd-${n}`).textContent = fmt(stats.sd);
  }
}

function refresh() { updateSampling(); updateComparisons(); }

function selectN(n) {
  if (!SAMPLE_SIZES.includes(n)) return;
  selectedN = n;
  document.querySelectorAll('.sample-size').forEach(button => {
    const active = Number(button.dataset.n) === n;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  updateSampling();
}

function generate(k) {
  // A short batch is small enough to run synchronously on typical classroom phones.
  const current = state[selectedN];
  for (let i=0; i<k; i++) {
    const sample = drawSample(selectedN);
    current.means.push(sample.mean);
    current.last = sample;
  }
  refresh();
  $('sample-status').textContent = `Generated ${compactCount(k)} sample${k===1?'':'s'} of size ${selectedN}; ${compactCount(current.means.length)} sample means now available.`;
}

function reset(n) {
  state[n] = {means:[],last:null};
  refresh();
  $('sample-status').textContent = `Cleared samples for n equals ${n}.`;
}

document.querySelectorAll('.sample-size').forEach(button => button.addEventListener('click', () => selectN(Number(button.dataset.n))));
document.querySelectorAll('[data-generate]').forEach(button => button.addEventListener('click', () => generate(Number(button.dataset.generate))));
$('reset-active').addEventListener('click', () => reset(selectedN));
$('reset-all').addEventListener('click', () => {
  for (const n of SAMPLE_SIZES) state[n] = {means:[],last:null};
  refresh();
  $('sample-status').textContent = 'All sampling results were cleared.';
});
$('reveal-button').addEventListener('click', () => {
  revealed = !revealed;
  $('math-reveal').hidden = !revealed;
  $('reveal-button').setAttribute('aria-expanded', String(revealed));
  $('reveal-button').textContent = revealed ? 'Hide the mathematics ↑' : 'Reveal the mathematics ↓';
});

updatePopulation();
refresh();
