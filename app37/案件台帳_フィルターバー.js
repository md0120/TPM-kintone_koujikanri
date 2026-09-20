/**
* app37「案件台帳」一覧画面 絞り込みバー（app31の絞り込みバーを参考に作成）
* 見た目は検索窓のみ（左側にラベルテキストは置かない）。窓の幅はテキストが読める最小限にする。
* 各プルダウンはExcelのフィルターのようなチェックボックス式の複数選択に対応。
*
* 対象フィールドと絞り込み方式：
* 年度（数値・単一選択プルダウン → 完全一致。件数バッジ＋現在年度への自動初期表示あり。
* 旧・案件台帳_検索ボックス.jsの検索欄をここに統合したもの）
* 工事名（文字列__1行_・テキスト検索・like演算子。旧検索ボックスの検索欄を統合）
* 見積査定（ドロップダウン_5・DROP_DOWN → in演算子・複数選択可）
* 契約状況（ドロップダウン_4・DROP_DOWN → in演算子・複数選択可）
* TPM担当（ドロップダウン・実体はSINGLE_LINE_TEXT → 既存値をAPIから収集・複数選択可。
* 旧検索ボックスの「主担当」と同一フィールド）
* 協力会社（文字列__複数行_・MULTI_LINE_TEXT → テキスト検索・like演算子）
* 経営会議／工期(着工)／工期(完工)／請求予定日（いずれもDATE → 既存値をAPIから収集・複数選択可）
* 着打ち（ドロップダウン_3・実体はSINGLE_LINE_TEXT → 既存値をAPIから収集・複数選択可）
*/
(function() {
'use strict';

var FIELD_YEAR = '数値'; // 年度
var FIELD_KOJI = '文字列__1行_'; // 工事名
var FIELD_MITSUMORI = 'ドロップダウン_5'; // 見積査定
var FIELD_KEIYAKU = 'ドロップダウン_4'; // 契約状況
var FIELD_SHINCHOKU = 'ドロップダウン_1'; // 工事進捗（app43の工事名色分け・完成非表示判定と同じフィールド）
var FIELD_TPM = 'ドロップダウン'; // TPM担当（旧検索ボックスの「主担当」と同一フィールド）
var FIELD_KYORYOKU = '文字列__複数行_'; // 協力会社
var FIELD_KEIEIKAIGI = '日付_3'; // 経営会議
var FIELD_CHAKKO = '日付'; // 工期(着工)
var FIELD_KANKO = '日付_0'; // 工期(完工)
var FIELD_SEIKYU = '日付_5'; // 請求予定日
var FIELD_CHAKUUCHI = 'ドロップダウン_3'; // 着打ち(顧客)

var DROPDOWN_FIELDS = [
{ field: FIELD_MITSUMORI, label: '見積査定' },
{ field: FIELD_KEIYAKU, label: '契約状況' },
{ field: FIELD_SHINCHOKU, label: '工事進捗' }
];

// 既存値をAPIから収集してチェックボックス化するフィールド（自由入力・日付とも in演算子・複数選択可）
var DISTINCT_FIELDS = [
{ field: FIELD_TPM, label: 'TPM担当' },
{ field: FIELD_KEIEIKAIGI, label: '経営会議' },
{ field: FIELD_CHAKKO, label: '工期(着工)' },
{ field: FIELD_KANKO, label: '工期(完工)' },
{ field: FIELD_SEIKYU, label: '請求予定日' },
{ field: FIELD_CHAKUUCHI, label: '着打ち' }
];

var MULTI_FIELDS = DROPDOWN_FIELDS.concat(DISTINCT_FIELDS);

// kintoneのクエリでは`in`演算子はチェックボックス・ドロップダウン等の選択肢系
// フィールド専用で、DATE型フィールドには使えない（「フィールドタイプには演算子in
// を使用できません」エラーになる）。日付フィールドを複数選択した場合は
// `(日付 = "a" or 日付 = "b")`のようにOR連結した完全一致に変換する。
var DATE_FIELD_CODES = [FIELD_KEIEIKAIGI, FIELD_CHAKKO, FIELD_KANKO, FIELD_SEIKYU];

// テキスト検索（like演算子・単一値）フィールド
var TEXT_FIELDS = [
{ field: FIELD_KOJI, id: 'smc37-txt-koji', placeholder: '工事名で検索' },
{ field: FIELD_KYORYOKU, id: 'smc37-txt-kyoryoku', placeholder: '協力会社' }
];

var STYLE = [
'.smc37-filter-bar {',
' display: flex;',
' align-items: center;',
' gap: 8px;',
' padding: 10px 16px;',
' background: #f0f4f8;',
' border-bottom: 1px solid #c8d6e0;',
' flex-wrap: wrap;',
' position: relative;',
'}',
'.smc37-year-wrap {',
' display: flex;',
' align-items: center;',
' gap: 6px;',
'}',
'.smc37-year-count {',
' color: #3498db;',
' font-size: 13px;',
' white-space: nowrap;',
'}',
'.smc37-filter-bar select {',
' font-size: 13px;',
' padding: 4px 6px;',
' border: 1px solid #aac;',
' border-radius: 4px;',
' background: #fff;',
' cursor: pointer;',
'}',
'.smc37-cb-wrap {',
' position: relative;',
'}',
'.smc37-cb-btn {',
' font-size: 13px;',
' padding: 4px 10px;',
' border: 1px solid #aac;',
' border-radius: 4px;',
' background: #fff;',
' cursor: pointer;',
' white-space: nowrap;',
'}',
'.smc37-cb-btn.smc37-cb-active {',
' border-color: #3b82f6;',
' color: #2563eb;',
' font-weight: bold;',
'}',
'.smc37-cb-panel {',
' position: absolute;',
' top: 100%;',
' left: 0;',
' margin-top: 4px;',
' background: #fff;',
' border: 1px solid #aac;',
' border-radius: 6px;',
' box-shadow: 0 4px 14px rgba(0,0,0,0.15);',
' padding: 8px;',
' z-index: 1000;',
' min-width: 160px;',
' max-height: 260px;',
' overflow-y: auto;',
'}',
'.smc37-cb-option {',
' display: flex;',
' align-items: center;',
' gap: 6px;',
' font-size: 13px;',
' padding: 4px 2px;',
' white-space: nowrap;',
' cursor: pointer;',
'}',
'.smc37-cb-option:hover {',
' background: #f0f4f8;',
'}',
'.smc37-cb-btnrow {',
' display: flex;',
' justify-content: space-between;',
' gap: 6px;',
' margin-top: 6px;',
' padding-top: 6px;',
' border-top: 1px solid #ddd;',
'}',
'.smc37-cb-btnrow button {',
' font-size: 12px;',
' padding: 4px 10px;',
' border-radius: 4px;',
' cursor: pointer;',
'}',
'.smc37-cb-clear {',
' border: 1px solid #aaa;',
' background: #fff;',
' color: #555;',
'}',
'.smc37-cb-apply {',
' border: none;',
' background: #3b82f6;',
' color: #fff;',
' font-weight: bold;',
'}',
'.smc37-filter-bar .smc37-text-input {',
' font-size: 13px;',
' padding: 4px 6px;',
' border: 1px solid #aac;',
' border-radius: 4px;',
' background: #fff;',
' width: 100px;',
' cursor: text;',
'}',
'.smc37-filter-bar .smc37-text-input:focus {',
' outline: 2px solid #3b82f6;',
'}',
'.smc37-reset-btn {',
' font-size: 11px;',
' padding: 5px 12px;',
' background: #fff;',
' border: 1px solid #aaa;',
' border-radius: 4px;',
' cursor: pointer;',
' color: #555;',
'}',
'.smc37-reset-btn:hover {',
' background: #eee;',
'}'
].join('\n');

function escapeQueryValue(v) {
return String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getCurrentFiscalYear() {
var d = new Date();
var y = d.getFullYear();
var m = d.getMonth() + 1;
return m >= 4 ? y : y - 1;
}

function fetchDropdownOptions(field, cb) {
kintone.api(kintone.api.url('/k/v1/app/form/fields.json', true), 'GET', { app: kintone.app.getId() }).then(function(resp) {
var f = resp.properties[field];
if (!f || !f.options) { cb([]); return; }
var opts = Object.keys(f.options).map(function(k) { return f.options[k]; });
opts.sort(function(a, b) { return a.index - b.index; });
cb(opts.map(function(o) { return o.label; }));
});
}

function fetchDistinct(field, cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: 'limit 500',
fields: [field]
}).then(function(resp) {
var seen = {};
var vals = [];
resp.records.forEach(function(r) {
var v = r[field].value;
if (v && !seen[v]) {
seen[v] = true;
vals.push(v);
}
});
vals.sort();
cb(vals);
});
}

function parseQuotedList(raw) {
var matches = raw.match(/"((?:[^"\\]|\\.)*)"/g) || [];
return matches.map(function(s) {
return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
});
}

