(function() {
'use strict';
var MOBILE_VIEW_ID = '5523202';
kintone.events.on('mobile.app.record.index.show', function(event) {
var params = new URLSearchParams(window.location.search);
if (params.get('view') !== MOBILE_VIEW_ID) {
params.set('view', MOBILE_VIEW_ID);
location.href = window.location.pathname + '?' + params.toString();
}
return event;
});
})();
