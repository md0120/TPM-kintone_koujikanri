(function() {
'use strict';

kintone.events.on('app.record.detail.show', function(event) {
// app37の①ボタンからwindow.open()で新規タブとして開かれた場合のみ表示する
// （直接このアプリを開いて保存した場合はwindow.openerが無いので表示しない）
if (!window.opener) return event;
if (document.getElementById('smc-close-btn')) return event;

var space = kintone.app.record.getHeaderMenuSpaceElement();
if (!space) return event;

var btn = document.createElement('button');
btn.id = 'smc-close-btn';
btn.textContent = '終了';
btn.style.padding = '6px 10px';
btn.style.marginLeft = '8px';
btn.style.cursor = 'pointer';
btn.style.border = '1px solid rgba(0,0,0,0.15)';
btn.style.borderRadius = '4px';
btn.style.backgroundColor = '#eeeeee';
btn.onclick = function() {
window.close();
};
space.appendChild(btn);

return event;
});
})();
