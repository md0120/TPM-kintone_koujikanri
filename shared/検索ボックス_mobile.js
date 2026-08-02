
(function() {
  'use strict';
  kintone.events.on('mobile.app.record.index.show', function(event) {
    if (document.getElementById('smc-search-box2')) return event;
    var appId = kintone.mobile.app.getId();
    var space = kintone.mobile.app.getHeaderSpaceElement();
    if (!space) return event;

    function fiscalYearOf(dateStr) {
      if (!dateStr) return null;
      var d = new Date(dateStr);
      var y = d.getFullYear();
      var m = d.getMonth() + 1;
      return m >= 4 ? y : y - 1;
    }

    function fetchAll(offset, acc) {
      return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {app: appId, fields: ['日付'], query: 'order by $id asc limit 500 offset ' + offset}).then(function(resp){
        acc = acc.concat(resp.records);
        if (resp.records.length === 500) return fetchAll(offset + 500, acc);
        return acc;
      });
    }

    fetchAll(0, []).then(function(records){
      var years = new Set();
      var now = new Date();
      years.add(fiscalYearOf(now.toISOString()));
      records.forEach(function(r){
        if (r['日付'] && r['日付'].value) {
          var fy = fiscalYearOf(r['日付'].value);
          if (fy !== null) years.add(fy);
        }
      });
      var sortedYears = Array.from(years).sort(function(a,b){return b-a;});

      var container = document.createElement('div');
      container.id = 'smc-search-box2';
      container.style.padding = '8px';
      container.style.background = '#f5f5f5';

      var row1 = document.createElement('div');
      row1.style.marginBottom = '6px';
      var yearSelect = document.createElement('select');
      yearSelect.id = 'smc-year-select2';
      yearSelect.style.width = '100%';
      yearSelect.style.padding = '6px';
      sortedYears.forEach(function(y){
        var opt = document.createElement('option');
        opt.value = y; opt.textContent = y + '年度';
        if (y === fiscalYearOf(now.toISOString())) opt.selected = true;
        yearSelect.appendChild(opt);
      });
      row1.appendChild(yearSelect);

      var row2 = document.createElement('div');
      row2.style.marginBottom = '6px';
      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = '工事名で検索';
      nameInput.id = 'smc-name-input2';
      nameInput.style.width = '100%';
      nameInput.style.padding = '6px';
      nameInput.style.boxSizing = 'border-box';
      row2.appendChild(nameInput);

      var row3 = document.createElement('div');
      var searchBtn = document.createElement('button');
      searchBtn.textContent = '検索';
      searchBtn.style.padding = '8px 16px';
      searchBtn.style.marginRight = '6px';
      var clearBtn = document.createElement('button');
      clearBtn.textContent = 'クリア';
      clearBtn.style.padding = '8px 16px';
      row3.appendChild(searchBtn);
      row3.appendChild(clearBtn);

      container.appendChild(row1);
      container.appendChild(row2);
      container.appendChild(row3);
      space.appendChild(container);

      searchBtn.onclick = function(){
        var y = parseInt(yearSelect.value, 10);
        var conds = [];
        conds.push('日付 >= "' + y + '-04-01" and 日付 <= "' + (y+1) + '-03-31"');
        var nameVal = nameInput.value.trim();
        if (nameVal) conds.push('ルックアップ like "' + nameVal.replace(/"/g,'') + '"');
        var query = conds.join(' and ');
        location.href = '/k/m/' + appId + '/?query=' + encodeURIComponent(query);
      };
      clearBtn.onclick = function(){
        location.href = '/k/m/' + appId + '/';
      };
    });
    return event;
  });
})();
