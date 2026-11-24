/* การเคลื่อนไหวและปุ่มกดทั้งหมดของเว็บ
   ตัวเลขกราฟอยู่ใน data/story-data.js · ข้อความอยู่ใน index.html */
(() => {
document.documentElement.classList.add('js');
const S = window.STORY;
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
const txt = (s, attrs, parent) => { const t = el('text', attrs, parent); t.textContent = s; return t; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const tween = (dur, fn, delay = 0, ease = easeOut) => new Promise(res => setTimeout(() => {
  const t0 = performance.now();
  const step = now => { const t = Math.max(0, Math.min(1, (now - t0) / dur)); fn(ease(t)); if (t < 1) requestAnimationFrame(step); else res(); };
  requestAnimationFrame(step);
}, delay));
const wait = ms => new Promise(r => setTimeout(r, ms));
const mix = (a, b, p) => `color-mix(in oklab, ${a}, ${b} ${Math.round(p * 100)}%)`;
const nf = n => n.toLocaleString('en-US');
/* วันที่ของกราฟรายวัน 18 ก.ย.–14 ต.ค. */
const DAYS = Array.from({ length: 27 }, (_, i) => i < 13 ? `${18 + i} ก.ย.` : `${i - 12} ต.ค.`);

/* ทะเบียนแอนิเมชัน: element -> { arm: ตั้งสถานะเริ่ม, play: เล่นเมื่อเลื่อนถึง } */
const A = new Map();
const reg = (node, arm, play) => { if (node) A.set(node, { arm, play }); };

/* ตัวเลขนับขึ้น และค่อยๆ เปลี่ยนสีถ้ามี data-heat */
const fmt = (v, n) => { const d = +(n.dataset.dec || 0); return (n.dataset.pre || '') + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + (n.dataset.suf || ''); };
const countUp = n => {
  const to = +n.dataset.count, from = +(n.dataset.from || 0), heat = n.dataset.heat;
  const dur = +(n.dataset.dur || (to > 1000 ? 1800 : 1200));
  return tween(dur, t => {
    const v = from + (to - from) * t, d = +(n.dataset.dec || 0);
    n.textContent = fmt(d ? Math.round(v * 10 ** d) / 10 ** d : Math.round(v), n);
    if (heat) n.style.color = mix(css('--bone'), css('--' + heat), t);
  }, +(n.dataset.delay || 0)).then(() => { n.textContent = fmt(to, n); if (heat) n.style.color = ''; });
};
document.querySelectorAll('[data-count]').forEach(n => {
  const arm = () => { n.textContent = fmt(+(n.dataset.from || 0), n); if (n.dataset.heat) n.style.color = css('--bone'); };
  if ('now' in n.dataset) { if (!reduce) { arm(); countUp(n); } return; }
  reg(n, arm, () => countUp(n));
});
const classAnim = n => reg(n, () => n.classList.add('armed'), () => { n.classList.remove('armed'); n.classList.add('in'); });
document.querySelectorAll('.rise').forEach(n => { [...n.children].forEach((c, i) => c.style.setProperty('--i', i)); classAnim(n); });
document.querySelectorAll('.sweep, .wanted, #cal').forEach(classAnim);
document.querySelectorAll('.wanted .poster, #cal span').forEach(c => c.style.setProperty('--i', [...c.parentNode.children].indexOf(c)));

/* ===== จระเข้: พิมพ์คำค้น แล้วตัวเลขวิ่งจาก 0 จนหยุดที่ 566 (แตะตัวเลขเพื่อดูอีกครั้ง) ===== */
(() => {
  const box = $('p-croc'), q = $('q'), n = $('n566'), st = $('qStatus'), bar = box.querySelector('.search');
  const word = q.textContent, parts = 'Segmenter' in Intl ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(word)].map(s => s.segment) : [...word];
  const run = () => {
    q.textContent = ''; n.textContent = '0'; n.classList.remove('landed'); n.classList.add('ticking'); st.textContent = ' '; bar.classList.add('searching');
    let i = 0;
    const type = () => {
      if (i < parts.length) { q.textContent += parts[i++]; setTimeout(type, 110); return; }
      st.textContent = 'กำลังค้นหา…';
      setTimeout(() => {
        bar.classList.remove('searching');
        tween(3000, t => { const v = Math.round(566 * t); n.textContent = v; st.textContent = `พบ ${v} คำร้อง`; }, 0, t => 1 - Math.pow(1 - t, 4))
          .then(() => { n.textContent = '566'; st.textContent = 'พบ 566 คำร้อง'; n.classList.remove('ticking'); n.classList.add('landed'); });
      }, 500);
    };
    type();
  };
  reg(box, () => { q.textContent = ''; n.textContent = '0'; st.textContent = ' '; }, run);
  n.title = 'แตะเพื่อดูอีกครั้ง'; n.addEventListener('click', () => { if (!reduce) run(); });
})();

/* ===== คำร้องน้ำท่วมรายวัน: แท่งค่อยๆ พุ่งขึ้น แตะแท่งเพื่อดูตัวเลข ===== */
(() => {
  const v = S.floodDaily;
  const S0 = 7, E = 22, keep = [0, S0, 8, 9, E];          // S0 = 25 ก.ย. · E = 10 ต.ค.
  const W = 900, H = 360, L = 50, B = 300, T = 60, max = 5500, bw = (W - L - 20) / v.length, top = Math.max(...v), PK = v.indexOf(top);
  const box = $('floodBars'), head = $('h5089'), read = $('barRead'), s = el('svg', { viewBox: `0 0 ${W} ${H}` }, box);
  const silt = css('--silt'), siren = css('--siren'), bone = css('--bone');
  const xl = i => L + i * bw;
  [0, 2500, 5000].forEach(t => { const y = B - t / max * (B - T); el('line', { x1: L, x2: W - 10, y1: y, y2: y, stroke: css('--line') }, s); txt(nf(t), { x: L - 8, y: y + 4, 'text-anchor': 'end' }, s); });
  const band = el('rect', { x: xl(S0), y: 30, width: xl(E + 1) - xl(S0), height: B - 30, fill: siren, 'fill-opacity': 0.13 }, s);
  const mk = (x, anchor, l1, l2) => {
    const g = el('g', {}, s);
    el('line', { x1: x, x2: x, y1: 14, y2: B, stroke: siren, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, g);
    const dx = anchor === 'start' ? 6 : -6;
    txt(l1, { x: x + dx, y: 18, 'text-anchor': anchor, class: 'hl', style: `fill:${siren}` }, g);
    txt(l2, { x: x + dx, y: 36, 'text-anchor': anchor }, g);
    g.style.transition = 'opacity 0.6s'; return g;
  };
  const mStart = mk(xl(S0), 'start', 'วันแรกที่น้ำท่วม · 25 ก.ย.', 'คำร้องกระโดดจาก 84 เป็น 1,883');
  const mEnd = mk(xl(E + 1), 'end', 'ปิดช่วงน้ำท่วม · 10 ต.ค.', 'คำร้องลดเหลือ 190 ต่ำสุดหลังพีค');
  const mid = txt('ช่วงน้ำท่วม 16 วัน', { x: (xl(S0) + xl(E + 1)) / 2 + 90, y: 80, 'text-anchor': 'middle', class: 'hl' }, s);
  mid.style.transition = 'opacity 0.6s';
  const opac = i => i === PK ? 1 : i > E ? 0.25 : 0.55;
  const bars = v.map((n, i) => {
    const h = n / max * (B - T), x = xl(i) + 4, w = bw - 8, cx = x + w / 2;
    const r = el('rect', { x, y: B - h, width: w, height: h, rx: 2, style: `fill:${i === PK ? siren : silt};fill-opacity:${opac(i)}` }, s);
    const lab = txt(nf(n), { x: cx, y: B - h - 8, 'text-anchor': 'middle', class: i === PK ? 'hl' : '' }, s);
    if (!keep.includes(i)) lab.style.opacity = 0;
    const day = txt(DAYS[i].split(' ')[0], { x: cx, y: B + 20, 'text-anchor': 'middle' }, s);
    return { n, h, r, lab, day, i };
  });
  txt('ก.ย. 2569', { x: xl(0) + 4, y: B + 44 }, s);
  txt('ต.ค.', { x: xl(13) + 4, y: B + 44 }, s);
  el('line', { x1: xl(13), x2: xl(13), y1: B + 4, y2: B + 50, stroke: css('--line') }, s);

  let running = false, sel = -1;
  const pick = i => {
    if (running) return;
    if (sel >= 0) { const o = bars[sel]; o.r.style.fillOpacity = opac(sel); o.day.classList.remove('hl'); if (!keep.includes(sel)) o.lab.style.opacity = 0; }
    sel = i; const b = bars[i];
    b.r.style.fillOpacity = 1; b.day.classList.add('hl'); b.lab.style.opacity = 1;
    const inFlood = i >= S0 && i <= E ? ` · วันที่ ${i - S0 + 1} ของน้ำท่วม` : i < S0 ? ' · ก่อนน้ำท่วม' : ' · หลังช่วงน้ำท่วม';
    read.innerHTML = `<b>${DAYS[i]}</b> คำร้องเรื่องน้ำท่วม <b>${nf(b.n)}</b> เรื่อง${inFlood}`;
  };
  bars.forEach((b, i) => {
    const hit = el('rect', { x: xl(i), y: 20, width: bw, height: B - 20 + 26, class: 'hit' }, s);
    hit.addEventListener('pointerenter', () => pick(i));
    hit.addEventListener('click', () => pick(i));
  });

  const setBand = i => band.setAttribute('width', Math.max(0, xl(Math.min(i, E) + 1) - xl(S0)));
  const grow = (b, dur, ease) => {
    b.day.classList.add('hl'); b.lab.style.transition = 'none'; b.lab.style.opacity = 1;
    if (b.i >= S0 && b.i <= E) setBand(b.i);
    return tween(dur, t => {
      const hh = b.h * t; b.r.setAttribute('y', B - hh); b.r.setAttribute('height', hh);
      b.lab.setAttribute('y', B - hh - 8); b.lab.textContent = nf(Math.round(b.n * t));
      if (b.i === PK) { b.r.style.fill = mix(silt, siren, t); head.textContent = nf(Math.round(b.n * t)); head.style.color = mix(bone, siren, t); }
    }, 0, ease).then(() => {
      b.day.classList.remove('hl'); b.lab.style.transition = '';
      if (!keep.includes(b.i)) b.lab.style.opacity = 0;
      if (b.i === PK) { head.style.color = ''; b.lab.textContent = nf(top); }
    });
  };
  const arm = () => {
    bars.forEach(b => { b.r.setAttribute('y', B); b.r.setAttribute('height', 0); b.lab.style.opacity = 0; b.r.style.fillOpacity = opac(b.i); if (b.i === PK) b.r.style.fill = silt; });
    head.textContent = '0'; head.style.color = bone; band.setAttribute('width', 0); sel = -1;
    [mStart, mEnd, mid].forEach(g => g.style.opacity = 0);
  };
  const play = async () => {
    if (running) return; arm(); running = true;
    for (const b of bars.slice(0, S0)) { grow(b, 500, easeOut); await wait(240); }
    await wait(600);
    mStart.style.opacity = 1; await wait(500);
    await grow(bars[S0], 1800, easeInOut);
    await wait(300);
    await grow(bars[PK], 4200, t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    mid.style.opacity = 1; await wait(400);
    for (const b of bars.slice(PK + 1, E + 1)) { grow(b, 800, easeOut); await wait(300); }
    await wait(700);
    mEnd.style.opacity = 1; await wait(600);
    for (const b of bars.slice(E + 1)) { grow(b, 500, easeOut); await wait(200); }
    running = false;
  };
  reg(box, arm, play);
  $('barReplay').addEventListener('click', () => { if (!reduce) play(); });
})();

/* ===== จับผิดคำร้อง ===== */
(() => {
  const cards = [...document.querySelectorAll('.fake')], score = $('fakeScore');
  let done = 0, right = 0;
  cards.forEach(f => {
    const why = f.querySelector('.fake-why'), base = why.textContent;
    f.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      if (f.classList.contains('done')) return;
      const ok = b.dataset.a === f.dataset.real;
      f.classList.add('done', ok ? 'right' : 'wrong'); b.classList.add('picked');
      f.querySelectorAll('button').forEach(x => x.setAttribute('aria-disabled', 'true'));
      why.innerHTML = `<b>${ok ? 'ถูกต้อง' : 'ไม่ใช่นะ'}</b> · ${esc(base)}`;
      done++; if (ok) right++;
      if (done === cards.length) score.textContent = `จับผิดถูก ${right} จาก ${cards.length} ข้อ · ` + (right === cards.length ? 'เก่งกว่าคอมพิวเตอร์แล้ว' : 'ไม่เป็นไร คอมพิวเตอร์ก็พลาดแบบนี้เหมือนกัน');
    }));
  });
})();

/* ===== ทายสิ ===== */
(() => {
  const q = $('quiz'), msg = $('quizMsg');
  q.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    q.classList.add('done'); q.querySelector('.ans').classList.add('win');
    msg.innerHTML = b.classList.contains('ans')
      ? '<b class="t-leech">ถูกต้อง!</b> ปลิงเพิ่มขึ้น 25 เท่า มากกว่างูเกือบ 15 เท่า'
      : `คำตอบคือ <b class="t-leech">ปลิง</b> เพิ่มขึ้น 25 เท่า ส่วน${esc(b.dataset.name)}เพิ่ม ${esc(b.dataset.x)} เท่า`;
  }));
})();

