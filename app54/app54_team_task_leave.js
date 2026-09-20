(function() {
'use strict';

var FIELD_TYPE = '種別';
var FIELD_MEMBER = '担当者';
var FIELD_KOJI = '案件';
var FIELD_DETAIL = '詳細';
var FIELD_START_DATE = '開始日';
var FIELD_DATE = '日付';
var FIELD_END_DATE = '終了日';
var FIELD_TIME = '時間帯';
var FIELD_STATUS = '進捗状況';
var FIELD_PRIORITY = '優先度';
var FIELD_ORDER = '表示順';
var FIELD_BAR_COLOR = 'バー色';

var TASK_TYPE = 'タスク';
var MEMBER_TYPE = 'メンバー';
var PLAN_TYPE = '計画';

var PRI_CLASS = { '高': 'high', '中': 'mid', '低': 'low' };
var MONTH_LABELS_FROM_APRIL = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

// ガントバーの選べる色（すべて薄い色）。キーはFIELD_BAR_COLORの値。
var BAR_COLORS = {
'グレー': '#d9dcd8',
'緑': '#d6ead0',
'水': '#d3e9f2',
'桃': '#f6dde6',
'橙': '#fbe3c9'
};
var BAR_COLOR_DEFAULT = 'グレー';

// タスクの担当者タブ選択を、追加・編集・削除後の再描画をまたいで維持するための状態。
var activeTaskMember = '__all__';

function fetchAllRecords(cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: 'order by 作成日時 asc limit 500',
fields: ['$id', FIELD_TYPE, FIELD_MEMBER, FIELD_KOJI, FIELD_DETAIL, FIELD_START_DATE, FIELD_DATE, FIELD_END_DATE, FIELD_TIME, FIELD_STATUS, FIELD_PRIORITY, FIELD_ORDER, FIELD_BAR_COLOR]
}).then(function(resp) {
cb(resp.records);
});
}

function addMemberRecord(name, order, cb) {
var record = {};
record[FIELD_TYPE] = { value: MEMBER_TYPE };
record[FIELD_MEMBER] = { value: name };
record[FIELD_ORDER] = { value: String(order) };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: kintone.app.getId(),
record: record
}).then(cb);
}

function removeMemberRecord(id, cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'DELETE', {
app: kintone.app.getId(),
ids: [id]
}).then(cb);
}

function deleteRecordById(id, cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'DELETE', {
app: kintone.app.getId(),
ids: [id]
}).then(cb);
}

