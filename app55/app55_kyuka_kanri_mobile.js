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
var APP_MEMBER_SOURCE = 54;

function fetchMemberNames(cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_MEMBER_SOURCE,
query: 'limit 500',
fields: ['種別', '担当者', '表示順']
}).then(function(resp) {
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
app: kintone.mobile.app.getId(),
query: 'order by 作成日時 asc limit 500',
fields: ['$id', FIELD_TYPE, FIELD_MEMBER, FIELD_DATE, FIELD_END_DATE, FIELD_TIME]
}).then(function(resp) {
cb(resp.records);
});
}

function deleteRecordById(id, cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'DELETE', {
app: kintone.mobile.app.getId(),
ids: [id]
}).then(cb);
}

function applyStyle() {
if (document.getElementById('smc55m-style')) return;
var style = document.createElement('style');
style.id = 'smc55m-style';
style.textContent =
'table.recordlist-gaia { display: none !important; }' +
'.gaia-mobile-v2-app-index-recordlist-table-wrapper { display: none !important; }' +
'#smc55m-root { font-size: 14px; width: 100%; }' +
'#smc55m-root * { box-sizing: border-box; }' +
'.smc55m-section { border: 1px solid #dce2db; border-radius: 10px; margin: 10px; background: #fff; overflow: hidden; }' +
'.smc55m-head { padding: 12px; border-left: 4px solid #3a6ea5; background: #e2ecf7; }' +
'.smc55m-head h3 { margin: 0; font-size: 14px; }' +
'.smc55m-member-block { border-bottom: 1px solid #eee; padding: 10px 12px; }' +
'.smc55m-member-block:last-child { border-bottom: none; }' +
'.smc55m-member-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }' +
'.smc55m-member-name { font-weight: 700; font-size: 14.5px; color: #2b332d; }' +
'.smc55m-add-btn { flex: none; border: 1px solid #ccc; background: #fff; color: #2b332d; border-radius: 8px; padding: 7px 12px; font-size: 12.5px; }' +
'.smc55m-card-list { display: flex; flex-direction: column; gap: 8px; }' +
'.smc55m-leave-card { position: relative; border: 1px solid #dce2db; border-radius: 10px; padding: 10px 12px; }' +
'.smc55m-leave-card.expired { opacity: 0.55; }' +
'.smc55m-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 100px; }' +
'.smc55m-badge.holiday { background: #f6e2de; color: #b23a2e; }' +
'.smc55m-badge.training { background: #e3efea; color: #2f6f63; }' +
'.smc55m-badge.outing { background: #fdf1c0; color: #9c7a0a; }' +
'.smc55m-leave-row { font-size: 13px; padding-right: 70px; }' +
'.smc55m-leave-row-type { padding-right: 0; }' +
'.smc55m-leave-row-period { color: #2b332d; font-weight: 700; white-space: nowrap; overflow: hidden; display: block; margin-top: 4px; }' +
'.smc55m-leave-row-time { color: #8b968e; word-break: break-word; margin-top: 4px; }' +
'.smc55m-leave-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; }' +
'.smc55m-icon-btn { border: none; background: #f7f8f5; cursor: pointer; font-size: 14px; padding: 6px 8px; border-radius: 6px; }' +
'.smc55m-icon-btn.del { color: #b23a2e; }' +
'.smc55m-edit-form, .smc55m-add-form { display: flex; flex-direction: column; gap: 8px; }' +
'.smc55m-edit-form input, .smc55m-edit-form select,' +
'.smc55m-add-form input, .smc55m-add-form select { font-size: 14px; padding: 10px; border: 1px solid #dce2db; border-radius: 8px; width: 100%; }' +
'.smc55m-add-form { display: none; padding: 10px 0 4px; }' +
'.smc55m-add-form.open { display: flex; }' +
'.smc55m-edit-btn-row { display: flex; gap: 8px; }' +
'.smc55m-edit-btn-row button { flex: 1; border: none; border-radius: 8px; padding: 10px 0; font-weight: 700; }' +
'.smc55m-save-btn { background: #2f6f63; color: #fff; }' +
'.smc55m-cancel-btn { background: #eef0ea; color: #5b665f; }';
document.head.appendChild(style);
}

