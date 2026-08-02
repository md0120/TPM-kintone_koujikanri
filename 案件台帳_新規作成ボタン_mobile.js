(function() {
'use strict';
var DOMAIN = '325fggwl7tdq.cybozu.com';
var APPS = { dailyReport: 38, partner: 40, acRecord: 45 };

kintone.events.on('mobile.app.record.detail.show', function(event) {
if (document.getElementById('smc-mobile-create-buttons')) return event;
var record = event.record;
var koujiName = record['文字列__1行_'] ? record['文字列__1行_'].value : '';

var space = kintone.mobile.app.getHeaderSpaceElement();
if (!space) return event;

var container = document.createElement('div');
container.id = 'smc-mobile-create-buttons';
container.style.padding = '8px';
container.style.background = '#f5f5f5';

function makeButton(label, appId, color) {
var btn = document.createElement('button');
btn.textContent = label;
btn.style.display = 'block';
btn.style.width = '100%';
btn.style.boxSizing = 'border-box';
btn.style.padding = '10px';
btn.style.marginBottom = '6px';
btn.style.fontWeight = 'bold';
btn.style.cursor = 'pointer';
btn.style.backgroundColor = color;
btn.style.border = '1px solid rgba(0,0,0,0.1)';
btn.style.borderRadius = '4px';
btn.onclick = function() {
var url = 'https://' + DOMAIN + '/k/m/' + appId + '/edit?' +
encodeURIComponent('smc_kouji') + '=' + encodeURIComponent(koujiName);
location.href = url;
};
return btn;
}

function makeBackButton(label, color) {
var btn = document.createElement('button');
btn.textContent = label;
btn.style.display = 'block';
btn.style.width = '100%';
btn.style.boxSizing = 'border-box';
btn.style.padding = '10px';
btn.style.marginBottom = '6px';
btn.style.fontWeight = 'bold';
btn.style.cursor = 'pointer';
btn.style.backgroundColor = color;
btn.style.border = '1px solid rgba(0,0,0,0.1)';
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
