var FORM_CONFIG = {
  endpoint: 'https://api.web3forms.com/submit',
  accessKey: '9b46d938-6138-41bc-98b0-d6a5d68a50ca'
};

var FALLBACK_EMAIL = 'recovery427@gmail.com';

(function () {
  var form = document.querySelector('.form');
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var live = document.getElementById('form-status');
  var endpoint = form.getAttribute('action') || FORM_CONFIG.endpoint;
  var external = /^https?:/i.test(endpoint || '');

  if (live && !live.hasAttribute('tabindex')) live.setAttribute('tabindex', '-1');

  function el(id) { return document.getElementById(id); }
  function val(id) { var i = el(id); return i ? (i.value || '').trim() : ''; }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function phoneOk(v) {
    var digits = v.replace(/[^0-9]/g, '');          // 하이픈·공백은 허용
    return digits.length >= 9 && digits.length <= 11;
  }

  function collect() {
    var bad = [];
    var email = val('email');
    var phone = val('phone');
    var consent = el('privacy');

    if (!val('name')) {
      bad.push({ id: 'name', label: '이름 또는 회사명', message: '어떻게 불러드릴지 알려주세요.' });
    }

    if (!email && !phone) {
      bad.push({
        id: 'email', label: '이메일 또는 전화번호',
        message: '답변을 받으실 이메일이나 전화번호 중 하나는 꼭 적어주세요.'
      });
    } else {
      if (email && !EMAIL_RE.test(email)) {
        bad.push({ id: 'email', label: '이메일', message: '이메일 형식을 확인해 주세요. 예: name@example.com' });
      }
      if (phone && !phoneOk(phone)) {
        bad.push({ id: 'phone', label: '전화번호', message: '전화번호 자릿수를 확인해 주세요. 숫자만 9~11자리입니다.' });
      }
    }

    if (consent && !consent.checked) {
      bad.push({
        id: 'privacy', label: '개인정보 수집·이용 동의',
        message: '수집 항목과 보유 기간을 확인하시고 동의에 체크해 주세요.'
      });
    }

    return bad;
  }

  function fieldOf(input) { return input.closest('.field'); }

  function describedBy(input, errorId) {
    var ids = [];
    if (el(input.id + '-hint')) ids.push(input.id + '-hint');
    if (errorId) ids.push(errorId);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  function showError(input, msg) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    var errorId = (input.id || '') + '-error';
    var node = wrap.querySelector('.field-error');
    if (!node) {
      node = document.createElement('p');
      node.className = 'field-error';
      wrap.appendChild(node);
    }
    node.id = errorId;
    node.textContent = msg;
    input.setAttribute('aria-invalid', 'true');
    describedBy(input, errorId);
  }

  function clearError(input) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    var node = wrap.querySelector('.field-error');
    if (node) node.remove();
    input.removeAttribute('aria-invalid');
    describedBy(input, null);
  }

  function clearAll() {
    ['name', 'email', 'phone', 'privacy'].forEach(function (id) {
      var i = el(id);
      if (i) clearError(i);
    });
  }

  function setStatus(type, text, withFallback) {
    if (!live) return;
    live.hidden = false;
    live.className = 'form-status mt-0 form-status--' + type;
    live.textContent = '';

    var p = document.createElement('p');
    p.className = 'mb-0';
    p.textContent = text;
    live.appendChild(p);

    if (withFallback) {
      var extra = document.createElement('p');
      extra.className = 'mb-0';
      extra.appendChild(document.createTextNode('적으신 내용은 그대로 남아 있습니다. 계속 안 되면 '));
      var a = document.createElement('a');
      a.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' + encodeURIComponent('your wings 문의');
      a.textContent = FALLBACK_EMAIL;
      extra.appendChild(a);
      extra.appendChild(document.createTextNode(' 으로 보내주세요. 같은 사람이 확인합니다.'));
      live.appendChild(extra);
    }
    return live;
  }

  function showSummary(bad) {
    setStatus('error', '보내지 못했습니다. 아래 ' + bad.length + '곳을 확인해 주세요.');

    var ul = document.createElement('ul');
    bad.forEach(function (b) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + b.id;
      a.textContent = b.label + ' — ' + b.message;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = el(b.id);
        if (t) { t.focus(); t.scrollIntoView({ block: 'center' }); }
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    live.appendChild(ul);
  }

  function hideStatus() {
    if (!live) return;
    live.hidden = true;
    live.textContent = '';
  }

  ['name', 'email', 'phone'].forEach(function (id) {
    var input = el(id);
    if (!input) return;
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid')) clearError(input);
    });
  });
  (function () {
    var c = el('privacy');
    if (!c) return;
    c.addEventListener('change', function () {
      if (c.checked && c.getAttribute('aria-invalid')) clearError(c);
    });
  })();

  function buildBody() {
    var data = new FormData(form);

    if (!data.get('access_key') && FORM_CONFIG.accessKey) {
      data.set('access_key', FORM_CONFIG.accessKey);
    }

    var email = val('email');
    if (email && EMAIL_RE.test(email)) data.set('replyto', email);

    var who = val('name') || '이름 미기재';
    var picks = [];
    form.querySelectorAll('input[name="package"]:checked').forEach(function (c) {
      picks.push(c.value);
    });
    var subject = '[your wings 문의] ' + who;
    if (picks.length) subject += ' · ' + picks.join(', ');
    else if (val('stage')) subject += ' · ' + val('stage');
    if (subject.length > 120) subject = subject.slice(0, 117) + '…';
    data.set('subject', subject);

    return data;
  }

  form.addEventListener('submit', function (e) {
    var bad = collect();

    if (bad.length) {
      e.preventDefault();
      clearAll();
      bad.forEach(function (b) {
        var input = el(b.id);
        if (input) showError(input, b.message);
      });
      showSummary(bad);

      var first = el(bad[0].id);
      if (first) {
        
        first.focus({ preventScroll: true });
        var gap = first.getBoundingClientRect().bottom - live.getBoundingClientRect().top;
        if (gap < window.innerHeight - 40) live.scrollIntoView({ block: 'start' });
        else first.scrollIntoView({ block: 'center' });
      }
      return;
    }

    if (!external || typeof fetch !== 'function' || typeof FormData !== 'function') return;

    e.preventDefault();
    clearAll();

    var data = buildBody();
    var original = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '보내는 중…';
    }
    setStatus('info', '보내는 중입니다. 잠시만 기다려 주세요.');

    fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().catch(function () { return {}; });
      })
      .then(function (out) {
        if (out && out.success === false) throw new Error(out.message || 'rejected');
        form.reset();
        setStatus('ok', '문의가 접수되었습니다. 확인한 뒤 남겨주신 연락처로 답변드리겠습니다.');
        live.scrollIntoView({ block: 'center' });
      })
      .catch(function () {
        
        setStatus(
          'error',
          '전송에 실패했습니다. 네트워크 상태를 확인하시고 다시 눌러주세요.',
          true
        );
        live.scrollIntoView({ block: 'center' });
      })
      .then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        }
      });
  });

  form.addEventListener('reset', function () { clearAll(); hideStatus(); });
})();