/* ===== รายเขต: ค้นหาเขตของคุณ ===== */
const showDistrict = (() => {
  const D = S.districts, sel = $('dSel'), card = $('dCard');
  const max = Math.max(...D.map(r => Math.max(r[1], r[2])));
  [...D].sort((a, b) => a[0].localeCompare(b[0], 'th')).forEach(r => { const o = document.createElement('option'); o.value = r[0]; o.textContent = 'เขต' + r[0]; sel.appendChild(o); });
  const animals = [['leech', 'ปลิง', 3], ['snake', 'งู', 4], ['centipede', 'ตะขาบ', 5], ['rat', 'หนู/ฉี่หนู', 6]];
  const render = name => {
    const r = D.find(x => x[0] === name); if (!r) return;
    const [n, b, f, , , , , st] = r;
    const rank = 1 + D.filter(x => x[2] > f).length, srank = 1 + D.filter(x => x[7] > st).length;
    let chip;
    if (f > b) chip = b ? `<span class="chip up">เพิ่มขึ้น ${f / b >= 1.95 ? 'ราว ' + Math.round(f / b) : (f / b).toFixed(1)} เท่า</span>` : `<span class="chip up">จาก 0 เป็น ${f} เรื่อง</span>`;
    else chip = f === b ? '<span class="chip flat">เท่าเดิม</span>' : '<span class="chip down">ลดลง</span>';
    const an = animals.filter(a => r[a[2]] > 0);
    card.innerHTML = `
      <div class="fc-head"><h3>เขต${esc(n)}</h3>${chip}</div>
      <div class="fc-bars">
        <div class="fc-row"><span>ก่อนน้ำท่วม</span><div class="fc-track"><i style="background:var(--silt)" data-w="${b / max * 100}"></i></div><b>${b}</b></div>
        <div class="fc-row"><span>ช่วงน้ำท่วม</span><div class="fc-track"><i style="background:var(--leech)" data-w="${f / max * 100}"></i></div><b>${f}</b></div>
      </div>
      <p class="muted">คำร้องสัตว์อันตราย นับ 16 วันเท่ากัน · ช่วงน้ำท่วมมากเป็นอันดับ ${rank} จาก 50 เขต</p>
      ${an.length ? `<div class="fc-animals">${an.map(a => `<span><svg viewBox="0 0 120 80" aria-hidden="true"><use href="#${a[0]}"/></svg>${a[1]} <b>${r[a[2]]}</b></span>`).join('')}</div>` : '<p class="muted">ช่วงน้ำท่วมไม่มีคำร้องที่ระบุว่าเป็นงู ปลิง ตะขาบ หรือหนู</p>'}
      <p class="fc-stand">${st > 0 ? `มีคำร้องที่บอกว่า<b>น้ำขัง 3 วันขึ้นไป ${nf(st)} เรื่อง</b> มากเป็นอันดับ ${srank} จาก 50 เขต` : 'ไม่มีคำร้องที่บอกว่าน้ำขัง 3 วันขึ้นไป'}</p>`;
    requestAnimationFrame(() => requestAnimationFrame(() => card.querySelectorAll('.fc-track i').forEach(i => i.style.width = i.dataset.w + '%')));
  };
  sel.addEventListener('change', () => { render(sel.value); mark(sel.value); });
  let mark = () => {};
  const show = name => { sel.value = name; render(name); mark(name); };
  show('หนองจอก');
  return { show, onMark: fn => { mark = fn; fn(sel.value); } };
})();

