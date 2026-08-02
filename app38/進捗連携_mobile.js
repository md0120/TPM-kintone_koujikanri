(function() {
'use strict';
function normalize(s) {
return (s || '').replace(/[\s　]/g, '');
}

// 作業日（4月始まり）から年度を算出する。工事名は年度をまたいで同名・類似名が
// 再利用されることがあるため、名前だけの一致では別年度の案件を誤って更新して
// しまう恐れがある。作業日から年度を求め、app37側の「年度」（フィールドコード
// 「数値」）と一致するものだけに絞り込むことで誤爆を防ぐ。
function fiscalYearFromDate(dateStr) {
if (!dateStr) return null;
var parts = dateStr.split('-');
if (parts.length !== 3) return null;
var y = parseInt(parts[0], 10);
var m = parseInt(parts[1], 10);
if (!y || !m) return null;
return m >= 4 ? y : y - 1;
}

function syncProgress(event) {
var record = event.record;
var koujiName = record['ルックアップ'] ? record['ルックアップ'].value : '';
var progress = record['ラジオボタン_12'] ? record['ラジオボタン_12'].value : '';
if (!koujiName || !progress) return event;
var targetName = normalize(koujiName);
var tokens = koujiName.split(/[\s　]+/).filter(Boolean);
var longestToken = tokens.reduce(function(a, b) { return b.length > a.length ? b : a; }, '');
if (!longestToken) return event;
var workDate = record['日付'] ? record['日付'].value : '';
var fiscalYear = fiscalYearFromDate(workDate);
return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
app: 37,
query: '文字列__1行_ like "' + longestToken.replace(/"/g, '\\"') + '"',
fields: ['$id', '文字列__1行_', '数値']
}).then(function(resp) {
var matches = resp.records.filter(function(r) {
if (normalize(r['文字列__1行_'].value) !== targetName) return false;
if (fiscalYear === null) return true;
var recYear = r['数値'] && r['数値'].value ? parseInt(r['数値'].value, 10) : null;
return recYear === null || recYear === fiscalYear;
});
if (!matches.length) return event;
var updates = matches.map(function(r) {
return { id: r.$id.value, record: { 'ドロップダウン_1': { value: progress } } };
});
return kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', {app: 37, records: updates}).then(function(){ return event; });
}).catch(function(err) {
console.error('進捗連携エラー', err);
return event;
});
}
kintone.events.on([
'mobile.app.record.create.submit.success',
'mobile.app.record.edit.submit.success',
'mobile.app.record.index.edit.submit.success'
], syncProgress);
})();
