(function() {
'use strict';
var FIELD_KOJI = '文字列__1行__0';
var FIELD_DATE = '日付';
var FIELD_KIKI = '文字列__1行__1';
var FIELD_START = '時刻';
var FIELD_END = '時刻_0';
var FIELD_PHOTO = '添付ファイル';
var FIELD_REMARKS = '文字列__1行_';

function pad2(n) {
return n < 10 ? '0' + n : '' + n;
}

function todayStr() {
var d = new Date();
return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function parseMonthFromQuery() {
var params = new URLSearchParams(location.search);
var q = params.get('query') || '';
var m = q.match(/日付\s*>=\s*"(\d{4}-\d{2})-01"/);
return m ? m[1] : '';
}

function lastDayOfMonth(yearMonth) {
var parts = yearMonth.split('-');
var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10);
return new Date(y, m, 0).getDate();
}

// ============ 検索ボックス（年月絞り込み） ============

function buildSearchBox() {
var wrap = document.createElement('span');
wrap.id = 'smc-month-search';
wrap.style.padding = '6px 10px';
wrap.style.display = 'inline-flex';
wrap.style.alignItems = 'center';
wrap.style.fontSize = '12px';

var label = document.createElement('span');
label.textContent = '年月';
label.style.marginRight = '4px';
wrap.appendChild(label);

var monthInput = document.createElement('input');
monthInput.type = 'month';
monthInput.value = parseMonthFromQuery();
monthInput.style.marginRight = '7px';
monthInput.style.fontSize = '12px';
monthInput.style.padding = '3px 5px';
wrap.appendChild(monthInput);

var clearBtn = document.createElement('button');
clearBtn.type = 'button';
clearBtn.textContent = 'クリア';
clearBtn.style.padding = '3px 8px';
clearBtn.style.border = '1px solid #999';
clearBtn.style.borderRadius = '4px';
clearBtn.style.backgroundColor = '#fff';
clearBtn.style.cursor = 'pointer';
clearBtn.style.fontSize = '12px';
clearBtn.onclick = function() {
var url = new URL(location.href);
url.searchParams.set('query', '');
location.href = url.toString();
};
wrap.appendChild(clearBtn);

monthInput.addEventListener('change', function() {
if (!monthInput.value) return;
var start = monthInput.value + '-01';
var end = monthInput.value + '-' + pad2(lastDayOfMonth(monthInput.value));
var url = new URL(location.href);
url.searchParams.set('query', FIELD_DATE + ' >= "' + start + '" and ' + FIELD_DATE + ' <= "' + end + '"');
location.href = url.toString();
});

return wrap;
}

// ============ PDF出力（開始日・終了日を指定） ============

function buildPdfButton() {
var btn = document.createElement('button');
btn.type = 'button';
btn.textContent = 'PDF出力';
btn.style.padding = '4px 10px';
btn.style.border = '1px solid #999';
btn.style.borderRadius = '4px';
btn.style.backgroundColor = '#e3f2fd';
btn.style.cursor = 'pointer';
btn.style.fontSize = '12px';
btn.style.marginLeft = '8px';
btn.onclick = openPdfRangeModal;
return btn;
}

function openPdfRangeModal() {
if (document.getElementById('smc-pdf-range-modal')) return;

var overlay = document.createElement('div');
overlay.id = 'smc-pdf-range-modal';
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';

var box = document.createElement('div');
box.style.cssText = 'background:#fff;padding:24px;border-radius:8px;min-width:280px;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-size:14px;';

var title = document.createElement('div');
title.textContent = 'PDF出力する期間を選択';
title.style.cssText = 'margin-bottom:12px;font-weight:bold;';
box.appendChild(title);

var startRow = document.createElement('div');
startRow.style.cssText = 'margin-bottom:8px;';
var startLabel = document.createElement('span');
startLabel.textContent = '開始日：';
startRow.appendChild(startLabel);
var startInput = document.createElement('input');
startInput.type = 'date';
startRow.appendChild(startInput);
box.appendChild(startRow);

var endRow = document.createElement('div');
endRow.style.cssText = 'margin-bottom:16px;';
var endLabel = document.createElement('span');
endLabel.textContent = '終了日：';
endRow.appendChild(endLabel);
var endInput = document.createElement('input');
endInput.type = 'date';
endInput.value = todayStr();
startInput.value = todayStr();
endRow.appendChild(endInput);
box.appendChild(endRow);

var btnRow = document.createElement('div');
btnRow.style.textAlign = 'right';

var cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.textContent = 'キャンセル';
cancelBtn.style.marginRight = '8px';
cancelBtn.addEventListener('click', function() {
overlay.remove();
});

var okBtn = document.createElement('button');
okBtn.type = 'button';
okBtn.textContent = '出力';
okBtn.addEventListener('click', function() {
if (!startInput.value || !endInput.value) {
alert('開始日と終了日を選択してください');
return;
}
if (startInput.value > endInput.value) {
alert('開始日は終了日より前にしてください');
return;
}
overlay.remove();
generatePdf(startInput.value, endInput.value);
});

btnRow.appendChild(cancelBtn);
btnRow.appendChild(okBtn);
box.appendChild(btnRow);

overlay.appendChild(box);
document.body.appendChild(overlay);
}

function generatePdf(startDate, endDate) {
var query = FIELD_DATE + ' >= "' + startDate + '" and ' + FIELD_DATE + ' <= "' + endDate + '" order by ' + FIELD_DATE + ' asc limit 500';

kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: query
}).then(function(resp) {
renderPdfOverlay(resp.records, startDate + ' 〜 ' + endDate);
});
}

