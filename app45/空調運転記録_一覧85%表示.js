(function() {
'use strict';

// app37で確立した方式を踏襲：zoomは使わず、フォントサイズ・行間・パディングを
// 直接85%相当に縮小する（zoom+position:stickyの組み合わせはChromeで描画ズレが出るため）。
// このアプリでは列固定は不要なため、縮小スタイルのみ適用する。
var SCALE_FONT_SIZE = '12px';
var SCALE_LINE_HEIGHT = '1.3';
var SCALE_PADDING = '4px 6px';

var CELL_TYPE_CLASSES = [
'recordlist-single_select-gaia', 'recordlist-date-gaia', 'recordlist-decimal-gaia',
'recordlist-number-gaia', 'recordlist-calc-gaia', 'recordlist-record_id-gaia',
'recordlist-time-gaia', 'recordlist-file-gaia', 'recordlist-creator-gaia',
'recordlist-created_at-gaia', 'recordlist-modifier-gaia', 'recordlist-modified_at-gaia',
'recordlist-single_check-gaia', 'recordlist-status-gaia', 'recordlist-status_assignee-gaia',
'recordlist-user_select-gaia', 'recordlist-multi_line_text-gaia'
];

function applyListScaleStyle() {
if (document.getElementById('smc-list-scale-style')) return;
var style = document.createElement('style');
style.id = 'smc-list-scale-style';
var typeSelectors = CELL_TYPE_CLASSES.map(function(c) {
return 'table.recordlist-gaia td.' + c;
}).join(',');
style.textContent =
'table.recordlist-gaia .line-cell-gaia {' +
'font-size: ' + SCALE_FONT_SIZE + ' !important;' +
'line-height: ' + SCALE_LINE_HEIGHT + ' !important;' +
'padding: ' + SCALE_PADDING + ' !important;' +
'}' +
typeSelectors + ' {' +
'font-size: ' + SCALE_FONT_SIZE + ' !important;' +
'line-height: ' + SCALE_LINE_HEIGHT + ' !important;' +
'padding: ' + SCALE_PADDING + ' !important;' +
'}' +
'table.recordlist-gaia .recordlist-header-label-gaia {' +
'font-size: ' + SCALE_FONT_SIZE + ' !important;' +
'}' +
'table.recordlist-gaia th.recordlist-header-cell-gaia {' +
'padding-top: 4px !important;' +
'padding-bottom: 4px !important;' +
'}';
document.head.appendChild(style);
}

kintone.events.on('app.record.index.show', function(event) {
applyListScaleStyle();
return event;
});
})();
