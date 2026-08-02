
(function() {
  'use strict';
  kintone.events.on('mobile.app.record.index.show', function(event) {
    var records = event.records;
    if (!records) return event;
    var appId = kintone.mobile.app.getId();
    var cells = document.querySelectorAll('td.value-5522242');
    cells.forEach(function(cell, i) {
      if (cell.dataset.smcLinked) return;
      cell.dataset.smcLinked = '1';
      cell.style.cursor = 'pointer';
      cell.style.color = '#3498db';
      cell.addEventListener('click', function() {
        var rec = records[i];
        if (rec && rec.$id) {
          location.href = '/k/m/' + appId + '/show?record=' + rec.$id.value;
        }
      });
    });
    return event;
  });
})();