function renderPdfOverlay(records, rangeLabel) {
closePdfOverlay();

var overlay = document.createElement('div');
overlay.id = 'smc-pdf-overlay';
overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:999999;overflow:auto;padding:16px;';

var closeBtn = document.createElement('button');
closeBtn.type = 'button';
closeBtn.textContent = '閉じる（印刷しない場合）';
closeBtn.style.cssText = 'margin-bottom:12px;padding:6px 14px;border:1px solid #999;border-radius:4px;background:#fff;cursor:pointer;';
closeBtn.onclick = closePdfOverlay;
overlay.appendChild(closeBtn);

var title = document.createElement('h2');
title.textContent = rangeLabel + ' 空調機運転記録';
title.style.cssText = 'font-size:16px;margin:0 0 12px;';
overlay.appendChild(title);

if (!records.length) {
var empty = document.createElement('div');
empty.textContent = 'この期間の記録はありません。';
overlay.appendChild(empty);
document.body.appendChild(overlay);
return;
}

var table = document.createElement('table');
table.style.cssText = 'border-collapse:collapse;width:100%;font-size:11px;margin-bottom:24px;table-layout:auto;';
var thead = document.createElement('tr');
['作業日', '機器名', '開始時刻', '終了時刻', '工事名', '備考'].forEach(function(h) {
var th = document.createElement('th');
th.textContent = h;
th.style.cssText = 'border:1px solid #999;padding:4px;background:#eee;text-align:left;white-space:nowrap;';
thead.appendChild(th);
});
table.appendChild(thead);

records.forEach(function(r) {
var tr = document.createElement('tr');
[r[FIELD_DATE].value, r[FIELD_KIKI].value, r[FIELD_START].value, r[FIELD_END].value, r[FIELD_KOJI].value, r[FIELD_REMARKS] ? r[FIELD_REMARKS].value : ''].forEach(function(v, i) {
var td = document.createElement('td');
td.textContent = v || '';
var isRemarks = (i === 5);
td.style.cssText = 'border:1px solid #999;padding:4px;' + (isRemarks ? 'white-space:normal;word-break:break-word;' : 'white-space:nowrap;');
tr.appendChild(td);
});
table.appendChild(tr);
});
overlay.appendChild(table);

// kintoneの公開REST API（file.json）は、素の<img src>参照だとセッション認証エラーになる
// （"X-Requested-With"ヘッダーが必須のため）。kintone.api()でBlobとして取得し、
// オブジェクトURLに変換してから<img>に設定する必要があることを実機で確認済み。
// 写真は一覧表とは別ページから、1枚＝1ページで、A4の印刷可能領域に収まる
// 最大サイズまで自動的に拡大して表示する（固定倍率ではなくmax-width/max-heightで
// アスペクト比を保ったまま自動調整する方式）。
var photoSection = document.createElement('div');
var photoLoadPromises = [];
records.forEach(function(r) {
var files = r[FIELD_PHOTO].value;
if (!files || !files.length) return;
files.forEach(function(f) {
var block = document.createElement('div');
block.style.cssText = 'page-break-before: always; break-before: page; page-break-inside: avoid; break-inside: avoid; text-align:center;';
var caption = document.createElement('div');
caption.textContent = r[FIELD_DATE].value + '　' + r[FIELD_KOJI].value + '　/　' + r[FIELD_KIKI].value;
caption.style.cssText = 'font-weight:bold;margin-bottom:8px;font-size:12px;text-align:left;';
block.appendChild(caption);
var img = document.createElement('img');
img.style.cssText = 'max-width:100%;max-height:160mm;width:auto;height:auto;display:inline-block;';
block.appendChild(img);
var url = kintone.api.url('/k/v1/file.json', true) + '?fileKey=' + encodeURIComponent(f.fileKey);
var p = fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
.then(function(res) { return res.blob(); })
.then(function(blob) { img.src = URL.createObjectURL(blob); });
photoLoadPromises.push(p);
photoSection.appendChild(block);
});
});
overlay.appendChild(photoSection);

document.body.appendChild(overlay);

var style = document.createElement('style');
style.id = 'smc-pdf-style';
style.textContent =
'@page { size: A4 landscape; margin: 12mm; }' +
'#smc-pdf-overlay, #smc-pdf-overlay * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
'@media print {' +
'body > *:not(#smc-pdf-overlay) { display: none !important; }' +
'#smc-pdf-overlay { position: static !important; padding: 0 !important; }' +
'#smc-pdf-overlay button { display: none !important; }' +
'}';
document.head.appendChild(style);

window.addEventListener('afterprint', closePdfOverlay);
// 写真の読み込み（Blob取得）が完了してから印刷ダイアログを開く。
// 先にwindow.print()すると、まだsrcが空のimg要素が印刷結果に含まれてしまう。
Promise.all(photoLoadPromises).then(function() {
setTimeout(function() { window.print(); }, 200);
});
}

function closePdfOverlay() {
window.removeEventListener('afterprint', closePdfOverlay);
var overlay = document.getElementById('smc-pdf-overlay');
if (overlay) overlay.remove();
var style = document.getElementById('smc-pdf-style');
if (style) style.remove();
}

kintone.events.on('app.record.index.show', function(event) {
if (document.getElementById('smc-month-search')) return event;
var space = kintone.app.getHeaderMenuSpaceElement();
if (!space) return event;

var row = document.createElement('span');
row.id = 'smc-search-pdf-row';
row.style.display = 'inline-flex';
row.style.alignItems = 'center';

row.appendChild(buildSearchBox());
row.appendChild(buildPdfButton());
space.appendChild(row);

// ヘッダー領域はkintone側で高さが固定されているため、明示的に必要な高さを確保する
space.style.minHeight = space.scrollHeight + 'px';

return event;
});
})();