function applyStyle() {
if (document.getElementById('smc54-style')) return;
var style = document.createElement('style');
style.id = 'smc54-style';
style.textContent =
'table.recordlist-gaia { display: none !important; }' +
'#smc54-root { font-size: 13px; width: 100%; }' +
'#smc54-root * { box-sizing: border-box; }' +
'.smc54-section { border: 1px solid #dce2db; border-radius: 10px; margin: 12px 16px; background: #fff; overflow: hidden; }' +
'.smc54-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 10px 10px; border-bottom: 1px solid #dce2db; background: #f7f8f5; border-left: 4px solid #c7cec9; }' +
'.smc54-head-roster { background: #eef0ea; border-left-color: #8a9a8f; }' +
'.smc54-head-plan { background: #e2ecf7; border-left-color: #3a6ea5; }' +
'.smc54-head-task { background: #e3efea; border-left-color: #2f6f63; }' +
'.smc54-head h3 { margin: 0; font-size: 13px; }' +
'.smc54-ghost-btn { font-size: 12px; border: 1px solid #ccc; background: #fff; border-radius: 6px; padding: 5px 10px; cursor: pointer; }' +
'.smc54-roster-body { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 14px; align-items: center; }' +
'.smc54-roster-chip { display: inline-flex; align-items: center; gap: 4px; background: #eef0ea; border-radius: 100px; padding: 5px 8px 5px 10px; font-size: 12.5px; font-weight: 700; color: #3a453d; }' +
'.smc54-roster-order { border: none; background: none; color: #5b665f; cursor: pointer; font-size: 9px; padding: 0 1px; }' +
'.smc54-roster-order:disabled { color: #cfd6d2; cursor: default; }' +
'.smc54-roster-remove { border: none; background: #fff; color: #b23a2e; cursor: pointer; font-size: 11px; border-radius: 50%; width: 18px; height: 18px; line-height: 1; }' +
'.smc54-roster-add { display: flex; gap: 6px; }' +
'.smc54-roster-add input { font-size: 12.5px; padding: 6px 8px; border: 1px solid #dce2db; border-radius: 6px; width: 140px; }' +
'.smc54-roster-add button { border: 1px solid #ccc; background: #fff; color: #2b332d; font-weight: normal; border-radius: 6px; padding: 0 12px; cursor: pointer; }' +
'.smc54-plan-scroll { overflow-x: auto; padding: 10px 14px; }' +
'.smc54-plan-table { border-collapse: collapse; width: 100%; min-width: 914px; table-layout: fixed; }' +
'.smc54-plan-table th, .smc54-plan-table td { border: 1px solid #eee; font-size: 10.5px; text-align: center; padding: 0; height: 26px; }' +
'.smc54-plan-table th { background: #f7f8f5; color: #5b665f; font-weight: 700; padding: 4px 0; height: auto; }' +
'.smc54-plan-month-th { border-left: 1px solid #ccc; }' +
'.smc54-plan-decan-th { font-size: 9.5px; color: #8b968e; }' +
'.smc54-plan-row-label { text-align: left !important; padding: 4px 4px 4px 6px !important; font-size: 12.5px !important; font-weight: 700; overflow: hidden; height: auto !important; }' +
'.smc54-plan-row-label-inner { display: flex; align-items: center; gap: 3px; }' +
'.smc54-plan-order-td { padding: 0 !important; background: #f7f8f5; height: auto !important; }' +
'.smc54-plan-row-order { display: inline-flex; flex-direction: column; flex: none; width: 100%; align-items: center; }' +
'.smc54-plan-row-order button { border: none; background: none; color: #5b665f; cursor: pointer; font-size: 8px; line-height: 1; padding: 1px 0; }' +
'.smc54-plan-row-order button:disabled { color: #d8ddda; cursor: default; }' +
'.smc54-plan-row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; cursor: text; }' +
'.smc54-plan-row-name:hover { text-decoration: underline dotted; }' +
'.smc54-plan-row-name-edit { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 700; padding: 2px 4px; border: 1px solid #3a6ea5; border-radius: 4px; }' +
'.smc54-plan-row-addline { flex: none; margin-left: auto; border: none; background: none; color: #2f6f63; cursor: pointer; font-size: 13px; font-weight: 700; padding: 0 2px; }' +
'.smc54-plan-action-td { padding: 0 !important; }' +
'.smc54-plan-row-del { border: none; background: none; color: #b23a2e; cursor: pointer; font-size: 12px; padding: 0 2px; }' +
'.smc54-plan-cell { cursor: pointer; position: relative; user-select: none; }' +
'.smc54-plan-cell-noborder-bottom { border-bottom: none !important; }' +
'.smc54-plan-cell-noborder-top { border-top: none !important; }' +
'.smc54-plan-cell:hover { background: #f0f4f8; }' +
'.smc54-plan-cell-dragging { background: #cfe0ee; }' +
'.smc54-plan-bar-cell { padding: 2px 3px !important; cursor: pointer; }' +
'.smc54-plan-bar { color: #000; height: 100%; border-radius: 4px; display: flex; align-items: center; justify-content: flex-start; font-size: 11px; font-weight: 400; overflow: visible; white-space: nowrap; padding: 0 4px; position: relative; z-index: 1; }' +
'.smc54-plan-modal-colors { display: flex; gap: 6px; margin-top: 10px; }' +
'.smc54-plan-modal-color-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }' +
'.smc54-plan-modal-color-btn.selected { border-color: #2b332d; }' +
'.smc54-plan-modal-overlay { position: fixed; inset: 0; background: rgba(20,24,26,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; }' +
'.smc54-plan-modal-box { background: #fff; border-radius: 10px; padding: 16px; width: 320px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }' +
'.smc54-plan-modal-title { font-size: 12.5px; font-weight: 700; color: #2b332d; margin-bottom: 10px; }' +
'.smc54-plan-modal-box input { width: 100%; font-size: 13px; padding: 8px; border: 1px solid #dce2db; border-radius: 6px; }' +
'.smc54-plan-modal-btn-row { display: flex; gap: 6px; margin-top: 12px; }' +
'.smc54-plan-modal-btn-row button { flex: 1; border: none; border-radius: 6px; padding: 8px 0; font-size: 12px; font-weight: 700; cursor: pointer; }' +
'.smc54-plan-modal-clear { background: #f6e2de; color: #b23a2e; }' +
'.smc54-plan-modal-cancel { background: #eef0ea; color: #5b665f; }' +
'.smc54-plan-modal-save { background: #2f6f63; color: #fff; }' +
'.smc54-add-form { display: none; gap: 6px; flex-wrap: wrap; padding: 10px 14px; background: #eef0ea; border-bottom: 1px solid #dce2db; }' +
'.smc54-add-form.open { display: flex; }' +
'.smc54-add-form input, .smc54-add-form select { font-size: 12.5px; padding: 5px 8px; border: 1px solid #dce2db; border-radius: 6px; }' +
'.smc54-add-form input[type=text] { flex: 1; min-width: 120px; }' +
'#smc54-task-date { color: #b23a2e; }' +
'.smc54-add-form button { border: none; background: #2f6f63; color: #fff; font-weight: 700; border-radius: 6px; padding: 0 12px; cursor: pointer; }' +
'.smc54-task-body { display: flex; min-height: 360px; }' +
'.smc54-filter-strip { display: flex; gap: 8px; padding: 10px 14px; overflow-x: auto; border-bottom: 1px solid #dce2db; background: #f7f8f5; }' +
'.smc54-filter-chip { flex: none; border: 1px solid #dce2db; background: #fff; border-radius: 100px; padding: 6px 12px; font-size: 12.5px; color: #5b665f; cursor: pointer; }' +
'.smc54-filter-chip:hover { background: #f7f8f5; }' +
'.smc54-filter-chip.active { background: #2f6f63; color: #fff; border-color: #2f6f63; font-weight: 700; }' +
'.smc54-task-panel { flex: 1; padding: 6px 14px 14px; overflow-x: auto; }' +
'.smc54-col-heads, .smc54-task-row { display: grid; grid-template-columns: 64px 204px 360px 90px 1fr 60px; gap: 10px; align-items: center; }' +
'.smc54-task-edit-form { display: grid; grid-template-columns: 64px 204px 360px 90px 1fr 130px; gap: 10px; align-items: center; padding: 8px 4px; border-bottom: 1px solid #eee; background: #f7f8f5; }' +
'.smc54-task-edit-form input, .smc54-task-edit-form select { font-size: 12px; padding: 5px 8px; border: 1px solid #dce2db; border-radius: 6px; width: 100%; }' +
'.smc54-edit-koji-wrap { display: flex; flex-direction: column; gap: 4px; }' +
'.smc54-task-edit-form .smc54-edit-btn-row { display: flex; gap: 6px; }' +
'.smc54-task-edit-form button { flex: 1; border: none; border-radius: 5px; padding: 6px 0; font-size: 11.5px; font-weight: 700; cursor: pointer; }' +
'.smc54-task-edit-form .smc54-save-btn { background: #2f6f63; color: #fff; }' +
'.smc54-task-edit-form .smc54-cancel-btn { background: #eef0ea; color: #5b665f; }' +
'.smc54-row-actions { display: flex; gap: 2px; justify-self: end; }' +
'.smc54-edit-btn { border: none; background: none; color: #5b665f; cursor: pointer; font-size: 12px; padding: 2px 4px; border-radius: 4px; }' +
'.smc54-edit-btn:hover { background: #eef0ea; }' +
'.smc54-col-heads { font-size: 12px; color: #2b332d; padding: 8px 4px; border-bottom: 1px solid #dce2db; }' +
'.smc54-col-heads > span, .smc54-task-row > *:not(.smc54-row-actions) { border-right: 1px solid #e4e8e3; padding-right: 10px; }' +
'.smc54-col-heads > span:last-child, .smc54-task-row > .smc54-status-input { border-right: none; }' +
'.smc54-task-row { padding: 8px 4px; border-bottom: 1px solid #eee; }' +
'.smc54-task-title { font-weight: 700; font-size: 12.5px; }' +
'.smc54-task-sub { font-size: 11px; color: #8b968e; }' +
'.smc54-task-detail { font-size: 12px; color: #5b665f; }' +
'.smc54-due { font-size: 11.5px; color: #b23a2e; }' +
'.smc54-status-input { width: 100%; font-size: 12px; padding: 5px 8px; border: 1px solid #dce2db; border-radius: 6px; background: #f7f8f5; }' +
'.smc54-status-input:focus { outline: none; border-color: #2f6f63; background: #fff; }' +
'.smc54-pri { justify-self: end; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 5px; }' +
'.smc54-pri.high { background: #f6e2de; color: #b23a2e; }' +
'.smc54-pri.mid { background: #f5e9d4; color: #b57a1f; }' +
'.smc54-pri.low { background: #eef0ea; color: #8b968e; }' +
'.smc54-del-btn { border: none; background: none; color: #b23a2e; cursor: pointer; font-size: 13px; justify-self: end; }';
document.head.appendChild(style);
}