function getCurrentFilters() {
var query = kintone.app.getQuery() || '';
var filters = {};
MULTI_FIELDS.forEach(function(cfg) {
var m = query.match(new RegExp(cfg.field + '\\s+in\\s+\\(([^)]*)\\)'));
filters[cfg.field] = m ? parseQuotedList(m[1]) : [];
});
TEXT_FIELDS.forEach(function(cfg) {
var m = query.match(new RegExp(cfg.field + '\\s+like\\s+"([^"]*)"'));
filters[cfg.field] = m ? m[1] : '';
});
var mYear = query.match(new RegExp(FIELD_YEAR + '\\s*=\\s*"?(\\d+)"?'));
filters[FIELD_YEAR] = mYear ? mYear[1] : '';
return filters;
}

function getCheckedValues(field) {
var boxes = document.querySelectorAll('.smc37-cb-' + field + ':checked');
return Array.prototype.map.call(boxes, function(b) { return b.value; });
}

function getFiltersFromDOM() {
var filters = {};
MULTI_FIELDS.forEach(function(cfg) {
filters[cfg.field] = getCheckedValues(cfg.field);
});
TEXT_FIELDS.forEach(function(cfg) {
var el = document.getElementById(cfg.id);
filters[cfg.field] = el ? el.value.trim() : '';
});
var yearSel = document.getElementById('smc37-sel-year');
filters[FIELD_YEAR] = yearSel ? yearSel.value : '';
return filters;
}

