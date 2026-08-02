(function() {
    'use strict';

    // 閲覧専用：モバイル一覧に会社名グループ見出しを表示する（検索・CSV出力・
    // 追加ボタンはデスクトップ版のみ。モバイルはほぼ使わない想定のため実装しない）。
    var CF_CLASS = 'value-5522095'; // 会社名フィールド（文字列__1行__0）のセルクラス

    // レコード番号列（見出し・本文セルとも label/value-5522086）を非表示にする。
    var st = document.createElement('style');
    st.textContent = '.label-5522086,.value-5522086{display:none!important}';
    document.head.appendChild(st);

    // app54のセクション見出し（左4pxアクセント＋薄いグレー背景）に合わせた配色。
    var PAL=['#378ADD','#1D9E75','#D85A30','#D4537E','#7F77DD','#BA7517','#639922','#E24B4A','#888780'];
    function hc(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%100000;return PAL[h%PAL.length];}

    // レコード番号列は<col>で幅も予約されているため、セルを消すだけだと空白列が
    // 残る。列見出し（label-5522086）の位置から対応する<col>を割り出して消す。
    function hideRecordNoCol(table){
        var th=table.querySelector('.label-5522086');
        if(!th)return;
        var idx=Array.prototype.indexOf.call(th.parentNode.children,th);
        var cols=table.querySelectorAll('.gaia-mobile-v2-app-index-recordlist-table-colgroup-col');
        if(cols[idx])cols[idx].style.display='none';
    }

    function groupify(){
        var table=document.querySelector('.gaia-mobile-v2-app-index-recordlist-table');
        if(!table)return;
        hideRecordNoCol(table);
        table.querySelectorAll('.company-banner-row-mobile').forEach(function(r){r.remove();});
        var rows=Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
        var prev=null;
        rows.forEach(function(row){
            var cc=row.querySelector('.'+CF_CLASS);
            if(!cc)return;
            var co=cc.textContent.trim();
            if(!co)return;
            var accent=hc(co);
            if(co!==prev){
                var b=document.createElement('tr');
                b.className='company-banner-row-mobile';
                var td=document.createElement('td');
                td.colSpan=row.children.length;
                td.textContent=co;
                td.style.cssText='background:#f7f8f5;color:#2b332d;font-weight:700;font-size:13px;padding:10px 14px 10px 10px;border-left:4px solid '+accent+';box-sizing:border-box;';
                b.appendChild(td);
                row.parentNode.insertBefore(b,row);
                prev=co;
            }
        });
    }

    kintone.events.on(['mobile.app.record.index.show'],function(event){
        setTimeout(groupify,300);
        setTimeout(groupify,800);
        return event;
    });
})();
