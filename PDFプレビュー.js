(function() {
'use strict';

function isPdfLink(a) {
return /\.pdf(\?|$)/i.test(a.href) || /\.pdf$/i.test(a.textContent.trim());
}

function applyStyle() {
if (document.getElementById('smc-pdf-preview-style')) return;
var style = document.createElement('style');
style.id = 'smc-pdf-preview-style';
style.textContent =
'#smc-pdf-overlay { position: fixed; inset: 0; background: rgba(20,24,26,0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; }' +
'#smc-pdf-modal { position: relative; width: 90vw; height: 90vh; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }' +
'#smc-pdf-modal iframe { width: 100%; height: 100%; border: none; display: block; }' +
'#smc-pdf-close { position: absolute; top: 8px; right: 8px; z-index: 1; border: none; background: #2b332d; color: #fff; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; cursor: pointer; }' +
'#smc-pdf-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #5b665f; background: #fff; }';
document.head.appendChild(style);
}

function onKeydown(e) {
if (e.key === 'Escape') closePreview();
}

function closePreview() {
var overlay = document.getElementById('smc-pdf-overlay');
if (!overlay) return;
var iframe = overlay.querySelector('iframe');
if (iframe && iframe.src && iframe.src.indexOf('blob:') === 0) {
URL.revokeObjectURL(iframe.src);
}
overlay.remove();
document.removeEventListener('keydown', onKeydown);
}

function openPreview(url) {
applyStyle();
var overlay = document.createElement('div');
overlay.id = 'smc-pdf-overlay';
overlay.addEventListener('click', function(e) {
if (e.target === overlay) closePreview();
});

var modal = document.createElement('div');
modal.id = 'smc-pdf-modal';

var closeBtn = document.createElement('button');
closeBtn.id = 'smc-pdf-close';
closeBtn.textContent = '✕';
closeBtn.addEventListener('click', closePreview);
modal.appendChild(closeBtn);

var loading = document.createElement('div');
loading.id = 'smc-pdf-loading';
loading.textContent = '読み込み中…';
modal.appendChild(loading);

overlay.appendChild(modal);
document.body.appendChild(overlay);
document.addEventListener('keydown', onKeydown);

fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then(function(resp) {
return resp.blob();
}).then(function(blob) {
var blobUrl = URL.createObjectURL(blob);
var iframe = document.createElement('iframe');
iframe.src = blobUrl;
loading.remove();
modal.appendChild(iframe);
}).catch(function() {
loading.textContent = 'プレビューを読み込めませんでした。';
});
}

function attachHandlers(container) {
var anchors = container.querySelectorAll('a');
anchors.forEach(function(a) {
if (a.dataset.smcPdfBound) return;
if (!isPdfLink(a)) return;
a.dataset.smcPdfBound = '1';
a.addEventListener('click', function(e) {
e.preventDefault();
openPreview(a.href);
});
});
}

function scanList() {
document.querySelectorAll('td.recordlist-file-gaia').forEach(attachHandlers);
}

function scanDetail() {
document.querySelectorAll('.control-file-field-gaia').forEach(attachHandlers);
}

kintone.events.on('app.record.index.show', function(event) {
scanList();
return event;
});

kintone.events.on(['app.record.detail.show'], function(event) {
scanDetail();
return event;
});
})();
