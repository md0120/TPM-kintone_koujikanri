(function() {
'use strict';

var APP_KOJI_ID = 37;
var APP43_ID = 43;
var DOMAIN = '325fggwl7tdq.cybozu.com';

// ==== 閲覧専用モバイルガントチャート ====
var FIELD_KOJI = '工事名';
var FIELD_START = '開始日時';
var FIELD_END = '終了日時';
var FIELD_NAIYO = '工程名';
var FIELD_KUBUN = '昼夜区分';
var FIELD_KOJI_SRC = '文字列__1行_';
var FIELD_PROGRESS_SRC = 'ドロップダウン_1';
var FIELD_CHAKKO_MTG_SRC = 'ドロップダウン_3';
var FIELD_SHUBETSU_SRC = '種別';

var M_COL_WIDTH = 15;
var M_ROW_HEAD_WIDTH = 184; // 元の92pxを基準に200%
var M_BAR_HEIGHT = 16;
var M_BAR_GAP = 2;
var M_ROW_PADDING = 8;
var M_MONTH_SPAN = 2;

var KUBUN_COLOR = { '昼': '#333333', '夜': '#c0392b' };
var SHUBETSU_ORDER = ['外装', '内装', '電気', '衛生', '空調', '搬送', '通信', '中水', '発電'];
var HOLIDAYS = new Set('2020-01-01,2020-01-13,2020-02-11,2020-02-23,2020-02-24,2020-03-20,2020-04-29,2020-05-03,2020-05-04,2020-05-05,2020-05-06,2020-07-23,2020-07-24,2020-08-10,2020-09-21,2020-09-22,2020-11-03,2020-11-23,2021-01-01,2021-01-11,2021-02-11,2021-02-23,2021-03-20,2021-04-29,2021-05-03,2021-05-04,2021-05-05,2021-07-22,2021-07-23,2021-08-08,2021-08-09,2021-09-20,2021-09-23,2021-11-03,2021-11-23,2022-01-01,2022-01-10,2022-02-11,2022-02-23,2022-03-21,2022-04-29,2022-05-03,2022-05-04,2022-05-05,2022-07-18,2022-08-11,2022-09-19,2022-09-23,2022-10-10,2022-11-03,2022-11-23,2023-01-01,2023-01-02,2023-01-09,2023-02-11,2023-02-23,2023-03-21,2023-04-29,2023-05-03,2023-05-04,2023-05-05,2023-07-17,2023-08-11,2023-09-18,2023-09-23,2023-10-09,2023-11-03,2023-11-23,2024-01-01,2024-01-08,2024-02-11,2024-02-12,2024-02-23,2024-03-20,2024-04-29,2024-05-03,2024-05-04,2024-05-05,2024-05-06,2024-07-15,2024-08-11,2024-08-12,2024-09-16,2024-09-22,2024-09-23,2024-10-14,2024-11-03,2024-11-04,2024-11-23,2025-01-01,2025-01-13,2025-02-11,2025-02-23,2025-02-24,2025-03-20,2025-04-29,2025-05-03,2025-05-04,2025-05-05,2025-05-06,2025-07-21,2025-08-11,2025-09-15,2025-09-23,2025-10-13,2025-11-03,2025-11-23,2025-11-24,2026-01-01,2026-01-12,2026-02-11,2026-02-23,2026-03-20,2026-04-29,2026-05-03,2026-05-04,2026-05-05,2026-05-06,2026-07-20,2026-08-11,2026-09-21,2026-09-22,2026-09-23,2026-10-12,2026-11-03,2026-11-23,2027-01-01,2027-01-11,2027-02-11,2027-02-23,2027-03-21,2027-03-22,2027-04-29,2027-05-03,2027-05-04,2027-05-05,2027-07-19,2027-08-11,2027-09-20,2027-09-23,2027-10-11,2027-11-03,2027-11-23,2028-01-01,2028-01-10,2028-02-11,2028-02-23,2028-03-20,2028-04-29,2028-05-03,2028-05-04,2028-05-05,2028-07-17,2028-08-11,2028-09-18,2028-09-22,2028-10-09,2028-11-03,2028-11-23,2029-01-01,2029-01-08,2029-02-11,2029-02-12,2029-02-23,2029-03-20,2029-04-29,2029-04-30,2029-05-03,2029-05-04,2029-05-05,2029-07-16,2029-08-11,2029-09-17,2029-09-23,2029-09-24,2029-10-08,2029-11-03,2029-11-23,2030-01-01,2030-01-14,2030-02-11,2030-02-23,2030-03-20,2030-04-29,2030-05-03,2030-05-04,2030-05-05,2030-05-06,2030-07-15,2030-08-11,2030-08-12,2030-09-16,2030-09-23,2030-10-14,2030-11-03,2030-11-04,2030-11-23'.split(','));

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function fmtISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
function daysBetween(a, b) { return Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate()) - new Date(a.getFullYear(),a.getMonth(),a.getDate())) / 86400000); }

