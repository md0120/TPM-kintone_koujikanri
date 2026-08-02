(function() {
'use strict';
var PROGRESS_CLASS = 'value-5523030'; // 進捗
var KOJI_CLASS = 'value-5522242'; // 工事名
var KEIYAKU_CLASS = 'value-5523259'; // 契約状況
var GRAY = '#d3d3d3';
var KEIYAKU_GRAY_VALUES = ['請求済', '(中止)'];

function applyGray() {
var rows = document.querySelectorAll('table.recordlist-gaia tbody tr');
rows.forEach(function(tr) {
var progressCell = tr.querySelector('td.' + PROGRESS_CLASS);
var kojiCell = tr.querySelector('td.' + KOJI_CLASS);
var keiyakuCell = tr.querySelector('td.' + KEIYAKU_CLASS);

var progressText = progressCell ? progressCell.textContent.trim() : '';
var keiyakuText = keiyakuCell ? keiyakuCell.textContent.trim() : '';

// 契約状況が「請求済」「受注済」「(中止)」のいずれかの場合はレコード（行）全体をグレー表示
var rowColor = (KEIYAKU_GRAY_VALUES.indexOf(keiyakuText) !== -1) ? GRAY : '';
// 進捗が「完成」の場合は工事名セルだけグレー表示（行がグレーならその色を引き継ぐ）
var kojiColor = (progressText === '完成') ? GRAY : rowColor;

// インライン編集の保存直後、kintoneがセルのDOMを再描画する過程で一瞬値が
// 中間状態になることがあり、その古い状態をキャッシュして再適用をスキップして
// しまうと「保存後に白へ戻る」不具合になる。そのため毎回無条件に再適用する。
tr.style.backgroundColor = rowColor;
Array.prototype.forEach.call(tr.children, function(td) {
// 固定表示（案件台帳_検索ボックス.jsのsmcFrozenCol）のセルはposition:stickyのため、
// 背景を透明のままにすると横スクロール時に下の内容と重なって見えてしまう。
// 固定セルだけは常に不透明な色（グレー、またはグレーでなければ白）を明示的に設定する。
if (td.classList.contains('smcFrozenCol')) {
td.style.backgroundColor = rowColor || '#fff';
} else {
td.style.backgroundColor = rowColor;
}
});
if (kojiCell) kojiCell.style.backgroundColor = kojiColor || '#fff';
});
}

// DOM変更が連続発生している間は都度再計算せず、変更が収まってから
// まとめて1回だけ最終状態を反映する（保存時の複数回の再描画に対応するため）。
var debounceTimer = null;
function scheduleApplyGray() {
if (debounceTimer) clearTimeout(debounceTimer);
debounceTimer = setTimeout(applyGray, 150);
}

kintone.events.on('app.record.index.show', function(event) {
applyGray();
return event;
});

var observer = new MutationObserver(function() { scheduleApplyGray(); });
if (document.body) {
observer.observe(document.body, {childList: true, subtree: true, characterData: true});
}
})();
