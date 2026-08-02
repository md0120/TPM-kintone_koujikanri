
(function() {
  'use strict';
  kintone.events.on('mobile.app.record.index.show', function(event) {
    if (document.getElementById('smc-search-box')) return event;
    var appId = kintone.mobile.app.getId();
    var space = kintone.mobile.app.getHeaderSpaceElement();
    if (!space) return event;

    kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {app: appId, fields: ['数値'], query: 'order by $id asc limit 500 offset 0'}).then(function(resp){
      var years = new Set();
      var now = new Date();
      years.add(String(now.getFullYear()));
      resp.records.forEach(function(r){ if (r['数値'] && r['数値'].value) years.add(String(r['数値'].value)); });
      var sortedYears = Array.from(years).sort(function(a,b){return b-a;});

      var container = document.createElement('div');
      container.id = 'smc-search-box';
      container.style.padding = '8px';
      container.style.background = '#f5f5f5';

      var row1 = document.createElement('div');
      row1.style.marginBottom = '6px';
      row1.style.display = 'flex';
      row1.style.alignItems = 'center';
      var yearSelect = document.createElement('select');
      yearSelect.id = 'smc-year-select';
      yearSelect.style.flex = '1';
      yearSelect.style.padding = '6px';
      sortedYears.forEach(function(y){
        var opt = document.createElement('option');
        opt.value = y; opt.textContent = y + '年度';
        if (y === String(now.getFullYear())) opt.selected = true;
        yearSelect.appendChild(opt);
      });
      var countLabel = document.createElement('span');
      countLabel.id = 'smc-count-label';
      countLabel.style.marginLeft = '10px';
      countLabel.style.fontWeight = 'bold';
      countLabel.style.color = '#3498db';
      countLabel.style.whiteSpace = 'nowrap';
      row1.appendChild(yearSelect);
      row1.appendChild(countLabel);

      var row2 = document.createElement('div');
      row2.style.marginBottom = '6px';
      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = '工事名で検索';
      nameInput.id = 'smc-name-input';
      nameInput.style.width = '100%';
      nameInput.style.padding = '6px';
      nameInput.style.boxSizing = 'border-box';
      row2.appendChild(nameInput);

      var row3 = document.createElement('div');
      row3.style.marginBottom = '6px';
      var tantouSelect = document.createElement('select');
      tantouSelect.id = 'smc-tantou-select';
      tantouSelect.style.width = '100%';
      tantouSelect.style.padding = '6px';
      var tantouOpts = ['', '田畑','宮井','渡邉','山本','藤原','石井','福島'];
      tantouOpts.forEach(function(t){
        var opt = document.createElement('option');
        opt.value = t; opt.textContent = t ? t : '主担当（すべて）';
        tantouSelect.appendChild(opt);
      });
      row3.appendChild(tantouSelect);

      var row4 = document.createElement('div');
      var searchBtn = document.createElement('button');
      searchBtn.textContent = '検索';
      searchBtn.style.padding = '8px 16px';
      searchBtn.style.marginRight = '6px';
      var clearBtn = document.createElement('button');
      clearBtn.textContent = 'クリア';
      clearBtn.style.padding = '8px 16px';
      row4.appendChild(searchBtn);
      row4.appendChild(clearBtn);

      container.appendChild(row1);
      container.appendChild(row2);
      container.appendChild(row3);
      container.appendChild(row4);
      space.appendChild(container);

      function updateCount() {
        countLabel.textContent = '…';
        var conds = ['数値 = "' + yearSelect.value + '"'];
        if (tantouSelect.value) conds.push('ドロップダウン in ("' + tantouSelect.value + '")');
        kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {app: appId, fields: ['$id'], query: conds.join(' and ') + ' limit 500'}).then(function(r){
          countLabel.textContent = r.records.length + '件';
        });
      }
      updateCount();
      yearSelect.addEventListener('change', updateCount);
      tantouSelect.addEventListener('change', updateCount);

      searchBtn.onclick = function(){
        var conds = [];
        conds.push('数値 = "' + yearSelect.value + '"');
        var nameVal = nameInput.value.trim();
        if (nameVal) conds.push('文字列__1行_ like "' + nameVal.replace(/"/g,'') + '"');
        if (tantouSelect.value) conds.push('ドロップダウン in ("' + tantouSelect.value + '")');
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