function formatDueDate(dateStr) {
if (!dateStr) return '';
var parts = dateStr.split('-');
if (parts.length !== 3) return dateStr;
return parts[1] + '/' + parts[2] + 'まで';
}

// ---------------- 共用：メンバー登録 ----------------
// 表示順が空欄のレコードが混ざっていても確実に入れ替わるよう、対象2件だけでなく
// 一覧全体（表示順でソート済みの配列）を渡してもらい、その並びごと表示順を振り直す
// （10,20,30...）。空欄値のフォールバック衝突による「入れ替わらない」不具合を防ぐ。
function swapOrder(list, idxA, idxB, cb) {
var newList = list.slice();
var tmp = newList[idxA]; newList[idxA] = newList[idxB]; newList[idxB] = tmp;
var updates = newList.map(function(r, i) {
var o = {};
o[FIELD_ORDER] = { value: String((i + 1) * 10) };
return { id: r.$id.value, record: o };
});
kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', {
app: kintone.app.getId(),
records: updates
}).then(cb);
}

function renderRosterSection(root, memberRecords, memberNames, records) {
var section = document.createElement('div');
section.className = 'smc54-section';

var sortedMemberRecords = memberRecords.slice().sort(function(a, b) {
var oa = a[FIELD_ORDER].value === '' ? Infinity : Number(a[FIELD_ORDER].value);
var ob = b[FIELD_ORDER].value === '' ? Infinity : Number(b[FIELD_ORDER].value);
if (oa !== ob) return oa - ob;
return a[FIELD_MEMBER].value.localeCompare(b[FIELD_MEMBER].value, 'ja');
});
var registeredNames = sortedMemberRecords.map(function(r) { return r[FIELD_MEMBER].value; });
var extraNames = memberNames.filter(function(n) { return registeredNames.indexOf(n) === -1; }).sort();
var orderedNames = registeredNames.concat(extraNames);

var head = document.createElement('div');
head.className = 'smc54-head smc54-head-roster';
head.innerHTML = '<h3>メンバー登録（' + memberNames.length + '人）</h3>';
section.appendChild(head);

var body = document.createElement('div');
body.className = 'smc54-roster-body';

orderedNames.forEach(function(name, idx) {
var chip = document.createElement('span');
chip.className = 'smc54-roster-chip';

var rec = sortedMemberRecords.filter(function(r) { return r[FIELD_MEMBER].value === name; })[0];

if (rec) {
var recIdx = sortedMemberRecords.indexOf(rec);
var upBtn = document.createElement('button');
upBtn.className = 'smc54-roster-order';
upBtn.textContent = '▲';
upBtn.title = '前へ';
upBtn.disabled = recIdx === 0;
upBtn.addEventListener('click', function() {
swapOrder(sortedMemberRecords, recIdx, recIdx - 1, function() { refreshAll(); });
});
chip.appendChild(upBtn);

var downBtn = document.createElement('button');
downBtn.className = 'smc54-roster-order';
downBtn.textContent = '▼';
downBtn.title = '次へ';
downBtn.disabled = recIdx === sortedMemberRecords.length - 1;
downBtn.addEventListener('click', function() {
swapOrder(sortedMemberRecords, recIdx, recIdx + 1, function() { refreshAll(); });
});
chip.appendChild(downBtn);
}

var nameSpan = document.createElement('span');
nameSpan.textContent = name;
chip.appendChild(nameSpan);

if (rec) {
var rm = document.createElement('button');
rm.className = 'smc54-roster-remove';
rm.textContent = '✕';
rm.title = 'メンバー登録から外す';
rm.addEventListener('click', function() {
var taskIds = records.filter(function(r) {
return r[FIELD_TYPE].value === TASK_TYPE && r[FIELD_MEMBER].value === name;
}).map(function(r) { return r.$id.value; });
if (taskIds.length > 0) {
alert('タスクを完了または削除して、メンバー削除して下さい（' + name + ' の未処理タスクが ' + taskIds.length + ' 件あります）');
return;
}
if (!confirm(name + ' をメンバー登録から外しますか？')) return;
removeMemberRecord(rec.$id.value, function() { refreshAll(); });
});
chip.appendChild(rm);
}
body.appendChild(chip);
});

var addWrap = document.createElement('div');
addWrap.className = 'smc54-roster-add';
addWrap.innerHTML = '<input type="text" id="smc54-roster-input" placeholder="氏名を入力して登録"><button type="button" id="smc54-roster-add-btn">＋ 登録</button>';
body.appendChild(addWrap);

section.appendChild(body);
root.appendChild(section);

document.getElementById('smc54-roster-add-btn').addEventListener('click', function() {
var input = document.getElementById('smc54-roster-input');
var name = input.value.trim();
if (!name) return;
if (memberNames.indexOf(name) !== -1) { alert('すでに登録されています'); return; }
var maxOrder = sortedMemberRecords.reduce(function(max, r) {
var v = r[FIELD_ORDER].value === '' ? 0 : Number(r[FIELD_ORDER].value);
return v > max ? v : max;
}, 0);
addMemberRecord(name, maxOrder + 10, function() { refreshAll(); });
});
}

// 4月始まりの年度で、日付を「月×上旬/中旬/下旬」の36分割インデックス（0〜35）に変換する。
// 上旬=1〜10日、中旬=11〜20日、下旬=21日〜月末。年度の範囲外の日付はnullを返す。
var DECAN_LABELS = ['上', '中', '下'];

function fiscalDecanIndex(dateStr, fiscalYear) {
if (!dateStr) return null;
var parts = dateStr.split('-');
if (parts.length !== 3) return null;
var y = parseInt(parts[0], 10);
var m = parseInt(parts[1], 10);
var d = parseInt(parts[2], 10);
var monthIdx = m >= 4 ? m - 4 : m + 8;
var recordFiscalYear = m >= 4 ? y : y - 1;
if (recordFiscalYear !== fiscalYear) return null;
var decan = d <= 10 ? 0 : (d <= 20 ? 1 : 2);
return monthIdx * 3 + decan;
}

