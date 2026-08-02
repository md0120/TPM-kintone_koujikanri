(function() {
'use strict';

var FIELD_TYPE = '種別';
var FIELD_MEMBER = '担当者';
var FIELD_KOJI = '案件';
var FIELD_DETAIL = '詳細';
var FIELD_DATE = '日付';
var FIELD_END_DATE = '終了日';
var FIELD_TIME = '時間帯';
var FIELD_STATUS = '進捗状況';
var FIELD_PRIORITY = '優先度';

var TASK_TYPE = 'タスク';
var MEMBER_TYPE = 'メンバー';
var PRI_CLASS = { '高': 'high', '中': 'mid', '低': 'low' };

function fetchAllRecords(cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.mobile.app.getId(),
query: 'order by 作成日時 asc limit 500',
fields: ['$id', FIELD_TYPE, FIELD_MEMBER, FIELD_KOJI, FIELD_DETAIL, FIELD_DATE, FIELD_END_DATE, FIELD_TIME, FIELD_STATUS, FIELD_PRIORITY]
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

function formatDueDate(dateStr) {
if (!dateStr) return '';
var parts = dateStr.split('-');
if (parts.length !== 3) return dateStr;
return parts[1] + '/' + parts[2] + 'まで';
}

function applyStyle() {
if (document.getElementById('smc54m-style')) return;
var style = document.createElement('style');
style.id = 'smc54m-style';
style.textContent =
'table.recordlist-gaia { display: none !important; }' +
'.gaia-mobile-v2-app-index-recordlist-table-wrapper { display: none !important; }' +
'#smc54m-root { font-size: 14px; width: 100%; }' +
'#smc54m-root * { box-sizing: border-box; }' +
'.smc54m-section { border: 1px solid #dce2db; border-radius: 10px; margin: 10px; background: #fff; overflow: hidden; }' +
'.smc54m-head { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-left: 4px solid #c7cec9; background: #f7f8f5; }' +
'.smc54m-head h3 { margin: 0; font-size: 14px; }' +
'.smc54m-head-task { background: #e3efea; border-left-color: #2f6f63; }' +
'.smc54m-ghost-btn { font-size: 13px; border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 12px; }' +
'.smc54m-roster-body { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }' +
'.smc54m-roster-chip { display: inline-flex; align-items: center; gap: 6px; background: #eef0ea; border-radius: 100px; padding: 8px 8px 8px 14px; font-size: 13.5px; font-weight: 700; color: #3a453d; }' +
'.smc54m-roster-remove { border: none; background: #fff; color: #b23a2e; font-size: 13px; border-radius: 50%; width: 24px; height: 24px; }' +
'.smc54m-roster-add { display: flex; gap: 8px; padding: 0 12px 12px; }' +
'.smc54m-roster-add input { flex: 1; font-size: 14px; padding: 10px; border: 1px solid #dce2db; border-radius: 8px; }' +
'.smc54m-roster-add button { border: none; background: #2f6f63; color: #fff; font-weight: 700; border-radius: 8px; padding: 0 14px; }' +
'.smc54m-add-form { display: none; flex-direction: column; gap: 8px; padding: 12px; background: #eef0ea; border-bottom: 1px solid #dce2db; }' +
'.smc54m-add-form.open { display: flex; }' +
'.smc54m-add-form input, .smc54m-add-form select { font-size: 14px; padding: 10px; border: 1px solid #dce2db; border-radius: 8px; width: 100%; }' +
'.smc54m-field-label { font-size: 12px; color: #5b665f; font-weight: 700; margin-bottom: -4px; }' +
'.smc54m-add-form button { border: none; background: #2f6f63; color: #fff; font-weight: 700; border-radius: 8px; padding: 10px 0; }' +
'.smc54m-leave-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; }' +
'.smc54m-icon-btn { border: none; background: #f7f8f5; cursor: pointer; font-size: 14px; padding: 6px 8px; border-radius: 6px; }' +
'.smc54m-icon-btn.del { color: #b23a2e; }' +
'.smc54m-edit-btn-row { display: flex; gap: 8px; }' +
'.smc54m-edit-btn-row button { flex: 1; border: none; border-radius: 8px; padding: 10px 0; font-weight: 700; }' +
'.smc54m-save-btn { background: #2f6f63; color: #fff; }' +
'.smc54m-cancel-btn { background: #eef0ea; color: #5b665f; }' +
'.smc54m-filter-strip { display: flex; gap: 8px; padding: 10px 12px; overflow-x: auto; border-bottom: 1px solid #dce2db; background: #f7f8f5; }' +
'.smc54m-filter-chip { flex: none; border: 1px solid #dce2db; background: #fff; border-radius: 100px; padding: 6px 12px; font-size: 12.5px; color: #5b665f; }' +
'.smc54m-filter-chip.active { background: #2f6f63; color: #fff; border-color: #2f6f63; }' +
'.smc54m-task-list { display: flex; flex-direction: column; gap: 8px; padding: 12px; }' +
'.smc54m-task-card { position: relative; border: 1px solid #dce2db; border-radius: 10px; padding: 10px 12px; }' +
'.smc54m-task-top { display: flex; align-items: center; gap: 8px; padding-right: 70px; }' +
'.smc54m-task-title { font-weight: 700; font-size: 14px; }' +
'.smc54m-task-sub { font-size: 12px; color: #8b968e; margin-top: 2px; }' +
'.smc54m-task-detail { font-size: 13px; color: #5b665f; margin-top: 6px; }' +
'.smc54m-task-due { font-size: 12.5px; color: #5b665f; margin-top: 4px; }' +
'.smc54m-status-input { width: 100%; font-size: 13.5px; padding: 8px 10px; border: 1px solid #dce2db; border-radius: 8px; background: #f7f8f5; margin-top: 8px; }' +
'.smc54m-pri { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 5px; }' +
'.smc54m-pri.high { background: #f6e2de; color: #b23a2e; }' +
'.smc54m-pri.mid { background: #f5e9d4; color: #b57a1f; }' +
'.smc54m-pri.low { background: #eef0ea; color: #8b968e; }' +
'.smc54m-task-edit-form { display: flex; flex-direction: column; gap: 8px; }' +
'.smc54m-task-edit-form input, .smc54m-task-edit-form select { font-size: 14px; padding: 10px; border: 1px solid #dce2db; border-radius: 8px; width: 100%; }';
document.head.appendChild(style);
}

// ---------------- 下段：タスク管理 ----------------
function renderTaskSection(root, records, memberNames) {
var taskRecords = records.filter(function(r) { return r[FIELD_TYPE].value === TASK_TYPE; });

var section = document.createElement('div');
section.className = 'smc54m-section';

var head = document.createElement('div');
head.className = 'smc54m-head smc54m-head-task';
head.innerHTML = '<h3>タスク管理</h3>';
var addBtn = document.createElement('button');
addBtn.className = 'smc54m-ghost-btn';
addBtn.textContent = '＋ 追加';
head.appendChild(addBtn);
section.appendChild(head);

var form = document.createElement('div');
form.className = 'smc54m-add-form';
form.innerHTML =
'<select id="smc54m-task-member"></select>' +
'<input type="text" id="smc54m-task-koji" placeholder="案件">' +
'<input type="text" id="smc54m-task-detail" placeholder="詳細">' +
'<label class="smc54m-field-label">期限</label>' +
'<input type="date" id="smc54m-task-date">' +
'<select id="smc54m-task-pri"><option value="中">優先度：中</option><option value="高">優先度：高</option><option value="低">優先度：低</option></select>' +
'<button type="button" id="smc54m-task-add-btn">追加</button>';
section.appendChild(form);

var memberCounts = {};
taskRecords.forEach(function(r) {
var m = r[FIELD_MEMBER].value || '（未設定）';
memberCounts[m] = (memberCounts[m] || 0) + 1;
});
var allMembers = memberNames.slice();
Object.keys(memberCounts).forEach(function(m) { if (allMembers.indexOf(m) === -1) allMembers.push(m); });

var filterStrip = document.createElement('div');
filterStrip.className = 'smc54m-filter-strip';
var allChip = document.createElement('button');
allChip.className = 'smc54m-filter-chip active';
allChip.setAttribute('data-member', '__all__');
allChip.textContent = '全件（' + taskRecords.length + '）';
filterStrip.appendChild(allChip);
allMembers.forEach(function(name) {
var chip = document.createElement('button');
chip.className = 'smc54m-filter-chip';
chip.setAttribute('data-member', name);
chip.textContent = name + '（' + (memberCounts[name] || 0) + '）';
filterStrip.appendChild(chip);
});
section.appendChild(filterStrip);

function renderTaskCardView(card, r) {
card.className = 'smc54m-task-card';
card.setAttribute('data-member', r[FIELD_MEMBER].value || '（未設定）');
card.innerHTML =
'<div class="smc54m-leave-actions">' +
'<button type="button" class="smc54m-icon-btn edit" title="編集">✎</button>' +
'<button type="button" class="smc54m-icon-btn del" title="削除">🗑</button>' +
'</div>' +
'<div class="smc54m-task-top">' +
'<span class="smc54m-pri ' + (PRI_CLASS[r[FIELD_PRIORITY].value] || 'low') + '">' + (r[FIELD_PRIORITY].value || '低') + '</span>' +
'<span class="smc54m-task-title">' + (r[FIELD_KOJI].value || '（案件未入力）') + '</span>' +
'</div>' +
'<div class="smc54m-task-sub">' + (r[FIELD_MEMBER].value || '') + '</div>' +
(r[FIELD_DETAIL].value ? '<div class="smc54m-task-detail">' + r[FIELD_DETAIL].value + '</div>' : '') +
'<div class="smc54m-task-due">' + formatDueDate(r[FIELD_DATE].value) + '</div>' +
'<input class="smc54m-status-input" value="' + (r[FIELD_STATUS].value || '') + '">';

var statusInput = card.querySelector('.smc54m-status-input');
statusInput.addEventListener('change', function() {
var rec = {};
rec[FIELD_STATUS] = { value: statusInput.value };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.mobile.app.getId(),
id: r.$id.value,
record: rec
});
});

card.querySelector('.smc54m-icon-btn.del').addEventListener('click', function() {
if (!confirm('このタスクを削除しますか？')) return;
deleteRecordById(r.$id.value, function() { location.reload(); });
});
card.querySelector('.smc54m-icon-btn.edit').addEventListener('click', function() {
renderTaskCardEdit(card, r);
});
}

function renderTaskCardEdit(card, r) {
card.className = 'smc54m-task-card';
var memberOptions = allMembers.map(function(n) {
return '<option value="' + n + '"' + (n === r[FIELD_MEMBER].value ? ' selected' : '') + '>' + n + '</option>';
}).join('');
card.innerHTML =
'<div class="smc54m-task-edit-form">' +
'<select class="smc54m-edit-pri"><option value="高">優先度：高</option><option value="中">優先度：中</option><option value="低">優先度：低</option></select>' +
'<select class="smc54m-edit-member">' + memberOptions + '</select>' +
'<input type="text" class="smc54m-edit-koji" value="' + (r[FIELD_KOJI].value || '').replace(/"/g, '&quot;') + '" placeholder="案件">' +
'<input type="date" class="smc54m-edit-date" value="' + (r[FIELD_DATE].value || '') + '">' +
'<input type="text" class="smc54m-edit-detail" value="' + (r[FIELD_DETAIL].value || '').replace(/"/g, '&quot;') + '" placeholder="詳細">' +
'<div class="smc54m-edit-btn-row"><button type="button" class="smc54m-save-btn">保存</button><button type="button" class="smc54m-cancel-btn">キャンセル</button></div>' +
'</div>';
card.querySelector('.smc54m-edit-pri').value = r[FIELD_PRIORITY].value || '低';

card.querySelector('.smc54m-cancel-btn').addEventListener('click', function() {
renderTaskCardView(card, r);
});
card.querySelector('.smc54m-save-btn').addEventListener('click', function() {
var member = card.querySelector('.smc54m-edit-member').value;
var koji = card.querySelector('.smc54m-edit-koji').value.trim();
var date = card.querySelector('.smc54m-edit-date').value;
var detail = card.querySelector('.smc54m-edit-detail').value.trim();
var pri = card.querySelector('.smc54m-edit-pri').value;
if (!member || !koji) { alert('担当者と案件を入力してください'); return; }
var record = {};
record[FIELD_MEMBER] = { value: member };
record[FIELD_KOJI] = { value: koji };
record[FIELD_DATE] = { value: date };
record[FIELD_DETAIL] = { value: detail };
record[FIELD_PRIORITY] = { value: pri };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.mobile.app.getId(),
id: r.$id.value,
record: record
}).then(function() { location.reload(); });
});
}

var list = document.createElement('div');
list.className = 'smc54m-task-list';
taskRecords.forEach(function(r) {
var card = document.createElement('div');
renderTaskCardView(card, r);
list.appendChild(card);
});
section.appendChild(list);
root.appendChild(section);

filterStrip.addEventListener('click', function(e) {
var chip = e.target.closest('.smc54m-filter-chip');
if (!chip) return;
filterStrip.querySelectorAll('.smc54m-filter-chip').forEach(function(c) { c.classList.remove('active'); });
chip.classList.add('active');
var member = chip.getAttribute('data-member');
list.querySelectorAll('.smc54m-task-card').forEach(function(card) {
card.style.display = (member === '__all__' || card.getAttribute('data-member') === member) ? '' : 'none';
});
});

addBtn.addEventListener('click', function() {
form.classList.toggle('open');
var sel = document.getElementById('smc54m-task-member');
sel.innerHTML = '';
var blankOpt = document.createElement('option');
blankOpt.value = ''; blankOpt.textContent = '（担当者を選択）';
sel.appendChild(blankOpt);
allMembers.forEach(function(n) {
var opt = document.createElement('option');
opt.value = n; opt.textContent = n;
sel.appendChild(opt);
});
sel.value = '';
});

document.getElementById('smc54m-task-add-btn').addEventListener('click', function() {
var member = document.getElementById('smc54m-task-member').value;
var koji = document.getElementById('smc54m-task-koji').value.trim();
var detail = document.getElementById('smc54m-task-detail').value.trim();
var date = document.getElementById('smc54m-task-date').value;
var pri = document.getElementById('smc54m-task-pri').value;
if (!member || !koji) { alert('担当者と案件を入力してください'); return; }
var record = {};
record[FIELD_TYPE] = { value: TASK_TYPE };
record[FIELD_MEMBER] = { value: member };
record[FIELD_KOJI] = { value: koji };
record[FIELD_DETAIL] = { value: detail };
record[FIELD_DATE] = { value: date };
record[FIELD_PRIORITY] = { value: pri };
record[FIELD_STATUS] = { value: '未着手' };
kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: kintone.mobile.app.getId(),
record: record
}).then(function() {
location.reload();
});
});
}

kintone.events.on('mobile.app.record.index.show', function(event) {
applyStyle();
var space = kintone.mobile.app.getHeaderSpaceElement();
if (!space) return event;
if (document.getElementById('smc54m-root')) return event;

var root = document.createElement('div');
root.id = 'smc54m-root';
space.appendChild(root);

var loading = document.createElement('div');
loading.textContent = '読み込み中…';
loading.style.padding = '12px 16px';
root.appendChild(loading);

fetchAllRecords(function(records) {
root.innerHTML = '';
var memberRecords = records.filter(function(r) { return r[FIELD_TYPE].value === MEMBER_TYPE; });
var memberSet = {};
memberRecords.forEach(function(r) { if (r[FIELD_MEMBER].value) memberSet[r[FIELD_MEMBER].value] = true; });
records.forEach(function(r) { if (r[FIELD_TYPE].value !== MEMBER_TYPE && r[FIELD_MEMBER].value) memberSet[r[FIELD_MEMBER].value] = true; });
var memberNames = Object.keys(memberSet).sort();
renderTaskSection(root, records, memberNames);
});

return event;
});
})();