function badge(type) {
return '<span class="smc55m-badge ' + (TYPE_BADGE_CLASS[type] || '') + '">' + type + '</span>';
}

// 期間の行は改行せず、枠に収まるまでフォントサイズを縮めて1行に収める。
function shrinkToFit(el, minSize) {
var size = parseFloat(getComputedStyle(el).fontSize);
minSize = minSize || 9;
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
'<div class="smc55m-leave-actions">' +
'<button type="button" class="smc55m-icon-btn edit" title="編集">✎</button>' +
'<button type="button" class="smc55m-icon-btn del" title="削除">✕</button>' +
'</div>' +
'<div class="smc55m-leave-row smc55m-leave-row-type">' + badge(r[FIELD_TYPE].value) + '</div>' +
'<div class="smc55m-leave-row smc55m-leave-row-period">' + periodStr + '</div>' +
'<div class="smc55m-leave-row smc55m-leave-row-time">' + (timeStr || '（メモなし）') + '</div>';

card.querySelector('.smc55m-icon-btn.del').addEventListener('click', function() {
if (!confirm('この予定を削除しますか？')) return;
deleteRecordById(r.$id.value, onChange);
});
card.querySelector('.smc55m-icon-btn.edit').addEventListener('click', function() {
renderCardEdit(card, r, onChange);
});
}

function renderCardEdit(card, r, onChange) {
card.innerHTML =
'<div class="smc55m-edit-form">' +
'<select class="smc55m-edit-type"><option value="休暇">休暇</option><option value="研修">研修</option><option value="外出">外出</option></select>' +
'<input type="date" class="smc55m-edit-date" value="' + (r[FIELD_DATE].value || '') + '">' +
'<input type="date" class="smc55m-edit-end-date" value="' + (r[FIELD_END_DATE].value || '') + '">' +
'<input type="text" class="smc55m-edit-time" placeholder="時間帯・メモ" value="' + (r[FIELD_TIME].value || '').replace(/"/g, '&quot;') + '">' +
'<div class="smc55m-edit-btn-row"><button type="button" class="smc55m-save-btn">保存</button><button type="button" class="smc55m-cancel-btn">キャンセル</button></div>' +
'</div>';
card.querySelector('.smc55m-edit-type').value = r[FIELD_TYPE].value;

card.querySelector('.smc55m-cancel-btn').addEventListener('click', function() {
renderCardView(card, r, onChange);
});
card.querySelector('.smc55m-save-btn').addEventListener('click', function() {
var type = card.querySelector('.smc55m-edit-type').value;
var date = card.querySelector('.smc55m-edit-date').value;
var endDate = card.querySelector('.smc55m-edit-end-date').value;
var time = card.querySelector('.smc55m-edit-time').value.trim();
if (!date) { alert('日付を入力してください'); return; }
if (endDate && endDate < date) { alert('入力エラー：終了日は開始日より前の日付にできません'); return; }
var record = {};
record[FIELD_TYPE] = { value: type };
record[FIELD_DATE] = { value: date };
record[FIELD_END_DATE] = { value: endDate || date };
record[FIELD_TIME] = { value: time };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.mobile.app.getId(),
id: r.$id.value,
record: record
}).then(onChange);
});
}

