
(function() {
  'use strict';
  var DATE_FIELD = '日付';
  var LOOKUP_FIELD = '工事名テキスト';
  var YEAR_SELECT_ID = 'smc-year-select2';

  function fiscalYearOf(dateStr) {
    var parts = dateStr.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    return m >= 4 ? y : y - 1;
  }

  function fetchAllYears(appId, cb) {
    var years = {};
    var limit = 500;
    function loop(offset) {
      kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: appId,
        fields: [DATE_FIELD],
        query: 'order by $id asc limit ' + limit + ' offset ' + offset
      }).then(function(resp) {
        resp.records.forEach(function(r) {
          var v = r[DATE_FIELD] && r[DATE_FIELD].value;
          if (v) years[fiscalYearOf(v)] = true;
        });
        if (resp.records.length === limit) {
          loop(offset + limit);
        } else {
          cb(Object.keys(years).map(Number));
        }
      });
    }
    loop(0);
  }

  kintone.events.on('app.record.index.show', function(event) {
    if (document.getElementById('smc-search-box2')) return event;
    var space = kintone.app.getHeaderMenuSpaceElement();
    if (!space) return event;

    var appId = kintone.app.getId();
    var now = new Date();
    var currentFiscalYear = fiscalYearOf(now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-01');

    var container = document.createElement('div');
    container.id = 'smc-search-box2';
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.alignItems = 'center';
    container.style.flexWrap = 'wrap';

    var yearLabel = document.createElement('span');
    yearLabel.innerText = '年度:';
    var yearSelect = document.createElement('select');
    yearSelect.id = YEAR_SELECT_ID;
    var loadingOpt = document.createElement('option');
    loadingOpt.text = '読み込み中...';
    yearSelect.appendChild(loadingOpt);

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = '工事名で検索';
    nameInput.style.width = '200px';

    var searchBtn = document.createElement('button');
    searchBtn.innerText = '検索';
    searchBtn.style.cursor = 'pointer';
    searchBtn.onclick = function() {
      var conditions = [];
      if (yearSelect.value) {
        var y = parseInt(yearSelect.value, 10);
        var startDate = y + '-04-01';
        var endDate = (y+1) + '-03-31';
        conditions.push(DATE_FIELD + ' >= "' + startDate + '" and ' + DATE_FIELD + ' <= "' + endDate + '"');
      }
      if (nameInput.value.trim()) {
        var v = nameInput.value.trim().replace(/"/g, '\\"');
        conditions.push(LOOKUP_FIELD + ' like "' + v + '"');
      }
      var query = conditions.join(' and ');
      var url = location.href.split('?')[0].split('#')[0] + (query ? ('?query=' + encodeURIComponent(query)) : '');
      location.href = url;
    };

    var clearBtn = document.createElement('button');
    clearBtn.innerText = 'クリア';
    clearBtn.style.cursor = 'pointer';
    clearBtn.onclick = function() {
      location.href = location.href.split('?')[0].split('#')[0];
    };

    container.appendChild(yearLabel);
    container.appendChild(yearSelect);
    container.appendChild(nameInput);
    container.appendChild(searchBtn);
    container.appendChild(clearBtn);

    space.appendChild(container);

    fetchAllYears(appId, function(years) {
      if (years.indexOf(currentFiscalYear) === -1) years.push(currentFiscalYear);
      years.sort(function(a,b){return a-b;});
      yearSelect.innerHTML = '';
      var blankYear = document.createElement('option');
      blankYear.value = '';
      blankYear.text = 'すべて';
      yearSelect.appendChild(blankYear);
      years.forEach(function(y) {
        var opt = document.createElement('option');
        opt.value = String(y);
        opt.text = y + '年度';
        if (y === currentFiscalYear) opt.selected = true;
        yearSelect.appendChild(opt);
      });
    });

    return event;
  });
})();
