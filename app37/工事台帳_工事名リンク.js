
(function() {
  'use strict';
  var appId = null;
  function applyLinks() {
    if (!appId) appId = kintone.app.getId();
    var cells = document.querySelectorAll('td.value-5522242');
    cells.forEach(function(cell) {
      if (cell.dataset.smcLinked) return;
      var tr = cell.closest('tr');
      if (!tr) return;
      var idCell = tr.querySelector('td.value-5522226');
      if (!idCell) return;
      cell.dataset.smcLinked = '1';
      cell.style.cursor = 'pointer';
      cell.style.color = '#3498db';
      cell.addEventListener('click', function() {
        var idText = idCell.textContent.trim();
        if (idText) {
          location.href = '/k/' + appId + '/show#record=' + idText;
        }
      });
    });
  }
  kintone.events.on('app.record.index.show', function(event) {
    applyLinks();
    return event;
  });
  var observer = new MutationObserver(function() { applyLinks(); });
  document.addEventListener('DOMContentLoaded', function() {
    var target = document.body;
    observer.observe(target, {childList: true, subtree: true});
  });
  if (document.body) {
    observer.observe(document.body, {childList: true, subtree: true});
  }
})();