function buildQueryString(f) {
var parts = [];
if (f[FIELD_YEAR]) parts.push(FIELD_YEAR + ' = "' + escapeQueryValue(f[FIELD_YEAR]) + '"');
MULTI_FIELDS.forEach(function(cfg) {
var vals = f[cfg.field];
if (!vals || !vals.length) return;
if (DATE_FIELD_CODES.indexOf(cfg.field) !== -1) {
var ors = vals.map(function(v) { return cfg.field + ' = "' + escapeQueryValue(v) + '"'; }).join(' or ');
parts.push(vals.length > 1 ? '(' + ors + ')' : ors);
} else {
parts.push(cfg.field + ' in (' + vals.map(function(v) { return '"' + escapeQueryValue(v) + '"'; }).join(', ') + ')');
}
});
TEXT_FIELDS.forEach(function(cfg) {
if (f[cfg.field]) parts.push(cfg.field + ' like "' + escapeQueryValue(f[cfg.field]) + '"');
});
return parts.join(' and ');
}

function applyFilters(f) {
var query = buildQueryString(f);
var url = location.pathname + '?app=' + kintone.app.getId();
if (query) url += '&query=' + encodeURIComponent(query);
location.href = url;
}

function closeAllPanels(except) {
document.querySelectorAll('.smc37-cb-panel').forEach(function(p) {
if (p !== except) p.style.display = 'none';
});
}

function updateBtnLabel(btn, label, count) {
btn.textContent = count ? label + '（' + count + '）' : label;
btn.classList.toggle('smc37-cb-active', count > 0);
}

