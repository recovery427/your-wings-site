var FORM_CONFIG = {
  endpoint: 'https://api.web3forms.com/submit',
  accessKey: '9b46d938-6138-41bc-98b0-d6a5d68a50ca'
};

(function () {
  var form = document.querySelector('.form');
  if (!form) return;

  var pending = document.getElementById('form-pending');
  var submitBtn = form.querySelector('button[type="submit"]');
  var live = document.getElementById('form-status');
  var connected = !!FORM_CONFIG.endpoint;

  if (connected) {
    if (pending) pending.hidden = true;
    if (submitBtn) submitBtn.disabled = false;
  } else {
    if (pending) pending.hidden = false;
    if (submitBtn) submitBtn.disabled = true;
  }

  var RULES = [
    {
      id: 'name',
      label: '이름 또는 회사명',
      test: function (v) { return v.length > 0; },
      message: '어떻게 불러드릴지 알려주세요.'
    },
    {
      id: 'contact',
      label: '연락받을 방법',
      test: function (v) { return v.length > 0; },
      message: '답변을 받으실 이메일이나 전화번호를 적어주세요.'
    },
    {
      id: 'contact',
      label: '연락받을 방법',
      test: function (v) {
        if (!v) return true;                       // 위 규칙이 먼저 잡는다
        if (v.indexOf('@') !== -1) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        }
        var digits = v.replace(/[^0-9]/g, '');     // 하이픈·공백은 허용
        return digits.length >= 9 && digits.length <= 11;
      },
      message: '이메일 형식(name@example.com) 또는 전화번호를 확인해 주세요.'
    }
  ];

  function fieldOf(input) { return input.closest('.field'); }

  function showError(input, msg) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    var el = wrap.querySelector('.field-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'field-error';
      wrap.appendChild(el);
    }
    el.textContent = msg;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', (input.id || '') + '-error');
    el.id = (input.id || '') + '-error';
  }

  function clearError(input) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    var el = wrap.querySelector('.field-error');
    if (el) el.remove();
    input.removeAttribute('aria-invalid');
  }

  function validate() {
    var firstBad = null;
    var checked = {};

    RULES.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      if (!input) return;
      if (checked[rule.id]) return;               // 앞 규칙이 이미 걸렀다
      var value = (input.value || '').trim();
      if (!rule.test(value)) {
        showError(input, rule.message);
        checked[rule.id] = true;
        if (!firstBad) firstBad = input;
      } else {
        clearError(input);
      }
    });

    return firstBad;
  }

  ['name', 'contact'].forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid')) clearError(input);
    });
  });

  function setStatus(type, text) {
    if (!live) return;
    live.hidden = false;
    live.className = 'form-status form-status--' + type;
    live.textContent = text;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var bad = validate();
    if (bad) {
      setStatus('error', '아직 비어 있거나 형식이 맞지 않는 칸이 있습니다.');
      bad.focus();
      return;
    }

    if (!connected) {
      setStatus('error', '문의 폼이 아직 연결되지 않아 전송할 수 없습니다. 잠시 뒤 다시 시도해 주세요.');
      return;
    }

    var data = new FormData(form);
    if (FORM_CONFIG.accessKey) data.append('access_key', FORM_CONFIG.accessKey);

    submitBtn.disabled = true;
    var original = submitBtn.textContent;
    submitBtn.textContent = '보내는 중…';
    setStatus('info', '보내는 중입니다.');

    fetch(FORM_CONFIG.endpoint, {
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
        setStatus('ok', '문의가 접수되었습니다. 확인 후 남겨주신 연락처로 답변드리겠습니다.');
      })
      .catch(function () {
        
        setStatus(
          'error',
          '전송에 실패했습니다. 네트워크 상태를 확인하시고 다시 눌러주세요. ' +
          '계속 실패하면 작성하신 내용을 복사해 두시면 다시 보내실 때 편합니다.'
        );
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      });
  });
})();