// decanIndex（0〜35）から、その旬の初日・末日の日付文字列を求める。
function decanToCalendar(decanIdx, fiscalYear) {
var monthIdx = Math.floor(decanIdx / 3);
var decan = decanIdx % 3;
var year = monthIdx <= 8 ? fiscalYear : fiscalYear + 1;
var month = monthIdx <= 8 ? monthIdx + 4 : monthIdx - 8;
var mm = month < 10 ? '0' + month : String(month);
var firstDay, lastDay;
if (decan === 0) { firstDay = 1; lastDay = 10; }
else if (decan === 1) { firstDay = 11; lastDay = 20; }
else { firstDay = 21; lastDay = new Date(year, month, 0).getDate(); }
var pad = function(n) { return n < 10 ? '0' + n : String(n); };
return {
first: year + '-' + mm + '-' + pad(firstDay),
last: year + '-' + mm + '-' + pad(lastDay)
};
}

function decanLabel(decanIdx) {
var monthIdx = Math.floor(decanIdx / 3);
var decan = decanIdx % 3;
return MONTH_LABELS_FROM_APRIL[monthIdx] + DECAN_LABELS[decan] + '旬';
}

function getCurrentFiscalYear() {
var d = new Date();
var y = d.getFullYear();
var m = d.getMonth() + 1;
return m >= 4 ? y : y - 1;
}

function createPlanRecord(name, order, cb) {
var record = {};
record[FIELD_TYPE] = { value: PLAN_TYPE };
record[FIELD_KOJI] = { value: name };
record[FIELD_ORDER] = { value: String(order) };
record[FIELD_BAR_COLOR] = { value: BAR_COLOR_DEFAULT };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: kintone.app.getId(),
record: record
}).then(cb);
}

// 項目名（FIELD_KOJI）は複数レコードで共有するグルーピングキーなので、改名する
// 際はその項目に属する全レコードをまとめて更新する。
function renamePlanGroup(groupRecs, newName, cb) {
var updates = groupRecs.map(function(r) {
var o = {};
o[FIELD_KOJI] = { value: newName };
return { id: r.$id.value, record: o };
});
kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', {
app: kintone.app.getId(),
records: updates
}).then(cb);
}

// 項目（案件名でグルーピングした行）単位の並び替え。1項目に複数のガントバー
// （レコード）がぶら下がっていても、その項目に属する全レコードをまとめて動かす。
// 表示順は毎回全体を振り直す（10,20,30...）ので、空欄値の衝突による
// 「入れ替わらない」不具合は起きない。
function swapPlanGroupOrder(groups, idxA, idxB, cb) {
var newGroups = groups.slice();
var tmp = newGroups[idxA]; newGroups[idxA] = newGroups[idxB]; newGroups[idxB] = tmp;
var updates = [];
newGroups.forEach(function(group, i) {
var order = String((i + 1) * 10);
group.forEach(function(r) {
var o = {};
o[FIELD_ORDER] = { value: order };
updates.push({ id: r.$id.value, record: o });
});
});
kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', {
app: kintone.app.getId(),
records: updates
}).then(cb);
}

// バー編集モーダル：期間（開始旬・終了旬）とバー上に表示するテキストを入力する。
// クリア（期間だけ消す）・削除（項目ごと削除）にも対応。
function openPlanModal(r, startIdx, endIdx, fiscalYear, onDone) {
var overlay = document.createElement('div');
overlay.className = 'smc54-plan-modal-overlay';
overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

var box = document.createElement('div');
box.className = 'smc54-plan-modal-box';

var title = document.createElement('div');
title.className = 'smc54-plan-modal-title';
title.textContent = (r[FIELD_KOJI].value || '') + '　' + decanLabel(startIdx) + '〜' + decanLabel(endIdx);
box.appendChild(title);

var textInput = document.createElement('input');
textInput.type = 'text';
textInput.placeholder = 'バーに表示するテキスト（内容・担当者など）';
textInput.value = r[FIELD_DETAIL].value || '';
box.appendChild(textInput);

var selectedColor = r[FIELD_BAR_COLOR].value || BAR_COLOR_DEFAULT;
var colorRow = document.createElement('div');
colorRow.className = 'smc54-plan-modal-colors';
Object.keys(BAR_COLORS).forEach(function(colorName) {
var colorBtn = document.createElement('button');
colorBtn.type = 'button';
colorBtn.className = 'smc54-plan-modal-color-btn' + (colorName === selectedColor ? ' selected' : '');
colorBtn.style.background = BAR_COLORS[colorName];
colorBtn.title = colorName;
colorBtn.addEventListener('click', function() {
selectedColor = colorName;
colorRow.querySelectorAll('.smc54-plan-modal-color-btn').forEach(function(b) { b.classList.remove('selected'); });
colorBtn.classList.add('selected');
});
colorRow.appendChild(colorBtn);
});
box.appendChild(colorRow);

var btnRow = document.createElement('div');
btnRow.className = 'smc54-plan-modal-btn-row';

var clearBtn = document.createElement('button');
clearBtn.type = 'button';
clearBtn.className = 'smc54-plan-modal-clear';
clearBtn.textContent = 'クリア';
clearBtn.addEventListener('click', function() {
if (!confirm((r[FIELD_KOJI].value || '') + ' の期間をクリアしますか？')) return;
var rec = {};
rec[FIELD_START_DATE] = { value: '' };
rec[FIELD_DATE] = { value: '' };
rec[FIELD_DETAIL] = { value: '' };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.app.getId(),
id: r.$id.value,
record: rec
}).then(function() { overlay.remove(); onDone(); });
});

var cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.className = 'smc54-plan-modal-cancel';
cancelBtn.textContent = 'キャンセル';
cancelBtn.addEventListener('click', function() { overlay.remove(); });

var saveBtn = document.createElement('button');
saveBtn.type = 'button';
saveBtn.className = 'smc54-plan-modal-save';
saveBtn.textContent = '保存';
saveBtn.addEventListener('click', function() {
var range = decanToCalendar(startIdx, fiscalYear);
var rangeEnd = decanToCalendar(endIdx, fiscalYear);
var record = {};
record[FIELD_START_DATE] = { value: range.first };
record[FIELD_DATE] = { value: rangeEnd.last };
record[FIELD_DETAIL] = { value: textInput.value.trim() };
record[FIELD_BAR_COLOR] = { value: selectedColor };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.app.getId(),
id: r.$id.value,
record: record
}).then(function() { overlay.remove(); onDone(); });
});

btnRow.appendChild(clearBtn);
btnRow.appendChild(cancelBtn);
btnRow.appendChild(saveBtn);
box.appendChild(btnRow);

overlay.appendChild(box);
document.body.appendChild(overlay);
textInput.focus();
}

