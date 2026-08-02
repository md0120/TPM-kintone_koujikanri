(function() {
  'use strict';

  var DOMAIN = '325fggwl7tdq.cybozu.com';
  var APPS = {
    dailyReport: 38, // 作業日報
    ky: 39,          // KY活動記録
    partner: 40      // 協力会社報告書
  };

  kintone.events.on('app.record.detail.show', function(event) {
    var record = event.record;
    var koujiName = record['文字列__1行_'] ? record['文字列__1行_'].value : '';

    var space = kintone.app.record.getHeaderMenuSpaceElement();
    if (!space) {
      return event;
    }

    var container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.marginRight = '8px';

    function makeButton(label, appId) {
      var btn = document.createElement('button');
      btn.innerText = label;
      btn.style.marginRight = '6px';
      btn.style.padding = '6px 10px';
      btn.style.cursor = 'pointer';
      btn.onclick = function() {
        var url = 'https://' + DOMAIN + '/k/' + appId + '/edit?' +
          encodeURIComponent('smc_kouji') + '=' + encodeURIComponent(koujiName);
        window.open(url, '_blank');
      };
      return btn;
    }

    container.appendChild(makeButton('① 作業日報を作成', APPS.dailyReport));
    container.appendChild(makeButton('② KY用紙を保存', APPS.ky));
    container.appendChild(makeButton('③ 協力会社報告書を保存', APPS.partner));

    space.appendChild(container);

    return event;
  });
})();