function buildCheckboxDropdown(field, label, choices, currentValues) {
var wrap = document.createElement('div');
wrap.className = 'smc37-cb-wrap';

var btn = document.createElement('button');
btn.type = 'button';
btn.className = 'smc37-cb-btn';
updateBtnLabel(btn, label, currentValues.length);

var panel = document.createElement('div');
panel.className = 'smc37-cb-panel';
panel.style.display = 'none';

choices.forEach(function(c) {
var optLabel = document.createElement('label');
optLabel.className = 'smc37-cb-option';
var cb = document.createElement('input');
cb.type = 'checkbox';
cb.value = c;
cb.className = 'smc37-cb-' + field;
cb.checked = currentValues.indexOf(c) !== -1;
optLabel.appendChild(cb);
optLabel.appendChild(document.createTextNode(c));
panel.appendChild(optLabel);
});

var btnRow = document.createElement('div');
btnRow.className = 'smc37-cb-btnrow';

var clearBtn = document.createElement('button');
clearBtn.type = 'button';
clearBtn.className = 'smc37-cb-clear';
clearBtn.textContent = 'クリア';
clearBtn.addEventListener('click', function() {
panel.querySelectorAll('input[type=checkbox]').forEach(function(cb) { cb.checked = false; });
});

var applyBtn = document.createElement('button');
applyBtn.type = 'button';
applyBtn.className = 'smc37-cb-apply';
applyBtn.textContent = '適用';
applyBtn.addEventListener('click', function() {
applyFilters(getFiltersFromDOM());
});

btnRow.appendChild(clearBtn);
btnRow.appendChild(applyBtn);
panel.appendChild(btnRow);

btn.addEventListener('click', function(e) {
e.stopPropagation();
var isOpen = panel.style.display !== 'none';
closeAllPanels(null);
panel.style.display = isOpen ? 'none' : 'block';
});

wrap.appendChild(btn);
wrap.appendChild(panel);
return wrap;
}

function buildTextFilter(cfg, currentValue) {
var inp = document.createElement('input');
inp.type = 'text';
inp.id = cfg.id;
inp.className = 'smc37-text-input';
inp.placeholder = cfg.placeholder;
inp.value = currentValue;
inp.addEventListener('keydown', function(e) {
if (e.key === 'Enter') applyFilters(getFiltersFromDOM());
});
return inp;
}

// 年度：単一選択プルダウン＋件数バッジ。旧・案件台帳_検索ボックス.jsの「年度」欄を踏襲。
function buildYearFilter(years, currentYear, count) {
var wrap = document.createElement('div');
wrap.className = 'smc37-year-wrap';

var sel = document.createElement('select');
sel.id = 'smc37-sel-year';
years.forEach(function(y) {
var opt = document.createElement('option');
opt.value = y;
opt.textContent = y + '年度';
if (String(y) === String(currentYear)) opt.selected = true;
sel.appendChild(opt);
});
sel.addEventListener('change', function() { applyFilters(getFiltersFromDOM()); });
wrap.appendChild(sel);

var countSpan = document.createElement('span');
countSpan.className = 'smc37-year-count';
countSpan.textContent = count + '件';
wrap.appendChild(countSpan);

return wrap;
}

function buildResetButton() {
var btn = document.createElement('button');
btn.className = 'smc37-reset-btn';
btn.textContent = '🔄 リセット';
btn.addEventListener('click', function() {
location.href = location.pathname + '?app=' + kintone.app.getId();
});
return btn;
}

