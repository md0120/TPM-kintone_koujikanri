(function() {
'use strict';

var FIELD_TYPE = '種別';
var FIELD_MEMBER = '担当者';
var FIELD_DATE = '日付';
var FIELD_END_DATE = '終了日';
var FIELD_TIME = '時間帯';

var LEAVE_TYPES = ['休暇', '研修', '外出'];
var TYPE_BADGE_CLASS = { '休暇': 'holiday', '研修': 'training', '外出': 'outing' };

// メンバー名はapp54（【SMC】⑧チームタスク・不在情報）のメンバー登録・既存レコードから取得する。
// メンバー管理そのものはapp54側に一本化し、こちらは参照するだけ。
var APP_MEMBER_SOURCE = 54;

function fetchMemberNames(cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_MEMBER_SOURCE,
query: 'limit 500',
fields: ['種別', '担当者', '表示順']
}).then(function(resp) {
// app54で管理している「表示順」に従って並べる（app54のメンバー登録欄の▲▼で変更可能）。
// メンバー登録には無いがタスク・予定にだけ名前がある担当者は、末尾に五十音順で追加する。
var registered = [];
var seen = {};
resp.records.forEach(function(r) {
if (r['種別'].value !== 'メンバー') return;
var v = r['担当者'] ? r['担当者'].value : '';
if (v && !seen[v]) {
seen[v] = true;
var order = r['表示順'] && r['表示順'].value !== '' ? Number(r['表示順'].value) : Infinity;
registered.push({ name: v, order: order });
}
});
registered.sort(function(a, b) {
if (a.order !== b.order) return a.order - b.order;
return a.name.localeCompare(b.name, 'ja');
});
var names = registered.map(function(x) { return x.name; });
var extra = [];
resp.records.forEach(function(r) {
var v = r['担当者'] ? r['担当者'].value : '';
if (v && !seen[v]) { seen[v] = true; extra.push(v); }
});
extra.sort();
cb(names.concat(extra));
});
}

function fetchAllRecords(cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: 'order by 作成日時 asc limit 500',
fields: ['$id', FIELD_TYPE, FIELD_MEMBER, FIELD_DATE, FIELD_END_DATE, FIELD_TIME]
}).then(function(resp) {
cb(resp.records);
});
}

function deleteRecordById(id, cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'DELETE', {
app: kintone.app.getId(),
ids: [id]
}).then(cb);
}

function applyStyle() {
if (document.getElementById('smc55-style')) return;
var style = document.createElement('style');
style.id = 'smc55-style';
style.textContent =
'table.recordlist-gaia { display: none !important; }' +
'#smc55-root { font-size: 13px; width: 100%; }' +
'#smc55-root * { box-sizing: border-box; }' +
'.smc55-section { border: 1px solid #dce2db; border-radius: 10px; margin: 12px 16px; background: #fff; overflow: hidden; }' +
'.smc55-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 10px 10px; border-bottom: 1px solid #dce2db; background: #e2ecf7; border-left: 4px solid #3a6ea5; }' +
'.smc55-head h3 { margin: 0; font-size: 13px; }' +
'.smc55-member-row { display: flex; border-bottom: 1px solid #eee; }' +
'.smc55-member-row:last-child { border-bottom: none; }' +
'.smc55-member-label { flex: none; width: 90px; padding: 10px; font-weight: 700; font-size: 12.5px; color: #2b332d; background: #f7f8f5; border-right: 1px solid #dce2db; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 6px; }' +
'.smc55-member-body { flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 12px; overflow-x: auto; }' +
'.smc55-add-btn { flex: none; border: 1px solid #ccc; background: #fff; color: #2b332d; border-radius: 6px; padding: 5px 8px; font-size: 11px; cursor: pointer; white-space: nowrap; }' +
'.smc55-leave-card { position: relative; flex: none; width: 171px; border: 1px solid #dce2db; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }' +
'.smc55-leave-card.expired { opacity: 0.55; }' +
'.smc55-badge { display: inline-block; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 100px; width: fit-content; }' +
'.smc55-badge.holiday { background: #f6e2de; color: #b23a2e; }' +
'.smc55-badge.training { background: #e3efea; color: #2f6f63; }' +
'.smc55-badge.outing { background: #fdf1c0; color: #9c7a0a; }' +
'.smc55-leave-row { font-size: 11.5px; }' +
'.smc55-leave-row-period { color: #2b332d; font-weight: 700; white-space: nowrap; overflow: hidden; display: block; transform-origin: left center; }' +
'.smc55-leave-row-time { color: #8b968e; word-break: break-word; }' +
'.smc55-leave-actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 2px; }' +
'.smc55-leave-edit, .smc55-leave-del { border: none; background: none; cursor: pointer; font-size: 12px; padding: 2px 4px; border-radius: 4px; }' +
'.smc55-leave-edit { color: #5b665f; }' +
'.smc55-leave-edit:hover { background: #eef0ea; }' +
'.smc55-leave-del { color: #b23a2e; }' +
'.smc55-leave-del:hover { background: #f6e2de; }' +
'.smc55-leave-edit-form { display: flex; flex-direction: column; gap: 5px; width: 220px; flex: none; }' +
'.smc55-add-form-inline { display: flex; flex-direction: column; gap: 5px; width: 132px; flex: none; }' +
'.smc55-leave-edit-form input, .smc55-leave-edit-form select,' +
'.smc55-add-form-inline input, .smc55-add-form-inline select { font-size: 11.5px; padding: 4px 6px; border: 1px solid #dce2db; border-radius: 5px; width: 100%; }' +
'.smc55-edit-btn-row { display: flex; gap: 6px; margin-top: 2px; }' +
'.smc55-edit-btn-row button { flex: 1; border: none; border-radius: 5px; padding: 5px 0; font-size: 11.5px; font-weight: 700; cursor: pointer; }' +
'.smc55-save-btn { background: #2f6f63; color: #fff; }' +
'.smc55-cancel-btn { background: #eef0ea; color: #5b665f; }';
document.head.appendChild(style);
}

