(function() {
'use strict';
var FIELD_DATE = '日付';

function pad2(n) {
return n < 10 ? '0' + n : '' + n;
}

function todayStr() {
var d = new Date();
return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function parseDateFromQuery() {
var params = new URLSearchParams(location.search);
var q = params.get('query') || '';
var m = q.match(/日付\s*=\s*"([^"]*)"/);
return m ? m[1] : '';
}

kintone.events.on('mobile.app.record.index.show', function(event) {
var params = new URLSearchParams(location.search);
var hasQuery = params.has('query');

if (!hasQuery) {
var url = new URL(location.href);
url.searchParams.set('query', FIELD_DATE + ' = "' + todayStr() + '"');
location.href = url.toString();
return event;
}

if (document.getElementById('smc-date-search')) return event;
var space = kintone.mobile.app.getHeaderSpaceElement();
if (!space) return event;

var currentDate = parseDateFromQuery() || todayStr();

var wrap = document.createElement('div');
wrap.id = 'smc-date-search';
wrap.style.padding = '8px';
wrap.style.background = '#f5f5f5';
wrap.style.display = 'flex';
wrap.style.alignItems = 'center';
wrap.style.gap = '8px';

var label = document.createElement('span');
label.textContent = '作業日';
wrap.appendChild(label);

var dateInput = document.createElement('input');
dateInput.type = 'date';
dateInput.value = currentDate;
dateInput.style.flex = '1';
wrap.appendChild(dateInput);

var clearBtn = document.createElement('button');
clearBtn.type = 'button';
clearBtn.textContent = 'すべて表示';
clearBtn.style.padding = '6px 10px';
clearBtn.style.border = '1px solid #999';
clearBtn.style.borderRadius = '4px';
clearBtn.style.backgroundColor = '#fff';
clearBtn.onclick = function() {
var url = new URL(location.href);
url.searchParams.set('query', '');
location.href = url.toString();
};
wrap.appendChild(clearBtn);

dateInput.addEventListener('change', function() {
if (!dateInput.value) return;
var url = new URL(location.href);
url.searchParams.set('query', FIELD_DATE + ' = "' + dateInput.value + '"');
location.href = url.toString();
});

space.appendChild(wrap);
return event;
});
})();
