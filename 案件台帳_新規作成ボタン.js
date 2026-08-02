(function() {
'use strict';
var DOMAIN = '325fggwl7tdq.cybozu.com';
var APPS = {
dailyReport: 38, // 作業日報
partner: 40, // 協力会社報告書
acRecord: 45 // 空調運転記録
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

function makeButton(label, appId, color) {
var btn = document.createElement('button');
btn.innerText = label;
btn.style.marginRight = '6px';
btn.style.padding = '6px 10px';
btn.style.cursor = 'pointer';
btn.style.backgroundColor = color;
btn.style.border = '1px solid rgba(0,0,0,0.15)';
btn.style.borderRadius = '4px';
btn.onclick = function() {
var url = 'https://' + DOMAIN + '/k/' + appId + '/edit?' +
encodeURIComponent('smc_kouji') + '=' + encodeURIComponent(koujiName);
window.open(url, '_blank');
};
return btn;
}

function makeBackButton(label, color) {
var btn = document.createElement('button');
btn.innerText = label;
btn.style.marginRight = '6px';
btn.style.padding = '6px 10px';
btn.style.cursor = 'pointer';
btn.style.backgroundColor = color;
btn.style.border = '1px solid rgba(0,0,0,0.15)';
btn.style.borderRadius = '4px';
btn.onclick = function() {
history.back();
};
return btn;
}

container.appendChild(makeButton('① 作業日報を作成', APPS.dailyReport, '#e3f2fd'));
container.appendChild(makeButton('② 協力会社報告書を保存', APPS.partner, '#fff3e0'));
container.appendChild(makeButton('③ 空調運転記録', APPS.acRecord, '#e8f5e9'));
container.appendChild(makeBackButton('戻る', '#eeeeee'));

space.appendChild(container);

return event;
});
})();
