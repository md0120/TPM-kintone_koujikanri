(function() {
  'use strict';
  kintone.events.on('mobile.app.record.create.show', function(event) {
    var params = new URLSearchParams(window.location.search);
    var kouji = params.get('smc_kouji');
    if (kouji && event.record['ルックアップ']) {
      event.record['ルックアップ'].value = kouji;
    }
    return event;
  });
})();