function badge(type) {
return '<span class="smc55-badge ' + (TYPE_BADGE_CLASS[type] || '') + '">' + type + '</span>';
}

// 期間の行は改行せず、枠に収まるまでフォントサイズを縮めて1行に収める。
function shrinkToFit(el, minSize) {
var size = parseFloat(getComputedStyle(el).fontSize);
minSize = minSize || 8;
var guard = 0;
while (el.scrollWidth > el.clientWidth && size > minSize && guard < 30) {
size -= 0.5;
el.style.fontSize = size + 'px';
guard++;
}
}

function renderCardView(card, r, onChange) {
var dateStr = r[FIELD_DATE].value || '';
var endDateStr = r[FIELD_END_DATE].value || '';
var periodStr = dateStr + (endDateStr && endDateStr !== dateStr ? '〜' + endDateStr : '');
var timeStr = r[FIELD_TIME].value || '';
card.innerHTML =
'<div class="smc55-leave-actions">' +
'<button type="button" class="smc55-leave-edit" title="編集">✎</button>' +
'<button type="button" class="smc55-leave-del" title="削除">✕</button>' +
'</div>' +
'<div class="smc55-leave-row smc55-leave-row-type">' + badge(r[FIELD_TYPE].value) + '</div>' +
'<div class="smc55-leave-row smc55-leave-row-period">' + periodStr + '</div>' +
'<div class="smc55-leave-row smc55-leave-row-time">' + (timeStr || '（メモなし）') + '</div>';

card.querySelector('.smc55-leave-del').addEventListener('click', function() {
if (!confirm('この予定を削除しますか？')) return;
deleteRecordById(r.$id.value, onChange);
});
card.querySelector('.smc55-leave-edit').addEventListener('click', function() {
renderCardEdit(card, r, onChange);
});
}

function renderCardEdit(card, r, onChange) {
card.innerHTML =
'<div class="smc55-leave-edit-form">' +
'<select class="smc55-edit-type"><option value="休暇">休暇</option><option value="研修">研修</option><option value="外出">外出</option></select>' +
'<input type="date" class="smc55-edit-date" value="' + (r[FIELD_DATE].value || '') + '">' +
'<input type="date" class="smc55-edit-end-date" value="' + (r[FIELD_END_DATE].value || '') + '">' +
'<input type="text" class="smc55-edit-time" placeholder="時間帯・メモ" value="' + (r[FIELD_TIME].value || '').replace(/"/g, '&quot;') + '">' +
'<div class="smc55-edit-btn-row">' +
'<button type="button" class="smc55-save-btn">保存</button>' +
'<button type="button" class="smc55-cancel-btn">キャンセル</button>' +
'</div>' +
'</div>';
card.querySelector('.smc55-edit-type').value = r[FIELD_TYPE].value;

card.querySelector('.smc55-cancel-btn').addEventListener('click', function() {
renderCardView(card, r, onChange);
});
card.querySelector('.smc55-save-btn').addEventListener('click', function() {
var type = card.querySelector('.smc55-edit-type').value;
var date = card.querySelector('.smc55-edit-date').value;
var endDate = card.querySelector('.smc55-edit-end-date').value;
var time = card.querySelector('.smc55-edit-time').value.trim();
if (!date) { alert('日付を入力してください'); return; }
if (endDate && endDate < date) { alert('入力エラー：終了日は開始日より前の日付にできません'); return; }
var record = {};
record[FIELD_TYPE] = { value: type };
record[FIELD_DATE] = { value: date };
record[FIELD_END_DATE] = { value: endDate || date };
record[FIELD_TIME] = { value: time };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.app.getId(),
id: r.$id.value,
record: record
}).then(onChange);
});
}

