(function() {
    'use strict';
    var APP_ID = kintone.app.getId();
    var CF = '文字列__1行__0';
    var AF = '文字列__1行__6';
    var DF = '文字列__1行__1';

    var st = document.createElement('style');
    st.textContent = '.gaia-argoui-app-viewtoggle,.gaia-argoui-app-filterbutton,.gaia-argoui-app-subtotalbutton{display:none!important}';
    document.head.appendChild(st);

    // app54のセクション見出し（左4pxアクセント＋薄いグレー背景）に合わせた配色。
    // 会社ごとの色分けは今まで通りハッシュで自動割当し、塗りつぶしではなく
    // 左側のアクセントバーだけに色を使う。
    var PAL=['#378ADD','#1D9E75','#D85A30','#D4537E','#7F77DD','#BA7517','#639922','#E24B4A','#888780'];
    function hc(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%100000;return PAL[h%PAL.length];}

    function reorder(row){
        if(!row||row.getAttribute('data-reordered'))return;
        var ch=Array.prototype.slice.call(row.children);
        if(ch.length<3)return;
        var rc=ch[1],ac=ch[ch.length-1];
        row.removeChild(rc);row.insertBefore(rc,ac);
        row.setAttribute('data-reordered','1');
    }
    // スクロール時にkintoneが表示する「固定見出し」は本来の見出しとは別の複製
    // テーブル（.gaia-app-recordlist-fixedheader）を使っており、reorder()で並び替えた
    // 列順が反映されない（生成タイミングが遅く、当初は空のため）。そのままだと
    // スクロール時に見出しと本文の列がズレて見えるので、この複製側も個別に
    // 並び替える。複製は遅れて生成されるため、監視して生成され次第そろえる。
    function reorderFixedHeader(){
        var fh=document.querySelector('.gaia-app-recordlist-fixedheader thead');
        if(fh)reorder(fh);
    }
    function groupify(){
        document.querySelectorAll('.company-banner-row').forEach(function(r){r.remove();});
        var thead=document.querySelector('table thead');
        reorder(thead);
        reorderFixedHeader();
        var rows=Array.prototype.slice.call(document.querySelectorAll('.recordlist-row-gaia'));
        var prev=null;
        rows.forEach(function(row){
            reorder(row);
            var cells=row.querySelectorAll('.recordlist-cell-gaia');
            var cc=cells[1];if(!cc)return;
            var co=row.getAttribute('data-company');
            if(!co){co=cc.textContent.trim();if(co)row.setAttribute('data-company',co);}
            if(!co)return;
            var accent=hc(co);
            if(co!==prev){
                var b=document.createElement('tr');b.className='company-banner-row';
                var td=document.createElement('td');
                td.colSpan=row.children.length;td.textContent=co;
                td.style.cssText='background:#f7f8f5;color:#2b332d;font-weight:700;font-size:13px;padding:10px 14px 10px 10px;border-left:4px solid '+accent+';box-sizing:border-box;';
                b.appendChild(td);row.parentNode.insertBefore(b,row);prev=co;
            }
            cc.textContent='';
        });
    }

    kintone.events.on(['app.record.index.show'],function(event){
        if(!document.getElementById('company-filter-box')){
            var hs=kintone.app.getHeaderMenuSpaceElement();
            if(hs){
                var box=document.createElement('div');
                box.id='company-filter-box';
                box.style.cssText='display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#f5f5f5;border:1px solid #ddd;border-radius:6px;margin:4px 0;flex-wrap:nowrap';
                var lbl=document.createElement('span');
                lbl.textContent='🏢 会社名';
                lbl.style.cssText='font-weight:bold;font-size:13px;color:#333;white-space:nowrap';
                var inp=document.createElement('input');
                inp.type='text';inp.id='company-input';
                inp.placeholder='会社名を入力… (Enterで検索)';
                inp.style.cssText='padding:5px 10px;font-size:14px;border:1px solid #aaa;border-radius:4px;width:140px';
                var sel=document.createElement('select');
                sel.id='company-select';
                sel.style.cssText='padding:5px 10px;font-size:14px;border:1px solid #aaa;border-radius:4px;min-width:140px;cursor:pointer;background:#fff';
                var dopt=document.createElement('option');dopt.value='';
                dopt.textContent='── すべての会社 ──';
                sel.appendChild(dopt);
                var clr=document.createElement('button');
                clr.textContent='✕ クリア';
                clr.style.cssText='padding:5px 10px;font-size:13px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;color:#666';
                var all=[];
                function fo(kw){
                    var cur=sel.value;
                    while(sel.options.length>1)sel.remove(1);
                    var fl=kw?all.filter(function(n){return n.indexOf(kw)!==-1;}):all;
                    fl.forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);});
                    if(fl.length===1)sel.value=fl[0];
                    else if(fl.indexOf(cur)!==-1)sel.value=cur;
                    else sel.value='';
                }
                function nav(co){
                    var base=location.origin+location.pathname;
                    location.href=co?base+'?query='+encodeURIComponent(CF+' = "'+co+'"'):base;
                }
                clr.addEventListener('click',function(){inp.value='';fo('');sel.value='';nav('');});
                inp.addEventListener('input',function(){fo(inp.value.trim());});
                inp.addEventListener('keydown',function(e){
                    if(e.key!=='Enter')return;e.preventDefault();
                    if(sel.value)nav(sel.value);
                    else if(inp.value.trim())location.href=location.origin+location.pathname+'?query='+encodeURIComponent(CF+' like "'+inp.value.trim()+'"');
                    else nav('');
                });
                sel.addEventListener('change',function(){if(sel.value)inp.value='';nav(sel.value);});
                fetch('/k/v1/records.json?app='+APP_ID+'&fields[0]='+CF+'&query=limit%20500',{headers:{'X-Requested-With':'XMLHttpRequest'}})
                .then(function(r){return r.json();}).then(function(resp){
                    if(!resp.records)return;
                    resp.records.forEach(function(r){var n=r[CF]&&r[CF].value;if(n&&all.indexOf(n)===-1)all.push(n);});
                    all.sort();fo('');
                    var p=new URLSearchParams(location.search);
                    var q=p.get('query')||'';
                    var m1=q.match(/文字列__1行__0\s*=\s*"([^"]+)"/);
                    var m2=q.match(/文字列__1行__0\s*like\s*"([^"]+)"/);
                    if(m1)sel.value=m1[1];
                    if(m2){inp.value=m2[1];fo(m2[1]);}
                });
                var addBtn=document.createElement('a');
                addBtn.href='/k/'+APP_ID+'/edit';
                addBtn.textContent='＋ 連絡先追加';
                addBtn.style.cssText='display:inline-block;line-height:18px;padding:6px 14px;font-size:13px;font-weight:bold;border:1px solid #3498db;border-radius:4px;background:#3498db;color:#fff;text-decoration:none;cursor:pointer;white-space:nowrap;box-sizing:border-box;';
                var csvBtn=document.createElement('button');
                csvBtn.textContent='⬇ CSV出力';
                csvBtn.style.cssText='display:inline-block;padding:6px 14px;font-size:13px;font-weight:bold;border:1px solid #27ae60;border-radius:4px;background:#27ae60;color:#fff;cursor:pointer;white-space:nowrap;box-sizing:border-box;';
                csvBtn.addEventListener('click',function(){
                    csvBtn.textContent='読み込み中…';
                    csvBtn.disabled=true;
                    var params=new URLSearchParams(location.search);
                    var cq=params.get('query')||'';
                    var aq=(cq?cq+' and ':'')+'limit 500';
                    var fcs=['文字列__1行_','文字列__1行__0','文字列__1行__1','文字列__1行__2','文字列__1行__3','文字列__1行__4','文字列__1行__5','リンク','文字列__1行__6','文字列__1行__7'];
                    var fq=fcs.map(function(f,i){return'fields['+i+']='+encodeURIComponent(f);}).join('&');
                    fetch('/k/v1/records.json?app='+APP_ID+'&'+fq+'&query='+encodeURIComponent(aq),{headers:{'X-Requested-With':'XMLHttpRequest'}})
                    .then(function(r){return r.json();}).then(function(resp){
                        if(!resp.records){csvBtn.textContent='⬇ CSV出力';csvBtn.disabled=false;return;}
                        var hdrs=['氏名','会社名','部署名','役職','携帯電話','会社電話','会社FAX','メールアドレス','会社住所','メモ'];
                        var rows=[hdrs.map(function(h){return'"'+h+'"';})];
                        resp.records.forEach(function(rec){
                            rows.push(fcs.map(function(fc){
                                var v=rec[fc]&&rec[fc].value?String(rec[fc].value):'';
                                return'"'+v.replace(/"/g,'""')+'"';
                            }));
                        });
                        var csv=String.fromCharCode(0xFEFF)+rows.map(function(r){return r.join(',');}).join('\r\n');
                        var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
                        var url=URL.createObjectURL(blob);
                        var a=document.createElement('a');
                        var now=new Date();
                        var ts=now.getFullYear()+('0'+(now.getMonth()+1)).slice(-2)+('0'+now.getDate()).slice(-2);
                        a.href=url;a.download='連絡先一覧_'+ts+'.csv';a.click();
                        URL.revokeObjectURL(url);
                        csvBtn.textContent='⬇ CSV出力';csvBtn.disabled=false;
                    }).catch(function(){csvBtn.textContent='⬇ CSV出力';csvBtn.disabled=false;});
                });
                box.appendChild(lbl);box.appendChild(inp);box.appendChild(sel);box.appendChild(clr);box.appendChild(addBtn);box.appendChild(csvBtn);
                hs.appendChild(box);
            }
        }
        setTimeout(groupify,300);setTimeout(groupify,800);
        if(!window.__smc34ScrollBound){
            window.__smc34ScrollBound=true;
            window.addEventListener('scroll',reorderFixedHeader,{passive:true});
        }
        return event;
    });

    function getInp(lText){
        var fs=document.querySelectorAll('.control-gaia');
        for(var i=0;i<fs.length;i++){
            var l=fs[i].querySelector('.control-label-gaia');
            if(l&&l.textContent.trim()===lText)return fs[i].querySelector('input')||fs[i].querySelector('textarea');
        }
        return null;
    }
    function mkDl(id){var e=document.getElementById(id);if(e)e.remove();var d=document.createElement('datalist');d.id=id;document.body.appendChild(d);return d;}
    function fillDl(dl,opts){while(dl.firstChild)dl.removeChild(dl.firstChild);opts.forEach(function(v){var o=document.createElement('option');o.value=v;dl.appendChild(o);});}

    kintone.events.on(['app.record.create.show','app.record.edit.show'],function(event){
        fetch('/k/v1/records.json?app='+APP_ID+'&fields[0]='+CF+'&fields[1]='+AF+'&fields[2]='+DF+'&query=limit%20500',{headers:{'X-Requested-With':'XMLHttpRequest'}})
        .then(function(r){return r.json();}).then(function(resp){
            if(!resp.records)return;
            var cd={};
            resp.records.forEach(function(r){
                var co=r[CF]&&r[CF].value,ad=r[AF]&&r[AF].value,dp=r[DF]&&r[DF].value;
                if(!co)return;
                if(!cd[co])cd[co]={a:[],d:[]};
                if(ad&&cd[co].a.indexOf(ad)===-1)cd[co].a.push(ad);
                if(dp&&cd[co].d.indexOf(dp)===-1)cd[co].d.push(dp);
            });
            var ci=getInp('会社名'),ai=getInp('会社住所'),di=getInp('部署名');
            if(!ci)return;
            var dlC=mkDl('ac-company'),dlA=mkDl('ac-address'),dlD=mkDl('ac-dept');
            fillDl(dlC,Object.keys(cd).sort());
            ci.setAttribute('list','ac-company');ci.setAttribute('autocomplete','off');
            if(ai){ai.setAttribute('list','ac-address');ai.setAttribute('autocomplete','off');}
            if(di){di.setAttribute('list','ac-dept');di.setAttribute('autocomplete','off');}
            function onChange(){
                var co=ci.value.trim(),data=cd[co];
                fillDl(dlA,data?data.a:[]);fillDl(dlD,data?data.d:[]);
                if(ai&&data&&data.a.length===1&&!ai.value){ai.value=data.a[0];ai.dispatchEvent(new Event('change',{bubbles:true}));}
            }
            ci.addEventListener('input',onChange);ci.addEventListener('change',onChange);
        });
        return event;
    });
})();