/* =====================================================================
   Navegação compartilhada dos slides (JS puro, sem dependências)
   - ← → / Espaço / PageUp / PageDown / Home / End
   - F = tela cheia · clique nas bordas (12%) avança/volta
   - Fragments: elementos .frag[data-step="n"] são revelados 1 passo por vez
   ===================================================================== */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  var total = slides.length;
  var moduleName = document.body.getAttribute('data-module') || '';
  var cur = 0;        // slide atual
  var step = 0;       // passo de revelação atual no slide
  var steps = [];     // nº de passos de cada slide
  var counterRaf = null;

  /* ---------- Monta barra de progresso e rodapés ---------- */
  var prog = document.createElement('div');
  prog.id = 'progress';
  prog.innerHTML = '<i></i>';
  stage.appendChild(prog);
  var progBar = prog.firstChild;

  slides.forEach(function (s, i) {
    var foot = document.createElement('div');
    foot.className = 'foot';
    foot.innerHTML = '<span>' + moduleName + '</span><b>' + (i + 1) + '/' + total + '</b>';
    s.appendChild(foot);
    var max = 0;
    Array.prototype.forEach.call(s.querySelectorAll('.frag'), function (f) {
      max = Math.max(max, parseInt(f.getAttribute('data-step'), 10) || 0);
    });
    steps.push(max);
  });

  /* ---------- Peças pequenas de Lego: <div data-bricks="12"> ---------- */
  var widths = [70, 120, 90, 160, 80, 110, 60, 140, 100, 75];
  Array.prototype.forEach.call(document.querySelectorAll('[data-bricks]'), function (el) {
    var n = parseInt(el.getAttribute('data-bricks'), 10) || 0;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('span');
      b.className = 'brick mini ' + (i % 2 ? 'c2' : 'c1');
      b.style.width = widths[i % widths.length] + 'px';
      el.appendChild(b);
    }
  });

  /* ---------- Escala 16:9 centralizada ---------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.setProperty('--s', s);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- Contador animado (.counter[data-count]) ---------- */
  function fmt(n) { return Math.round(n).toLocaleString('pt-BR'); }
  function runCounter(slide) {
    if (counterRaf) cancelAnimationFrame(counterRaf);
    var el = slide.querySelector('[data-count]');
    if (!el) return;
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var t0 = null, dur = 2600;
    function tick(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * e) + (p === 1 ? suffix : '');
      if (p < 1) counterRaf = requestAnimationFrame(tick);
    }
    counterRaf = requestAnimationFrame(tick);
  }

  /* ---------- Renderização do estado ---------- */
  var lastShown = -1;
  function render() {
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === cur);
      s.classList.toggle('past', i < cur);
      Array.prototype.forEach.call(s.querySelectorAll('.frag'), function (f) {
        var st = parseInt(f.getAttribute('data-step'), 10) || 0;
        var on = (i < cur) || (i === cur && st <= step);
        f.classList.toggle('in', on);
      });
    });
    progBar.style.width = ((cur + 1) / total * 100) + '%';
    if (cur !== lastShown) { runCounter(slides[cur]); lastShown = cur; }
    if (history.replaceState) history.replaceState(null, '', '#' + (cur + 1));
  }

  /* ---------- Navegação ---------- */
  function next() {
    if (step < steps[cur]) { step++; }
    else if (cur < total - 1) { cur++; step = 0; }
    render();
  }
  function prev() {
    if (step > 0) { step--; }
    else if (cur > 0) { cur--; step = steps[cur]; }
    render();
  }
  function go(i) { cur = Math.max(0, Math.min(total - 1, i)); step = 0; render(); }

  function toggleFull() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    } else {
      document.exitFullscreen();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); prev(); break;
      case 'Home': go(0); break;
      case 'End': go(total - 1); break;
      case 'f': case 'F': toggleFull(); break;
    }
  });

  /* Clique nas bordas: esquerda volta, direita avança */
  function zone(e) {
    var x = e.clientX / window.innerWidth;
    return x < 0.12 ? -1 : (x > 0.88 ? 1 : 0);
  }
  document.addEventListener('click', function (e) {
    var z = zone(e);
    if (z > 0) next(); else if (z < 0) prev();
  });
  document.addEventListener('mousemove', function (e) {
    document.body.style.cursor = zone(e) === 0 ? 'default' : 'pointer';
  });

  /* ---------- Início (aceita #n na URL) ---------- */
  var h = parseInt((location.hash || '').replace('#', ''), 10);
  cur = (h >= 1 && h <= total) ? h - 1 : 0;
  render();
})();