function renderMemberRow(root, memberName, records, onChange) {
var todayStr = new Date().toISOString().slice(0, 10);
var memberRecords = records.filter(function(r) {
return LEAVE_TYPES.indexOf(r[FIELD_TYPE].value) !== -1 && r[FIELD_MEMBER].value === memberName;
});
memberRecords.sort(function(a, b) {
var da = a[FIELD_DATE].value || '';
var db = b[FIELD_DATE].value || '';
return da < db ? -1 : da > db ? 1 : 0;
});

var row = document.createElement('div');
row.className = 'smc55-member-row';

// 「＋追加」ボタンはメンバー名の下に配置し、スクロール領域（.smc55-member-body）の
// 外に固定表示する。カードが増えて横スクロールが伸びても押せなくなるのを防ぐため。
var label = document.createElement('div');
label.className = 'smc55-member-label';
var nameSpan = document.createElement('span');
nameSpan.textContent = memberName;
label.appendChild(nameSpan);
var addBtn = document.createElement('button');
addBtn.type = 'button';
addBtn.className = 'smc55-add-btn';
addBtn.textContent = '＋ 追加';
label.appendChild(addBtn);
row.appendChild(label);

var body = document.createElement('div');
body.className = 'smc55-member-body';

var addForm = document.createElement('div');
addForm.className = 'smc55-add-form-inline';
addForm.style.display = 'none';
addForm.innerHTML =
'<select class="smc55-new-type"><option value="休暇">休暇</option><option value="研修">研修</option><option value="外出">外出</option></select>' +
'<input type="date" class="smc55-new-date">' +
'<input type="date" class="smc55-new-end-date">' +
'<input type="text" class="smc55-new-time" placeholder="時間帯・メモ">' +
'<div class="smc55-edit-btn-row"><button type="button" class="smc55-new-save-btn">追加</button><button type="button" class="smc55-new-cancel-btn">キャンセル</button></div>';
body.appendChild(addForm);

addBtn.addEventListener('click', function() {
addForm.style.display = addForm.style.display === 'none' ? 'flex' : 'none';
if (addForm.style.display === 'flex') body.scrollLeft = 0;
});

var firstActiveCard = null;
memberRecords.forEach(function(r) {
var card = document.createElement('div');
card.className = 'smc55-leave-card';
var endDateStr = r[FIELD_END_DATE].value || r[FIELD_DATE].value || '';
if (endDateStr < todayStr) {
card.classList.add('expired');
} else if (!firstActiveCard) {
firstActiveCard = card;
}
renderCardView(card, r, onChange);
body.appendChild(card);
});

addForm.querySelector('.smc55-new-cancel-btn').addEventListener('click', function() {
addForm.style.display = 'none';
});
addForm.querySelector('.smc55-new-save-btn').addEventListener('click', function() {
var type = addForm.querySelector('.smc55-new-type').value;
var date = addForm.querySelector('.smc55-new-date').value;
var endDate = addForm.querySelector('.smc55-new-end-date').value;
var time = addForm.querySelector('.smc55-new-time').value.trim();
if (!date) { alert('日付を入力してください'); return; }
if (endDate && endDate < date) { alert('入力エラー：終了日は開始日より前の日付にできません'); return; }
var record = {};
record[FIELD_TYPE] = { value: type };
record[FIELD_MEMBER] = { value: memberName };
record[FIELD_DATE] = { value: date };
record[FIELD_END_DATE] = { value: endDate || date };
record[FIELD_TIME] = { value: time };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: kintone.app.getId(),
record: record
}).then(onChange);
});

row.appendChild(body);
root.appendChild(row);

if (firstActiveCard) {
setTimeout(function() {
body.scrollLeft = firstActiveCard.offsetLeft;
}, 0);
}
}

function loadAndRender(root) {
root.innerHTML = '';
var loading = document.createElement('div');
loading.textContent = '読み込み中…';
loading.style.padding = '12px 16px';
root.appendChild(loading);

fetchMemberNames(function(memberNames) {
fetchAllRecords(function(records) {
root.innerHTML = '';

var section = document.createElement('div');
section.className = 'smc55-section';

var head = document.createElement('div');
head.className = 'smc55-head';
head.innerHTML = '<h3>不在情報（休暇・研修・外出）</h3>';
section.appendChild(head);

var onChange = function() { loadAndRender(root); };
memberNames.forEach(function(name) {
renderMemberRow(section, name, records, onChange);
});

root.appendChild(section);

// DOMに接続され実際の幅が確定してから、期間の行を1行に収まるよう縮小する。
setTimeout(function() {
root.querySelectorAll('.smc55-leave-row-period').forEach(function(el) {
shrinkToFit(el);
});
}, 0);
});
});
}

function mountRoot() {
var toolbar = document.querySelector('.gaia-argoui-app-index-toolbar');
var root = document.createElement('div');
root.id = 'smc55-root';
if (toolbar && toolbar.parentNode) {
toolbar.parentNode.insertBefore(root, toolbar.nextSibling);
} else {
var space = kintone.app.getHeaderMenuSpaceElement();
if (space) space.appendChild(root);
}
return root;
}

kintone.events.on('app.record.index.show', function(event) {
applyStyle();
if (document.getElementById('smc55-root')) return event;
loadAndRender(mountRoot());
return event;
});
})();