/* ===== dumbbell 14 เขต: จุดช่วงน้ำท่วมวิ่งออกจากจุดก่อนน้ำท่วม แตะแถวเพื่อดูเขตนั้น ===== */
(() => {
  const rows = [...S.districts].sort((a, b) => b[2] - a[2] || b[1] - a[1] || a[0].localeCompare(b[0], 'th')).slice(0, 14).map(r => [r[0], r[1], r[2], r[3]]);
  const W = 900, rh = 32, T = 50, H = T + rows.length * rh + 30, x0 = 150, x1 = 760, vmax = 35, x = v => x0 + v / vmax * (x1 - x0);
  const box = $('dumbbell'), s = el('svg', { viewBox: `0 0 ${W} ${H}` }, box);
  const bone = css('--bone'), red = css('--leech'), heat = d => Math.min(1, Math.max(0, d) / 26);
  el('circle', { cx: 160, cy: 18, r: 6, fill: css('--silt'), 'fill-opacity': 0.45 }, s); txt('ก่อนน้ำท่วม', { x: 172, y: 23 }, s);
  el('circle', { cx: 280, cy: 18, r: 7, fill: bone }, s); txt('ช่วงน้ำท่วม', { x: 292, y: 23 }, s);
  el('circle', { cx: 400, cy: 18, r: 7, fill: red }, s); txt('ยิ่งแดง ยิ่งเพิ่มมาก', { x: 412, y: 23 }, s);
  txt('ปลิง', { x: 850, y: 23, 'text-anchor': 'middle' }, s);
  const parts = rows.map(([n, b, f, l], i) => {
    const y = T + i * rh, c = mix(bone, red, heat(f - b));
    const bg = el('rect', { x: 4, y: y - rh / 2, width: W - 8, height: rh, rx: 6, fill: css('--siren'), 'fill-opacity': 0 }, s);
    el('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: css('--line') }, s);
    const name = txt(n, { x: x0 - 12, y: y + 5, 'text-anchor': 'end' }, s);
    const seg = el('line', { x1: x(b), x2: x(f), y1: y, y2: y, 'stroke-width': 3, style: `stroke:${c};stroke-opacity:0.6` }, s);
    el('circle', { cx: x(b), cy: y, r: 6, fill: css('--silt'), 'fill-opacity': 0.45 }, s);
    const dot = el('circle', { cx: x(f), cy: y, r: 7, style: `fill:${c}` }, s);
    const lab = txt(`${b} → ${f}`, { x: x(Math.max(b, f)) + 14, y: y + 5 }, s);
    const lt = txt(String(l), { x: 850, y: y + 5, 'text-anchor': 'middle' }, s); if (l >= 8) lt.setAttribute('style', `fill:${red};font-weight:600`);
    const hit = el('rect', { x: 0, y: y - rh / 2, width: W, height: rh, class: 'hit' }, s);
    hit.addEventListener('click', () => { showDistrict.show(n); $('finder').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }); });
    return { n, b, f, seg, dot, lab, lt, bg, name };
  });
  showDistrict.onMark(sel => parts.forEach(p => { const on = p.n === sel; p.bg.setAttribute('fill-opacity', on ? 0.12 : 0); p.name.classList.toggle('hl', on); p.lab.classList.toggle('hl', on); }));
  [0, 10, 20, 30].forEach(v => txt(String(v), { x: x(v), y: H - 6, 'text-anchor': 'middle' }, s));
  reg(box, () => parts.forEach(p => { p.seg.setAttribute('x2', x(p.b)); p.dot.setAttribute('cx', x(p.b)); p.dot.style.fill = bone; p.seg.style.stroke = bone; p.lab.style.opacity = 0; p.lt.style.opacity = 0; }),
    () => parts.forEach((p, i) => tween(1000, t => {
      const xv = x(p.b) + (x(p.f) - x(p.b)) * t, c = mix(bone, red, heat(p.f - p.b) * t);
      p.seg.setAttribute('x2', xv); p.dot.setAttribute('cx', xv); p.dot.style.fill = c; p.seg.style.stroke = c;
    }, i * 110).then(() => { p.lab.style.opacity = 1; p.lt.style.opacity = 1; })));
})();

