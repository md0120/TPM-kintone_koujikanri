(function() {
'use strict';

kintone.events.on('mobile.app.record.detail.show', function(event) {
if (document.getElementById('smc-list-btn')) return event;

var space = kintone.mobile.app.getHeaderSpaceElement();
if (!space) return event;

var btn = document.createElement('button');
btn.id = 'smc-list-btn';
btn.textContent = '協力会社報告書一覧へ';
btn.style.display = 'block';
btn.style.width = '100%';
btn.style.boxSizing = 'border-box';
btn.style.padding = '10px';
btn.style.marginBottom = '6px';
btn.style.fontWeight = 'bold';
btn.style.cursor = 'pointer';
btn.style.backgroundColor = '#eeeeee';
btn.style.border = '1px solid rgba(0,0,0,0.1)';
btn.style.borderRadius = '4px';
btn.onclick = function() {
location.href = location.origin + '/k/m/' + kintone.mobile.app.getId() + '/';
};
space.appendChild(btn);

return event;
});
})();
