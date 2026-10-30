(function () {
  document.querySelectorAll('.gd-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.gd-ask');
      var text = box.querySelector('.gd-ask-text').textContent.trim();
      var done = function () {
        btn.textContent = '복사됨';
        btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = '복사'; btn.classList.remove('is-done'); }, 1500);
      };
      var fallback = function () {
        var r = document.createRange();
        r.selectNodeContents(box.querySelector('.gd-ask-text'));
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    });
  });
})();