function charCategory(ch) {
if (!ch) return 0;
if (/[0-9０-９]/.test(ch)) return 1;
if (/[a-zA-Zａ-ｚＡ-Ｚ]/.test(ch)) return 2;
if (/[ぁ-ゟ]/.test(ch)) return 3;
if (/[ァ-ヿ]/.test(ch)) return 4;
if (/[一-鿿]/.test(ch)) return 5;
return 0;
}
function compareKoji(a, b) {
var ca = charCategory(a.charAt(0)), cb = charCategory(b.charAt(0));
if (ca !== cb) return ca - cb;
return a.localeCompare(b, 'ja');
}
function shubetsuIndex(name) {
var idx = SHUBETSU_ORDER.indexOf(name);
return idx === -1 ? SHUBETSU_ORDER.length : idx;
}
function sortKojiByShubetsu(list, kojiMeta) {
return list.sort(function(a, b) {
var sa = shubetsuIndex(kojiMeta[a] ? kojiMeta[a].shubetsu : '');
var sb = shubetsuIndex(kojiMeta[b] ? kojiMeta[b].shubetsu : '');
if (sa !== sb) return sa - sb;
return compareKoji(a, b);
});
}

function computeMobileRange(offset) {
var today = new Date();
var start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
var end = new Date(start.getFullYear(), start.getMonth() + M_MONTH_SPAN, 0);
var days = [];
var cur = new Date(start);
while (cur <= end) { days.push(new Date(cur)); cur = addDays(cur, 1); }
return { start: start, days: days };
}

function fetchKojiMetaMobile(cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_KOJI_ID,
query: 'limit 500',
fields: [FIELD_KOJI_SRC, FIELD_CHAKKO_MTG_SRC, FIELD_PROGRESS_SRC, FIELD_SHUBETSU_SRC]
}).then(function(resp) {
var map = {};
resp.records.forEach(function(r) {
map[r[FIELD_KOJI_SRC].value] = {
chakkoMtg: r[FIELD_CHAKKO_MTG_SRC].value,
progress: r[FIELD_PROGRESS_SRC].value,
shubetsu: r[FIELD_SHUBETSU_SRC] ? r[FIELD_SHUBETSU_SRC].value : ''
};
});
cb(map);
});
}

function buildMobileGantt(container, offset, yearFilter) {
container.innerHTML = '';

var navWrap = document.createElement('div');
navWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:#f5f5f5;';
var prevBtn = document.createElement('button');
prevBtn.textContent = '◀前へ';
var label = document.createElement('span');
label.style.fontWeight = 'bold';
label.style.fontSize = '13px';
var nextBtn = document.createElement('button');
nextBtn.textContent = '次へ▶';
navWrap.appendChild(prevBtn);
navWrap.appendChild(label);
navWrap.appendChild(nextBtn);
container.appendChild(navWrap);

var scrollWrap = document.createElement('div');
scrollWrap.style.cssText = 'overflow-x:auto;overflow-y:auto;max-height:70vh;-webkit-overflow-scrolling:touch;';
container.appendChild(scrollWrap);
scrollWrap.textContent = '読み込み中…';

var range = computeMobileRange(offset);
label.textContent = fmtISO(range.start).slice(0,7);

prevBtn.onclick = function() { buildMobileGantt(container, offset - 1, yearFilter); };
nextBtn.onclick = function() { buildMobileGantt(container, offset + 1, yearFilter); };

var query = (yearFilter ? '年度 = "' + yearFilter + '" ' : '') + 'limit 500';
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP43_ID,
query: query,
fields: ['$id', FIELD_KOJI, FIELD_START, FIELD_END, FIELD_NAIYO, FIELD_KUBUN]
}).then(function(resp) {
fetchKojiMetaMobile(function(kojiMeta) {
renderMobileGanttTable(scrollWrap, range, resp.records, kojiMeta);
// 初期表示が月初のままだと、実際のバーが横スクロールしないと画面に入らないことが
// 多いため、今日の日付が見える位置まで自動で横スクロールしておく。
var todayIdx = daysBetween(range.start, new Date());
if (todayIdx > 0 && todayIdx < range.days.length) {
scrollWrap.scrollLeft = Math.max(0, todayIdx * M_COL_WIDTH - 40);
}
});
});
}

