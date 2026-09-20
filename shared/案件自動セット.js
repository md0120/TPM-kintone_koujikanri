(function() {
  'use strict';

  kintone.events.on('app.record.create.show', function(event) {
    var params = new URLSearchParams(window.location.search);
    var kouji = params.get('smc_kouji');
    if (kouji && event.record['工事名テキスト']) {
      event.record['工事名テキスト'].value = kouji;
    }
    return event;
  });
})();