/* ===== Aha: เส้นวาดตัวเอง จุดพีคเด้ง แตะหรือลากเพื่อดูตัวเลขแต่ละวัน ===== */
(() => {
  const danger = S.lag.danger, leech = S.lag.leech;
  const W = 900, H = 380, L = 50, R = 870, T = 60, B = 330, ymax = 40, n = danger.length;
  const x = i => L + i * (R - L) / (n - 1), y = v => B - v / ymax * (B - T);
  const box = $('lag'), read = $('lagRead'), s = el('svg', { viewBox: `0 0 ${W} ${H}` }, box);
  const fi = 8, di = danger.indexOf(Math.max(...danger));
  const band = el('rect', { x: x(10), y: T - 24, width: x(15) - x(10), height: B - T + 24, fill: css('--leech'), 'fill-opacity': 0.1 }, s);
  const bandT = txt('วันที่ 4–9 น้ำขัง', { x: (x(10) + x(15)) / 2, y: T - 30, 'text-anchor': 'middle' }, s);
  [0, 10, 20, 30, 40].forEach(v => { el('line', { x1: L, x2: R, y1: y(v), y2: y(v), stroke: css('--line') }, s); txt(String(v), { x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, s); });
  el('line', { x1: x(fi), x2: x(fi), y1: 20, y2: B, stroke: css('--silt'), 'stroke-dasharray': '5 5' }, s);
  txt('น้ำท่วมสูงสุด 26 ก.ย. · 5,089 คำร้อง', { x: x(fi) - 8, y: 24, 'text-anchor': 'end' }, s);
  const path = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const pl = el('path', { d: path(leech), fill: 'none', stroke: css('--leech'), 'stroke-width': 2.5 }, s);
  const ll = txt('ปลิง', { x: x(11) + 10, y: y(11) + 4, style: `fill:${css('--leech')}` }, s);
  const pd = el('path', { d: path(danger), fill: 'none', stroke: css('--bone'), 'stroke-width': 3.5 }, s);
  const ring = el('circle', { cx: x(di), cy: y(danger[di]), r: 7, stroke: css('--siren'), class: 'pulse' }, s);
  const dot = el('circle', { cx: x(di), cy: y(danger[di]), r: 7, fill: css('--siren') }, s);
  const pk = txt(`พีค 1 ต.ค. · ${danger[di]} คำร้อง`, { x: x(di) + 12, y: y(danger[di]) - 10, class: 'hl' }, s);
  txt('สัตว์อันตรายทั้งหมด', { x: x(0), y: y(19), class: 'hl' }, s);
  DAYS.forEach((t, i) => { if (i % 3 === 0) txt(t, { x: x(i), y: B + 22, 'text-anchor': 'middle' }, s); });
  /* เส้นชี้วัน */
  const cross = el('g', { style: 'opacity:0;pointer-events:none' }, s);
  const cl = el('line', { y1: T - 10, y2: B, stroke: css('--siren'), 'stroke-width': 1.5 }, cross);
  const cd = el('circle', { r: 6, fill: css('--bone'), stroke: css('--night'), 'stroke-width': 2 }, cross);
  const cle = el('circle', { r: 5, fill: css('--leech'), stroke: css('--night'), 'stroke-width': 2 }, cross);
  const hit = el('rect', { x: L - 10, y: T - 30, width: R - L + 20, height: B - T + 40, class: 'hit', style: 'touch-action:pan-y' }, s);
  const at = e => { const r = s.getBoundingClientRect(); const sx = (e.clientX - r.left) / r.width * W; return Math.max(0, Math.min(n - 1, Math.round((sx - L) / (R - L) * (n - 1)))); };
  const show = i => {
    cross.style.opacity = 1; cl.setAttribute('x1', x(i)); cl.setAttribute('x2', x(i));
    cd.setAttribute('cx', x(i)); cd.setAttribute('cy', y(danger[i])); cle.setAttribute('cx', x(i)); cle.setAttribute('cy', y(leech[i]));
    const ph = i < 7 ? 'ก่อนน้ำท่วม' : i <= 22 ? `วันที่ ${i - 6} ของน้ำท่วม` : 'หลังช่วงน้ำท่วม';
    read.innerHTML = `<b>${DAYS[i]}</b> (${ph}) · สัตว์อันตราย <b>${danger[i]}</b> เรื่อง · ปลิง <b>${leech[i]}</b> เรื่อง`;
  };
  hit.addEventListener('pointermove', e => show(at(e)));
  hit.addEventListener('pointerdown', e => show(at(e)));
  const lens = [pd, pl].map(p => Math.ceil(p.getTotalLength()) + 2);
  reg(box, () => {
    [pd, pl].forEach((p, i) => { p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i]; });
    [dot, pk, ll, bandT].forEach(e => e.style.opacity = 0); ring.style.display = 'none'; band.setAttribute('fill-opacity', 0);
  }, () => {
    tween(600, t => band.setAttribute('fill-opacity', 0.1 * t)); bandT.style.opacity = 1;
    tween(2600, t => { pd.style.strokeDashoffset = lens[0] * (1 - t); pl.style.strokeDashoffset = lens[1] * (1 - t); }, 200, easeInOut)
      .then(() => { ll.style.opacity = 1; dot.style.opacity = 1; return tween(500, t => dot.setAttribute('r', 7 + 6 * Math.sin(Math.PI * t))); })
      .then(() => { pk.style.opacity = 1; ring.style.display = ''; });
  });
})();