function renderMobileGanttTable(scrollWrap, range, records, kojiMeta) {
scrollWrap.innerHTML = '';
var days = range.days;
var totalWidth = M_ROW_HEAD_WIDTH + days.length * M_COL_WIDTH;

var table = document.createElement('table');
table.style.cssText = 'border-collapse:separate;border-spacing:0;table-layout:fixed;width:' + totalWidth + 'px;font-size:10px;';

var colgroup = document.createElement('colgroup');
var rc = document.createElement('col'); rc.style.width = M_ROW_HEAD_WIDTH + 'px'; colgroup.appendChild(rc);
days.forEach(function() { var c = document.createElement('col'); c.style.width = M_COL_WIDTH + 'px'; colgroup.appendChild(c); });
table.appendChild(colgroup);

var thead = document.createElement('thead');
var dayRow = document.createElement('tr');
var rh = document.createElement('th');
rh.textContent = '工事名';
rh.style.cssText = 'position:sticky;left:0;top:0;z-index:3;background:#f2f2f2;border:1px solid #999;padding:2px;';
dayRow.appendChild(rh);
days.forEach(function(d) {
var th = document.createElement('th');
var iso = fmtISO(d);
var bg = '#f2f2f2';
if (d.getDay() === 0 || HOLIDAYS.has(iso)) bg = '#fde0e0';
else if (d.getDay() === 6) bg = '#e0edfd';
th.style.cssText = 'position:sticky;top:0;z-index:2;background:' + bg + ';border:1px solid #999;padding:1px 0;text-align:center;';
th.textContent = d.getDate();
dayRow.appendChild(th);
});
thead.appendChild(dayRow);
table.appendChild(thead);

// 表示中の全工事名を先に確定させ、その期間にバーが無くても行自体は表示する
// （PC版のガントチャートと同じ挙動に合わせる）。
// デフォルトでは進捗「完成」の工事は非表示にし、「工事中」（＝完成以外）のみ表示する。
var allKojiSet = {};
records.forEach(function(r) {
var koji = r[FIELD_KOJI].value;
if (!koji) return;
var meta = kojiMeta[koji];
if (meta && meta.progress === '完成') return;
allKojiSet[koji] = true;
});

var byKoji = {};
records.forEach(function(r) {
var koji = r[FIELD_KOJI].value;
if (!koji) return;
var sv = r[FIELD_START].value, ev = r[FIELD_END].value;
if (!sv || !ev) return;
var sd = new Date(sv), ed = new Date(ev);
var si = daysBetween(range.start, sd), ei = daysBetween(range.start, ed);
if (ei < 0 || si > days.length - 1) return;
if (!byKoji[koji]) byKoji[koji] = [];
byKoji[koji].push({
id: r.$id.value,
startIdx: Math.max(0, si),
endIdx: Math.min(days.length - 1, ei),
naiyo: r[FIELD_NAIYO].value,
kubun: r[FIELD_KUBUN].value
});
});

var kojiList = sortKojiByShubetsu(Object.keys(allKojiSet), kojiMeta);
var tbody = document.createElement('tbody');
kojiList.forEach(function(koji) {
var bars = byKoji[koji] || [];
var tr = document.createElement('tr');
var rowHeight = M_BAR_HEIGHT + M_ROW_PADDING;
tr.style.height = rowHeight + 'px';

var rowhead = document.createElement('td');
rowhead.textContent = koji;
var meta = kojiMeta[koji];
var color = (meta && meta.chakkoMtg === '未') ? '#c0392b' : '#000';
var bg = (meta && meta.progress === '完成') ? '#ccc' : '#fff';
rowhead.style.cssText = 'position:sticky;left:0;z-index:3;background:' + bg + ';color:' + color + ';border:1px solid #999;padding:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;';
tr.appendChild(rowhead);

days.forEach(function(d) {
var td = document.createElement('td');
var iso = fmtISO(d);
var c = '#fff';
if (d.getDay() === 0 || HOLIDAYS.has(iso)) c = '#fdf0f0';
else if (d.getDay() === 6) c = '#f0f6fd';
td.style.cssText = 'border:1px solid #ddd;background:' + c + ';position:relative;';
tr.appendChild(td);
});
tbody.appendChild(tr);

var firstCell = tr.children[1];
if (firstCell) firstCell.style.position = 'relative';
bars.forEach(function(bar) {
var div = document.createElement('div');
div.textContent = bar.naiyo || '';
var left = bar.startIdx * M_COL_WIDTH;
var width = (bar.endIdx - bar.startIdx + 1) * M_COL_WIDTH - 1;
var style = 'position:absolute;z-index:2;left:' + left + 'px;top:1px;width:' + width + 'px;height:' + M_BAR_HEIGHT + 'px;line-height:' + M_BAR_HEIGHT + 'px;font-size:9px;padding:0 2px;overflow:hidden;white-space:nowrap;box-sizing:border-box;color:#fff;border-radius:2px;';
if (bar.kubun === '工事予定') {
style += 'background:#dcdcdc;border:1.5px dashed #000;color:#333;';
} else {
style += 'background:' + (KUBUN_COLOR[bar.kubun] || '#666') + ';';
}
div.style.cssText = style;
firstCell.appendChild(div);
});
});
table.appendChild(tbody);
scrollWrap.appendChild(table);
}

