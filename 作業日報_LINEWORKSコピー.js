(function() {
  'use strict';

  kintone.events.on('app.record.detail.show', function(event) {
    var record = event.record;

    var space = kintone.app.record.getHeaderMenuSpaceElement();
    if (!space) {
      return event;
    }

    var btn = document.createElement('button');
    btn.innerText = 'LINE WORKS送信用テキストをコピー';
    btn.style.padding = '6px 10px';
    btn.style.cursor = 'pointer';

    btn.onclick = function() {
      var comment = record['送信コメント'] ? record['送信コメント'].value : '';
      var url = location.href.split('#')[0] + '#record=' + kintone.app.record.getId();
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