/* ===== ช่องว่าง: นาฬิกา 30 วัน ช่องค่อยๆ ติดเมื่อคำร้องถูกปิด ที่เหลือกะพริบแดง ===== */
(() => {
  const days = [];
  S.closing.bins.forEach(([lo, hi, n]) => { for (let k = 0; k < n; k++) days.push(lo + (hi - lo) * (k + 1) / n); });
  const OPEN = S.closing.open, total = days.length + OPEN;
  const cols = 37, gap = 24, box = $('dots');
  const s = el('svg', { viewBox: `0 0 ${cols * gap} ${Math.ceil(total / cols) * gap}` }, box);
  const water = css('--water'), silt = css('--silt'), safe = css('--safe');
  const rects = [];
  for (let k = 0; k < total; k++) rects.push(el('rect', { x: (k % cols) * gap + 3, y: Math.floor(k / cols) * gap + 3, width: gap - 6, height: gap - 6, rx: 3 }, s));
  const setOpen = r => { r.setAttribute('class', 'open'); r.style.fill = water; r.style.fillOpacity = 1; r.setAttribute('stroke', silt); r.setAttribute('stroke-opacity', 0.5); };
  const setClosed = (r, d) => { r.setAttribute('class', ''); r.style.fill = d <= 3 ? safe : silt; r.style.fillOpacity = d <= 3 ? 1 : 0.75; r.removeAttribute('stroke'); };
  rects.forEach((r, k) => k < days.length ? setClosed(r, days[k]) : setOpen(r));
  rects.slice(days.length).forEach(r => r.classList.add('alarm'));
  const steps = [...document.querySelectorAll('#steps div')], thr = [1, 3, 7, 14, 30, 99];
  const dayEl = $('clkDay'), cEl = $('clkClosed'), oEl = $('clkOpen');
  reg(box, () => { rects.forEach(setOpen); $('steps').classList.add('armed'); dayEl.textContent = 'วันที่ 0 หลังแจ้ง'; cEl.textContent = 0; oEl.textContent = total; },
    () => {
      let k = 0; $('steps').classList.remove('armed');
      tween(6500, t => {
        const d = t * 33;
        while (k < days.length && days[k] <= d) { setClosed(rects[k], days[k]); k++; }
        steps.forEach((st, i) => st.classList.toggle('lit', d >= thr[i]));
        dayEl.textContent = d > 30 ? 'เกิน 30 วัน' : `วันที่ ${Math.floor(d)} หลังแจ้ง`; cEl.textContent = k; oEl.textContent = total - k;
      }, 200, t => t).then(() => {
        dayEl.textContent = 'ณ 27 ต.ค.'; steps.forEach(st => st.classList.add('lit'));
        rects.slice(days.length).forEach(r => r.classList.add('alarm'));
      });
    });
})();