function buildFilterBar(years, currentYear, yearCount, dropdownOptions, distinctOptions, current) {
if (!document.getElementById('smc37-filter-style')) {
var styleEl = document.createElement('style');
styleEl.id = 'smc37-filter-style';
styleEl.textContent = STYLE;
document.head.appendChild(styleEl);
}

var bar = document.createElement('div');
bar.className = 'smc37-filter-bar';
bar.id = 'smc37-filter-bar';

// 表示順：年度（件数含む）→工事名→見積査定→経営会議→契約状況→TPM担当→協力会社
// →工期(着工)→工期(完工)→請求予定日→着打ち
bar.appendChild(buildYearFilter(years, currentYear, yearCount));
bar.appendChild(buildTextFilter(TEXT_FIELDS[0], current[FIELD_KOJI]));

bar.appendChild(buildCheckboxDropdown(FIELD_MITSUMORI, '見積査定', dropdownOptions[FIELD_MITSUMORI] || [], current[FIELD_MITSUMORI]));
bar.appendChild(buildCheckboxDropdown(FIELD_KEIEIKAIGI, '経営会議', distinctOptions[FIELD_KEIEIKAIGI] || [], current[FIELD_KEIEIKAIGI]));
bar.appendChild(buildCheckboxDropdown(FIELD_KEIYAKU, '契約状況', dropdownOptions[FIELD_KEIYAKU] || [], current[FIELD_KEIYAKU]));
bar.appendChild(buildCheckboxDropdown(FIELD_SHINCHOKU, '工事進捗', dropdownOptions[FIELD_SHINCHOKU] || [], current[FIELD_SHINCHOKU]));
bar.appendChild(buildCheckboxDropdown(FIELD_TPM, 'TPM担当', distinctOptions[FIELD_TPM] || [], current[FIELD_TPM]));
bar.appendChild(buildTextFilter(TEXT_FIELDS[1], current[FIELD_KYORYOKU]));

[FIELD_CHAKKO, FIELD_KANKO, FIELD_SEIKYU].forEach(function(field) {
var cfg = DISTINCT_FIELDS.filter(function(c) { return c.field === field; })[0];
bar.appendChild(buildCheckboxDropdown(field, cfg.label, distinctOptions[field] || [], current[field]));
});

bar.appendChild(buildCheckboxDropdown(FIELD_CHAKUUCHI, '着打ち', distinctOptions[FIELD_CHAKUUCHI] || [], current[FIELD_CHAKUUCHI]));

bar.appendChild(buildResetButton());

document.addEventListener('click', function() { closeAllPanels(null); });
bar.addEventListener('click', function(e) { e.stopPropagation(); });

return bar;
}

kintone.events.on('app.record.index.show', function(event) {
if (document.getElementById('smc37-filter-bar')) return event;
var headerSpace = kintone.app.getHeaderSpaceElement();
if (!headerSpace) return event;

var current = getCurrentFilters();

fetchDistinct(FIELD_YEAR, function(years) {
years.sort(function(a, b) { return Number(b) - Number(a); });

var hasQueryParam = new URLSearchParams(location.search).has('query');
var defaultYear = current[FIELD_YEAR];
if (!defaultYear) {
var fiscalYear = String(getCurrentFiscalYear());
defaultYear = years.some(function(y) { return String(y) === fiscalYear; }) ? fiscalYear : (years[0] || '');
}

// URLに絞り込み条件が一切無い初回アクセス時は、現在年度に絞り込んだ状態へ自動的にリダイレクトする
// （旧・案件台帳_検索ボックス.jsの初期表示ルールを踏襲）。
if (!hasQueryParam && defaultYear) {
var url = new URL(location.href);
url.searchParams.set('query', FIELD_YEAR + ' = "' + escapeQueryValue(defaultYear) + '"');
location.href = url.toString();
return;
}

kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: defaultYear ? FIELD_YEAR + ' = "' + escapeQueryValue(defaultYear) + '"' : '',
fields: [FIELD_YEAR],
totalCount: true
}).then(function(resp) {
var yearCount = resp.totalCount;

var dropdownOptions = {};
var distinctOptions = {};

Promise.all(
DROPDOWN_FIELDS.map(function(cfg) {
return new Promise(function(resolve) {
fetchDropdownOptions(cfg.field, function(opts) {
dropdownOptions[cfg.field] = opts;
resolve();
});
});
}).concat(DISTINCT_FIELDS.map(function(cfg) {
return new Promise(function(resolve) {
fetchDistinct(cfg.field, function(vals) {
distinctOptions[cfg.field] = vals;
resolve();
});
});
}))
).then(function() {
if (document.getElementById('smc37-filter-bar')) return;
headerSpace.appendChild(buildFilterBar(years, defaultYear, yearCount, dropdownOptions, distinctOptions, current));
});
});
});

return event;
});
})();