// ---------------- 上段：年間計画（app43のガントチャートを参考にした版） ----------------
// タスク管理とは別の項目（予算計画・見積契約・工事着手完成・次年度計画など、全体の目安となる
// マイルストーン）を独自に登録する。左に項目名、上に4月〜3月×上旬中旬下旬（36分割）を並べた表で、
// app43と同様にセルをドラッグして期間を選択するとバーが引け、バーにはテキストを表示できる。
// ◀▶で年度を手動切替できる（既定は今年度）。
function renderAnnualPlanSection(root, records) {
var fiscalYear = getCurrentFiscalYear();
var planRecords = records.filter(function(r) { return r[FIELD_TYPE].value === PLAN_TYPE; });
planRecords.sort(function(a, b) {
var oa = a[FIELD_ORDER].value === '' ? Infinity : Number(a[FIELD_ORDER].value);
var ob = b[FIELD_ORDER].value === '' ? Infinity : Number(b[FIELD_ORDER].value);
if (oa !== ob) return oa - ob;
return (a[FIELD_KOJI].value || '').localeCompare(b[FIELD_KOJI].value || '', 'ja');
});

var section = document.createElement('div');
section.className = 'smc54-section';

var head = document.createElement('div');
head.className = 'smc54-head smc54-head-plan';
head.innerHTML = '<h3>年間計画（' + fiscalYear + '年度）</h3>';

var addBtn = document.createElement('button');
addBtn.type = 'button';
addBtn.className = 'smc54-ghost-btn';
addBtn.textContent = '＋ 項目追加';
head.appendChild(addBtn);
section.appendChild(head);

var addForm = document.createElement('div');
addForm.className = 'smc54-add-form';
addForm.innerHTML = '<input type="text" id="smc54-plan-name" placeholder="項目名（例：予算計画、見積・契約、工事着手・完成、次年度計画）"><button type="button" id="smc54-plan-add-btn">追加</button>';
section.appendChild(addForm);
addBtn.addEventListener('click', function() { addForm.classList.toggle('open'); });
addForm.querySelector('#smc54-plan-add-btn').addEventListener('click', function() {
var input = document.getElementById('smc54-plan-name');
var name = input.value.trim();
if (!name) { alert('項目名を入力してください'); return; }
var maxOrder = planRecords.reduce(function(max, r) {
var v = r[FIELD_ORDER].value === '' ? 0 : Number(r[FIELD_ORDER].value);
return v > max ? v : max;
}, 0);
createPlanRecord(name, maxOrder + 10, refreshAll);
});

var scrollWrap = document.createElement('div');
scrollWrap.className = 'smc54-plan-scroll';

var table = document.createElement('table');
table.className = 'smc54-plan-table';

// table-layout:fixedでも列幅が確実に反映されるよう、colgroupで明示的に指定する
// （項目名の列が押し潰されて見えなくなる問題への対策。上旬/中旬/下旬は20%狭める）。
var colgroup = document.createElement('colgroup');
var orderCol = document.createElement('col');
orderCol.style.width = '18px';
colgroup.appendChild(orderCol);
var labelCol = document.createElement('col');
labelCol.style.width = '134px';
colgroup.appendChild(labelCol);
for (var colI = 0; colI < 36; colI++) {
var decanCol = document.createElement('col');
decanCol.style.width = '20px';
colgroup.appendChild(decanCol);
}
var actionCol = document.createElement('col');
actionCol.style.width = '22px';
colgroup.appendChild(actionCol);
table.appendChild(colgroup);

var thead = document.createElement('thead');
var monthRow = document.createElement('tr');
var orderCornerTh = document.createElement('th');
orderCornerTh.rowSpan = 2;
monthRow.appendChild(orderCornerTh);
var cornerTh = document.createElement('th');
cornerTh.rowSpan = 2;
monthRow.appendChild(cornerTh);
MONTH_LABELS_FROM_APRIL.forEach(function(label) {
var th = document.createElement('th');
th.colSpan = 3;
th.className = 'smc54-plan-month-th';
th.textContent = label;
monthRow.appendChild(th);
});
var actionCornerTh = document.createElement('th');
actionCornerTh.rowSpan = 2;
monthRow.appendChild(actionCornerTh);
thead.appendChild(monthRow);

var decanRow = document.createElement('tr');
for (var m = 0; m < 12; m++) {
DECAN_LABELS.forEach(function(label) {
var th = document.createElement('th');
th.className = 'smc54-plan-decan-th';
th.textContent = label;
decanRow.appendChild(th);
});
}
thead.appendChild(decanRow);
table.appendChild(thead);

var tbody = document.createElement('tbody');

// 案件名（FIELD_KOJI）が同じレコードは同じ「項目」としてグルーピングし、1項目内に
// 複数のガントバー（レコード）をぶら下げられるようにする。並び順は各項目の中で
// 最初に登場したレコードの表示順に従う（planRecordsは既に表示順でソート済み）。
var groupMap = {};
var groups = [];
planRecords.forEach(function(r) {
var key = r[FIELD_KOJI].value || '';
if (!groupMap[key]) { groupMap[key] = []; groups.push(groupMap[key]); }
groupMap[key].push(r);
});

groups.forEach(function(groupRecs, groupIdx) {
var groupRowCells = []; // 罫線制御用：各行（線）で作った個別td/actionTdをまとめておく
groupRecs.forEach(function(r, lineIdx) {
var tr = document.createElement('tr');
var thisRowCells = [];

if (lineIdx === 0) {
var orderTd = document.createElement('td');
orderTd.className = 'smc54-plan-order-td';
orderTd.rowSpan = groupRecs.length;

var orderWrap = document.createElement('span');
orderWrap.className = 'smc54-plan-row-order';
var upBtn = document.createElement('button');
upBtn.type = 'button';
upBtn.textContent = '▲';
upBtn.title = '前へ';
upBtn.disabled = groupIdx === 0;
upBtn.addEventListener('click', function(e) {
e.stopPropagation();
swapPlanGroupOrder(groups, groupIdx, groupIdx - 1, refreshAll);
});
var downBtn = document.createElement('button');
downBtn.type = 'button';
downBtn.textContent = '▼';
downBtn.title = '次へ';
downBtn.disabled = groupIdx === groups.length - 1;
downBtn.addEventListener('click', function(e) {
e.stopPropagation();
swapPlanGroupOrder(groups, groupIdx, groupIdx + 1, refreshAll);
});
orderWrap.appendChild(upBtn);
orderWrap.appendChild(downBtn);
orderTd.appendChild(orderWrap);
tr.appendChild(orderTd);

var labelTd = document.createElement('td');
labelTd.className = 'smc54-plan-row-label';
labelTd.rowSpan = groupRecs.length;

// td自体にdisplay:flexを指定すると「表セルとして扱われなくなり」rowSpanでの
// 行結合が効かなくなる（ブラウザのテーブルレイアウトから外れてしまう）ため、
// tdは通常のtable-cellのままにし、中身をflexの内側divでレイアウトする。
var labelInner = document.createElement('div');
labelInner.className = 'smc54-plan-row-label-inner';

var labelText = document.createElement('span');
labelText.className = 'smc54-plan-row-name';
labelText.textContent = r[FIELD_KOJI].value || '（項目未入力）';
labelText.title = 'クリックして項目名を編集';
labelText.addEventListener('click', function(e) {
e.stopPropagation();
var curName = groupRecs[0][FIELD_KOJI].value || '';
var editInput = document.createElement('input');
editInput.type = 'text';
editInput.className = 'smc54-plan-row-name-edit';
editInput.value = curName;
labelInner.replaceChild(editInput, labelText);
editInput.focus();
editInput.select();
var done = false;
function commit() {
if (done) return;
done = true;
var newName = editInput.value.trim();
if (!newName || newName === curName) { refreshAll(); return; }
renamePlanGroup(groupRecs, newName, refreshAll);
}
editInput.addEventListener('blur', commit);
editInput.addEventListener('keydown', function(ev) {
if (ev.key === 'Enter') { ev.preventDefault(); editInput.blur(); }
if (ev.key === 'Escape') { done = true; refreshAll(); }
});
});
labelInner.appendChild(labelText);

var addLineBtn = document.createElement('button');
addLineBtn.type = 'button';
addLineBtn.className = 'smc54-plan-row-addline';
addLineBtn.textContent = '＋';
addLineBtn.title = 'この項目にガントチャート線を追加';
addLineBtn.addEventListener('click', function(e) {
e.stopPropagation();
var order = groupRecs[0][FIELD_ORDER].value || '0';
createPlanRecord(groupRecs[0][FIELD_KOJI].value, order, refreshAll);
});
labelInner.appendChild(addLineBtn);
labelTd.appendChild(labelInner);

tr.appendChild(labelTd);
}

var startIdx = fiscalDecanIndex(r[FIELD_START_DATE].value, fiscalYear);
var endIdx = fiscalDecanIndex(r[FIELD_DATE].value, fiscalYear);
if (startIdx !== null && endIdx !== null && endIdx < startIdx) {
var tmp = startIdx; startIdx = endIdx; endIdx = tmp;
}

// バーがある区間は1つのtd(colspan)にまとめてテキストを表示し、それ以外は
// 個別のtd（旬ごと）としてドラッグで期間選択できるようにする。
var cellsByIdx = {}; // 個別セルのみ（バー区間は含まない）
var barText = r[FIELD_DETAIL].value || '';
var idx = 0;
while (idx < 36) {
if (startIdx !== null && endIdx !== null && idx === startIdx) {
var barTd = document.createElement('td');
barTd.className = 'smc54-plan-cell smc54-plan-bar-cell';
barTd.colSpan = endIdx - startIdx + 1;
var bar = document.createElement('div');
bar.className = 'smc54-plan-bar';
bar.style.background = BAR_COLORS[r[FIELD_BAR_COLOR].value] || BAR_COLORS[BAR_COLOR_DEFAULT];
bar.title = (r[FIELD_KOJI].value || '') + '（' + decanLabel(startIdx) + '〜' + decanLabel(endIdx) + '）' + (barText ? '：' + barText : '');
bar.textContent = barText;
bar.addEventListener('click', function(e) {
e.stopPropagation();
openPlanModal(r, startIdx, endIdx, fiscalYear, refreshAll);
});
barTd.appendChild(bar);
tr.appendChild(barTd);
thisRowCells.push(barTd);
idx = endIdx + 1;
} else {
var td = document.createElement('td');
td.className = 'smc54-plan-cell';
tr.appendChild(td);
cellsByIdx[idx] = td;
thisRowCells.push(td);
idx++;
}
}

// ドラッグで期間選択：セルをmousedownしてから他のセルへmousemoveし、mouseupで確定する。
var dragStartIdx = null;
var dragCurIdx = null;

function clearHighlight() {
Object.keys(cellsByIdx).forEach(function(k) { cellsByIdx[k].classList.remove('smc54-plan-cell-dragging'); });
}
function applyHighlight() {
if (dragStartIdx === null || dragCurIdx === null) return;
var lo = Math.min(dragStartIdx, dragCurIdx);
var hi = Math.max(dragStartIdx, dragCurIdx);
clearHighlight();
for (var k = lo; k <= hi; k++) { if (cellsByIdx[k]) cellsByIdx[k].classList.add('smc54-plan-cell-dragging'); }
}
function onMouseUp() {
document.removeEventListener('mousemove', onMouseMoveDoc);
document.removeEventListener('mouseup', onMouseUp);
clearHighlight();
if (dragStartIdx === null || dragCurIdx === null) return;
var lo = Math.min(dragStartIdx, dragCurIdx);
var hi = Math.max(dragStartIdx, dragCurIdx);
dragStartIdx = null;
dragCurIdx = null;
openPlanModal(r, lo, hi, fiscalYear, refreshAll);
}
function onMouseMoveDoc(e) {
var el = document.elementFromPoint(e.clientX, e.clientY);
if (!el) return;
var cellEl = el.closest ? el.closest('.smc54-plan-cell') : null;
if (cellEl && cellEl.dataset.idx !== undefined) {
dragCurIdx = Number(cellEl.dataset.idx);
applyHighlight();
}
}

Object.keys(cellsByIdx).forEach(function(k) {
var cell = cellsByIdx[k];
cell.dataset.idx = k;
cell.addEventListener('mousedown', function(e) {
e.preventDefault();
dragStartIdx = Number(k);
dragCurIdx = Number(k);
applyHighlight();
document.addEventListener('mousemove', onMouseMoveDoc);
document.addEventListener('mouseup', onMouseUp);
});
});

var actionTd = document.createElement('td');
actionTd.className = 'smc54-plan-action-td';
var delBtn = document.createElement('button');
delBtn.type = 'button';
delBtn.className = 'smc54-plan-row-del';
delBtn.textContent = '×';
delBtn.title = 'この線を削除';
delBtn.addEventListener('click', function(e) {
e.stopPropagation();
if (!confirm((r[FIELD_KOJI].value || '') + ' の線を削除しますか？')) return;
deleteRecordById(r.$id.value, refreshAll);
});
actionTd.appendChild(delBtn);
tr.appendChild(actionTd);
thisRowCells.push(actionTd);

tbody.appendChild(tr);
groupRowCells.push(thisRowCells);
});

// 同じ項目内（1つの項目に複数のガントチャート線がある場合）の行と行の間だけ
// 横罫線を消す。項目と項目の間の罫線はそのまま残す。
for (var b = 0; b < groupRowCells.length - 1; b++) {
groupRowCells[b].forEach(function(cell) { cell.classList.add('smc54-plan-cell-noborder-bottom'); });
groupRowCells[b + 1].forEach(function(cell) { cell.classList.add('smc54-plan-cell-noborder-top'); });
}
});
table.appendChild(tbody);

scrollWrap.appendChild(table);
section.appendChild(scrollWrap);
root.appendChild(section);
}

