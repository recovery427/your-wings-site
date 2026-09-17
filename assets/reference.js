(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var slice = function (list) { return Array.prototype.slice.call(list); };

  var tabs = slice(doc.querySelectorAll('.ref-tab'));
  var blocks = slice(doc.querySelectorAll('.ref-block'));

  function apply(cat, animate) {
    blocks.forEach(function (b) {
      var show = (cat === 'all' || b.getAttribute('data-cat') === cat);
      if (show) {
        b.hidden = false;
        if (animate && !reduce) {

          b.classList.remove('is-swap');
          void b.offsetWidth;          // 애니메이션을 다시 태우기 위한 강제 리플로우
          b.classList.add('is-swap');
        }
      } else {
        b.hidden = true;
      }
    });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-cat') === cat;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    fitFrames();
    scanFrames();
    sweep();
  }

  blocks.forEach(function (b) {
    b.addEventListener('animationend', function () { b.classList.remove('is-swap'); });
  });

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { apply(t.getAttribute('data-cat'), true); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, next = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') next = 0;
      else if (k === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      tabs[next].focus();
      apply(tabs[next].getAttribute('data-cat'), true);
    });
  });

  var frames = slice(doc.querySelectorAll('.refcard-media--frame'));
  var posters = slice(doc.querySelectorAll('video[data-poster]'));

  function fitFrames() {
    frames.forEach(function (box) {
      var f = box.querySelector('iframe');
      if (!f) return;
      var w = box.clientWidth;
      if (!w) return;
      f.style.transform = 'scale(' + (w / 1440) + ')';
    });
  }

  function loadFrame(box) {
    var f = box.querySelector('iframe');
    if (f && f.dataset.src && !f.getAttribute('src')) {
      f.setAttribute('src', f.dataset.src);
    }
  }

  function nearViewport(el, margin) {
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;      // 숨은 블록 안
    return r.bottom > -margin && r.top < window.innerHeight + margin;
  }

  function scanFrames() {
    frames.forEach(function (box) { if (nearViewport(box, 500)) loadFrame(box); });
    scanPosters();
  }

  function scanPosters() {
    posters.forEach(function (v) {
      if (v.getAttribute('poster')) return;
      if (!nearViewport(v, 600)) return;
      var src = v.dataset.poster;
      if (src) v.setAttribute('poster', src);
    });
  }

  window.addEventListener('resize', function () { fitFrames(); }, { passive: true });
  fitFrames();

  var MAX_PLAYING = 4;                    // 한 화면에서 동시에 돌리는 최대 편수
  var vids = slice(doc.querySelectorAll('.refvid'));
  var reel = doc.querySelector('.ref-reelvid');
  var soundOn = null;

  var canPlayMp4 = (function () {
    var probe = doc.createElement('video');
    if (!probe.canPlayType) return false;

    return probe.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  })();

  function boxOf(v) { return v.parentElement; }

  function block(v) {
    var b = boxOf(v);
    if (b) b.classList.add('is-blocked');
  }
  function unblock(v) {
    var b = boxOf(v);
    if (b) b.classList.remove('is-blocked');
  }

  function attachFallback(v, label) {
    var box = boxOf(v);
    if (!box || box.querySelector('.hero-play')) return;
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'hero-play';
    btn.textContent = label || '영상 재생';
    box.appendChild(btn);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      start(v, true);
    });
    v.addEventListener('playing', function () { unblock(v); });
    v.addEventListener('pause', function () {

      if (!v.ended && v.dataset.want === '1') block(v);
    });
    v.addEventListener('error', function () { block(v); });
  }

  function start(v, force) {
    if (!canPlayMp4 && !force) { block(v); return; }
    if (v.dataset.src && !v.src) v.src = v.dataset.src;
    v.dataset.want = '1';
    if (reduce && !force) { block(v); return; }
    var p;
    try { p = v.play(); } catch (err) { block(v); return; }
    if (p && typeof p.then === 'function') {
      p.then(function () { unblock(v); }).catch(function () { block(v); });
    }
  }

  function stop(v) {
    v.dataset.want = '0';
    if (!v.paused) { try { v.pause(); } catch (err) {  } }
  }

  vids.forEach(function (v) { attachFallback(v, '재생'); });
  if (reel) {

    var reelBtn = doc.querySelector('.ref-reel .hero-play');
    if (reelBtn) {
      reelBtn.addEventListener('click', function (e) {
        e.preventDefault();
        startReel(true);
      });
      reel.addEventListener('playing', function () { unblockReel(); });
      reel.addEventListener('pause', function () { if (!reel.ended) blockReel(); });
      reel.addEventListener('error', blockReel);
    }
  }
  function reelBox() { return doc.querySelector('.ref-reel'); }
  function blockReel() { var b = reelBox(); if (b) b.classList.add('is-blocked'); }
  function unblockReel() { var b = reelBox(); if (b) b.classList.remove('is-blocked'); }

  function sweep() {
    scanFrames();

    if (reel) {
      var rr = reelBox();
      if (rr && nearViewport(rr, 0)) {
        if (reel.paused) startReel();
      } else if (!reel.paused) {
        reel.pause();
      }
    }

    var vh = window.innerHeight;
    var mid = vh / 2;
    var live = [];

    vids.forEach(function (v) {
      var blk = v.closest('.ref-block');
      if (blk && blk.hidden) { stop(v); return; }
      var r = v.getBoundingClientRect();
      if (!r.height || r.bottom <= 0 || r.top >= vh) { stop(v); return; }
      live.push({ v: v, d: Math.abs((r.top + r.bottom) / 2 - mid) });
    });

    live.sort(function (a, b) { return a.d - b.d; });
    live.forEach(function (item, i) {

      if (i < MAX_PLAYING || item.v === soundOn) start(item.v);
      else stop(item.v);
    });
  }

  function startReel(force) {
    if ((!canPlayMp4 || reduce) && !force) { blockReel(); return; }
    if (reel.dataset.src && !reel.src) reel.src = reel.dataset.src;
    var p;
    try { p = reel.play(); } catch (err) { blockReel(); return; }
    if (p && typeof p.then === 'function') {
      p.then(unblockReel).catch(blockReel);
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { sweep(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) sweep(); });

  ['touchstart', 'click'].forEach(function (ev) {
    doc.addEventListener(ev, function once() {
      doc.removeEventListener(ev, once);
      sweep();
    }, { passive: true });
  });

  sweep();

  setTimeout(function () {
    if (reel && reel.paused) blockReel();
    vids.forEach(function (v) { if (v.dataset.want === '1' && v.paused) block(v); });
  }, 2000);

  slice(doc.querySelectorAll('.refcard-sound')).forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var v = btn.parentElement.querySelector('video');
      if (!v) return;
      var turningOn = v.muted;
      if (turningOn) {
        vids.forEach(function (o) { if (o !== v) { o.muted = true; } });
        if (reel) reel.muted = true;
        slice(doc.querySelectorAll('.refcard-sound')).forEach(function (b) {
          b.classList.remove('is-on');
          b.setAttribute('aria-label', '소리 켜기');
        });
      }
      v.muted = !turningOn;
      soundOn = turningOn ? v : null;
      btn.classList.toggle('is-on', turningOn);
      btn.setAttribute('aria-label', turningOn ? '소리 끄기' : '소리 켜기');
      start(v, true);
    });
  });

  var bar = doc.getElementById('quickbar');
  var toggle = bar && bar.querySelector('.quickbar-toggle');
  var form = doc.getElementById('quickform');

  if (bar && toggle && form) {
    toggle.addEventListener('click', function () {
      var open = form.hidden;
      form.hidden = !open;
      bar.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '접기' : '문의 남기기';
      if (open) {
        var first = doc.getElementById('q-brand');
        if (first) first.focus();
      }
    });
  }

  if (!form) return;
  var status = doc.getElementById('q-status');
  var send = form.querySelector('button[type="submit"]');
  var cfg = window.FORM_CONFIG || {};
  var connected = !!cfg.endpoint;

  function say(kind, text) {
    status.hidden = false;
    status.className = 'quickform-status quickform-status--' + kind;
    status.textContent = text;
  }

  if (!connected) {
    send.disabled = true;
    say('info', '문의 폼을 연결하는 중입니다. 아래 상담 페이지를 이용해 주세요.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var contact = doc.getElementById('q-contact').value.trim();
    if (!contact) {
      say('error', '연락받으실 번호나 이메일을 남겨주세요.');
      doc.getElementById('q-contact').focus();
      return;
    }
    var ok = contact.indexOf('@') !== -1
      ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact)
      : (function () { var d = contact.replace(/[^0-9]/g, ''); return d.length >= 9 && d.length <= 11; })();
    if (!ok) {
      say('error', '전화번호 또는 이메일 형식을 확인해 주세요.');
      doc.getElementById('q-contact').focus();
      return;
    }
    if (!connected) {
      say('error', '아직 전송할 수 없습니다. 상담 페이지를 이용해 주세요.');
      return;
    }

    var data = new FormData(form);
    if (cfg.accessKey) data.append('access_key', cfg.accessKey);

    send.disabled = true;
    var label = send.textContent;
    send.textContent = '보내는 중…';
    say('info', '보내는 중입니다.');

    fetch(cfg.endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json().catch(function () { return {}; }); })
      .then(function (out) {
        if (out && out.success === false) throw new Error('rejected');
        form.reset();
        say('ok', '접수됐습니다. 남겨주신 곳으로 곧 연락드리겠습니다.');
      })
      .catch(function () {
        say('error', '전송에 실패했습니다. 다시 눌러주시거나 상담 페이지를 이용해 주세요.');
      })
      .then(function () { send.disabled = false; send.textContent = label; });
  });
})();
