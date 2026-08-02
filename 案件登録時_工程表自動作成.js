(function() {
'use strict';

var APP_PROCESS = 43;
var FIELD_KOJI_SRC = '文字列__1行_';
var FIELD_YEAR_SRC = '数値';
var FIELD_TPM_SRC = 'ドロップダウン';
// app43側で「どのapp37レコードから作られたか」を追跡するための参照フィールド。
// 工事名が後から変更されても同期ボタンで確実に対象を見つけられるようにする。
var FIELD_SRC_ID_DEST = '文字列__1行_';

function pad2(n) {
return n < 10 ? '0' + n : '' + n;
}

// 年度のJST 4/1 00:00〜23:59を、kintoneのDATETIME形式（UTC）で返す。
// JSTはUTC+9なので、4/1 00:00 JST = 3/31 15:00 UTC、4/1 23:59 JST = 4/1 14:59 UTC。
function dummyScheduleRange(year) {
var y = parseInt(year, 10);
if (!y) return null;
var start = new Date(Date.UTC(y, 2, 31, 15, 0, 0));
var end = new Date(Date.UTC(y, 3, 1, 14, 59, 0));
function fmt(d) {
return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()) +
'T' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ':00Z';
}
return { start: fmt(start), end: fmt(end) };
}

kintone.events.on('app.record.create.submit.success', function(event) {
var record = event.record;
var koujiName = record[FIELD_KOJI_SRC] ? record[FIELD_KOJI_SRC].value : '';
if (!koujiName) {
return event;
}
var year = record[FIELD_YEAR_SRC] ? record[FIELD_YEAR_SRC].value : '';
var tpm = record[FIELD_TPM_SRC] ? record[FIELD_TPM_SRC].value : '';
var range = dummyScheduleRange(year);

return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_PROCESS,
query: '工事名 = "' + koujiName.replace(/"/g, '\\"') + '" limit 1',
fields: ['レコード番号']
}).then(function(resp) {
if (resp.records.length > 0) {
return event;
}
var newRecord = {
'工事名': { value: koujiName },
'年度': { value: year },
'主担当': { value: tpm },
'昼夜区分': { value: '工事予定' },
'工程名': { value: 'ダミー' }
};
newRecord[FIELD_SRC_ID_DEST] = { value: event.recordId ? String(event.recordId) : '' };
if (range) {
newRecord['開始日時'] = { value: range.start };
newRecord['終了日時'] = { value: range.end };
}
return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: APP_PROCESS,
record: newRecord
}).then(function() {
return event;
});
});
});
})();
