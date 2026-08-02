
(function() {
  'use strict';
  kintone.events.on('mobile.app.record.detail.show', function(event) {
    if (document.getElementById('smc-mobile-copy-button')) return event;
    var record = event.record;
    var space = kintone.mobile.app.getHeaderSpaceElement();
    if (!space) return event;

    var btn = document.createElement('button');
    btn.id = 'smc-mobile-copy-button';
    btn.textContent = 'LINE WORKS送信用テキストをコピー';
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.boxSizing = 'border-box';
    btn.style.padding = '10px';
    btn.style.marginBottom = '6px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.backgroundColor = '#f3e5f5';
    btn.style.border = '1px solid rgba(0,0,0,0.1)';
    btn.style.borderRadius = '4px';

    btn.onclick = function() {
      var comment = record['送信コメント'] ? record['送信コメント'].value : '';
      var url = location.href.split('?')[0].split('#')[0] + '?record=' + kintone.mobile.app.record.getId();
      var text = (comment ? comment + '\n' : '') + url;

      navigator.clipboard.writeText(text).then(function() {
        alert('コピーしました。LINE WORKSのグループトークに貼り付けて送信してください。');
      }, function() {
        window.prompt('コピーできませんでした。下のテキストを手動でコピーしてください。', text);
      });
    };

    space.appendChild(btn);
    return event;
  });
})();
