import {
  POPULATION_MEAN, POPULATION_SD, SAMPLE_SIZES, PLOT_MAX_X, BIN_COUNT,
  drawSample, summarize, histogram, theoreticalStandardError
} from './math.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const state = Object.fromEntries(SAMPLE_SIZES.map(n => [n, { means: [], inspectedSample: null }]));
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

/** Shared horizontal range and fixed density axis for the comparison cards. */
function svgPlot(container, options = {}) {
  const { kind = 'sample', values = [], mini = false, n = 1, highlight = null } = options;
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

  for (const v of [0, 8, 16, 24, 32, 40]) {
    const x = xPx(v);
    svg.appendChild(svgEl('line', { x1:x, y1:top, x2:x, y2:top+height, stroke:'#e6edef', 'stroke-width':1 }));
    if (!mini || [0,16,32,40].includes(v)) {
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
  } else if (values.length >= 20) {
    // For at least 20 means, use a density histogram so differing sample counts remain comparable.
    const { densities } = histogram(values);
    const bw = width / BIN_COUNT;
    for (let i=0; i<densities.length; i++) {
      const density = Math.min(densities[i], yMax);
      const barHeight = density / yMax * height;
      if (barHeight > 0) {
        svg.appendChild(svgEl('rect', { x:left+i*bw+.55, y:top+height-barHeight,
          width:Math.max(0,bw-1.1), height:barHeight, fill:mini?'#6faeb4':'#4f98a4',rx:1 }));
      }
    }
  } else if (values.length) {
    // Show the first handful of sample means as dots; a 1-observation density bar is misleading.
    const dots = values.filter(v => v >= 0 && v <= PLOT_MAX_X).sort((a,b) => a-b);
    let previousX = -100;
    let row = 0;
    for (const value of dots) {
      const x = xPx(value);
      row = x - previousX < (mini ? 7 : 9) ? (row + 1) % 5 : 0;
      const y = top + height - 8 - row * (mini ? 8 : 10);
      svg.appendChild(svgEl('circle', { cx:x, cy:y, r:mini?3.8:5,
        fill:'#237f88',stroke:'#ffffff','stroke-width':1 }));
      previousX = x;
    }
  } else {
    svg.appendChild(svgEl('text', { x:left+width/2, y:top+height/2,
      fill:'#718590','text-anchor':'middle','font-size':mini?12:15 }, 'No samples yet'));
  }

  // Vertical reference line for the population mean.
  svg.appendChild(svgEl('line', { x1:xPx(8),y1:top,x2:xPx(8),y2:top+height,
    stroke:'#1e766b','stroke-width':2,'stroke-dasharray':'5 5' }));
  if (!mini) {
    svg.appendChild(svgEl('text', { x:xPx(8)+5,y:top+11,fill:'#1a7168','font-size':11,'font-weight':700 }, 'μ = 8'));
    svg.appendChild(svgEl('text', { x:left+width/2,y:H-5,fill:'#5e747e','text-anchor':'middle','font-size':12 },
      kind === 'population' ? 'Individual wait time (minutes)' : 'Sample mean wait time (minutes)'));
  }
  // Link the example sample's mean to a mark on the sampling distribution.
  if (kind === 'sample' && !mini && highlight !== null && highlight >= 0 && highlight <= PLOT_MAX_X) {
    const x = xPx(highlight);
    const y = top + height - 3;
    svg.appendChild(svgEl('path', { d:`M ${x} ${y-13} l 6 6 l -6 6 l -6 -6 Z`,
      fill:'#af542a',stroke:'white','stroke-width':1.2 }));
    svg.appendChild(svgEl('text', { x:Math.min(x+10,left+width-100),y:top+height-20,
      fill:'#8e4526','font-size':11,'font-weight':700 }, 'Example mean'));
  }
  container.replaceChildren(svg);
}

/** Plot the *individual wait times* in the sample inspector, plus its average. */
function drawSampleDots(sample) {
  const container = $('sample-dots');
  const W=580, H=108, L=25, R=22, axisY=77, plotWidth=W-L-R;
  const xPx = value => L + Math.min(PLOT_MAX_X,Math.max(0,value)) / PLOT_MAX_X * plotWidth;
  const svg = svgEl('svg',{viewBox:`0 0 ${W} ${H}`,xmlns:SVG_NS,'aria-hidden':'true',focusable:'false'});
  for (const tick of [0,8,16,24,32,40]) {
    const x=xPx(tick);
    svg.appendChild(svgEl('line',{x1:x,y1:20,x2:x,y2:axisY,stroke:'#e3e9e9','stroke-width':1}));
    svg.appendChild(svgEl('text',{x,y:axisY+17,fill:'#536b77','text-anchor':'middle','font-size':12},String(tick)));
  }
  svg.appendChild(svgEl('line',{x1:L,y1:axisY,x2:W-R,y2:axisY,stroke:'#78959c','stroke-width':1.5}));
  const sorted=sample.values.filter(v=>v<=PLOT_MAX_X).slice().sort((a,b)=>a-b);
  let previousX=-100, row=0;
  for (const value of sorted) {
    const x=xPx(value);
    row=(x-previousX<11)?(row+1)%5:0;
    svg.appendChild(svgEl('circle',{cx:x,cy:axisY-13-row*10,r:4.6,
      fill:'#288f9b',stroke:'#ffffff','stroke-width':1.1}));
    previousX=x;
  }
  const mx=xPx(sample.mean);
  svg.appendChild(svgEl('path',{d:`M ${mx} 6 L ${mx+7} 14 L ${mx} 22 L ${mx-7} 14 Z`,
    fill:'#b75c31',stroke:'white','stroke-width':1}));
  svg.appendChild(svgEl('line',{x1:mx,y1:22,x2:mx,y2:axisY,
    stroke:'#b75c31','stroke-width':1.4,'stroke-dasharray':'3 4'}));
  container.replaceChildren(svg);
  const beyond=sample.values.filter(v=>v>PLOT_MAX_X).length;
  const description=sample.values.length===1 ? 'One observed wait time' : `${sample.values.length} individual wait times`;
  container.setAttribute('aria-label',`${description} plotted from 0 to 40 minutes; sample mean ${fmt(sample.mean)} minutes; ${beyond} observations beyond the 40-minute plot range.`);
}

function updatePopulation() { svgPlot($('population-plot'), { kind:'population' }); }

function updateSampleInspector() {
  const sample=state[selectedN].inspectedSample;
  $('sample-detail-empty').hidden=Boolean(sample);
  $('sample-detail').hidden=!sample;
  if (!sample) {
    $('sample-detail-empty').innerHTML = `Choose <strong>Draw 1 sample</strong> to inspect the individual wait times in a sample of <strong>${selectedN}</strong> customer${selectedN===1?'':'s'}.`;
    return;
  }
  const n=sample.values.length;
  $('sample-observation-count').textContent=`One sample: ${n} customer${n===1?'':'s'} → one sample mean`;
  drawSampleDots(sample);
  const preview=$('sample-values-preview');
  const visible=n>8?sample.values.slice(0,8):sample.values;
  preview.replaceChildren(...visible.map((v,i)=>{
    const span=document.createElement('span');
    span.className='observation-chip';
    span.textContent=v.toFixed(2);
    span.setAttribute('title',`Customer ${i+1}: ${v.toFixed(2)} minutes`);
    return span;
  }));
  const details=$('all-values-details');
  details.hidden=n<=8;
  details.open=false;
  $('all-values-label').textContent=`Show all ${n} individual wait times`;
  if (n>8) {
    $('all-values-list').replaceChildren(...sample.values.map(v=>{
      const li=document.createElement('li');
      li.textContent=`${v.toFixed(2)} min`;
      return li;
    }));
  } else {
    $('all-values-list').replaceChildren();
  }
  const sum=sample.values.reduce((total,v)=>total+v,0);
  $('sample-mean-step').textContent = n<=4
    ? `x̄ = (${sample.values.map(v=>v.toFixed(2)).join(' + ')}) ÷ ${n} ≈ ${fmt(sample.mean)} min`
    : `x̄ = ${sum.toFixed(2)} ÷ ${n} ≈ ${fmt(sample.mean)} min`;
}

function updateSampling() {
  const data=state[selectedN];
  const stats=summarize(data.means);
  const count=stats.count;
  svgPlot($('sampling-plot'), {values:data.means,n:selectedN,
    highlight:data.inspectedSample?.mean ?? null});
  $('sampling-plot').setAttribute('aria-label',count
    ? `Plot of ${count} sample means from samples of size ${selectedN}, with mean ${fmt(stats.mean)} minutes. ${count<20?'Dots show individual sample means.':'Histogram shows estimated probability density.'}`
    : `No sample means yet for samples of size ${selectedN}.`);
  $('active-count').textContent=`${compactCount(count)} sample mean${count===1?'':'s'}`;
  $('observed-mean').textContent=fmt(stats.mean);
  $('observed-sd').textContent=fmt(stats.sd);
  $('reset-active').textContent=`↺ Clear samples for n = ${selectedN}`;
  const outOfRange=histogram(data.means).outOfRange;
  $('plot-note').textContent=!count
    ? 'Choose a button above to begin. Each sample adds one mean.'
    : outOfRange
      ? `${compactCount(outOfRange)} sample mean${outOfRange===1?' is':'s are'} beyond 40 min; all are included in the statistics.`
      : count<20
        ? 'Each dot represents one sample mean. Draw more samples to build a histogram.'
        : 'The dashed line marks μ = 8. The orange diamond marks your inspected sample mean, if one was drawn.';
  $('theory-line').textContent=`For n = ${selectedN}, the predicted standard deviation of the sample mean is ${fmt(theoreticalStandardError(selectedN))} minutes.`;
  updateSampleInspector();
}

function updateComparisons() {
  for (const n of SAMPLE_SIZES) {
    const stats=summarize(state[n].means);
    svgPlot($(`compare-plot-${n}`),{values:state[n].means,n,mini:true});
    $(`compare-plot-${n}`).setAttribute('aria-label',stats.count
      ? `${stats.count<20?'Dots':'Density histogram'} of ${stats.count} sample means for n equals ${n}; observed mean ${fmt(stats.mean)} minutes and standard deviation ${fmt(stats.sd)} minutes.`
      : `No samples generated for n equals ${n}.`);
    $(`compare-count-${n}`).textContent=stats.count
      ? `${compactCount(stats.count)} sample${stats.count===1?'':'s'}` : 'No samples yet';
    $(`compare-mean-${n}`).textContent=fmt(stats.mean);
    $(`compare-sd-${n}`).textContent=fmt(stats.sd);
  }
}

function refresh() { updateSampling(); updateComparisons(); }

function selectN(n) {
  if (!SAMPLE_SIZES.includes(n)) return;
  selectedN=n;
  document.querySelectorAll('.sample-size').forEach(button=>{
    const active=Number(button.dataset.n)===n;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  updateSampling();
}

function generate(k) {
  const current=state[selectedN];
  for (let i=0;i<k;i++) {
    const sample=drawSample(selectedN);
    current.means.push(sample.mean);
    // The single-sample view shows only explicitly requested examples, not the last
    // of 1,000 samples in a batch (which could imply students observed every draw).
    if (k===1) current.inspectedSample=sample;
  }
  refresh();
  $('sample-status').textContent=`Generated ${compactCount(k)} sample${k===1?'':'s'} of size ${selectedN}. There are now ${compactCount(current.means.length)} sample means.`;
}

function reset(n) {
  state[n]={means:[],inspectedSample:null};
  refresh();
  $('sample-status').textContent=`Cleared sampling data for n equals ${n}.`;
}

document.querySelectorAll('.sample-size').forEach(button=>
  button.addEventListener('click',()=>selectN(Number(button.dataset.n))));
document.querySelectorAll('[data-generate]').forEach(button=>
  button.addEventListener('click',()=>generate(Number(button.dataset.generate))));
document.querySelectorAll('[name="opening-prediction"]').forEach(input=>
  input.addEventListener('change',()=>{
    $('prediction-feedback').textContent='Prediction saved for this session. Now experiment and decide whether the evidence supports it.';
  }));
$('reset-active').addEventListener('click',()=>reset(selectedN));
$('reset-all').addEventListener('click',()=>{
  for (const n of SAMPLE_SIZES) state[n]={means:[],inspectedSample:null};
  refresh();
  document.querySelectorAll('[name="opening-prediction"]').forEach(input=>input.checked=false);
  $('prediction-feedback').textContent='Choose one, then look for evidence in the sampling experiments.';
  revealed=false;
  $('math-reveal').hidden=true;
  $('reveal-button').setAttribute('aria-expanded','false');
  $('reveal-button').textContent='Reveal the mathematics ↓';
  selectN(1);
  $('sample-status').textContent='Cleared all sampling experiments and predictions.';
});
$('reveal-button').addEventListener('click',()=>{
  revealed=!revealed;
  $('math-reveal').hidden=!revealed;
  $('reveal-button').setAttribute('aria-expanded',String(revealed));
  $('reveal-button').textContent=revealed?'Hide the mathematics ↑':'Reveal the mathematics ↓';
});

updatePopulation();
refresh();
