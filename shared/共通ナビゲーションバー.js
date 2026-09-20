(function() {
'use strict';

// app37は絞り込み条件（queryパラメータ）が無い状態で開くと、
// 案件台帳_フィルターバー.js が「現在年度で絞り込んだ状態」へ自動的に
// location.hrefでリダイレクトする（実質ページを2回読み込む＝画面が2回切り替わる
// ように見える）。ナビゲーションバーのリンクにあらかじめ現在年度のqueryを
// 付けておけば、そのリダイレクトが発生しなくなる。
function getCurrentFiscalYear() {
var d = new Date();
var y = d.getFullYear();
var m = d.getMonth() + 1;
return m >= 4 ? y : y - 1;
}

var APPS = [
{ id: 37, label: '工事一覧', href: function() {
// 「年度」は表示ラベルで、実際のフィールドコードは「数値」（案件台帳_フィルターバー.jsの
// FIELD_YEARと同じ）。クエリにはフィールドコードを使う必要がある。
return '/k/37/?query=' + encodeURIComponent('数値 = "' + getCurrentFiscalYear() + '"');
} },
{ id: 38, label: 'TPM報告書' },
{ id: 40, label: '他報告書' },
{ id: 43, label: '工程管理' },
{ id: 45, label: '空調運転記録' },
{ id: 54, label: '計画・タスク管理' },
{ id: 55, label: '不在・休暇' },
{ id: 34, label: '連絡先' }
];

function applyStyle() {
if (document.getElementById('smc-nav-style')) return;
var style = document.createElement('style');
style.id = 'smc-nav-style';
style.textContent =
'.smc-nav-bar { display: flex; gap: 6px; padding: 8px 12px; background: #f7f8f5; border-bottom: 1px solid #dce2db; overflow-x: auto; }' +
'.smc-nav-bar a { flex: none; display: inline-flex; align-items: center; text-decoration: none; font-size: 12.5px; font-weight: 700; color: #2b332d; background: #fff; border: 1px solid #dce2db; border-radius: 100px; padding: 5px 11px; white-space: nowrap; }' +
'.smc-nav-bar a:hover { background: #e3efea; border-color: #2f6f63; }' +
'.smc-nav-bar a.current { background: #2f6f63; color: #fff; border-color: #2f6f63; cursor: default; pointer-events: none; }';
document.head.appendChild(style);
}

function mount() {
if (document.getElementById('smc-nav-bar')) return;
var currentAppId = kintone.app.getId();

var nav = document.createElement('nav');
nav.id = 'smc-nav-bar';
nav.className = 'smc-nav-bar';

APPS.forEach(function(a) {
var link = document.createElement('a');
link.textContent = a.label;
if (a.id === currentAppId) {
link.className = 'current';
link.href = '#';
} else {
link.href = a.href ? a.href() : '/k/' + a.id + '/';
}
nav.appendChild(link);
});

var toolbar = document.querySelector('.gaia-argoui-app-index-toolbar');
if (toolbar && toolbar.parentNode) {
toolbar.parentNode.insertBefore(nav, toolbar.nextSibling);
keepOnTop(toolbar, nav);
} else {
var space = kintone.app.getHeaderSpaceElement();
if (space) space.appendChild(nav);
}
}

// 他のカスタマイズJSがツールバー直後に自分のUIを差し込むと、実行順序次第で
// ナビゲーションバーが後ろに押しやられることがあるため、常に最上部に留まるよう監視する。
function keepOnTop(toolbar, nav) {
var parent = toolbar.parentNode;
var observer = new MutationObserver(function() {
if (toolbar.nextElementSibling !== nav) {
parent.insertBefore(nav, toolbar.nextSibling);
}
});
observer.observe(parent, { childList: true });
}

kintone.events.on(['app.record.index.show'], function(event) {
applyStyle();
mount();
return event;
});
})();