function renderMemberBlock(root, memberName, records, onChange) {
var todayStr = new Date().toISOString().slice(0, 10);
var memberRecords = records.filter(function(r) {
return LEAVE_TYPES.indexOf(r[FIELD_TYPE].value) !== -1 && r[FIELD_MEMBER].value === memberName;
});
memberRecords.sort(function(a, b) {
var da = a[FIELD_DATE].value || '';
var db = b[FIELD_DATE].value || '';
return da < db ? -1 : da > db ? 1 : 0;
});

var block = document.createElement('div');
block.className = 'smc55m-member-block';

var top = document.createElement('div');
top.className = 'smc55m-member-top';
var nameSpan = document.createElement('span');
nameSpan.className = 'smc55m-member-name';
nameSpan.textContent = memberName;
top.appendChild(nameSpan);
var addBtn = document.createElement('button');
addBtn.type = 'button';
addBtn.className = 'smc55m-add-btn';
addBtn.textContent = '＋ 追加';
top.appendChild(addBtn);
block.appendChild(top);

var addForm = document.createElement('div');
addForm.className = 'smc55m-add-form';
addForm.innerHTML =
'<select class="smc55m-new-type"><option value="休暇">休暇</option><option value="研修">研修</option><option value="外出">外出</option></select>' +
'<input type="date" class="smc55m-new-date">' +
'<input type="date" class="smc55m-new-end-date">' +
'<input type="text" class="smc55m-new-time" placeholder="時間帯・メモ">' +
'<div class="smc55m-edit-btn-row"><button type="button" class="smc55m-new-save-btn">追加</button><button type="button" class="smc55m-new-cancel-btn">キャンセル</button></div>';
block.appendChild(addForm);

addBtn.addEventListener('click', function() {
addForm.classList.toggle('open');
});
addForm.querySelector('.smc55m-new-cancel-btn').addEventListener('click', function() {
addForm.classList.remove('open');
});
addForm.querySelector('.smc55m-new-save-btn').addEventListener('click', function() {
var type = addForm.querySelector('.smc55m-new-type').value;
var date = addForm.querySelector('.smc55m-new-date').value;
var endDate = addForm.querySelector('.smc55m-new-end-date').value;
var time = addForm.querySelector('.smc55m-new-time').value.trim();
if (!date) { alert('日付を入力してください'); return; }
if (endDate && endDate < date) { alert('入力エラー：終了日は開始日より前の日付にできません'); return; }
var record = {};
record[FIELD_TYPE] = { value: type };
record[FIELD_MEMBER] = { value: memberName };
record[FIELD_DATE] = { value: date };
record[FIELD_END_DATE] = { value: endDate || date };
record[FIELD_TIME] = { value: time };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: kintone.mobile.app.getId(),
record: record
}).then(onChange);
});

var list = document.createElement('div');
list.className = 'smc55m-card-list';
memberRecords.forEach(function(r) {
var card = document.createElement('div');
card.className = 'smc55m-leave-card';
var endDateStr = r[FIELD_END_DATE].value || r[FIELD_DATE].value || '';
if (endDateStr < todayStr) card.classList.add('expired');
renderCardView(card, r, onChange);
list.appendChild(card);
});
block.appendChild(list);

root.appendChild(block);
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
section.className = 'smc55m-section';

var head = document.createElement('div');
head.className = 'smc55m-head';
head.innerHTML = '<h3>不在情報（休暇・研修・外出）</h3>';
section.appendChild(head);

var onChange = function() { loadAndRender(root); };
memberNames.forEach(function(name) {
renderMemberBlock(section, name, records, onChange);
});

root.appendChild(section);

// DOMに接続され実際の幅が確定してから、期間の行を1行に収まるよう縮小する。
setTimeout(function() {
root.querySelectorAll('.smc55m-leave-row-period').forEach(function(el) {
shrinkToFit(el);
});
}, 0);
});
});
}

kintone.events.on('mobile.app.record.index.show', function(event) {
applyStyle();
var space = kintone.mobile.app.getHeaderSpaceElement();
if (!space) return event;
if (document.getElementById('smc55m-root')) return event;

var root = document.createElement('div');
root.id = 'smc55m-root';
space.appendChild(root);

loadAndRender(root);

return event;
});
})();
