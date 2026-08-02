(function() {
'use strict';

var FIELD_YEAR = '数値';
var KOJI_FIELD_ID = '5522242'; // 工事名
var SHUBETSU_FIELD_ID = '5523192'; // 種別

function applyLayoutStyle() {
if (document.getElementById('smc-layout-style')) return;
var style = document.createElement('style');
style.id = 'smc-layout-style';
style.textContent =
'.gaia-argoui-app-index-pager{padding-top:0 !important; padding-bottom:2px !important;}' +
'.kintone-app-header-space{margin-top:0 !important;}' +
'.kintone-app-headermenu-space{height:auto !important;}' +
'.gaia-argoui-app-toolbar{height:auto !important;}' +
'.gaia-argoui-app-index-toolbar{height:auto !important;}';
document.head.appendChild(style);
}

// 一覧テーブルの表示縮小(85%相当) + 種別・工事名列の固定表示
var COMPACT_STYLE_ID = 'smc-list-compact-style';

function applyCompactStyle() {
if (document.getElementById(COMPACT_STYLE_ID)) return;
var style = document.createElement('style');
style.id = COMPACT_STYLE_ID;
style.textContent =
'table.recordlist-gaia .line-cell-gaia,' +
'table.recordlist-gaia td.recordlist-single_select-gaia > div,' +
'table.recordlist-gaia td.recordlist-date-gaia > div,' +
'table.recordlist-gaia td.recordlist-decimal-gaia > div,' +
'table.recordlist-gaia td.recordlist-number-gaia > div,' +
'table.recordlist-gaia td.recordlist-record_id-gaia > div {' +
'font-size: 11.9px !important; line-height: 17.85px !important;' +
'padding: 11.9px 0 11.9px 6.8px !important;' +
'}' +
'table.recordlist-gaia .recordlist-header-cell-inner-wrapper-gaia {' +
'font-size: 11.9px !important; line-height: 17.85px !important;' +
'padding: 8.5px 4.25px 8.5px 0 !important;' +
'}' +
'table.recordlist-gaia .' + FROZEN_CLASS + ' { position: sticky; z-index: 3; border-right: 1px solid #ddd; border-bottom: 1px solid #eee; }' +
'table.recordlist-gaia thead .' + FROZEN_CLASS + ' { z-index: 4; background-color: #fff; }' +
'table.recordlist-gaia .' + FROZEN_LAST_CLASS + ' { border-right: 2px solid #888; }';
document.head.appendChild(style);
}

// 列の固定表示：どの列が実際に先頭付近に並んでいるかを毎回DOMから読み取って
// オフセットを計算する方式にする（列の並び順を変更しても壊れないようにするため）。
var FROZEN_FIELD_IDS = ['5523192', '5522242']; // 種別, 工事名
var FROZEN_CLASS = 'smcFrozenCol';
var FROZEN_LAST_CLASS = 'smcFrozenColLast';

function buildFreezeSelectors() {
var headSelectors = ['thead th:first-child'];
var bodySelectors = ['tbody td.recordlist-action-gaia'];
FROZEN_FIELD_IDS.forEach(function(id) {
headSelectors.push('thead th.label-' + id);
bodySelectors.push('tbody td.value-' + id);
});
return { headSelectors: headSelectors, bodySelectors: bodySelectors };
}

// kintoneの「先頭行を固定表示」を有効にしていると、ヘッダー行だけを複製した
// table.gaia-app-recordlist-fixedheader がもう1つ生成される。これも合わせて
// 固定表示にしないと、横スクロール時にそちらのヘッダー表示だけずれて見える。
function applyColumnFreezeToTable(table, widths) {
var sel = buildFreezeSelectors();
var offset = 0;
sel.headSelectors.forEach(function(s, idx) {
var th = table.querySelector(s);
if (th) {
th.classList.add(FROZEN_CLASS);
th.style.left = offset + 'px';
if (idx === sel.headSelectors.length - 1) th.classList.add(FROZEN_LAST_CLASS);
}
offset += widths[idx];
});

var rows = table.querySelectorAll('tbody > tr');
rows.forEach(function(tr) {
var cum = 0;
sel.bodySelectors.forEach(function(s, idx) {
var td = tr.querySelector(s);
if (td) {
td.classList.add(FROZEN_CLASS);
td.style.left = cum + 'px';
td.style.backgroundColor = getComputedStyle(tr).backgroundColor;
if (idx === sel.bodySelectors.length - 1) td.classList.add(FROZEN_LAST_CLASS);
}
cum += widths[idx];
});
});
}

function applyColumnFreeze() {
var mainTable = document.querySelector('table.recordlist-gaia');
if (!mainTable) return;

var sel = buildFreezeSelectors();
var widths = sel.headSelectors.map(function(s) {
var th = mainTable.querySelector(s);
return th ? th.getBoundingClientRect().width : 0;
});

var tables = document.querySelectorAll('table.recordlist-gaia');
tables.forEach(function(table) {
applyColumnFreezeToTable(table, widths);
});
}

// 工事名の先頭文字の種類で並び順を決める：記号→数字→アルファベット→ひらがな→カタカナ→漢字。
// kintoneの標準ソート（order by）はUnicodeのコードポイント順にしかならず、この優先順位を
// 表現できないため、一覧表示後にJS側でtbody内の<tr>を並べ替える方式にしている。
function charCategory(ch) {
if (!ch) return 0;
if (/[0-9０-９]/.test(ch)) return 1;
if (/[a-zA-Zａ-ｚＡ-Ｚ]/.test(ch)) return 2;
if (/[ぁ-ゟ]/.test(ch)) return 3;
if (/[ァ-ヿ]/.test(ch)) return 4;
if (/[一-鿿]/.test(ch)) return 5;
return 0;
}

// 種別（外装・内装・電気・衛生・空調・搬送・通信・発電）でグループ分けし、
// 各グループ内は従来通りの工事名並び順にする。
var SHUBETSU_ORDER = ['外装', '内装', '電気', '衛生', '空調', '搬送', '通信', '中水', '発電'];

function shubetsuIndex(name) {
var idx = SHUBETSU_ORDER.indexOf(name);
return idx === -1 ? SHUBETSU_ORDER.length : idx; // 未設定は最後尾
}

function sortListRowsByKoji() {
var table = document.querySelector('table.recordlist-gaia');
if (!table) return;
var tbody = table.querySelector('tbody');
if (!tbody) return;
function getKoji(tr) {
var td = tr.querySelector('td.value-' + KOJI_FIELD_ID);
return td ? td.textContent.trim() : '';
}
function getShubetsu(tr) {
var td = tr.querySelector('td.value-' + SHUBETSU_FIELD_ID);
return td ? td.textContent.trim() : '';
}
var rows = Array.from(tbody.querySelectorAll('tr'));
rows.sort(function(a, b) {
var sa = shubetsuIndex(getShubetsu(a)), sb = shubetsuIndex(getShubetsu(b));
if (sa !== sb) return sa - sb;
var ta = getKoji(a), tb = getKoji(b);
var ca = charCategory(ta.charAt(0)), cb = charCategory(tb.charAt(0));
if (ca !== cb) return ca - cb;
return ta.localeCompare(tb, 'ja');
});
rows.forEach(function(tr) { tbody.appendChild(tr); });
}

kintone.events.on('app.record.index.show', function(event) {
applyLayoutStyle();
applyCompactStyle();
sortListRowsByKoji();
setTimeout(applyColumnFreeze, 0);
return event;
});

kintone.events.on('app.record.create.show', function(event) {
var record = event.record;
record[FIELD_YEAR].value = String(new Date().getFullYear());
return event;
});
})();