/* ===== แผนที่: น้ำท่วม → น้ำขัง → สัตว์อื่น → ปลิงเด้งขึ้นทีละจุด ===== */
(() => {
  const M = S.map, box = $('map'), sx = 0.97;
  const s = el('svg', { viewBox: `${-1.5 * sx} -1 ${77 * sx} 47` }, box);
  const g1 = el('g', { class: 'g' }, s), g2 = el('g', { class: 'g g2' }, s), g3 = el('g', { class: 'g g3' }, s), g4 = el('g', {}, s), g6 = el('g', { class: 'g g6' }, s), g5 = el('g', { class: 'g g5' }, s);
  M.runs.forEach(([yy, a, b, st]) => el('rect', { x: a * sx, y: yy, width: (b - a + 1) * sx, height: 1.02, fill: st ? 'rgba(84,150,196,0.75)' : 'rgba(147,166,165,0.28)' }, st ? g2 : g1));
  M.pts.filter(p => p[3] > 0).forEach(([gx, gy, , o]) => el('circle', { cx: (gx + 0.5) * sx, cy: gy + 0.5, r: 0.22 + Math.sqrt(o) * 0.16, fill: css('--bone'), 'fill-opacity': 0.7 }, g3));
  const lp = M.pts.filter(p => p[2] > 0).sort((a, b) => a[0] - b[0]);
  lp.forEach(([gx, gy, l], i) => { const c = el('circle', { cx: (gx + 0.5) * sx, cy: gy + 0.5, r: 0.3 + Math.sqrt(l) * 0.22, fill: css('--leech'), class: 'lp' }, g4); c.style.setProperty('--i', i); });
  [...lp].sort((a, b) => b[2] - a[2]).slice(0, 3).forEach(([gx, gy, l]) => el('circle', { cx: (gx + 0.5) * sx, cy: gy + 0.5, r: 0.3 + Math.sqrt(l) * 0.22, stroke: css('--leech'), class: 'pulse' }, g6));
  M.labs.forEach(([nm, gx, gy]) => txt(nm, { x: gx * sx, y: gy - 0.9, 'text-anchor': 'middle', 'font-size': 1.25 }, g5));
  classAnim(box);
})();

