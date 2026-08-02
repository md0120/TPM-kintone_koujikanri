(function() {
'use strict';
var FIELD_KOJI = '文字列__1行__0';

kintone.events.on('mobile.app.record.create.show', function(event) {
var params = new URLSearchParams(window.location.search);
var kouji = params.get('smc_kouji');
if (kouji && event.record[FIELD_KOJI]) {
event.record[FIELD_KOJI].value = kouji;
}
return event;
});

kintone.events.on('mobile.app.record.detail.show', function(event) {
if (document.getElementById('smc-continue-btn')) return event;

var space = kintone.mobile.app.getHeaderSpaceElement();
if (!space) return event;

var koujiName = event.record[FIELD_KOJI] ? event.record[FIELD_KOJI].value : '';

var btn = document.createElement('button');
btn.id = 'smc-continue-btn';
btn.textContent = '続けて追加（同じ工事名）';
btn.style.display = 'block';
btn.style.width = '100%';
btn.style.boxSizing = 'border-box';
btn.style.padding = '10px';
btn.style.marginBottom = '6px';
btn.style.fontWeight = 'bold';
btn.style.cursor = 'pointer';
btn.style.backgroundColor = '#e8f5e9';
btn.style.border = '1px solid rgba(0,0,0,0.1)';
btn.style.borderRadius = '4px';
btn.onclick = function() {
var url = location.origin + '/k/m/' + kintone.mobile.app.getId() + '/edit?' +
encodeURIComponent('smc_kouji') + '=' + encodeURIComponent(koujiName);
location.href = url;
};
space.appendChild(btn);

if (!document.getElementById('smc-list-btn')) {
var listBtn = document.createElement('button');
listBtn.id = 'smc-list-btn';
listBtn.textContent = '空調運転記録一覧へ';
listBtn.style.display = 'block';
listBtn.style.width = '100%';
listBtn.style.boxSizing = 'border-box';
listBtn.style.padding = '10px';
listBtn.style.marginBottom = '6px';
listBtn.style.fontWeight = 'bold';
listBtn.style.cursor = 'pointer';
listBtn.style.backgroundColor = '#eeeeee';
listBtn.style.border = '1px solid rgba(0,0,0,0.1)';
listBtn.style.borderRadius = '4px';
listBtn.onclick = function() {
location.href = location.origin + '/k/m/' + kintone.mobile.app.getId() + '/';
};
space.appendChild(listBtn);
}

return event;
});
})();
