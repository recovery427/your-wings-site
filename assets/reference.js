(function () {
  
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.ref-tab'));
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.ref-block'));

  function apply(cat) {
    blocks.forEach(function (b) {
      b.hidden = !(cat === 'all' || b.getAttribute('data-cat') === cat);
    });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-cat') === cat;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    
    sweep();
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { apply(t.getAttribute('data-cat')); });
  });

  var vids = Array.prototype.slice.call(document.querySelectorAll('.refvid'));

  function load(v) {
    if (v.dataset.src && !v.src) {
      v.src = v.dataset.src;   
    }
  }

  function sweep() {
    vids.forEach(function (v) {
      var card = v.closest('.ref-block');
      if (card && card.hidden) { v.pause(); return; }
      var r = v.getBoundingClientRect();
      var visible = r.bottom > 0 && r.top < window.innerHeight;
      if (visible) {
        load(v);
        if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      } else if (!v.paused) {
        v.pause();
      }
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { sweep(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  sweep();

  document.querySelectorAll('.refcard-sound').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var v = btn.parentElement.querySelector('video');
      if (!v) return;
      var turningOn = v.muted;
      if (turningOn) {
        vids.forEach(function (o) { if (o !== v) { o.muted = true; } });
        document.querySelectorAll('.refcard-sound').forEach(function (b) {
          b.classList.remove('is-on');
        });
      }
      v.muted = !turningOn;
      btn.classList.toggle('is-on', turningOn);
      btn.setAttribute('aria-label', turningOn ? '소리 끄기' : '소리 켜기');
      load(v);
      if (v.paused) v.play();
    });
  });

  var form = document.getElementById('quickform');
  if (!form) return;
  var status = document.getElementById('q-status');
  var btn = form.querySelector('button[type="submit"]');
  var cfg = window.FORM_CONFIG || {};
  var connected = !!cfg.endpoint;

  function say(kind, text) {
    status.hidden = false;
    status.className = 'quickform-status quickform-status--' + kind;
    status.textContent = text;
  }

  if (!connected) {
    btn.disabled = true;
    say('info', '문의 폼을 연결하는 중입니다. 잠시 뒤 다시 시도해 주세요.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var contact = document.getElementById('q-contact').value.trim();
    if (!contact) {
      say('error', '연락받으실 번호나 이메일을 남겨주세요.');
      document.getElementById('q-contact').focus();
      return;
    }
    var ok = contact.indexOf('@') !== -1
      ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact)
      : (function () { var d = contact.replace(/[^0-9]/g, ''); return d.length >= 9 && d.length <= 11; })();
    if (!ok) {
      say('error', '전화번호 또는 이메일 형식을 확인해 주세요.');
      document.getElementById('q-contact').focus();
      return;
    }
    if (!connected) {
      say('error', '아직 전송할 수 없습니다. 상담 페이지를 이용해 주세요.');
      return;
    }

    var data = new FormData(form);
    if (cfg.accessKey) data.append('access_key', cfg.accessKey);

    btn.disabled = true;
    var label = btn.textContent;
    btn.textContent = '보내는 중…';
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
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();

(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('.refcard-media--frame'));
  if (!frames.length) return;
  function fit() {
    frames.forEach(function (box) {
      var f = box.querySelector('iframe');
      if (!f) return;
      var k = box.clientWidth / 1440;
      f.style.transform = 'scale(' + k + ')';
    });
  }
  window.addEventListener('resize', fit, { passive: true });
  fit();
  
  document.querySelectorAll('.ref-tab').forEach(function (t) {
    t.addEventListener('click', function () { setTimeout(fit, 0); });
  });
})();