/* ===== ทายก่อนเฉลย: ปิดได้ภายใน 3 วันกี่เรื่องจาก 10 ===== */
const unlockGap = (() => {
  const inp = $('gIn'), out = $('gOut'), btn = $('gBtn'), msg = $('gMsg'), wrap = $('gHouses'), res = $('gapResult');
  const houses = Array.from({ length: 10 }, () => { const sv = el('svg', { viewBox: '0 0 32 32' }, wrap); el('use', { href: '#i-house' }, sv); return sv; });
  const paint = v => houses.forEach((h, i) => { h.classList.toggle('on', i < v); h.classList.remove('wait'); });
  paint(+inp.value);
  res.classList.add('locked');
  inp.addEventListener('input', () => { out.textContent = `${inp.value} จาก 10`; paint(+inp.value); });
  let open = null;
  btn.addEventListener('click', () => {
    const v = +inp.value; btn.disabled = true; inp.disabled = true;
    houses.forEach((h, i) => { h.classList.toggle('on', i < 1); h.classList.toggle('wait', i >= 1); });
    out.textContent = 'ความจริง: 1 จาก 10';
    msg.innerHTML = v === 1 ? '<b>ทายถูก!</b> ปิดได้ภายใน 3 วันแค่ 1 ใน 10 เรื่อง'
      : v === 0 ? 'เกือบถูก! ความจริงคือ <b>1 ใน 10</b> อีก 9 เรื่องต้องรอนานกว่า 3 วัน หรือยังไม่ได้ปิด'
      : `คุณทายไว้ ${v} แต่ความจริงมีแค่ <b>1 ใน 10</b> อีก 9 เรื่องต้องรอนานกว่า 3 วัน หรือยังไม่ได้ปิด`;
    res.classList.remove('locked');
    if (open) open(res);
  });
  return fn => { open = fn; };
})();

/* ===== เช็กความพร้อม (จำไว้ในเครื่องของผู้อ่าน) ===== */
(() => {
  const btns = [...document.querySelectorAll('#ready button')], KEY = 'whoswims-ready';
  const score = $('rScore'), bar = $('rBar'), msg = $('rMsg');
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { saved = []; }
  const upd = () => {
    const on = btns.map((b, i) => b.getAttribute('aria-pressed') === 'true' ? i : -1).filter(i => i >= 0), n = on.length;
    score.textContent = `${n} / ${btns.length}`; bar.style.width = n / btns.length * 100 + '%';
    msg.textContent = n === 0 ? 'เริ่มแตะข้อแรกได้เลย' : n <= 4 ? 'เริ่มต้นดีแล้ว ยังเหลืออีกหลายข้อ' : n <= 8 ? 'มาได้ครึ่งทางแล้ว' : n < btns.length ? 'อีกนิดเดียวจะพร้อมเต็มที่' : 'พร้อมรับน้ำเต็มที่ ชวนเพื่อนบ้านทำด้วยกัน';
    try { localStorage.setItem(KEY, JSON.stringify(on)); } catch (e) { /* ไม่มีที่เก็บก็ใช้ได้ */ }
  };
  btns.forEach((b, i) => {
    if (Array.isArray(saved) && saved.includes(i)) b.setAttribute('aria-pressed', 'true');
    b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); upd(); });
  });
  upd();
})();

/* ===== คำศัพท์: แตะคำที่ขีดเส้นประเพื่อดูความหมาย ===== */
(() => {
  const sheet = $('sheet'), t = $('sheetT'), p = $('sheetP'), x = $('sheetX');
  let y0 = 0, from = null;
  const close = () => { if (sheet.hidden) return; sheet.hidden = true; if (from) from.focus({ preventScroll: true }); };
  document.querySelectorAll('.tip').forEach(b => b.addEventListener('click', () => {
    t.textContent = b.dataset.term || b.textContent; p.textContent = b.dataset.tip; sheet.hidden = false; y0 = scrollY; from = b; x.focus({ preventScroll: true });
  }));
  x.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('scroll', () => { if (!sheet.hidden && Math.abs(scrollY - y0) > 260) { sheet.hidden = true; } }, { passive: true });
})();

