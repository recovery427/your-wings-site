(function () {
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

(function () {
  var v = document.querySelector('.hero-video');
  if (!v) return;
  var media = v.closest('.hero-media');
  if (!media) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hero-play';
  btn.textContent = '영상 재생';
  media.appendChild(btn);
  media.removeAttribute('aria-hidden');   // 버튼이 생겼으니 더 이상 숨김 영역이 아니다

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var small = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  function release() {
    var s2 = v.querySelector('source');
    if (!s2 || !s2.hasAttribute('media')) return false;
    s2.removeAttribute('media');
    v.load();
    return true;
  }

  function block() { media.classList.add('is-blocked'); }
  function unblock() { media.classList.remove('is-blocked'); }

  function tryPlay() {
    var p = v.play();
    if (p && typeof p.catch === 'function') p.catch(block);
  }

  v.addEventListener('playing', unblock);
  v.addEventListener('pause', function () {

    if (!v.ended) block();
  });

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    release();
    v.play();
  });

  if (small) {

    block();
    return;
  }

  if (reduce) {

    v.removeAttribute('autoplay');
    v.pause();
    block();
    return;
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && v.paused) tryPlay();
  });

  ['touchstart', 'click'].forEach(function (ev) {
    document.addEventListener(ev, function once() {
      document.removeEventListener(ev, once);
      if (v.paused) tryPlay();
    }, { passive: true });
  });

  if (v.readyState >= 2) tryPlay();
  else v.addEventListener('loadeddata', tryPlay);

  setTimeout(function () { if (v.paused) block(); }, 2000);
})();

(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  function showAll() { items.forEach(function (el) { el.classList.add('in'); }); }

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { showAll(); return; }

  var io = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { rootMargin: '600px 0px -6% 0px', threshold: 0 });
  items.forEach(function (el) { io.observe(el); });

  var t;
  function sweep() {
    var edge = window.innerHeight;
    items.forEach(function (el) {
      if (el.classList.contains('in')) return;
      if (el.getBoundingClientRect().top < edge) el.classList.add('in');
    });
  }
  function later() { clearTimeout(t); t = setTimeout(function () { sweep(); requestAnimationFrame(sweep); }, 180); }
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', later);
  window.addEventListener('beforeprint', showAll);
  setTimeout(sweep, 2400);

  setTimeout(showAll, 8000);
})();

(function () {
  if (document.querySelector('.stickycta')) return;
  if (document.body.classList.contains('no-stickycta')) return;

  var MAIL = 'recovery427@gmail.com';
  var onContact = /contact\.html$/.test(location.pathname) ||
                  !!document.querySelector('form.form');

  var bar = document.createElement('div');
  bar.className = 'stickycta';
  bar.innerHTML =
    '<a class="btn btn--primary" href="' + (onContact ? '#form' : 'contact.html') + '">' +
      (onContact ? '문의 남기기' : '무료로 상담 요청하기') + '</a>' +
    '<a class="stickycta-alt" href="mailto:' + MAIL + '" aria-label="이메일로 문의하기">메일</a>';
  document.body.appendChild(bar);
  document.body.classList.add('has-stickycta');

  var form = document.querySelector('form.form');
  var foot = document.querySelector('.site-footer');
  var ticking = false;

  function overlaps(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > window.innerHeight - 140;
  }

  function frame() {
    ticking = false;
    var past = window.pageYOffset > window.innerHeight * 1.5;
    var hide = overlaps(form) || overlaps(foot);
    bar.classList.toggle('is-on', past && !hide);
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
