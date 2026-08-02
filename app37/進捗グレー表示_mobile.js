
(function() {
  'use strict';
  kintone.events.on('mobile.app.record.index.show', function(event) {
    var records = event.records;
    if (!records) return event;
    var cells = document.querySelectorAll('td.value-5522242');
    cells.forEach(function(cell, i) {
      var tr = cell.closest('tr');
      if (!tr) return;
      var rec = records[i];
      var isDone = rec && rec['ドロップダウン_1'] && rec['ドロップダウン_1'].value === '完成';
      var color = isDone ? '#d3d3d3' : '';
      tr.style.backgroundColor = color;
      Array.prototype.forEach.call(tr.children, function(td) {
        td.style.backgroundColor = color;
      });
    });
    return event;
  });
})();