/* ===== เมนูบท + ระดับน้ำ + ความแดงของทั้งหน้า + แถบความคืบหน้า ===== */
(() => {
  const flood = $('flood'), rust = $('rust'), heatEl = $('heat'), fill = $('gaugeFill'), day = $('gaugeDay'), root = document.documentElement, pf = document.querySelector('#prog .fill');
  /* [id, ระดับน้ำ 0–1, วันที่ของน้ำท่วม, ความแดง 0–1] */
  const marks = [['p-open',0,0,0],['p-surge',0.5,1,0.1],['p-croc',0.5,1,0.12],['p-fake',0.55,2,0.18],['ch2',0.6,2,0.25],['p-quiz',0.62,3,0.3],['p-wanted',0.68,4,0.45],['p-voices',0.75,5,0.6],['p-home',0.85,7,0.72],['ch3',0.9,8,0.8],['p-lag',1,9,1],['p-map',0.9,10,0.9],['p-district',0.75,12,0.8],['ch4',0.6,13,0.7],['p-gap',0.5,14,0.65],['p-asks',0.3,16,0.5],['p-ready',0.15,20,0.25],['p-end',0.06,30,0.05],['behind',0.06,30,0]]
    .filter(m => $(m[0]));
  const nodes = marks.map(m => $(m[0]));
  const nav = $('chap'), now = $('chapNow'), list = $('chapList'), num = $('chapNum'), name = $('chapName');
  const NAMES = { 1: 'คืนที่น้ำมา', 2: 'ผู้ต้องสงสัยตัวจริง', 3: 'น้ำที่ไม่ยอมไป', 4: 'ใครจะไปถึงก่อน', 5: 'เบื้องหลังข้อมูล' };
  const chs = [...document.querySelectorAll('[data-ch]')], links = [...list.querySelectorAll('a')];
  const topOf = n => n.getBoundingClientRect().top + scrollY;
  let cur = 0, ticking = false;
  const update = () => {
    ticking = false;
    const mid = scrollY + innerHeight * 0.5; let lvl = 0.06, dd = 0, h = 0;
    const tops = nodes.map(topOf);
    for (let i = 0; i < marks.length; i++) {
      const ta = tops[i], tb = i + 1 < marks.length ? tops[i + 1] : document.documentElement.scrollHeight;
      if (mid >= ta) {
        const p = i + 1 < marks.length ? Math.min(1, (mid - ta) / Math.max(1, tb - ta)) : 0, a = marks[i], b = marks[i + 1] || a;
        lvl = a[1] + (b[1] - a[1]) * p; dd = Math.round(a[2] + (b[2] - a[2]) * p); h = a[3] + (b[3] - a[3]) * p;
      }
    }
    lvl = Math.max(lvl, 0.06);
    flood.style.height = (reduce ? 6 : lvl * 38) + 'vh';
    rust.style.opacity = (h * 0.7).toFixed(3); heatEl.style.opacity = (h * 0.55).toFixed(3);
    root.style.setProperty('--heat', h.toFixed(3));
    fill.style.height = (lvl * 100) + '%'; fill.style.background = mix(css('--siren'), css('--leech'), h);
    day.textContent = dd > 16 ? 'หลังน้ำลด' : 'วันที่ ' + dd;
    pf.style.width = (Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) * 100).toFixed(1) + '%';
    /* บทปัจจุบัน */
    let ch = 1; const line = scrollY + innerHeight * 0.35;
    chs.forEach(c => { if (topOf(c) <= line) ch = +c.dataset.ch; });
    if (ch !== cur) {
      cur = ch; num.textContent = ch <= 4 ? `บทที่ ${ch}/4` : 'ท้ายเรื่อง'; name.textContent = NAMES[ch];
      links.forEach((a, i) => a.setAttribute('aria-current', i + 1 === ch ? 'true' : 'false'));
    }
    nav.classList.toggle('show', scrollY > innerHeight * 0.6);
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const setOpen = o => { list.hidden = !o; now.setAttribute('aria-expanded', String(o)); };
  now.addEventListener('click', () => setOpen(list.hidden));
  links.forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setOpen(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); update();
  document.querySelectorAll('details').forEach(d => d.addEventListener('toggle', req));
})();

/* ===== เริ่ม: ตั้งสถานะเริ่มเฉพาะส่วนที่ยังอยู่ใต้จอ แล้วเล่นเมื่อเลื่อนถึง ===== */
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); A.get(e.target).play(); } }), { threshold: 0.25, rootMargin: '0px 0px -15% 0px' });
  const start = (n, v) => { const r = n.getBoundingClientRect(); if (r.bottom > 0) { v.arm(); if (r.top < innerHeight * 0.85) setTimeout(() => v.play(), 500); else io.observe(n); } };
  A.forEach((v, n) => { if (!n.closest('.locked')) start(n, v); });
  /* ส่วนที่ซ่อนไว้จนกว่าจะกดเฉลย */
  unlockGap(box => A.forEach((v, n) => { if (box.contains(n)) start(n, v); }));
}
})();