kintone.events.on('mobile.app.record.index.show', function(event) {
var space = kintone.mobile.app.getHeaderSpaceElement();
if (!space || document.getElementById('smc-kotei-search-box-m')) {
return event;
}

var wrap = document.createElement('div');
wrap.id = 'smc-kotei-search-box-m';
wrap.style.padding = '6px 8px';
wrap.style.display = 'flex';
wrap.style.alignItems = 'center';
wrap.style.justifyContent = 'space-between';
wrap.style.background = '#fff';

var select = document.createElement('select');
select.style.flex = '1';
select.style.marginRight = '8px';

var urlParams = new URLSearchParams(location.search);
var currentQuery = urlParams.get('query') || '';
var m = currentQuery.match(/年度\s*=\s*(\d+)/);
var currentYear = m ? m[1] : '';

kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_KOJI_ID,
query: 'order by 数値 desc limit 500',
fields: ['数値']
}).then(function(resp) {
var years = [];
resp.records.forEach(function(r) {
var y = r['数値'].value;
if (y && years.indexOf(y) === -1) years.push(y);
});
years.forEach(function(y) {
var opt = document.createElement('option');
opt.value = y;
opt.textContent = y + '年度';
if (String(y) === currentYear) opt.selected = true;
select.appendChild(opt);
});

if (!currentYear && years.length > 0) {
select.value = years[0];
var url = new URL(location.href);
url.searchParams.set('query', '年度 = ' + years[0]);
location.href = url.toString();
}
});

select.addEventListener('change', function() {
var year = select.value;
var url = new URL(location.href);
if (year) {
url.searchParams.set('query', '年度 = ' + year);
} else {
url.searchParams.delete('query');
}
location.href = url.toString();
});

var link = document.createElement('a');
link.textContent = '工事一覧へ';
link.href = '/k/' + APP_KOJI_ID + '/';
link.style.whiteSpace = 'nowrap';
link.style.marginRight = '8px';

var ganttLink = document.createElement('a');
ganttLink.textContent = '工程表の表示';
ganttLink.href = 'https://' + DOMAIN + '/k/' + APP43_ID + '/';
ganttLink.target = '_blank';
ganttLink.rel = 'noopener';
ganttLink.style.whiteSpace = 'nowrap';
ganttLink.style.padding = '4px 10px';
ganttLink.style.border = '1px solid #999';
ganttLink.style.borderRadius = '4px';
ganttLink.style.textDecoration = 'none';
ganttLink.style.color = '#333';
ganttLink.style.backgroundColor = '#e3f2fd';
ganttLink.style.fontSize = '13px';

wrap.appendChild(select);
wrap.appendChild(link);
wrap.appendChild(ganttLink);
space.appendChild(wrap);

var ganttContainer = document.createElement('div');
ganttContainer.id = 'smc-gantt-mobile-root';
space.appendChild(ganttContainer);
buildMobileGantt(ganttContainer, 0, currentYear);

return event;
});
})();
