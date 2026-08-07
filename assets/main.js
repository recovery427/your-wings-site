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
    v.play();
  });

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
