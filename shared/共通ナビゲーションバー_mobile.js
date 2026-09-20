(function() {
'use strict';

// app37は「view」パラメータが無い状態で開くと、一覧ビュー自動切替_mobile.js が
// 特定ビューへ自動的にlocation.hrefでリダイレクトする（実質ページを2回読み込む＝
// 画面が2回切り替わるように見える）。ナビゲーションバーのリンクにあらかじめ
// そのviewパラメータを付けておけば、そのリダイレクトが発生しなくなる。
var APP37_MOBILE_VIEW_ID = '5523202';

var APPS = [
{ id: 37, label: '工事一覧', href: function() {
return '/k/m/37/?view=' + APP37_MOBILE_VIEW_ID;
} },
{ id: 38, label: 'TPM報告書' },
{ id: 40, label: '他報告書' },
{ id: 43, label: '工程管理' },
{ id: 45, label: '空調運転記録' },
{ id: 54, label: '計画・タスク管理' },
{ id: 55, label: '不在・休暇' },
{ id: 34, label: '連絡先' }
];

// モバイルは画面が狭いため、常時表示の横バーではなく、ヘッダーに小さな
// メニューボタン（≡）だけを置き、タップすると画面下からアプリ一覧が
// せり上がる「ドロワー」形式にする。

function applyStyle() {
if (document.getElementById('smc-nav-mobile-style')) return;
var style = document.createElement('style');
style.id = 'smc-nav-mobile-style';
style.textContent =
'.smc-nav-m-btn { position: fixed; top: 8px; right: 8px; z-index: 2500; display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #dce2db; border-radius: 8px; background: #fff; font-size: 18px; line-height: 1; color: #2b332d; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }' +
'.smc-nav-m-overlay { position: fixed; inset: 0; background: rgba(20,24,26,0.4); z-index: 3000; display: none; }' +
'.smc-nav-m-overlay.open { display: block; }' +
'.smc-nav-m-sheet { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 14px 14px 0 0; padding: 10px 10px calc(14px + env(safe-area-inset-bottom)); box-shadow: 0 -4px 20px rgba(0,0,0,0.15); }' +
'.smc-nav-m-sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 6px 10px; }' +
'.smc-nav-m-sheet-head span { font-size: 13px; font-weight: 700; color: #2b332d; }' +
'.smc-nav-m-close { border: none; background: none; font-size: 20px; color: #5b665f; padding: 2px 6px; cursor: pointer; }' +
'.smc-nav-m-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }' +
'.smc-nav-m-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 10px 4px; border-radius: 10px; text-decoration: none; color: #2b332d; background: #f7f8f5; }' +
'.smc-nav-m-item .dot { width: 8px; height: 8px; border-radius: 50%; background: #8a9a8f; }' +
'.smc-nav-m-item span { font-size: 11px; font-weight: 700; text-align: center; line-height: 1.3; }' +
'.smc-nav-m-item.current { background: #2f6f63; }' +
'.smc-nav-m-item.current .dot { background: #fff; }' +
'.smc-nav-m-item.current span { color: #fff; }';
document.head.appendChild(style);
}

function mount() {
if (document.getElementById('smc-nav-m-btn')) return;

var currentAppId = kintone.mobile.app.getId();

var btn = document.createElement('button');
btn.type = 'button';
btn.id = 'smc-nav-m-btn';
btn.className = 'smc-nav-m-btn';
btn.textContent = '≡';
btn.title = 'アプリ一覧';

var overlay = document.createElement('div');
overlay.className = 'smc-nav-m-overlay';
overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

var sheet = document.createElement('div');
sheet.className = 'smc-nav-m-sheet';

var head = document.createElement('div');
head.className = 'smc-nav-m-sheet-head';
var headLabel = document.createElement('span');
headLabel.textContent = 'アプリ一覧';
var closeBtn = document.createElement('button');
closeBtn.type = 'button';
closeBtn.className = 'smc-nav-m-close';
closeBtn.textContent = '✕';
closeBtn.addEventListener('click', function() { close(); });
head.appendChild(headLabel);
head.appendChild(closeBtn);
sheet.appendChild(head);

var grid = document.createElement('div');
grid.className = 'smc-nav-m-grid';
APPS.forEach(function(a) {
var isCurrent = a.id === currentAppId;
var item = document.createElement(isCurrent ? 'div' : 'a');
item.className = 'smc-nav-m-item' + (isCurrent ? ' current' : '');
if (!isCurrent) item.href = a.href ? a.href() : '/k/m/' + a.id + '/';
var dot = document.createElement('span');
dot.className = 'dot';
var label = document.createElement('span');
label.textContent = a.label;
item.appendChild(dot);
item.appendChild(label);
grid.appendChild(item);
});
sheet.appendChild(grid);
overlay.appendChild(sheet);

function open() { overlay.classList.add('open'); }
function close() { overlay.classList.remove('open'); }
btn.addEventListener('click', open);

document.body.appendChild(btn);
document.body.appendChild(overlay);
}

kintone.events.on(['mobile.app.record.index.show'], function(event) {
applyStyle();
mount();
return event;
});
})();