// ---------------- 下段：タスク管理 ----------------
function renderTaskSection(root, records, memberNames) {
var taskRecords = records.filter(function(r) { return r[FIELD_TYPE].value === TASK_TYPE; });

var section = document.createElement('div');
section.className = 'smc54-section';

var head = document.createElement('div');
head.className = 'smc54-head smc54-head-task';
head.innerHTML = '<h3>タスク管理</h3>';
var addBtn = document.createElement('button');
addBtn.className = 'smc54-ghost-btn';
addBtn.textContent = '＋ タスクを追加';
head.appendChild(addBtn);
section.appendChild(head);

var form = document.createElement('div');
form.className = 'smc54-add-form';
form.innerHTML =
'<select id="smc54-task-member"></select>' +
'<input type="text" id="smc54-task-koji" placeholder="案件">' +
'<input type="text" id="smc54-task-detail" placeholder="詳細">' +
'<input type="date" id="smc54-task-date">' +
'<select id="smc54-task-pri"><option value="高">優先度：高</option><option value="中">優先度：中</option><option value="低" selected>優先度：低</option></select>' +
'<button type="button" id="smc54-task-add-btn">追加</button>';
section.appendChild(form);

var filterStrip = document.createElement('div');
filterStrip.className = 'smc54-filter-strip';

var memberCounts = {};
taskRecords.forEach(function(r) {
var m = r[FIELD_MEMBER].value || '（未設定）';
memberCounts[m] = (memberCounts[m] || 0) + 1;
});
var allMembers = memberNames.slice();
Object.keys(memberCounts).forEach(function(m) { if (allMembers.indexOf(m) === -1) allMembers.push(m); });

if (activeTaskMember !== '__all__' && allMembers.indexOf(activeTaskMember) === -1) {
activeTaskMember = '__all__';
}

var allChip = document.createElement('button');
allChip.className = 'smc54-filter-chip' + (activeTaskMember === '__all__' ? ' active' : '');
allChip.setAttribute('data-member', '__all__');
allChip.textContent = '全件（' + taskRecords.length + '）';
filterStrip.appendChild(allChip);

allMembers.forEach(function(name) {
var chip = document.createElement('button');
chip.className = 'smc54-filter-chip' + (activeTaskMember === name ? ' active' : '');
chip.setAttribute('data-member', name);
chip.textContent = name + '（' + (memberCounts[name] || 0) + '）';
filterStrip.appendChild(chip);
});

section.appendChild(filterStrip);

var body = document.createElement('div');
body.className = 'smc54-task-body';

var panel = document.createElement('div');
panel.className = 'smc54-task-panel';
panel.innerHTML =
'<div class="smc54-col-heads"><span>優先度</span><span>案件</span><span>詳細</span><span>期限</span><span>進捗状況</span><span></span></div>';

function renderTaskRowView(row, r) {
row.className = 'smc54-task-row';
row.setAttribute('data-member', r[FIELD_MEMBER].value || '（未設定）');
row.innerHTML =
'<span class="smc54-pri ' + (PRI_CLASS[r[FIELD_PRIORITY].value] || 'low') + '">' + (r[FIELD_PRIORITY].value || '低') + '</span>' +
'<div><div class="smc54-task-title">' + (r[FIELD_KOJI].value || '（案件未入力）') + '</div><div class="smc54-task-sub">' + (r[FIELD_MEMBER].value || '') + '</div></div>' +
'<div class="smc54-task-detail">' + (r[FIELD_DETAIL].value || '') + '</div>' +
'<div class="smc54-due">' + formatDueDate(r[FIELD_DATE].value) + '</div>' +
'<input class="smc54-status-input" value="' + (r[FIELD_STATUS].value || '') + '">' +
'<div class="smc54-row-actions">' +
'<button class="smc54-edit-btn" title="編集">✎</button>' +
'<button class="smc54-del-btn" title="削除">🗑</button>' +
'</div>';

var statusInput = row.querySelector('.smc54-status-input');
statusInput.addEventListener('change', function() {
var rec = {};
rec[FIELD_STATUS] = { value: statusInput.value };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.app.getId(),
id: r.$id.value,
record: rec
});
});

