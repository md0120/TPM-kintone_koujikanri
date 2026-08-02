(function() {
'use strict';
var FIELD_KOJI = '文字列__1行__0';
var TIME_LABELS = ['開始時刻', '終了時刻'];

var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

function pad2(n) {
return n < 10 ? '0' + n : '' + n;
}

// kintoneの標準「時刻」フィールドは input.input-time-text-cybozu というテキスト入力を
// 独自ウィジェット（div.input-time-cybozu）で覆う形で実装されている。この入力欄に対して
// ネイティブのvalue setter経由で値をセットし、input/change/blurイベントを発火させれば、
// kintone側のレコードモデルにも正しく反映されることを実機で確認済み。
function findTimeInput(labelText) {
var labelEls = Array.from(document.querySelectorAll('.control-label-text-gaia')).filter(function(el) {
return el.textContent.trim() === labelText;
});
if (!labelEls.length) return null;
var container = labelEls[0].closest('.control-gaia') || labelEls[0].parentElement.parentElement;
if (!container) return null;
var input = container.querySelector('input.input-time-text-cybozu');
var widget = container.querySelector('.input-time-cybozu');
if (!input || !widget) return null;
return { container: container, input: input, widget: widget };
}

function setupTimeDropdown(labelText) {
var found = findTimeInput(labelText);
if (!found) return;
if (found.container.querySelector('.smc-time-select-wrap')) return; // 二重設置防止

found.widget.style.display = 'none';

// 開始時刻・終了時刻はフォーム上で横並びの狭い列に配置されているため、
// プルダウンの合計幅が元の時刻欄の列幅を超えると隣の列にはみ出して重なってしまう。
// セレクトの幅を切り詰め、列自体の幅も広げて重なりを防ぐ。
found.container.style.width = 'auto';
found.container.style.minWidth = '150px';
var valueGaia = found.container.querySelector('.control-value-gaia');
if (valueGaia) {
valueGaia.style.width = 'auto';
valueGaia.style.minWidth = '150px';
}

var wrap = document.createElement('span');
wrap.className = 'smc-time-select-wrap';
wrap.style.display = 'inline-flex';
wrap.style.alignItems = 'center';
wrap.style.gap = '2px';
wrap.style.whiteSpace = 'nowrap';

var hourSel = document.createElement('select');
hourSel.style.width = '52px';
hourSel.style.flexShrink = '0';
hourSel.appendChild(new Option('--', ''));
for (var h = 0; h < 24; h++) hourSel.appendChild(new Option(pad2(h), pad2(h)));

var minSel = document.createElement('select');
minSel.style.width = '52px';
minSel.style.flexShrink = '0';
minSel.appendChild(new Option('--', ''));
for (var m = 0; m < 60; m++) minSel.appendChild(new Option(pad2(m), pad2(m)));

wrap.appendChild(hourSel);
wrap.appendChild(document.createTextNode('：'));
wrap.appendChild(minSel);
found.widget.parentNode.insertBefore(wrap, found.widget);

function syncFromInput() {
var v = found.input.value;
if (v && /^\d{2}:\d{2}$/.test(v)) {
hourSel.value = v.slice(0, 2);
minSel.value = v.slice(3, 5);
} else {
hourSel.value = '';
minSel.value = '';
}
}
syncFromInput();

function updateOriginal() {
var h = hourSel.value, m = minSel.value;
var newVal = (h && m) ? (h + ':' + m) : '';
if (found.input.value !== newVal) {
nativeInputValueSetter.call(found.input, newVal);
found.input.dispatchEvent(new Event('input', { bubbles: true }));
found.input.dispatchEvent(new Event('change', { bubbles: true }));
found.input.dispatchEvent(new Event('blur', { bubbles: true }));
}
}
hourSel.addEventListener('change', updateOriginal);
minSel.addEventListener('change', updateOriginal);
}

function setupAllTimeDropdowns() {
TIME_LABELS.forEach(setupTimeDropdown);
}

kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
setTimeout(setupAllTimeDropdowns, 0);
return event;
});

kintone.events.on('app.record.create.show', function(event) {
var params = new URLSearchParams(window.location.search);
var kouji = params.get('smc_kouji');
if (kouji && event.record[FIELD_KOJI]) {
event.record[FIELD_KOJI].value = kouji;
}
return event;
});

kintone.events.on('app.record.detail.show', function(event) {
if (document.getElementById('smc-continue-btn')) return event;

var space = kintone.app.record.getHeaderMenuSpaceElement();
if (!space) return event;

var koujiName = event.record[FIELD_KOJI] ? event.record[FIELD_KOJI].value : '';

var btn = document.createElement('button');
btn.id = 'smc-continue-btn';
btn.textContent = '続けて追加（同じ工事名）';
btn.style.padding = '6px 10px';
btn.style.marginRight = '8px';
btn.style.cursor = 'pointer';
btn.style.backgroundColor = '#e8f5e9';
btn.style.border = '1px solid rgba(0,0,0,0.15)';
btn.style.borderRadius = '4px';
btn.onclick = function() {
var url = location.origin + '/k/' + kintone.app.getId() + '/edit?' +
encodeURIComponent('smc_kouji') + '=' + encodeURIComponent(koujiName);
location.href = url;
};
space.appendChild(btn);

// app37の③ボタンからwindow.open()で新規タブとして開かれた場合のみ「終了」を表示する
if (window.opener && !document.getElementById('smc-close-btn')) {
var closeBtn = document.createElement('button');
closeBtn.id = 'smc-close-btn';
closeBtn.textContent = '終了';
closeBtn.style.padding = '6px 10px';
closeBtn.style.marginRight = '8px';
closeBtn.style.cursor = 'pointer';
closeBtn.style.backgroundColor = '#eeeeee';
closeBtn.style.border = '1px solid rgba(0,0,0,0.15)';
closeBtn.style.borderRadius = '4px';
closeBtn.onclick = function() {
window.close();
};
space.appendChild(closeBtn);
}

return event;
});
})();