row.querySelector('.smc54-del-btn').addEventListener('click', function() {
if (!confirm('このタスクを削除しますか？')) return;
deleteRecordById(r.$id.value, function() { refreshAll(); });
});

row.querySelector('.smc54-edit-btn').addEventListener('click', function() {
renderTaskRowEdit(row, r);
});
}

function renderTaskRowEdit(row, r) {
row.className = 'smc54-task-edit-form';
row.removeAttribute('data-member');
var memberOptions = allMembers.map(function(n) {
return '<option value="' + n + '"' + (n === r[FIELD_MEMBER].value ? ' selected' : '') + '>' + n + '</option>';
}).join('');
// 表示画面の「案件」列は案件名＋担当者を1セルにまとめている（smc54-task-title/-sub）。
// 編集フォームも同じ列構成に合わせ、案件名入力欄と担当者選択欄を「案件」列の中で
// 縦に並べる。こうしないと編集時だけ列が1つずつズレて見えてしまう。
row.innerHTML =
'<select class="smc54-edit-pri"><option value="高">高</option><option value="中">中</option><option value="低">低</option></select>' +
'<div class="smc54-edit-koji-wrap">' +
'<input type="text" class="smc54-edit-koji" value="' + (r[FIELD_KOJI].value || '').replace(/"/g, '&quot;') + '" placeholder="案件">' +
'<select class="smc54-edit-member">' + memberOptions + '</select>' +
'</div>' +
'<input type="text" class="smc54-edit-detail" value="' + (r[FIELD_DETAIL].value || '').replace(/"/g, '&quot;') + '" placeholder="詳細">' +
'<input type="date" class="smc54-edit-date" value="' + (r[FIELD_DATE].value || '') + '">' +
'<span></span>' +
'<div class="smc54-edit-btn-row"><button type="button" class="smc54-save-btn">保存</button><button type="button" class="smc54-cancel-btn">キャンセル</button></div>';
row.querySelector('.smc54-edit-pri').value = r[FIELD_PRIORITY].value || '低';

row.querySelector('.smc54-cancel-btn').addEventListener('click', function() {
renderTaskRowView(row, r);
});
row.querySelector('.smc54-save-btn').addEventListener('click', function() {
var member = row.querySelector('.smc54-edit-member').value;
var koji = row.querySelector('.smc54-edit-koji').value.trim();
var date = row.querySelector('.smc54-edit-date').value;
var detail = row.querySelector('.smc54-edit-detail').value.trim();
var pri = row.querySelector('.smc54-edit-pri').value;
if (!member || !koji) { alert('担当者と案件を入力してください'); return; }
var record = {};
record[FIELD_MEMBER] = { value: member };
record[FIELD_KOJI] = { value: koji };
record[FIELD_DATE] = { value: date };
record[FIELD_DETAIL] = { value: detail };
record[FIELD_PRIORITY] = { value: pri };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.app.getId(),
id: r.$id.value,
record: record
}).then(function() { refreshAll(); });
});
}

var list = document.createElement('div');
list.id = 'smc54-task-list';
taskRecords.forEach(function(r) {
var row = document.createElement('div');
renderTaskRowView(row, r);
if (activeTaskMember !== '__all__' && (r[FIELD_MEMBER].value || '（未設定）') !== activeTaskMember) {
row.style.display = 'none';
}
list.appendChild(row);
});
panel.appendChild(list);
body.appendChild(panel);
section.appendChild(body);
root.appendChild(section);

filterStrip.addEventListener('click', function(e) {
var chip = e.target.closest('.smc54-filter-chip');
if (!chip) return;
filterStrip.querySelectorAll('.smc54-filter-chip').forEach(function(c) { c.classList.remove('active'); });
chip.classList.add('active');
var member = chip.getAttribute('data-member');
activeTaskMember = member;
list.querySelectorAll('.smc54-task-row').forEach(function(row) {
row.style.display = (member === '__all__' || row.getAttribute('data-member') === member) ? '' : 'none';
});
});

addBtn.addEventListener('click', function() {
form.classList.toggle('open');
var sel = document.getElementById('smc54-task-member');
sel.innerHTML = '';
var blankOpt = document.createElement('option');
blankOpt.value = ''; blankOpt.textContent = '（担当者を選択）';
sel.appendChild(blankOpt);
allMembers.forEach(function(n) {
var opt = document.createElement('option');
opt.value = n; opt.textContent = n;
sel.appendChild(opt);
});
sel.value = (activeTaskMember !== '__all__' && allMembers.indexOf(activeTaskMember) !== -1) ? activeTaskMember : '';
});

document.getElementById('smc54-task-add-btn').addEventListener('click', function() {
var member = document.getElementById('smc54-task-member').value;
var koji = document.getElementById('smc54-task-koji').value.trim();
var detail = document.getElementById('smc54-task-detail').value.trim();
var date = document.getElementById('smc54-task-date').value;
var pri = document.getElementById('smc54-task-pri').value;
if (!member || !koji) { alert('担当者と案件を入力してください'); return; }
var record = {};
record[FIELD_TYPE] = { value: TASK_TYPE };
record[FIELD_MEMBER] = { value: member };
record[FIELD_KOJI] = { value: koji };
record[FIELD_DETAIL] = { value: detail };
record[FIELD_DATE] = { value: date };
record[FIELD_PRIORITY] = { value: pri };
record[FIELD_STATUS] = { value: '（未着手）' };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: kintone.app.getId(),
record: record
}).then(function() {
refreshAll();
});
});
}

function mountRoot() {
var toolbar = document.querySelector('.gaia-argoui-app-index-toolbar');
var root = document.createElement('div');
root.id = 'smc54-root';
if (toolbar && toolbar.parentNode) {
toolbar.parentNode.insertBefore(root, toolbar.nextSibling);
} else {
var space = kintone.app.getHeaderMenuSpaceElement();
if (space) space.appendChild(root);
}
return root;
}

function loadAndRender(root) {
root.innerHTML = '';
var loading = document.createElement('div');
loading.textContent = '読み込み中…';
loading.style.padding = '12px 16px';
root.appendChild(loading);

fetchAllRecords(function(records) {
root.innerHTML = '';
var memberRecords = records.filter(function(r) { return r[FIELD_TYPE].value === MEMBER_TYPE; });

// メンバー登録の表示順（app54のメンバー登録欄で▲▼設定した順）に合わせる。
// 登録欄には無いがタスク・予定にだけ名前がある担当者は、末尾に五十音順で追加する。
var registeredSorted = memberRecords.slice().sort(function(a, b) {
var oa = a[FIELD_ORDER].value === '' ? Infinity : Number(a[FIELD_ORDER].value);
var ob = b[FIELD_ORDER].value === '' ? Infinity : Number(b[FIELD_ORDER].value);
if (oa !== ob) return oa - ob;
return a[FIELD_MEMBER].value.localeCompare(b[FIELD_MEMBER].value, 'ja');
});
var memberNames = registeredSorted.map(function(r) { return r[FIELD_MEMBER].value; });
var seen = {};
memberNames.forEach(function(n) { seen[n] = true; });
var extraNames = [];
records.forEach(function(r) {
if (r[FIELD_TYPE].value !== MEMBER_TYPE && r[FIELD_MEMBER].value && !seen[r[FIELD_MEMBER].value]) {
seen[r[FIELD_MEMBER].value] = true;
extraNames.push(r[FIELD_MEMBER].value);
}
});
extraNames.sort(function(a, b) { return a.localeCompare(b, 'ja'); });
memberNames = memberNames.concat(extraNames);

renderRosterSection(root, memberRecords, memberNames, records);
renderAnnualPlanSection(root, records);
renderTaskSection(root, records, memberNames);
});
}

// ページ全体をリロードする代わりに、既存の#smc54-rootだけをデータごと再構築する。
// タスクの担当者タブ選択（activeTaskMember）は再構築後も維持される。
function refreshAll() {
var root = document.getElementById('smc54-root');
if (root) loadAndRender(root);
}

kintone.events.on('app.record.index.show', function(event) {
applyStyle();
if (document.getElementById('smc54-root')) return event;
loadAndRender(mountRoot());
return event;
});
})();
