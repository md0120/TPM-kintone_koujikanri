(function() {
'use strict';

// app43「【SMC】⑥工程管理」の自作ガントチャート（表示のみ・フェーズ1）。
// 市販の「kintone 日程・工程・稼働表作成プラグイン」で原因不明・非決定的な行の
// 非表示バグが解消できなかったため、プラグインを廃止し表示ロジックを完全自作する。
// プラグインは無効化済みで #ganttchart は存在しない前提。旧app43_search_desktop.jsは
// 本ファイルに置き換える（両方を同時に有効化しない）。

var FIELD_KOJI = '工事名';
var FIELD_START = '開始日時';
var FIELD_END = '終了日時';
var FIELD_NAIYO = '工程名';
var FIELD_KUBUN = '昼夜区分';
var FIELD_TPM = '主担当';
var FIELD_YEAR = '年度';
var FIELD_HACCHUSHA = '発注者';

// 進捗はapp43自体には存在せず、app37（案件台帳）の進捗ドロップダウンを参照する。
var APP_KOJI_ID = 37;
var FIELD_KOJI_SRC = '文字列__1行_';
var FIELD_PROGRESS_SRC = 'ドロップダウン_1';
var FIELD_TPM_SRC = 'ドロップダウン';
var FIELD_HACCHUSHA_SRC = 'ドロップダウン_0'; // app37「発注者」
var FIELD_SRC_ID = '文字列__1行_'; // app43側「app37レコード番号」フィールド
var FIELD_CHAKKO_MTG_SRC = 'ドロップダウン_3'; // app37「着工打合せ（顧客）」
var FIELD_YEAR_SRC = '数値'; // app37「年度」
var FIELD_SHUBETSU_SRC = '種別'; // app37「種別」

// 工事名一覧を種別（外装・内装・電気・衛生・空調・搬送・通信・発電）でグループ分けし、
// 各グループ内は従来通りの工事名並び順（compareKoji）にする。
var SHUBETSU_ORDER = ['外装', '内装', '電気', '衛生', '空調', '搬送', '通信', '中水', '発電'];

// バーの追加・更新・削除のたびにページ全体をリロードすると連続編集の邪魔になるため、
// render()に渡したspace/stateを覚えておき、ガントチャート部分だけを再描画する。
var currentSpace = null;
var currentState = null;
function refreshGantt() {
if (!currentSpace || !currentState) return;
var oldScrollWrap = document.getElementById('smc-gantt-scroll');
var scrollLeft = oldScrollWrap ? oldScrollWrap.scrollLeft : 0;
var scrollTop = oldScrollWrap ? oldScrollWrap.scrollTop : 0;
var winScrollX = window.scrollX;
var winScrollY = window.scrollY;
render(currentSpace, currentState, function() {
var newScrollWrap = document.getElementById('smc-gantt-scroll');
if (newScrollWrap) {
newScrollWrap.scrollLeft = scrollLeft;
newScrollWrap.scrollTop = scrollTop;
}
window.scrollTo(winScrollX, winScrollY);
});
}

function shubetsuIndex(name) {
var idx = SHUBETSU_ORDER.indexOf(name);
return idx === -1 ? SHUBETSU_ORDER.length : idx; // 未設定は最後尾
}

function sortKojiByShubetsu(kojiList, kojiMeta) {
return kojiList.sort(function(a, b) {
var sa = shubetsuIndex(kojiMeta && kojiMeta[a] ? kojiMeta[a].shubetsu : '');
var sb = shubetsuIndex(kojiMeta && kojiMeta[b] ? kojiMeta[b].shubetsu : '');
if (sa !== sb) return sa - sb;
return compareKoji(a, b);
});
}

var COL_WIDTH = 26;
var ROW_HEAD_WIDTH = 220;
var BAR_HEIGHT = 18;
var MONTH_ROW_HEIGHT = 16; // 見出し1段目（年月）の高さ。2段目（日付・曜日）のsticky top算出に使う
var BAR_GAP = 2;
var ROW_PADDING = 20;
var MONTH_SPAN = 12;

var PRINT_COL_WIDTH = 20;
var PRINT_ROW_HEAD_WIDTH = 300;
var PRINT_BAR_HEIGHT = 14;
var PRINT_BAR_GAP = 2;
var PRINT_ROW_PADDING = 10;

// 印刷ページ右上に表示する会社ロゴ（会社ロゴ.png をBase64で埋め込み、外部通信なしで確実に印刷される）。
var PRINT_LOGO_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAV8AAAArCAYAAADfcYviAAABS2lDQ1BJQ0MgUHJvZmlsZQAAKJF9kL9LQmEUhh9LEUIoIsKhwSGaLMQkWtVCBAcxpR/b9Woa6PXjekPaGmoXamkLW/oLamnoPygIGiKiuTVyKbmdq5VW1AeH9+H9zjm8HBjyaUpV3EDVsMxMIhZYW98IeJ/w4mecSTyaXlfRdDolLXzq99e+xeXozayz6/f/v2+kUKzrom9SEV2ZFrhCwumGpRzeFZ4wJZTwocOlHp86nO/xRbcnm4kLXwuP6WWtIPwoHMwP+KUBrla29Y8MTnpf0citiPqlpkiRIEBONEuGKKskWWL5j5lIdyZODcUOJluUKGPJhqg4igpF4SQGOnMEhcOEpBacW/+8Yd+rtWDxBYabfS9/BOf7EvOu700fw+genF0pzdS+Lutqu+ub8+Ee+2LgebDt5xnwHkCnaduvLdvunMj+e7g03gGUxl0kNbjoOgAAAFZlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA5KGAAcAAAASAAAARKACAAQAAAABAAABX6ADAAQAAAABAAAAKwAAAABBU0NJSQAAAFNjcmVlbnNob3T6Jq9oAAAB1WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40MzwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4zNTE8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpVc2VyQ29tbWVudD5TY3JlZW5zaG90PC9leGlmOlVzZXJDb21tZW50PgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4K+crutgAAH6pJREFUeAHtXQd8VUXWP8lLDy20UENRQECkKLCICCIWVEBslLVgWextddVFQcWyNnSx4q4IIqICoi6K6GIFlA4qCCiQQEiABFJJe3nvzXf+E+fuvPvuq3kE8Lsnv5s7d/o9d+bMmVPmxQgGssHGgI0BGwM2BuoUA7F12prdmI0BGwM2BmwMSAzYxNceCDYGbAzYGDgKGLCJ71FAut2kjQEbAzYGbOJrjwEbAzYGbAwcBQzEHYU2fZoUVVUkKko5PpZEaRFVZ+6kxH4DKSYxmURVBcUkpfiUsSNsDNgYsDFwPGMg5mhaO3jy9lHV+pUkDpeSo1UGOX9eS45GTSimUTOOK6LYps3J0bYjVa//nuI6dWVinESxjZuRo0Wb4xnndt9tDNgYsDFAdc75iorDVP3rVnKuW0GivIxc+7IpLqMjxTZvScRWb7FN0ylp2Eiq/O/HFNuwMTnSmlDxsk8oITebueJiik1vSfGdT6aE7r0ptlkL+xPaGLAxYGPguMRA3XG+bjc5f1xNVetWEsXEUOLAYVQ2azqlXnMbuffsIvK4KfH0oTItJqW+RGZMQiKJ6mqq/OZTEgUHycPE2ZN/gOOcFN+hE8U2akqOdh3IwUQaRNsGGwM2BmwMHC8YqBPiC7FCxWcLyLl5I8U2SKOY+vXJ0aARxZ10CiX06k/CWUUgtKGAOzuLnL9soKrVy0mUFFHSOSMpJjmFEjp3p1hbHBEKCu08NgZsDBwDGDjixNd9IFdytc4NP1A1c7hJg86l+HYnkKeshGW3bSNGgaekmMo/mE2Cueg45nqrd2yl1FHjydGhc8R1WhX86KOPyOPxyKTRo0cz0x5jle24jVu+fDmNHTuWcnNz6eyzz6bPPvuM4uPjj+n3+ec//0mPPPKI/BZTp06l22+//Zjub1107tdff6XNmzfLpuLi4mj48OFH/Dvm5eXRihUrqFevXvTjjz/SCSecQKecckpEr7tu3Tras2ePLJucnCz7H1FFYRTatGkT7drFu26GZs2a0aBBg8IoHYWsULgdKWB5rqhY8YWoWrtcOLdvEc6dW6PeVNn8meLQbWNFxTdLRNnC2cKVnRVSGy6XSwS63G632L59O1yvjevrr78WiA9UDmmBoLi4WEycOFGcfPLJok2bNiIhIcGoX7XVtGlTcdJJJ8mrS5cuomfPnoIHt0+1wfoRKB3vwYNdts+TRzAxk/3o37+/VzuB6gglzasyi4eqqipRXl4uL6fT6ZOjsrJSVFRUyHQkvvXWW7KfV155pRg/frwMz5071ygXSp9CzWNUGkYAeMV7hNqGVT6U5wU/jFaFuOeee7zGUWFhYUjl0Y5VH8xxVpUtWLBAtjllyhR550XcKltIcR07djT636lTJ58y5v5YPYeLs4svvjhgmz6diHLEEVO4QS5bvmguxbVsTc6CfIrv1osSB7BM1wLAHVcs+Yiqt2wgV9YO8rA4ASdOxNarT3FtMmTZpKG8knc52ad0yuXXUVznHuTevZOcG1eTh5VyKRdfyfLgxj559Qj+2MZKq8cHCp911lmBkmVaWloa7du3jxITfcUoc+bMoQceeECmq4qY2FFSUhK/ryCHw0FMkGnLli20YcMGlUXewWWYAXn3799vjg7puT6LfsDFx8bG0saNG2WZbt260RVXXCHD4KImTJgg+8rEgA4ePBhSvSpTkyZNJA7AUTz99NN03nnnqSSv+7hx4wjcNwD4ff/9973STzvtNDpwgOX8jJ9//etf9M4771CHDh3o7bfflvlQFlzwn//8Z8m9t27d2qt8bR7ATTIhCKsKntC0ePHisMqYM6enpxO41xNPPJFmzZol39ecx/zcrl07I6pBgwbUqFEj4zlQAPgbPHhwoCyyH7/99ptPHoxXAPoKiHTHVM16nfz8fFkH/l100UVGGIGdO3dS9+7dveKsHt577z0C/kMFzAEFoeJL5Y/G/YgR3+otG6UVA/EuPb77qZRw6gCf/gpnJRU/9gAdXjCXXPsPISubk/H1+65XuJjtdPLlmkeOxo9Q6vAR1HDyU2yW1t6rroSefamKiX0sW0a4fttKZQtnUeoV17N82f8AbNWqFTGXIgleSkqKpTiBV1fKzMwk3AEg2Myp+uQFYWDuTObDRzSLJr788kt68skn6auvvpL1gEBjgL3++uuELZYOIKbM0RlR2MbNnj2bevfubcSpACapuS30BQTVHK/KqHtOTo4Mpqam0scff0wDBgygZ599ltSAvOuuu2j9+vUqO7Vs2VLWa0QECKAPEGMAcGeuzC/xzc7ONibe3r17fWrFVrSkpETGl5WV0bnnnktffPEFMWcnCTLKX3755TIdxABESH0vn8rCjMC3DhfwTWqzAOi4wzfCYo0FiXcAxiJl7hO+t/6tUAfEZfXq1ZM4UvmRLyMjw2tBwTs2b95cZbG8YyG1AoUfMA8AjKVI4Ntvv6XSUtj518All1yigsadd0hG2F9AiQf9pZvj1eKBeD1sznfEnvlDRR08FeWi8OE7RNn7b4mqDd9b1l+1caXI6d1WZDLTt6ddosg5pTlf6SKnB9/1C/E900X2ifVFZirnbV9flC+abVlnxbLFouipv4vyzxaKqk1rLPOEE8mrsWAO1tiaWG39g9V36qmnGuX5I8owE1/BXKW47bbbxKWXXip4sMmLORCfvKeffrp47LHHxP333y9++eWXYM2FnL5o0SKftngyiZUrV8o6mNgb6RdccEHI9aqMl112mVG+R48eKtrnPmzYMCPf+eef75Petm1bI50XB5kOkYzCJXNEgomzT7njOaJFixbG+5155pnyVbZu3WrEqXeP9P7cc88dU+iBGE69CzNFPn2DOAHip2AXRD7hAOagaveMM84Ip2hU8kad8xXFhVS15jvmOhuyPe9PlDx8FL+fNzi3rKZ9Zw8kTwFRYncWDziY1eXVuoY2eeetIVfMzTF3mtAxkZxZB2n/JRMofYGTUi77i1fm+K49uC72kmNlnHPjKgJHHAyuueYayVFg5Q22tWbZq0914GIbNmxITGTlltgsbgDnDAAXogBtgZv1ByovuNfvv/9eXsj78ssvS6VK+/bt/RUNOZ7lyl55H374YcmhKs4XuwEFeL9wQd/GKQ4p3DrM+SHOATAhopdeekly4rfeeqs523H/zDPbeAeFO3CnGKtIM+9qEIetv869QVQEQBw43jfeeMOo84knnpDf2oiIMIAdCUQsrMcw5gAvjHJH+e6771K/fv2oc+fgCvBPPvnE6AEvxkZYBfC+5nml0oLdWZ9Ar732muwT8kI5iN2TGQ4dOmSOOuLPUSe+LpbfegoPUvKoceTa/jOblXlPXDhK5F0+mhwsm0sd1ZMqV6wkdx5TYT5lIoZ3ebgoFrIHvrNYgLUB7GKMMEenJVPqiLPJtSOL8m+ZSK269ZXyYIUlR6t2bFlBVPrGNEro0p2qd22n+I5dVLLP/fnnnyfIYRX07dvXZwD/9NNPxjYWIgCdKGGbs2bNGrkFzsrKkrI5bN11gCxLn0x6WqCwmmAg3hjEBQUFhG33559/TjfeeGOgoiGlHT582CvfnXfeaYgcvBL4IZQtn7kMxDDRBkWIUO+xaOEA2WWkck+FKzAASsyCuMaNa3QXuAdasFV5qzsrxryI75AhQ6yyhR33888/Eys+jXJYCMEggNjfcsstUpTAuzt66KGHCOIYK1i2bJkhokI68kcTMG/uvfdeo0pYgVgRX8i0IfaCHqWuIOrE1531K7FlA7kO5lHqJVf5vEfJ9KlUvZUVUn0yKK5VR0pf/A+q+mE5OdcuJ1fuXvIUsSyvkicuVvh4lq8yB+1o0YoSe/WjpLMvoPKFbzNR38VKOaKiqfdQs/e+9GoDxD6OTdncRQXkWf4Fxbc/kal2jWLAKyM/KE4K8ddff73XAFV5IZNVMkSY05iBRQLE2l4ZrSsNVD4MxNoAzHcw8TCIADp3U5t6zQQV8kVw8XUNapFBu0pxo/dBf189r54HYeAekwoE0F++QByiuT7kRdtLly6V8m5zunrGYjtv3jxJMBG2kleqvKHcwQXqC1cwZViwOh9//HGaPHmykY3FOMQWI8YzZMVKx2CFNzAY0HUAD2Yw6yvU+EE9d9xxB4HDBjFGezfccAM99dRTUmei16MTRjAZYICiCeCYsZNUzAYUwFaAOQ6TS5jO1RVEnfjG9ziVHJ3Y4YE/gCPdW/MMolr+nwUU1zaBrRKKqIg/jKe0hBpP58EwoWb7KDy85aosYw6W7+x4EaMpPYofvYeKXnqe3Y7rUXxGPapct4rce7PI0aa9ga/Yho0o5aKxzDGz40Ysv97/dnBGHhXQuVgobiD4hxIOAKIJLbsuxH/11VcJFgEqDpNz27ZtqjovrlhFgnBCORQt0IlRberUrScwiYIpXWrTVqCyamFDHqW40fPrnKTCu56uwthewm4z2gAREZSNVgCCf9999xlJLDeUYYwJlAGnbiZQRmY/AZbHeqUowugVGcIDFleIKXTrESgjf/jhB68dDjhtWHUEAn2s6PmsiLVKB9GHhcukSZMkQXvhhRdo4cKFkgsFYQZAEa0zNOZ3V3XV5o4+6v0MNH9Y3yF3mejfwIED5bfzt2tV8cqqJ5I+Rp34OlpmkDWfSewI8Qu52GQqJjWZYhOSKCEjkYpnzKHqndsp/ZNVsv8xsSxvSPmffFS91MGrL6TSt5dQYjfWvMZzt3lFrs7Jp6rvv6KUK65T2eQ9tpn1Fscrk+kBGnRcgSAS+SJMXzB41ccKVL9VGgYLVuNoEnC0A/MdBeBYjhbx1TlwJW9W/cJdXyB1jlDPgzCI3ddffy0XT32y6fmU7BPmagC0xzbCXvJ4lR/fC/XoJlwqTd11rhRtKxx+8803dPPNN0tzL5T/8MMPQzIXA4cKM0MF2FXpsnMVH+wOkzxwncppAflhxgcLCJih6cAKPWJFrh7lE/Ynb1XcpCpgrhtOCzBle/HFF6XoAQwOxFvoB4jy3XffrYpKQn0knBywKOvjxp/+AkQUct+1a9fSVVddZfQrWADvMmrUqGDZLNOjSnw9BWyLytwmbGxhu+tgIogjIVlNyfLapiSK2X7XzRxpDJuk8OBm1pQSuzan8s9X08HrR1LTmf+x7GTR5Jup9F0mvCezkggiBHDFAL65Wb4M8LAtMbk9fNhOOnm4bRzUI9tm1+ZQzn3AdkfZuMoK+V9RUZE0v1LKC6yI2LbpgO0YVnB/8Oabb/pLCjketqaK+MLkKBqgvKFQF8yPjhboJkas5ffphq4YVDjwycQR4DKHhCDLhE2zIr4gxiNHjrSqLmAcOFuYt0HxBwCXp7d90003SYIGpSDGEGy5V69eHZAAQ2SBehRA8QRZaTjw73//W5ov6mZnMHtDP+CdaQXgzLt27WqVFDROeYepjLBLtgLMGxAoiPYwV7BQ4VKAbwy59JEA7E703ZXVGEO7ffr0kQsWFmPsoCCGU/M+UL+UTD5QHn9pUSW+rqyd5DlcQklnnkeuTN7KuF3yCEhwvIl9z5R2uDFxrEzjQ3SIuGkQYNasJXZuQqXvLKakwS9Rvatv9+pr5befUdG0Gaw4Y8Udc4E64YWSztGkxkbRuYmPo2zVWhJa509r+cyHUWxt8QvLkA/J/nhV+vuDznVhm6HLn1T+adOmqSBNnz7dCKsAuAJFfPX6VDpseTEBzYAttuLQUA5hpVCC6ANx4HoxwHfs2GEUV9yVERFhANtPBeecc44K1vkdoh0FVpO3ffv2KjlihxKjAg7ocn7gF4uZlbhDL6PC2MGAi8MWGhwVAHa4Dz74oMpi3JEPOwq4P4MAwI4aW2yz4kkphOBMoYBN7qSbt3oOdAdRh502xAtmYohyENuAiwf3F64IJFC7SMM2XQfMIX+AHQCUa6+88orEFywkFABXVrselV6bu9lZycpeHvVDyQkGLNoy50B9jyrxdbRsQ242MwPENExjrvSQPKfXvfNXEj36UhxbIMQ1b0HVe3OYSLJhNogvLhYjxDVPosIpD7C8dgwT7BqCigN3Cu+dyGZrzPDCGYFFDQo8PJgcafXkWRGI85QUUuKgYXwm8DrJ8SLOnbm95qhKPFiAPumgFICyBoMAih8QQwwQXc6IlRucBAYzCCS2XfPnzzdqtlIYgQuKBmAiX3jhhWF58Phr95lnnjE4aeSJRJzir+5w4tl9W4pkVBmriYHJMHPmTJlFl6+rMuHe9a04tpr6GDDXBYKFLTksWj799FN5qTwQB8B8i+20VZTP/dFHH5VjCIs2Fhm8C+SraHPVqlX0wQcfyHdTHD2cFP72t78RzP78AcYkdBMQRUFMpstMVRn1XuDeYIWDPmL8XHfddVJGHa0FHOeAKIAuJJR64VykKwBRHosZu9FL7lPVF627vqgBBzi/5JgBJiRRhdK3XhbugnzBbr6ibNEcWXfpnFdF2dwZMlz0zCSxK46k44SXMwU7UmTyD1cUTrrJ6E/JzBfELj5VMqent+NFbq8WIjOFRP5VNUb5letWiJLXnpLlyj6YLap+XCvDJS8+JvtiVGgKsAxK4FwD5l55BaixKI7kzhyrPIeB5XWmFoTgSSZ48grmTuTFLpCCOWWB8xtUW8wNCN4yGs9M4AXLngTLDgXOLWCZoWB7X5+6I43gQWi0xdtny2qYizHywAkkXGB3X6M8HE2sgM38jDy8fZPnZpjzsYeckQf4grNBbQBnZSi8w8HDDOxh6PVtVF7cWaYpmHDK8lbnD5jrUs8s2jDa7NChg4BjiF4vE3IBfPEORxXxuuPb4+wGnLuhl1Nh1MdmkEYaHBVYnCPYukDo31rlh3MP8FobYPduoz3Uy7a0QavDHFB9wJ0ZHeMZc4gXo6B1hJOBxS9G/WgPjko6TNCcLMxnmuj5jlQYXFxUoWTG0wYhBPGs2rxeeJxV4tDNlwlPeZlsK6dPa5GVxkSViahBgNm7LbtDqtjTqYEk3Mi4b1g3sZvFxl6eb1xmdyuSl2v3Tlnfob+MFlUbf5CEtujJ+2Rc5Yr/iuJpU2Q42L/du3dL7xkMchA+fYCAKOCZBfVe8SCeS5YskYeSMHcRsAkQUOYMBMvW5IRAZpazGvWx/EuWRx7VNhupyzh4taFPmOwoE6wtWSjAP5ZNGm3wNlTwltgyd10QXxZ3GH1huaBlPxDJ5zsY+VhJ4zdfsASWcxv1AM9Wnl7Mocr24PEE70NMWBAa5lgFKykN4gsiGg7oRB9tw0uPuUCBhZcVPQGrYo7Zq98YCyzDFSwnFiAwgBkzZhh52LTKqA+LCZ+fIQ9xAlFWBG/o0KHCilkwCgYIYMzo8wGH4gQDPt/D6B/eHwsDDnZicYRXPNveB6sq5HQWYxl1867COJxJVfCHI74giPnX1LijurIzRcG918p3LX3rFXHg0kEy7NqzU+xumyqyGv7OASu3YnC/7I4Owsl2umI36+hyuqXVEGjkAeFlYpzZgH8EY+l8WRc45cLJt9aE+V62YJYMH7rxUnnSmXwI4R/LZQXcYBXxY9mc4G2VQSTBnfDWUxJRlQcTkJ0gAtbOsluBD6/KsKxV5sdEUHGYgAA+Vs+IQxrLA2U8a4GN+EhXaPSD7WCNelB/IE5DJ75wFQ4Xrr76aqMtK86Xt81GOvoSyEX4u+++M/Ji0rM4INzuyPy6WzK+J3ASDoBYqG8WLvEFEVRlcWdtf8hNs4mWYHtZ6fqtxoS58CO/n0qHuoEjFmWYsxgnpbEiSS4k6FO4AIKtu3yjPXa28FsNdpdwG1fvjl0mi2uM/CxGEcClSsedFY1GeiQBvJfuHo86wSiZ4Q9HfPGCRVPvNsQHxc9PMYhjPnOoBy6r8VX3FOeL3AFdas52aMNEtkczyeGCIy5+9iEBYv0/4txc7OmQIsUSezo35SMqv5F4LPz7RLFvSFcZhrgjf8JFMoxjJvPGnyvDofzD0Xhs0mQMAHC74IYB+qCA7zgmvnnwsVLNbzMYSKoOfcLqxJflUkZ5+PKr/CCACnROA5xYqIA+Y0uoc9qoX58AVnWxgsjoBzincEH312dNsldxcE76+QXB+oLC7NVn9IeN8b3qC/aABRKcrMIr7hDlhAvYhag69G8Zaj3YzajyuGMbHi0wE18wE9EEcP3YnegiOjAVbO1j2QwWNhw1qThtvC++gRW3jQXFvOPErgOLRDiAXQvwoHarCtf+5ucfkviy44TI6dNKVCxdJHGXd8UQUfj3G2vCY4eK7B5thTsvTz6XzXtD5PY7QWQ1JklsM1nGm9u/vdg3tLuUDYMAZzUikd09nYnyI8a32H9Of5HTL0M+l380lw/paSn4gHaBM4SzuzURzm2bjbyBAmzh4DUhMKlYayyL4A5ZlPqI4MAA2CbqMjakswePTDP/A4elyoN7AbDpiwBnreIh+9QBAxSX2lIiDXJjlR931UcQV9SHO2vgpSwP3DW2oThf1TyoIdoA1xkMdLkkCCW2ieDQWTMd8EIebIf1BYq99IzmWFkk9IUHEzRU0A/rwVbcSgTDClIBbgoiBpz9y+aDXgsrcMfOMqE26ZWvtsQXlYGoqO8I+TFbX3i1EelDpMQXTAbGFnZdGG+4Y3xgccK3xqJnFnug/2AMcN61GbA7YMcTwco34z0xp4ItsOCQseBj3EFEg/KKKUGdqo/oHy6ICLETBWOBRQH90Qk9+oixDr2JP/hDEl+8bMV3S8Vu5mid22q2JLmDOou8ccMlHoqfnSp2d2gs8saOFGySxtSoSlStWi7K3n6duea/ioK7rhYFd14pCh+6VZTOnM7ig88F/3KFcBcXcNqNYk/HpiL/hhpurPjpKcwVJwtXTo3cNbtzA8EuzP7wLeNBqLDl1okAPtbgwYOlokIVBsfEFgzGIDIrvXRFCsqDO2X/e0NxxJpVo6wuhwOx1DkINqcS7I0krr32WqlYgXwMF5spydPPMEigcGHtuWBbUIEFg20RZTfZ1EkSF51zR1/MFw5kZ627erWgd8hWzXVE+sxadtkea7WNOrH4gDiGCyAy+jdhjb9RBQgu8OyvnyNGjJCT2CgQZkAnvvhmkYK+8GIMhiv+sGqXLSSM94ZiMFTO1zyG/eFOxUNOb7XzgpjDLNYC8eNfHTHEHVb9DhSn9BH6gqX6EeiOkwBDWWAx51Q94e6mAvU71LSomprxixiQNOg8Snt4GuUO6EEtFn9JLb9js6IRZ9De7hnUbPZ71Hr8lVT8xKO0b/hA/gHMBpTYrz/F8Y9iOviXjOPbdWRzXnaYcMSRu+AQVS6ZT0XsWuxiE7XE3gMo/cMlBLO2/UP7scdcDrXdVS7Ny7IzUvk8idFU/47JRj+sAjDXYS5WHtAMm0qYlbVne1KzUTsTaS8DbZ4kXtXBvhJ2wMrYHgdzwPYRhvswa4FtI3za+WNIMzFVGPalcBvllV1GwRwIVzBAPWZAn5TNKdLgEcbctjSJw4lSOImNuQLiAWkuGvAZhw6hPA4WgrE5cGTVvlUlKi8vMBLHOGQFAM8rACuxpH0s+hkuwAxrzJgx8oB2HDQD7zFlp4z+wfwPply89ZQOMXAggAkb8kTqTKD6qH9/q7OHVb5gdxzmhMPfMb5w3jFsgXUHi2DlrdJhL6wANqu6iaSKt7rDPAz2v3A4Ud8XtsE4DwE45J2TxBv/8oo8dB1njVgBbNFh+gZzOTgr4YwL86HoVuUCxSkHG72PyI93g1kn2sI8Qx8xVtFHjHUcgBUK6G7Tuv13KGWjkSeGEe47o6NR8+91lL7yJB2a9CCl/fUBavjwP+jwrNeo4NFJlHhSV2pwy+3SDtf543pybdtM/BNA8swHwc4ZgBgmUjGpbHfbqi3F8XkRiaf1Z+Pdaip9cyaVf7WM6o8ZT2nPvkoVi96nA38ZSw3GjKPGr877vWX/N7wyCEQwgPcVb9+NQclKJPLnIaPXFWr9OKGMuSlpX6yXtwpjcoCI6e62yAfCCEcBNXngqAGidywCbwHlIS3R8qiDjSsIGLyTAJiUOPkN7w88RBtgjwsvMgAWDpZrR9wEbIjheYWxwgqikI5eDNQY7IbBUABAPDFWQhkHWFBwYfwA0B+UxwIWDoB4wTUXhxuFWzZYO/oYR170EcS3tk4jWCzUeSAg4FgQ6xKOOPHFy1R+u5TyrhrHB+I0pOZvzqOEvn+i4ien8A9gvkNudj9O6t2Hz97tzYS4NTl4FRYYCIxgebmcfOTkAapm4ly5dg0fEFFNyUPO51+0eJwrdlLetWOoatNqavzEC1R/4l11iTu7LRsDNgZsDESMgTohvqp3B28YQ4c/nM/uxJ2p4d33E05Ac+36Tf4MfPWObeTJ3882ZCxCAOfLtDeGD0anpGRyNG1OOBoy4bQBFNe9J3n2ZlHJK+ziyV4+yX86g5rNmc8ec9YnT6m27buNARsDNgaOJQzUKfHFi7tzs6hw0l1UvgyuiR5K6tmHks44i38EsxvFptacZiakvoiPguM/GeajKKv53AhWylHlGv6RzPJSSmJCnDb1OUroE54s81hCvt0XGwM2Bv7/YqDOia+O6opP5lPZonfJuWkdecr4lxX4OMlYlvN6wPEy4Y1lGZ6H5WIszOMft0jiXy/uTskjLqfU0eP5FzL4wAcbbAzYGLAxcJxi4KgSXx1noqqSPPuyybUvl0QpHz7OMl8o23A0ZFyrdhSj/QaaXs4O2xiwMWBj4HjEwDFDfI9H5Nl9tjFgY8DGQKQYqLEvibS0Xc7GgI0BGwM2BiLCgE18I0KbXcjGgI0BGwO1w4BNfGuHP7u0jQEbAzYGIsKATXwjQptdyMaAjQEbA7XDgE18a4c/u7SNARsDNgYiwoBNfCNCm13IxoCNARsDtcPA/wFZPkY4rlj0aQAAAABJRU5ErkJggg==';




var KUBUN_COLOR = {
'昼': '#333333',
'夜': '#c0392b',
'工事予定': '#2e7d32'
};

var HOLIDAYS = new Set('2020-01-01,2020-01-13,2020-02-11,2020-02-23,2020-02-24,2020-03-20,2020-04-29,2020-05-03,2020-05-04,2020-05-05,2020-05-06,2020-07-23,2020-07-24,2020-08-10,2020-09-21,2020-09-22,2020-11-03,2020-11-23,2021-01-01,2021-01-11,2021-02-11,2021-02-23,2021-03-20,2021-04-29,2021-05-03,2021-05-04,2021-05-05,2021-07-22,2021-07-23,2021-08-08,2021-08-09,2021-09-20,2021-09-23,2021-11-03,2021-11-23,2022-01-01,2022-01-10,2022-02-11,2022-02-23,2022-03-21,2022-04-29,2022-05-03,2022-05-04,2022-05-05,2022-07-18,2022-08-11,2022-09-19,2022-09-23,2022-10-10,2022-11-03,2022-11-23,2023-01-01,2023-01-02,2023-01-09,2023-02-11,2023-02-23,2023-03-21,2023-04-29,2023-05-03,2023-05-04,2023-05-05,2023-07-17,2023-08-11,2023-09-18,2023-09-23,2023-10-09,2023-11-03,2023-11-23,2024-01-01,2024-01-08,2024-02-11,2024-02-12,2024-02-23,2024-03-20,2024-04-29,2024-05-03,2024-05-04,2024-05-05,2024-05-06,2024-07-15,2024-08-11,2024-08-12,2024-09-16,2024-09-22,2024-09-23,2024-10-14,2024-11-03,2024-11-04,2024-11-23,2025-01-01,2025-01-13,2025-02-11,2025-02-23,2025-02-24,2025-03-20,2025-04-29,2025-05-03,2025-05-04,2025-05-05,2025-05-06,2025-07-21,2025-08-11,2025-09-15,2025-09-23,2025-10-13,2025-11-03,2025-11-23,2025-11-24,2026-01-01,2026-01-12,2026-02-11,2026-02-23,2026-03-20,2026-04-29,2026-05-03,2026-05-04,2026-05-05,2026-05-06,2026-07-20,2026-08-11,2026-09-21,2026-09-22,2026-09-23,2026-10-12,2026-11-03,2026-11-23,2027-01-01,2027-01-11,2027-02-11,2027-02-23,2027-03-21,2027-03-22,2027-04-29,2027-05-03,2027-05-04,2027-05-05,2027-07-19,2027-08-11,2027-09-20,2027-09-23,2027-10-11,2027-11-03,2027-11-23,2028-01-01,2028-01-10,2028-02-11,2028-02-23,2028-03-20,2028-04-29,2028-05-03,2028-05-04,2028-05-05,2028-07-17,2028-08-11,2028-09-18,2028-09-22,2028-10-09,2028-11-03,2028-11-23,2029-01-01,2029-01-08,2029-02-11,2029-02-12,2029-02-23,2029-03-20,2029-04-29,2029-04-30,2029-05-03,2029-05-04,2029-05-05,2029-07-16,2029-08-11,2029-09-17,2029-09-23,2029-09-24,2029-10-08,2029-11-03,2029-11-23,2030-01-01,2030-01-14,2030-02-11,2030-02-23,2030-03-20,2030-04-29,2030-05-03,2030-05-04,2030-05-05,2030-05-06,2030-07-15,2030-08-11,2030-08-12,2030-09-16,2030-09-23,2030-10-14,2030-11-03,2030-11-04,2030-11-23'.split(','));

function pad2(n) {
return n < 10 ? '0' + n : '' + n;
}

function fmtISO(d) {
return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function startOfDay(d) {
return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d, n) {
var r = new Date(d);
r.setDate(r.getDate() + n);
return r;
}

function daysBetween(a, b) {
return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}

// 工事名の先頭文字の種類で並び順を決める：記号→数字→アルファベット→ひらがな→カタカナ→漢字。
// 案件台帳_検索ボックス.js（app37）で確立した並び順ロジックと同じもの。
function charCategory(ch) {
if (!ch) return 0;
if (/[0-9０-９]/.test(ch)) return 1;
if (/[a-zA-Zａ-ｚＡ-Ｚ]/.test(ch)) return 2;
if (/[ぁ-ゟ]/.test(ch)) return 3;
if (/[ァ-ヿ]/.test(ch)) return 4;
if (/[一-鿿]/.test(ch)) return 5;
return 0;
}

function compareKoji(a, b) {
var ca = charCategory(a.charAt(0)), cb = charCategory(b.charAt(0));
if (ca !== cb) return ca - cb;
return a.localeCompare(b, 'ja');
}

function esc(s) {
return s.replace(/"/g, '\\"');
}

function getCurrentFiscalYear() {
var d = new Date();
var y = d.getFullYear();
var m = d.getMonth() + 1;
return m >= 4 ? y : y - 1;
}

function parseState() {
var params = new URLSearchParams(location.search);
var year = params.get('smc_year') || '';
var tpmRaw = params.get('smc_tpm') || '';
var tpm = tpmRaw ? tpmRaw.split(',') : []; // 主担当：チェックボックス複数選択のため配列
var hacchushaRaw = params.get('smc_hacchusha') || '';
var hacchusha = hacchushaRaw ? hacchushaRaw.split(',') : []; // 発注者：チェックボックス複数選択のため配列
var koji = params.get('smc_koji') || '';
var progress = params.get('smc_progress') || '';
var offset = parseInt(params.get('smc_offset') || '0', 10) || 0;
return { year: year, tpm: tpm, hacchusha: hacchusha, koji: koji, progress: progress, offset: offset };
}

function buildUrl(year, tpm, koji, progress, offset, hacchusha) {
var url = new URL(location.href);
var tpmArr = Array.isArray(tpm) ? tpm : (tpm ? [tpm] : []);
var hacchushaArr = Array.isArray(hacchusha) ? hacchusha : (hacchusha ? [hacchusha] : []);
if (year) url.searchParams.set('smc_year', year); else url.searchParams.delete('smc_year');
if (tpmArr.length) url.searchParams.set('smc_tpm', tpmArr.join(',')); else url.searchParams.delete('smc_tpm');
if (hacchushaArr.length) url.searchParams.set('smc_hacchusha', hacchushaArr.join(',')); else url.searchParams.delete('smc_hacchusha');
if (koji) url.searchParams.set('smc_koji', koji); else url.searchParams.delete('smc_koji');
if (progress) url.searchParams.set('smc_progress', progress); else url.searchParams.delete('smc_progress');
if (offset) url.searchParams.set('smc_offset', offset); else url.searchParams.delete('smc_offset');
return url.toString();
}

function fetchDistinct(appId, field, cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: appId,
query: 'limit 500',
fields: [field]
}).then(function(resp) {
var seen = {};
var vals = [];
resp.records.forEach(function(r) {
var v = r[field].value;
if (v && !seen[v]) {
seen[v] = true;
vals.push(v);
}
});
cb(vals);
});
}

function fetchRecords(year, tpm, koji, cb, hacchusha) {
var conds = [];
if (year) conds.push(FIELD_YEAR + ' = "' + esc(year) + '"');
var tpmArr = Array.isArray(tpm) ? tpm : (tpm ? [tpm] : []);
if (tpmArr.length) {
var tpmOrs = tpmArr.map(function(t) { return FIELD_TPM + ' = "' + esc(t) + '"'; }).join(' or ');
conds.push(tpmArr.length > 1 ? '(' + tpmOrs + ')' : tpmOrs);
}
var hacchushaArr = Array.isArray(hacchusha) ? hacchusha : (hacchusha ? [hacchusha] : []);
if (hacchushaArr.length) {
var hacchushaOrs = hacchushaArr.map(function(h) { return FIELD_HACCHUSHA + ' = "' + esc(h) + '"'; }).join(' or ');
conds.push(hacchushaArr.length > 1 ? '(' + hacchushaOrs + ')' : hacchushaOrs);
}
if (koji) conds.push(FIELD_KOJI + ' like "*' + esc(koji) + '*"');
var query = conds.join(' and ') + (conds.length ? ' ' : '') + 'limit 500';
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: query,
fields: ['$id', FIELD_KOJI, FIELD_START, FIELD_END, FIELD_NAIYO, FIELD_KUBUN]
}).then(function(resp) {
cb(resp.records);
});
}

// 進捗（app37の進捗ドロップダウン）に一致する工事名の集合を取得する。
function fetchProgressKoji(progress, cb) {
if (!progress) { cb(null); return; }
// 「工事中」は完成のみを除外した全件（未着手・調査・工事中など、完成以外すべて）を表す。
var cond = (progress === '工事中') ?
FIELD_PROGRESS_SRC + ' not in ("完成")' :
FIELD_PROGRESS_SRC + ' in ("' + esc(progress) + '")';
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_KOJI_ID,
query: cond + ' limit 500',
fields: [FIELD_KOJI_SRC]
}).then(function(resp) {
var set = {};
resp.records.forEach(function(r) { set[r[FIELD_KOJI_SRC].value] = true; });
cb(set);
});
}

// 工事名列（rowhead）の色分け用に、app37の「着工打合せ（顧客）」「進捗」を
// 工事名をキーにしたマップとして取得する。
function fetchKojiMeta(cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_KOJI_ID,
query: 'limit 500',
fields: [FIELD_KOJI_SRC, FIELD_CHAKKO_MTG_SRC, FIELD_PROGRESS_SRC, FIELD_SHUBETSU_SRC]
}).then(function(resp) {
var map = {};
resp.records.forEach(function(r) {
map[r[FIELD_KOJI_SRC].value] = {
chakkoMtg: r[FIELD_CHAKKO_MTG_SRC].value,
progress: r[FIELD_PROGRESS_SRC].value,
shubetsu: r[FIELD_SHUBETSU_SRC] ? r[FIELD_SHUBETSU_SRC].value : ''
};
});
cb(map);
});
}

// 工事名クリックで開くapp37レコード詳細ポップアップ用に、該当工事名の
// app37レコード1件をまるごと取得する。
function fetchKojiDetail(koji, cb) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_KOJI_ID,
query: FIELD_KOJI_SRC + ' = "' + esc(koji) + '" limit 1'
}).then(function(resp) {
cb(resp.records[0] || null);
});
}

var KOJI_DETAIL_FIELDS = [
{ code: 'ドロップダウン_1', label: '進捗' },
{ code: 'ドロップダウン', label: 'TPM担当' },
{ code: '文字列__複数行_', label: '協力会社' },
{ code: '日付', label: '工期（着手）' },
{ code: '日付_0', label: '工期（完成）' },
{ code: 'ドロップダウン_0', label: '発注者' },
{ code: 'ドロップダウン_2', label: '顧客担当' },
{ code: 'ドロップダウン_3', label: '着工打合せ（顧客）' }
];

// 工事名をクリックした時に開く、app37レコード詳細のポップアップ。
// モーダルのように背景をブロックせず、他の場所をクリックするだけで閉じられる
// 簡易的な吹き出し形式にする。
function openKojiDetailPopup(koji, e) {
closeKojiDetailPopup();

var popup = document.createElement('div');
popup.id = 'smc-koji-popup';
popup.style.cssText = 'position:fixed;z-index:100001;background:#fff;border:1px solid #999;border-radius:6px;padding:12px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-size:12px;min-width:240px;max-width:360px;';

var closeBtn = document.createElement('span');
closeBtn.textContent = '✕';
closeBtn.style.cssText = 'position:absolute;top:6px;left:10px;cursor:pointer;color:#999;font-size:14px;line-height:1;';
closeBtn.addEventListener('click', function(e) {
e.stopPropagation();
closeKojiDetailPopup();
});
popup.appendChild(closeBtn);

var title = document.createElement('div');
title.textContent = koji;
title.style.cssText = 'font-weight:bold;margin-bottom:8px;font-size:13px;padding-left:16px;';
popup.appendChild(title);

var loading = document.createElement('div');
loading.textContent = '読み込み中…';
loading.style.color = '#666';
popup.appendChild(loading);

document.body.appendChild(popup);
positionKojiPopup(popup, e);

fetchKojiDetail(koji, function(record) {
if (!document.getElementById('smc-koji-popup')) return; // 取得中に閉じられた場合
loading.remove();
if (!record) {
var none = document.createElement('div');
none.textContent = 'app37に該当レコードが見つかりませんでした。';
none.style.color = '#666';
popup.appendChild(none);
return;
}
KOJI_DETAIL_FIELDS.forEach(function(f) {
var row = document.createElement('div');
row.style.cssText = 'display:flex;margin-bottom:4px;';
var label = document.createElement('div');
label.textContent = f.label;
label.style.cssText = 'width:110px;flex-shrink:0;color:#666;white-space:nowrap;';
var value = document.createElement('div');
value.textContent = (record[f.code] && record[f.code].value) || '';
row.appendChild(label);
row.appendChild(value);
popup.appendChild(row);
});
positionKojiPopup(popup, e);
});

// このクリックイベント自体で即座に閉じてしまわないよう、少し遅らせて
// 「ポップアップの外側をクリックしたら閉じる」リスナーを登録する。
setTimeout(function() {
document.addEventListener('click', onOutsideKojiPopupClick);
}, 0);
}

function positionKojiPopup(popup, e) {
var x = e.clientX + 8;
var y = e.clientY + 8;
var rect = popup.getBoundingClientRect();
if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8;
if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8;
popup.style.left = Math.max(8, x) + 'px';
popup.style.top = Math.max(8, y) + 'px';
}

function onOutsideKojiPopupClick(e) {
var popup = document.getElementById('smc-koji-popup');
if (popup && !popup.contains(e.target)) closeKojiDetailPopup();
}

function closeKojiDetailPopup() {
var popup = document.getElementById('smc-koji-popup');
if (popup) popup.remove();
document.removeEventListener('click', onOutsideKojiPopupClick);
}

// app37の全レコード（工事名・主担当）を読み込み、app43側の「app37レコード番号」
// （FIELD_SRC_ID）で対応するレコードを特定して工事名・主担当を一括更新する。
// app37の編集画面には常設せず、ここ（app43側）でボタンを押した時だけ動く方式にすることで、
// 同期忘れが起きないようにする（app37→app43の一方向・手動トリガーのみ）。
function syncFromApp37(onDone) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_KOJI_ID,
query: 'limit 500',
fields: ['レコード番号', FIELD_KOJI_SRC, FIELD_TPM_SRC, FIELD_HACCHUSHA_SRC]
}).then(function(resp37) {
var byId37 = {};
resp37.records.forEach(function(r) {
byId37[r['レコード番号'].value] = {
koji: r[FIELD_KOJI_SRC].value,
tpm: r[FIELD_TPM_SRC].value,
hacchusha: r[FIELD_HACCHUSHA_SRC].value
};
});
return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: 'limit 500',
fields: ['$id', FIELD_SRC_ID, FIELD_KOJI, FIELD_TPM, FIELD_HACCHUSHA]
}).then(function(resp43) {
var updates = [];
resp43.records.forEach(function(r) {
var src = byId37[r[FIELD_SRC_ID].value];
if (!src) return;
if (r[FIELD_KOJI].value !== src.koji || r[FIELD_TPM].value !== src.tpm || r[FIELD_HACCHUSHA].value !== src.hacchusha) {
updates.push({
id: r.$id.value,
record: {
'工事名': { value: src.koji },
'主担当': { value: src.tpm },
'発注者': { value: src.hacchusha }
}
});
}
});
if (updates.length === 0) {
onDone(0);
return;
}
var batches = [];
for (var i = 0; i < updates.length; i += 10) {
batches.push(updates.slice(i, i + 10));
}
var chain = Promise.resolve();
batches.forEach(function(batch) {
chain = chain.then(function() {
return kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', {
app: kintone.app.getId(),
records: batch
});
});
});
chain.then(function() { onDone(updates.length); });
});
});
}

// app37の年度から、JST 4/1 00:00〜23:59をkintoneのDATETIME形式（UTC）で返す。
// 案件登録時_工程表自動作成.js（app37）のダミーレコード作成ロジックと同じもの。
function dummyScheduleRange(year) {
var y = parseInt(year, 10);
if (!y) return null;
var start = new Date(Date.UTC(y, 2, 31, 15, 0, 0));
var end = new Date(Date.UTC(y, 3, 1, 14, 59, 0));
function fmt(d) {
return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()) +
'T' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ':00Z';
}
return { start: fmt(start), end: fmt(end) };
}

// app37に登録されている全工事のうち、app43側に紐づくレコードが1件も無いものへ
// ダミーレコード（工程名＝ダミー、昼夜区分＝工事予定）を補完作成する。
// 誤ってダミーバーを削除してしまった場合の復旧、または新規登録の取りこぼし救済用。
function createMissingDummyRecords(onDone) {
kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: APP_KOJI_ID,
query: 'limit 500',
fields: ['レコード番号', FIELD_KOJI_SRC, FIELD_TPM_SRC, FIELD_YEAR_SRC, FIELD_HACCHUSHA_SRC]
}).then(function(resp37) {
return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
app: kintone.app.getId(),
query: 'limit 500',
fields: [FIELD_SRC_ID]
}).then(function(resp43) {
var existingIds = {};
resp43.records.forEach(function(r) {
if (r[FIELD_SRC_ID].value) existingIds[r[FIELD_SRC_ID].value] = true;
});
var toCreate = [];
resp37.records.forEach(function(r) {
var srcId = r['レコード番号'].value;
if (existingIds[srcId]) return;
var koji = r[FIELD_KOJI_SRC].value;
if (!koji) return;
var year = r[FIELD_YEAR_SRC].value;
var tpm = r[FIELD_TPM_SRC].value;
var hacchusha = r[FIELD_HACCHUSHA_SRC].value;
var range = dummyScheduleRange(year);
var rec = {
'工事名': { value: koji },
'年度': { value: year },
'主担当': { value: tpm },
'発注者': { value: hacchusha },
'昼夜区分': { value: '工事予定' },
'工程名': { value: 'ダミー' }
};
rec[FIELD_SRC_ID] = { value: String(srcId) };
if (range) {
rec['開始日時'] = { value: range.start };
rec['終了日時'] = { value: range.end };
}
toCreate.push(rec);
});
if (toCreate.length === 0) {
onDone(0);
return;
}
var batches = [];
for (var i = 0; i < toCreate.length; i += 10) {
batches.push(toCreate.slice(i, i + 10));
}
var chain = Promise.resolve();
batches.forEach(function(batch) {
chain = chain.then(function() {
return kintone.api(kintone.api.url('/k/v1/records.json', true), 'POST', {
app: kintone.app.getId(),
records: batch
});
});
});
chain.then(function() { onDone(toCreate.length); });
});
});
}

var ROWHEAD_WIDTH_STORAGE_KEY = 'smc_gantt_rowhead_width';
var ROWHEAD_MIN_WIDTH = 100;
var ROWHEAD_MAX_WIDTH = 500;

function applyRowheadWidth() {
var saved = parseInt(localStorage.getItem(ROWHEAD_WIDTH_STORAGE_KEY) || '', 10);
var width = (saved && saved >= ROWHEAD_MIN_WIDTH && saved <= ROWHEAD_MAX_WIDTH) ? saved : ROW_HEAD_WIDTH;
document.documentElement.style.setProperty('--smc-rowhead-w', width + 'px');
}

// 工事名列と日付列の境界（ヘッダー右端の細い領域）をドラッグして、
// 工事名列の表示幅を変更できるようにする。幅はlocalStorageに保存し、次回表示時も維持する。
function enableRowheadResize(monthHead) {
var handle = document.createElement('div');
handle.className = 'smc-rowhead-resizer';
monthHead.appendChild(handle);

handle.addEventListener('mousedown', function(e) {
if (e.button !== 0) return;
e.preventDefault();
e.stopPropagation();
var startX = e.clientX;
var startWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--smc-rowhead-w'), 10) || ROW_HEAD_WIDTH;

function onMove(ev) {
var newWidth = startWidth + (ev.clientX - startX);
newWidth = Math.max(ROWHEAD_MIN_WIDTH, Math.min(ROWHEAD_MAX_WIDTH, newWidth));
document.documentElement.style.setProperty('--smc-rowhead-w', newWidth + 'px');
}

function onUp() {
document.removeEventListener('mousemove', onMove);
document.removeEventListener('mouseup', onUp);
var finalWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--smc-rowhead-w'), 10);
if (finalWidth) localStorage.setItem(ROWHEAD_WIDTH_STORAGE_KEY, String(finalWidth));
}

document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);
});
}

function applyLayoutStyle() {
if (document.getElementById('smc-gantt-style')) return;
var style = document.createElement('style');
style.id = 'smc-gantt-style';
style.textContent =
'table.recordlist-gaia { display: none !important; }' +
// kintone標準の「一覧表示切替」「絞り込み」「集計」ボタン群は、独自描画のガントチャートには
// 意味を持たないため非表示にする。ビューは月次ガントチャートのみになったため、
// ビュー切り替えドロップダウンも合わせて不要。
'.gaia-argoui-app-viewtoggle, .gaia-argoui-app-filterbutton, .gaia-argoui-app-subtotalbutton, select.datespan { display: none !important; }' +
'.gaia-argoui-app-toolbar, .gaia-argoui-app-index-toolbar { min-height: 0 !important; height: auto !important; padding: 0 !important; margin: 0 !important; }' +
'#smc-gantt-root { font-size: 12px; }' +
'#smc-gantt-filter { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 4px 12px 4px 12px; margin-top: 0; transform: scale(0.8); transform-origin: left top; }' +
'.smc43-cb-wrap { position: relative; display: inline-block; }' +
'.smc43-cb-btn { font-size: 13px; padding: 4px 10px; border: 1px solid #999; border-radius: 4px; background: #fff; cursor: pointer; white-space: nowrap; }' +
'.smc43-cb-btn.smc43-cb-active { border-color: #3b82f6; color: #2563eb; font-weight: bold; }' +
// position:fixedで#smc-gantt-filter（transform:scale(0.8)指定）の外（document.body直下）に
// 表示する。transformを持つ祖先の内側にposition:absoluteで置くと、Chromeの描画バグで
// チェックボックスのテキストだけが描画されない現象が起きるため。
'.smc43-cb-panel { position: fixed; background: #fff; border: 1px solid #999; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); padding: 8px; z-index: 100000; min-width: 140px; max-height: 260px; overflow-y: auto; }' +
'.smc43-cb-option { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 4px 2px; white-space: nowrap; cursor: pointer; }' +
'.smc43-cb-option:hover { background: #f0f4f8; }' +
'.smc43-cb-btnrow { display: flex; justify-content: space-between; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #ddd; }' +
'.smc43-cb-btnrow button { font-size: 12px; padding: 4px 10px; border-radius: 4px; cursor: pointer; }' +
'.smc43-cb-clear { border: 1px solid #aaa; background: #fff; color: #555; }' +
'.smc43-cb-apply { border: none; background: #3b82f6; color: #fff; font-weight: bold; }' +
'.smc-gantt-toolbtn { border: 1px solid #999 !important; border-radius: 4px !important; }' +
'.kintone-app-headermenu-space { display: block !important; width: 100% !important; }' +
'#smc-gantt-root { max-width: 95vw; }' +
'#smc-gantt-scroll { overflow: auto; max-height: 70vh; max-width: 95vw; border-top: 1px solid #ccc; }' +
'table#smc-gantt-table { border-collapse: collapse; table-layout: fixed; }' +
'table#smc-gantt-table th, table#smc-gantt-table td { border: 1px solid #ddd; box-sizing: border-box; padding: 0; }' +
'table#smc-gantt-table th.smc-rowhead, table#smc-gantt-table td.smc-rowhead {' +
'position: sticky; left: 0; z-index: 5; background: #fff;' +
'width: var(--smc-rowhead-w, ' + ROW_HEAD_WIDTH + 'px); min-width: var(--smc-rowhead-w, ' + ROW_HEAD_WIDTH + 'px); max-width: var(--smc-rowhead-w, ' + ROW_HEAD_WIDTH + 'px);' +
'text-align: left; padding: 2px 6px; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' +
'}' +
'table#smc-gantt-table thead th { position: sticky; top: 0; z-index: 4; background: #f2f2f2; font-size: 10px; text-align: center; }' +
'table#smc-gantt-table th.smc-month-th { overflow: hidden; white-space: nowrap; text-overflow: clip; }' +
// 月（年月）行と日付・曜日行の2段見出しはどちらもposition:stickyでtop:0のままだと
// 縦スクロール時に同じ位置へ重なり合い、後段（日付・曜日）が前段（年月）を覆い隠して
// 見えなくなる。月行の高さを明示的に固定した上で、日付・曜日行はその高さぶんだけ
// topをずらし、2段とも表示され続けるようにする（smc-rowheadはrowSpan=2で全体に
// またがるのでtop:0のままでよい）。
'table#smc-gantt-table thead tr:first-child th:not(.smc-rowhead) { height: ' + MONTH_ROW_HEIGHT + 'px; box-sizing: border-box; }' +
'table#smc-gantt-table thead tr:last-child th { top: ' + MONTH_ROW_HEIGHT + 'px; }' +
'table#smc-gantt-table thead th.smc-rowhead { z-index: 6; }' +
'.smc-rowhead-resizer { position: absolute; top: 0; right: 0; bottom: 0; width: 6px; cursor: col-resize; z-index: 7; }' +
'.smc-koji-header-label { font-size: 150%; font-weight: bold; }' +
'.smc-koji-legend { position: absolute; right: 6px; bottom: 3px; text-align: right; line-height: 1.3; font-size: 11px; font-weight: normal; pointer-events: none; }' +
'.smc-koji-legend-red { color: #c0392b; }' +
'.smc-koji-legend-black { color: #000; }' +
'table#smc-gantt-table td.smc-day-cell { width: ' + COL_WIDTH + 'px; min-width: ' + COL_WIDTH + 'px; max-width: ' + COL_WIDTH + 'px; position: relative; }' +
'td.smc-holiday { background-color: #fdecea !important; }' +
'td.smc-saturday { background-color: #eaf2fd !important; }' +
'.smc-bar { position: absolute; top: 0; z-index: 2; height: ' + BAR_HEIGHT + 'px; border-radius: 2px; color: #fff; font-size: 9px; line-height: ' + BAR_HEIGHT + 'px; padding: 0 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: move; box-sizing: border-box; user-select: none; }' +
'.smc-bar-handle { position: absolute; top: 0; bottom: 0; width: 6px; cursor: ew-resize; z-index: 3; }' +
'.smc-bar-handle-left { left: 0; }' +
'.smc-bar-handle-right { right: 0; }' +
'#smc-bar-tooltip { position: fixed; z-index: 100000; background: #e0e0e0; color: #000; padding: 6px 10px; border-radius: 6px; font-size: 12px; line-height: 1.5; white-space: pre-line; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: none; max-width: 280px; }' +
'#smc-bar-tooltip::after { content: ""; position: absolute; top: 100%; left: 16px; border: 6px solid transparent; border-top-color: #e0e0e0; }';
document.head.appendChild(style);
}

// バーにカーソルを乗せた時に表示する吹き出し（カスタムツールチップ）。
// ネイティブのtitle属性によるツールチップは表示まで時間がかかり見た目も調整できないため、
// 自前のポップアップ要素を1つだけ使い回し、mouseenter/mousemoveで表示・追従させる。
function getBarTooltip() {
var tip = document.getElementById('smc-bar-tooltip');
if (!tip) {
tip = document.createElement('div');
tip.id = 'smc-bar-tooltip';
document.body.appendChild(tip);
}
return tip;
}

function showBarTooltip(e, text) {
var tip = getBarTooltip();
tip.textContent = text;
tip.style.display = 'block';
positionBarTooltip(e);
}

function positionBarTooltip(e) {
var tip = document.getElementById('smc-bar-tooltip');
if (!tip || tip.style.display === 'none') return;
var x = e.clientX + 12;
var y = e.clientY + 16;
var rect = tip.getBoundingClientRect();
if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8;
if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 12;
tip.style.left = x + 'px';
tip.style.top = y + 'px';
}

function hideBarTooltip() {
var tip = document.getElementById('smc-bar-tooltip');
if (tip) tip.style.display = 'none';
}

function closeAllTpmPanels(except) {
document.querySelectorAll('.smc43-cb-panel').forEach(function(p) {
if (p !== except) p.style.display = 'none';
});
}

// Excelライクなチェックボックス複数選択ドロップダウンを構築する（主担当・発注者共通）。
// applyBtnを押した時点でonApply(選択中の値の配列)を呼ぶ。
function buildTpmCheckboxDropdown(container, fieldKey, label, choices, currentValues, onApply) {
container.innerHTML = '';
// パネルはdocument.body直下に置く（containerの外）ため、containerをクリアしただけでは
// 前回分のパネルが残ってしまう。再構築のたびに必ず「このフィールド分の」古いパネルだけを
// 片付ける（他フィールドのパネルまで巻き込んで消さないようdata-fieldで区別する）。
document.querySelectorAll('.smc43-cb-panel[data-field="' + fieldKey + '"]').forEach(function(p) { p.remove(); });
var wrap = document.createElement('div');
wrap.className = 'smc43-cb-wrap';

var btn = document.createElement('button');
btn.type = 'button';
btn.className = 'smc43-cb-btn';
function updateBtnLabel() {
btn.textContent = currentValues.length ? label + '（' + currentValues.length + '）' : label;
btn.classList.toggle('smc43-cb-active', currentValues.length > 0);
}
updateBtnLabel();

var panel = document.createElement('div');
panel.className = 'smc43-cb-panel';
panel.setAttribute('data-field', fieldKey);
panel.style.display = 'none';

choices.forEach(function(c) {
var optLabel = document.createElement('label');
optLabel.className = 'smc43-cb-option';
var cb = document.createElement('input');
cb.type = 'checkbox';
cb.value = c;
cb.checked = currentValues.indexOf(c) !== -1;
optLabel.appendChild(cb);
optLabel.appendChild(document.createTextNode(c));
panel.appendChild(optLabel);
});

var btnRow = document.createElement('div');
btnRow.className = 'smc43-cb-btnrow';

var clearBtn = document.createElement('button');
clearBtn.type = 'button';
clearBtn.className = 'smc43-cb-clear';
clearBtn.textContent = 'クリア';
clearBtn.addEventListener('click', function() {
panel.querySelectorAll('input[type=checkbox]').forEach(function(cb) { cb.checked = false; });
});

var applyBtn = document.createElement('button');
applyBtn.type = 'button';
applyBtn.className = 'smc43-cb-apply';
applyBtn.textContent = '適用';
applyBtn.addEventListener('click', function() {
var vals = Array.prototype.map.call(panel.querySelectorAll('input[type=checkbox]:checked'), function(cb) { return cb.value; });
onApply(vals);
});

btnRow.appendChild(clearBtn);
btnRow.appendChild(applyBtn);
panel.appendChild(btnRow);

btn.addEventListener('click', function(e) {
e.stopPropagation();
var isOpen = panel.style.display !== 'none';
closeAllTpmPanels(null);
if (!isOpen) {
var r = btn.getBoundingClientRect();
panel.style.top = r.bottom + 'px';
panel.style.left = r.left + 'px';
}
panel.style.display = isOpen ? 'none' : 'block';
});

// パネル内（チェックボックス等）のクリックがdocumentまで伝播すると、
// 全パネルを閉じるドキュメント全体のクリックリスナーが反応してしまい、
// チェックのたびにパネルが閉じてしまう。パネル内クリックは伝播を止める。
panel.addEventListener('click', function(e) { e.stopPropagation(); });

wrap.appendChild(btn);
document.body.appendChild(panel);
container.appendChild(wrap);
}
document.addEventListener('click', function() { closeAllTpmPanels(null); });

function buildFilterUi(space, state, allKoji, onchange) {
var wrap = document.createElement('div');
wrap.id = 'smc-gantt-filter';

var yearLabel = document.createElement('span');
yearLabel.textContent = '年度';
wrap.appendChild(yearLabel);

var yearSelect = document.createElement('select');
wrap.appendChild(yearSelect);

var tpmLabel = document.createElement('span');
tpmLabel.textContent = '主担当';
tpmLabel.style.marginLeft = '8px';
wrap.appendChild(tpmLabel);

// 主担当はプルダウン単一選択から、Excelのようなチェックボックス複数選択に変更。
// 選択肢（fetchDistinctの結果）が届くまでは空のプレースホルダーとして用意しておき、
// 届き次第buildTpmCheckboxDropdown()で中身を差し込む。
var tpmWrap = document.createElement('span');
wrap.appendChild(tpmWrap);

var hacchushaLabel = document.createElement('span');
hacchushaLabel.textContent = '発注者';
hacchushaLabel.style.marginLeft = '8px';
wrap.appendChild(hacchushaLabel);

var hacchushaWrap = document.createElement('span');
wrap.appendChild(hacchushaWrap);

var progressLabel = document.createElement('span');
progressLabel.textContent = '表示';
progressLabel.style.marginLeft = '8px';
wrap.appendChild(progressLabel);

var progressSelect = document.createElement('select');
wrap.appendChild(progressSelect);
['全件', '工事中'].forEach(function(p) {
var opt = document.createElement('option');
opt.value = p === '全件' ? '' : p;
opt.textContent = p;
if (opt.value === state.progress) opt.selected = true;
progressSelect.appendChild(opt);
});

var kojiLabel = document.createElement('span');
kojiLabel.textContent = '工事名';
kojiLabel.style.marginLeft = '8px';
wrap.appendChild(kojiLabel);

var kojiInput = document.createElement('input');
kojiInput.type = 'text';
kojiInput.placeholder = '工事名で検索';
kojiInput.value = state.koji;
wrap.appendChild(kojiInput);

var clearBtn = document.createElement('button');
clearBtn.type = 'button';
clearBtn.textContent = 'クリア';
wrap.appendChild(clearBtn);

var syncSpacer = document.createElement('span');
syncSpacer.textContent = '　'; // 全角スペース1文字分の空白
wrap.appendChild(syncSpacer);

var syncBtn = document.createElement('button');
syncBtn.type = 'button';
syncBtn.className = 'smc-gantt-toolbtn';
syncBtn.textContent = '同期';
syncBtn.title = 'app37（案件台帳）の工事名・主担当を読み込んでapp43へ反映します';
syncBtn.style.marginRight = '8px';
syncBtn.style.backgroundColor = '#ffe0b2';
syncBtn.addEventListener('click', function() {
syncBtn.disabled = true;
syncBtn.textContent = '同期中…';
syncFromApp37(function(count) {
syncBtn.disabled = false;
syncBtn.textContent = '同期';
alert(count + '件を更新しました。' + (count > 0 ? '画面を再読み込みします。' : ''));
if (count > 0) location.reload();
});
});
wrap.appendChild(syncBtn);

var fillDummyBtn = document.createElement('button');
fillDummyBtn.type = 'button';
fillDummyBtn.className = 'smc-gantt-toolbtn';
fillDummyBtn.textContent = 'ダミー補完';
fillDummyBtn.title = 'app37の全工事のうち、app43に1件もレコードが無いものへダミーレコードを作成します';
fillDummyBtn.style.marginRight = '8px';
fillDummyBtn.style.backgroundColor = '#fff9c4';
fillDummyBtn.addEventListener('click', function() {
if (!confirm('app37の全工事を確認し、app43に紐づくレコードが1件も無い工事へダミーレコードを作成します。よろしいですか？')) return;
fillDummyBtn.disabled = true;
fillDummyBtn.textContent = '補完中…';
createMissingDummyRecords(function(count) {
fillDummyBtn.disabled = false;
fillDummyBtn.textContent = 'ダミー補完';
alert(count + '件のダミーレコードを作成しました。' + (count > 0 ? '画面を再読み込みします。' : ''));
if (count > 0) location.reload();
});
});
wrap.appendChild(fillDummyBtn);

var printBtn = document.createElement('button');
printBtn.type = 'button';
printBtn.className = 'smc-gantt-toolbtn';
printBtn.textContent = '印刷';
printBtn.style.marginLeft = '8px';
printBtn.style.backgroundColor = '#f3e5f5';
printBtn.addEventListener('click', function() {
printBtn.disabled = true;
printBtn.textContent = '準備中…';
// ドラッグ編集直後など、画面上のバー位置と読み込み済みキャッシュがずれている
// 可能性があるため、印刷直前に必ず最新データを取得し直す。
// 印刷は画面のスクロール位置（offset）に関係なく、選択中の年度の4月〜翌年3月を対象にする。
var range = computeFiscalYearRange(state.year);
fetchProgressKoji(state.progress, function(progressSet) {
fetchRecords(state.year, state.tpm, state.koji, function(records) {
if (progressSet) {
records = records.filter(function(r) { return progressSet[r[FIELD_KOJI].value]; });
}
fetchKojiMeta(function(kojiMeta) {
printBtn.disabled = false;
printBtn.textContent = '印刷';
openPrintRangeModal(range, records, kojiMeta);
});
}, state.hacchusha);
});
});
wrap.appendChild(printBtn);

var navWrap = document.createElement('span');
// 行全体（#smc-gantt-filter）を80%に縮小済みのため、ここでは重ねて縮小しない。
// #smc-gantt-filter全体は既に80%に縮小済みのため、ここでの追加倍率は
// 「全体80%」×「追加0.8125」＝実際の見た目65%になるよう逆算した値にする。
navWrap.style.cssText = 'display:inline-flex;align-items:center;margin-left:12px;transform:scale(0.8125);transform-origin:left center;';
wrap.appendChild(navWrap);

var prevBtn = document.createElement('button');
prevBtn.type = 'button';
prevBtn.textContent = '◀ 前へ';
navWrap.appendChild(prevBtn);

var rangeLabel = document.createElement('span');
rangeLabel.id = 'smc-gantt-range-label';
rangeLabel.style.margin = '0 6px';
rangeLabel.style.fontWeight = 'bold';
navWrap.appendChild(rangeLabel);

var nextBtn = document.createElement('button');
nextBtn.type = 'button';
nextBtn.textContent = '次へ ▶';
navWrap.appendChild(nextBtn);

var todayBtn = document.createElement('button');
todayBtn.type = 'button';
todayBtn.textContent = '今月';
todayBtn.style.marginLeft = '8px';
navWrap.appendChild(todayBtn);

space.appendChild(wrap);

fetchDistinct(kintone.app.getId(), FIELD_YEAR, function(years) {
years.sort(function(a, b) { return Number(b) - Number(a); });
var defaultYear = state.year;
if (!defaultYear) {
var fy = String(getCurrentFiscalYear());
defaultYear = years.some(function(y) { return String(y) === fy; }) ? fy : (years[0] || '');
}
var allOpt = document.createElement('option');
allOpt.value = '';
allOpt.textContent = 'すべて';
if (!defaultYear) allOpt.selected = true;
yearSelect.appendChild(allOpt);
years.forEach(function(y) {
var opt = document.createElement('option');
opt.value = y;
opt.textContent = y + '年度';
if (String(y) === String(defaultYear)) opt.selected = true;
yearSelect.appendChild(opt);
});
if (state.year !== defaultYear) {
location.href = buildUrl(defaultYear, state.tpm, state.koji, state.progress, state.offset, state.hacchusha);
}
});

fetchDistinct(kintone.app.getId(), FIELD_TPM, function(tpms) {
tpms.sort();
buildTpmCheckboxDropdown(tpmWrap, 'tpm', '主担当', tpms, state.tpm, function(vals) {
applyFilterChange(vals, undefined);
});
});

fetchDistinct(kintone.app.getId(), FIELD_HACCHUSHA, function(list) {
list.sort();
buildTpmCheckboxDropdown(hacchushaWrap, 'hacchusha', '発注者', list, state.hacchusha, function(vals) {
applyFilterChange(undefined, vals);
});
});

function applyFilterChange(tpmOverride, hacchushaOverride) {
var tpmVal = tpmOverride !== undefined ? tpmOverride : state.tpm;
var hacchushaVal = hacchushaOverride !== undefined ? hacchushaOverride : state.hacchusha;
location.href = buildUrl(yearSelect.value, tpmVal, kojiInput.value.trim(), progressSelect.value, state.offset, hacchushaVal);
}
yearSelect.addEventListener('change', function() { applyFilterChange(); });
progressSelect.addEventListener('change', function() { applyFilterChange(); });
kojiInput.addEventListener('keydown', function(e) {
if (e.key === 'Enter') applyFilterChange();
});
clearBtn.addEventListener('click', function() {
location.href = buildUrl('', '', '', '', state.offset, '');
});
prevBtn.addEventListener('click', function() {
location.href = buildUrl(state.year, state.tpm, state.koji, state.progress, state.offset - 1, state.hacchusha);
});
nextBtn.addEventListener('click', function() {
location.href = buildUrl(state.year, state.tpm, state.koji, state.progress, state.offset + 1, state.hacchusha);
});
todayBtn.addEventListener('click', function() {
location.href = buildUrl(state.year, state.tpm, state.koji, state.progress, 0, state.hacchusha);
});
}

// 「今日を含む週の月曜日」から7日前＝先週の月曜日を返す。
function getLastWeekMonday(baseDate) {
var d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
var daysSinceMonday = (d.getDay() + 6) % 7; // 月曜=0, 日曜=6
var thisMonday = addDays(d, -daysSinceMonday);
return addDays(thisMonday, -7);
}

function computeDateRange(offset) {
// offset=0（初期表示・「今月」ボタン）だけ「先週の月曜日」始まりにする。
// 月送り（前へ／次へ）でoffsetが0以外になった瞬間、通常の「その月の1日」始まりに戻る。
if (offset === 0) {
var anchor = getLastWeekMonday(new Date());
var end0 = new Date(anchor.getFullYear(), anchor.getMonth() + MONTH_SPAN, anchor.getDate());
var days0 = [];
var cur0 = new Date(anchor);
while (cur0 <= end0) {
days0.push(new Date(cur0));
cur0 = addDays(cur0, 1);
}
return { start: anchor, end: end0, days: days0 };
}
var today = new Date();
var start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
var end = new Date(start.getFullYear(), start.getMonth() + MONTH_SPAN, 0);
var days = [];
var cur = new Date(start);
while (cur <= end) {
days.push(new Date(cur));
cur = addDays(cur, 1);
}
return { start: start, end: end, days: days };
}

// 印刷用：画面のスクロール位置（offset）に関係なく、指定年度の4月〜翌年3月を対象にする。
// 過去年度分もこれで印刷できるようにする。
function computeFiscalYearRange(fiscalYear) {
var y = parseInt(fiscalYear, 10);
if (!y) y = getCurrentFiscalYear();
var start = new Date(y, 3, 1);
var end = new Date(y + 1, 2, 31);
var days = [];
var cur = new Date(start);
while (cur <= end) {
days.push(new Date(cur));
cur = addDays(cur, 1);
}
return { start: start, end: end, days: days };
}

function buildHeaderRows(days) {
var monthRow = document.createElement('tr');
var dayRow = document.createElement('tr');

var monthHead = document.createElement('th');
monthHead.className = 'smc-rowhead';
monthHead.rowSpan = 2;

var monthHeadLabel = document.createElement('span');
monthHeadLabel.className = 'smc-koji-header-label';
monthHeadLabel.textContent = '工事名';
monthHead.appendChild(monthHeadLabel);

// 工事名の色分け条件（赤＝着打ち前／黒＝着打ち済）の凡例。見出しセルの右下に配置。
var legend = document.createElement('div');
legend.className = 'smc-koji-legend';
var legendRed = document.createElement('div');
legendRed.className = 'smc-koji-legend-red';
legendRed.textContent = '工事名：着打ち前';
var legendBlack = document.createElement('div');
legendBlack.className = 'smc-koji-legend-black';
legendBlack.textContent = '工事名：着打ち済';
legend.appendChild(legendRed);
legend.appendChild(legendBlack);
monthHead.appendChild(legend);

enableRowheadResize(monthHead);
monthRow.appendChild(monthHead);

var i = 0;
while (i < days.length) {
var m = days[i].getMonth();
var y = days[i].getFullYear();
var span = 0;
while (i + span < days.length && days[i + span].getMonth() === m) span++;
var th = document.createElement('th');
// 表示範囲の先頭・末尾が月initial/月末にかかると、その月の表示日数が1〜2日しか
// 無いことがある。この場合「2026-08」のような長いラベルがセル幅からはみ出し、
// 隣の月の日付列に重なって「線と日付枠がズレて見える」原因になる。表示できる
// 日数が少ない時は短い表記（例：8月）に切り替え、はみ出しも保険としてCSSで防ぐ。
th.textContent = span >= 3 ? (y + '-' + pad2(m + 1)) : ((m + 1) + '月');
th.className = 'smc-month-th';
th.colSpan = span;
monthRow.appendChild(th);
i += span;
}

var WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];
days.forEach(function(d) {
var th = document.createElement('th');
th.textContent = d.getDate() + '\n' + WEEKDAY[d.getDay()];
th.style.whiteSpace = 'pre';
var iso = fmtISO(d);
if (d.getDay() === 0 || HOLIDAYS.has(iso)) th.classList.add('smc-holiday');
else if (d.getDay() === 6) th.classList.add('smc-saturday');
dayRow.appendChild(th);
});

var thead = document.createElement('thead');
thead.appendChild(monthRow);
thead.appendChild(dayRow);
return thead;
}

function assignSlots(bars) {
// 開始日が早い順に並べ、重ならない最初の空きスロットへ割り当てる。
var sorted = bars.slice().sort(function(a, b) { return a.startIdx - b.startIdx; });
var slotEnds = [];
sorted.forEach(function(bar) {
var slot = 0;
while (slot < slotEnds.length && slotEnds[slot] > bar.startIdx) slot++;
bar.slot = slot;
slotEnds[slot] = bar.endIdx + 1;
});
var maxSlot = 0;
sorted.forEach(function(b) { maxSlot = Math.max(maxSlot, b.slot); });
return maxSlot + 1;
}

// 空セルクリックで開く簡易フォーム（フェーズ2：新規バー作成）。
// ドラッグでの範囲指定はフェーズ3で対応する。ここではクリックした日を
// 開始日・終了日の初期値にし、ユーザーが手入力で調整する方式にする。
function openNewBarModal(koji, clickedDate, clickedEndDate) {
if (document.getElementById('smc-newbar-modal')) return;

var overlay = document.createElement('div');
overlay.id = 'smc-newbar-modal';
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';

var box = document.createElement('div');
box.style.cssText = 'background:#fff;padding:20px;border-radius:8px;min-width:320px;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-size:13px;';

var title = document.createElement('div');
title.textContent = '新規工程を追加';
title.style.cssText = 'font-weight:bold;margin-bottom:10px;font-size:14px;';
box.appendChild(title);

function row(labelText) {
var r = document.createElement('div');
r.style.cssText = 'margin-bottom:8px;';
var label = document.createElement('div');
label.textContent = labelText;
label.style.cssText = 'margin-bottom:2px;color:#666;';
r.appendChild(label);
box.appendChild(r);
return r;
}

var kojiRow = row('工事名');
var kojiText = document.createElement('div');
kojiText.textContent = koji;
kojiText.style.cssText = 'font-weight:bold;';
kojiRow.appendChild(kojiText);

var dateIso = fmtISO(clickedDate);
var endDateIso = fmtISO(clickedEndDate || clickedDate);

var startRow = row('開始日');
var startInput = document.createElement('input');
startInput.type = 'date';
startInput.value = dateIso;
startInput.style.width = '100%';
startRow.appendChild(startInput);

var endRow = row('終了日');
var endInput = document.createElement('input');
endInput.type = 'date';
endInput.value = endDateIso;
endInput.style.width = '100%';
endRow.appendChild(endInput);

var naiyoRow = row('立会者および詳細');
var naiyoInput = document.createElement('input');
naiyoInput.type = 'text';
naiyoInput.style.width = '100%';
naiyoInput.style.boxSizing = 'border-box';
naiyoRow.appendChild(naiyoInput);

var kubunRow = row('昼・夜／工事予定');
var kubunSelect = document.createElement('select');
['昼', '夜', '工事予定'].forEach(function(k) {
var opt = document.createElement('option');
opt.value = k;
opt.textContent = k;
kubunSelect.appendChild(opt);
});
kubunRow.appendChild(kubunSelect);

var btnRow = document.createElement('div');
btnRow.style.cssText = 'text-align:right;margin-top:12px;';

var cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.textContent = 'キャンセル';
cancelBtn.style.marginRight = '8px';
cancelBtn.addEventListener('click', function() { overlay.remove(); });

var saveBtn = document.createElement('button');
saveBtn.type = 'button';
saveBtn.textContent = '追加';
saveBtn.addEventListener('click', function() {
if (!startInput.value || !endInput.value) {
alert('開始日・終了日を入力してください');
return;
}
if (startInput.value > endInput.value) {
alert('開始日は終了日より前にしてください');
return;
}
saveBtn.disabled = true;
createBarRecord(koji, startInput.value, endInput.value, naiyoInput.value.trim(), kubunSelect.value)
.then(function() {
overlay.remove();
refreshGantt();
})
.catch(function(e) {
saveBtn.disabled = false;
alert('追加に失敗しました：' + (e.message || e));
});
});

btnRow.appendChild(cancelBtn);
btnRow.appendChild(saveBtn);
box.appendChild(btnRow);

overlay.appendChild(box);
document.body.appendChild(overlay);
}

// 開始日・終了日（YYYY-MM-DD、JSTのカレンダー日付として扱う）を、
// JST 00:00〜23:59のkintone DATETIME形式（UTC）に変換して新規レコードを作成する。
// 日付（YYYY-MM-DD、JSTのカレンダー日付として扱う）を、
// JST 00:00／23:59に対応するkintone DATETIME形式（UTC）へ変換する。
function toUtcStart(dateStr) {
var parts = dateStr.split('-').map(Number);
var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] - 1, 15, 0, 0));
return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
function toUtcEnd(dateStr) {
var parts = dateStr.split('-').map(Number);
var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 14, 59, 0));
return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function createBarRecord(koji, startDateStr, endDateStr, naiyo, kubun) {
// 工事名はapp37へのルックアップフィールドのため、値を設定すると
// 年度・主担当はkintoneが自動的にapp37から複写する（ここで明示指定は不要）。
var record = {};
record[FIELD_KOJI] = { value: koji };
record[FIELD_START] = { value: toUtcStart(startDateStr) };
record[FIELD_END] = { value: toUtcEnd(endDateStr) };
record[FIELD_NAIYO] = { value: naiyo };
record[FIELD_KUBUN] = { value: kubun };
return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
app: kintone.app.getId(),
record: record
});
}

function updateBarRecord(recordId, startDateStr, endDateStr, naiyo, kubun) {
var record = {};
record[FIELD_START] = { value: toUtcStart(startDateStr) };
record[FIELD_END] = { value: toUtcEnd(endDateStr) };
record[FIELD_NAIYO] = { value: naiyo };
record[FIELD_KUBUN] = { value: kubun };
return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
app: kintone.app.getId(),
id: recordId,
record: record
});
}

function deleteBarRecord(recordId) {
return kintone.api(kintone.api.url('/k/v1/records.json', true), 'DELETE', {
app: kintone.app.getId(),
ids: [recordId]
});
}

// 既存バーをクリックした時に開く編集ポップアップ（フェーズ2）。
// ドラッグでの移動・リサイズはフェーズ3で対応する。ここでは開始日・終了日・
// 内容・昼夜区分の変更と、レコードの削除ができる。
function openEditBarModal(koji, bar) {
if (document.getElementById('smc-newbar-modal')) return;

var overlay = document.createElement('div');
overlay.id = 'smc-newbar-modal';
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';

var box = document.createElement('div');
box.style.cssText = 'background:#fff;padding:20px;border-radius:8px;min-width:320px;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-size:13px;';

var title = document.createElement('div');
title.textContent = '工程を編集';
title.style.cssText = 'font-weight:bold;margin-bottom:10px;font-size:14px;';
box.appendChild(title);

function row(labelText) {
var r = document.createElement('div');
r.style.cssText = 'margin-bottom:8px;';
var label = document.createElement('div');
label.textContent = labelText;
label.style.cssText = 'margin-bottom:2px;color:#666;';
r.appendChild(label);
box.appendChild(r);
return r;
}

var kojiRow = row('工事名');
var kojiText = document.createElement('div');
kojiText.textContent = koji;
kojiText.style.cssText = 'font-weight:bold;';
kojiRow.appendChild(kojiText);

var startRow = row('開始日');
var startInput = document.createElement('input');
startInput.type = 'date';
startInput.value = bar.startDateStr;
startInput.style.width = '100%';
startRow.appendChild(startInput);

var endRow = row('終了日');
var endInput = document.createElement('input');
endInput.type = 'date';
endInput.value = bar.endDateStr;
endInput.style.width = '100%';
endRow.appendChild(endInput);

var naiyoRow = row('立会者および詳細');
var naiyoInput = document.createElement('input');
naiyoInput.type = 'text';
naiyoInput.value = bar.naiyo || '';
naiyoInput.style.width = '100%';
naiyoInput.style.boxSizing = 'border-box';
naiyoRow.appendChild(naiyoInput);

var kubunRow = row('昼・夜／工事予定');
var kubunSelect = document.createElement('select');
['昼', '夜', '工事予定'].forEach(function(k) {
var opt = document.createElement('option');
opt.value = k;
opt.textContent = k;
if (k === bar.kubun) opt.selected = true;
kubunSelect.appendChild(opt);
});
kubunRow.appendChild(kubunSelect);

var btnRow = document.createElement('div');
btnRow.style.cssText = 'display:flex;justify-content:space-between;margin-top:12px;';

var deleteBtn = document.createElement('button');
deleteBtn.type = 'button';
deleteBtn.textContent = '削除';
deleteBtn.style.color = '#c0392b';
deleteBtn.addEventListener('click', function() {
if (!confirm('この工程を削除しますか？（' + koji + '　' + (bar.naiyo || '') + '）\nこの操作は取り消せません。')) return;
deleteBtn.disabled = true;
deleteBarRecord(bar.id).then(function() {
overlay.remove();
refreshGantt();
}).catch(function(e) {
deleteBtn.disabled = false;
alert('削除に失敗しました：' + (e.message || e));
});
});

var rightBtns = document.createElement('div');

var cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.textContent = 'キャンセル';
cancelBtn.style.marginRight = '8px';
cancelBtn.addEventListener('click', function() { overlay.remove(); });

var saveBtn = document.createElement('button');
saveBtn.type = 'button';
saveBtn.textContent = '更新';
saveBtn.addEventListener('click', function() {
if (!startInput.value || !endInput.value) {
alert('開始日・終了日を入力してください');
return;
}
if (startInput.value > endInput.value) {
alert('開始日は終了日より前にしてください');
return;
}
saveBtn.disabled = true;
updateBarRecord(bar.id, startInput.value, endInput.value, naiyoInput.value.trim(), kubunSelect.value)
.then(function() {
overlay.remove();
refreshGantt();
})
.catch(function(e) {
saveBtn.disabled = false;
alert('更新に失敗しました：' + (e.message || e));
});
});

rightBtns.appendChild(cancelBtn);
rightBtns.appendChild(saveBtn);
btnRow.appendChild(deleteBtn);
btnRow.appendChild(rightBtns);
box.appendChild(btnRow);

overlay.appendChild(box);
document.body.appendChild(overlay);
}

// 空セルをドラッグで範囲選択→選択した開始日・終了日をあらかじめ入力した状態で
// 新規作成モーダルを開く。ドラッグせず1セルだけクリックした場合は、その1日だけの
// 新規作成として扱う（従来の単純クリックと同じ挙動になる）。
function enableDayRangeSelect(tr, koji, range) {
var cells = Array.prototype.slice.call(tr.querySelectorAll('td.smc-day-cell'));

cells.forEach(function(td, dayIdx) {
td.addEventListener('mousedown', function(e) {
if (e.button !== 0) return;
e.preventDefault();
var startIdx = dayIdx;
var endIdx = dayIdx;

function updateHighlight() {
var lo = Math.min(startIdx, endIdx);
var hi = Math.max(startIdx, endIdx);
cells.forEach(function(c, idx) {
c.style.outline = (idx >= lo && idx <= hi) ? '2px solid #1976d2' : '';
c.style.outlineOffset = '-1px';
});
}
updateHighlight();

function onEnter(idx) {
return function() {
if (endIdx !== idx) {
endIdx = idx;
updateHighlight();
}
};
}
var enterHandlers = cells.map(function(c, idx) { return onEnter(idx); });
cells.forEach(function(c, idx) { c.addEventListener('mouseenter', enterHandlers[idx]); });

function cleanup() {
cells.forEach(function(c, idx) {
c.style.outline = '';
c.removeEventListener('mouseenter', enterHandlers[idx]);
});
document.removeEventListener('mouseup', onUp);
}

function onUp() {
cleanup();
var lo = Math.min(startIdx, endIdx);
var hi = Math.max(startIdx, endIdx);
openNewBarModal(koji, range.days[lo], range.days[hi]);
}
document.addEventListener('mouseup', onUp);
});
});
}

// バーのドラッグ編集（フェーズ3）。
// バー本体をドラッグ＝移動（開始日・終了日を同時にシフト）、左右端の細いハンドルを
// ドラッグ＝リサイズ（片方の日付だけ変更）。マウスがほとんど動かなかった場合は
// ドラッグではなく単純なクリックとみなし、従来通り編集ポップアップを開く。
function enableBarDrag(div, koji, bar, range) {
// mousedown/upのみで制御するため、後から発火するネイティブclickイベントが
// バーの親セル（新規作成用のクリック領域）まで伝播しないようにする。
div.addEventListener('click', function(e) { e.stopPropagation(); });

var handleLeft = document.createElement('div');
handleLeft.className = 'smc-bar-handle smc-bar-handle-left';
div.appendChild(handleLeft);

var handleRight = document.createElement('div');
handleRight.className = 'smc-bar-handle smc-bar-handle-right';
div.appendChild(handleRight);

function startDrag(mode, e) {
if (e.button !== 0) return;
e.preventDefault();
e.stopPropagation();
hideBarTooltip();
var startX = e.clientX;
var origStart = bar.startIdx;
var origEnd = bar.endIdx;
var newStart = origStart;
var newEnd = origEnd;
var moved = false;

function onMove(ev) {
var deltaPx = ev.clientX - startX;
var d = Math.round(deltaPx / COL_WIDTH);
if (d !== 0) moved = true;
if (mode === 'move') {
newStart = origStart + d;
newEnd = origEnd + d;
if (newStart < 0) { d = d - newStart; newStart = 0; newEnd = origEnd + d; }
if (newEnd > range.days.length - 1) {
var over = newEnd - (range.days.length - 1);
newEnd = range.days.length - 1;
newStart = origStart + d - over;
}
} else if (mode === 'resize-start') {
newStart = Math.min(origEnd, Math.max(0, origStart + d));
newEnd = origEnd;
} else if (mode === 'resize-end') {
newEnd = Math.max(origStart, Math.min(range.days.length - 1, origEnd + d));
newStart = origStart;
}
div.style.left = (newStart * COL_WIDTH) + 'px';
div.style.width = ((newEnd - newStart + 1) * COL_WIDTH - 2) + 'px';
}

function onUp() {
document.removeEventListener('mousemove', onMove);
document.removeEventListener('mouseup', onUp);
if (!moved || (newStart === origStart && newEnd === origEnd)) {
openEditBarModal(koji, bar);
return;
}
var newStartDate = fmtISO(range.days[newStart]);
var newEndDate = fmtISO(range.days[newEnd]);
updateBarRecord(bar.id, newStartDate, newEndDate, bar.naiyo, bar.kubun).then(function() {
refreshGantt();
}).catch(function(err) {
alert('更新に失敗しました：' + (err.message || err));
refreshGantt();
});
}

document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);
}

handleLeft.addEventListener('mousedown', function(e) { startDrag('resize-start', e); });
handleRight.addEventListener('mousedown', function(e) { startDrag('resize-end', e); });
div.addEventListener('mousedown', function(e) {
if (e.target === handleLeft || e.target === handleRight) return;
startDrag('move', e);
});
}

function buildBodyRows(range, records, kojiMeta) {
var byKoji = {};
records.forEach(function(r) {
var koji = r[FIELD_KOJI].value;
if (!koji) return;
if (!byKoji[koji]) byKoji[koji] = [];
var startVal = r[FIELD_START].value;
var endVal = r[FIELD_END].value;
if (!startVal || !endVal) return;
var startDate = new Date(startVal);
var endDate = new Date(endVal);
var startIdx = daysBetween(range.start, startDate);
var endIdx = daysBetween(range.start, endDate);
if (endIdx < 0 || startIdx > range.days.length - 1) return;
byKoji[koji].push({
id: r.$id.value,
startIdx: Math.max(0, startIdx),
endIdx: Math.min(range.days.length - 1, endIdx),
naiyo: r[FIELD_NAIYO].value,
kubun: r[FIELD_KUBUN].value,
startDateStr: fmtISO(startDate),
endDateStr: fmtISO(endDate)
});
});

var kojiList = sortKojiByShubetsu(Object.keys(byKoji), kojiMeta);

var tbody = document.createElement('tbody');
kojiList.forEach(function(koji) {
var bars = byKoji[koji];
var slotCount = bars.length ? assignSlots(bars) : 1;
var rowHeight = slotCount * (BAR_HEIGHT + BAR_GAP) + ROW_PADDING;

var tr = document.createElement('tr');
tr.style.height = rowHeight + 'px';

var rowhead = document.createElement('td');
rowhead.className = 'smc-rowhead';
rowhead.textContent = koji;
rowhead.title = koji;
// app37の「着工打合せ（顧客）」に「済」の文字が含まれていなければ赤文字、含まれていれば黒文字。
// app37の「進捗」が「完成」ならグレー背景、それ以外は白背景。
var meta = kojiMeta ? kojiMeta[koji] : null;
if (meta) {
rowhead.style.color = (meta.chakkoMtg && meta.chakkoMtg.indexOf('済') !== -1) ? '#000' : '#c0392b';
rowhead.style.backgroundColor = (meta.progress === '完成') ? '#ccc' : '#fff';
}
rowhead.style.cursor = 'pointer';
rowhead.addEventListener('click', function(e) {
e.stopPropagation();
openKojiDetailPopup(koji, e);
});
tr.appendChild(rowhead);

range.days.forEach(function(d, idx) {
var td = document.createElement('td');
td.className = 'smc-day-cell';
td.style.height = rowHeight + 'px';
td.style.cursor = 'pointer';
var iso = fmtISO(d);
if (d.getDay() === 0 || HOLIDAYS.has(iso)) td.classList.add('smc-holiday');
else if (d.getDay() === 6) td.classList.add('smc-saturday');
tr.appendChild(td);
});

enableDayRangeSelect(tr, koji, range);

tbody.appendChild(tr);

// バーは行の最初のセルを基準に絶対配置し、複数日にまたがる横幅を確保する。
var firstCell = tr.children[1];
if (firstCell) firstCell.style.position = 'relative';
bars.forEach(function(bar) {
var div = document.createElement('div');
div.className = 'smc-bar';
div.textContent = bar.naiyo || '';
var tooltipText = bar.naiyo || '';
div.addEventListener('mouseenter', function(e) { if (tooltipText) showBarTooltip(e, tooltipText); });
div.addEventListener('mousemove', positionBarTooltip);
div.addEventListener('mouseleave', hideBarTooltip);
div.style.left = (bar.startIdx * COL_WIDTH) + 'px';
div.style.width = ((bar.endIdx - bar.startIdx + 1) * COL_WIDTH - 2) + 'px';
div.style.top = (bar.slot * (BAR_HEIGHT + BAR_GAP) + ROW_PADDING / 2) + 'px';
if (bar.kubun === '工事予定') {
// 「工事予定」は未確定の仮日程であることが一目でわかるよう、
// 黒の破線枠＋グレー塗りつぶしで表示する（昼＝黒塗り、夜＝赤塗りとは見た目を区別する）。
div.style.backgroundColor = '#dcdcdc';
div.style.border = '2px dashed #000';
div.style.color = '#333';
div.style.boxSizing = 'border-box';
} else {
div.style.backgroundColor = KUBUN_COLOR[bar.kubun] || '#666';
}
enableBarDrag(div, koji, bar, range);
firstCell.appendChild(div);
});
});

return tbody;
}

function render(space, state, onComplete) {
currentSpace = space;
currentState = state;
var existing = document.getElementById('smc-gantt-root');
if (existing) existing.remove();

var root = document.createElement('div');
root.id = 'smc-gantt-root';
space.appendChild(root);

// ヘッダー領域(kintone.app.getHeaderMenuSpaceElement())はツールバーのflexアイテムの1つに
// なっており、幅の広いガントチャートをそのまま入れると＋/歯車/•••アイコンがflex行の外へ
// 押し出されてしまう。ツールバーの外（直後）へ物理的に移動させることでこれを回避する。
var toolbar = document.querySelector('.gaia-argoui-app-index-toolbar');
if (toolbar && toolbar.parentNode) {
toolbar.parentNode.insertBefore(root, toolbar.nextSibling);
}

buildFilterUi(root, state, null);

var range = computeDateRange(state.offset);
var label = document.getElementById('smc-gantt-range-label');
if (label) label.textContent = fmtISO(range.start) + ' 〜 ' + fmtISO(range.end);

var scrollWrap = document.createElement('div');
scrollWrap.id = 'smc-gantt-scroll';
root.appendChild(scrollWrap);

var loading = document.createElement('div');
loading.textContent = '読み込み中…';
loading.style.padding = '12px';
scrollWrap.appendChild(loading);

fetchProgressKoji(state.progress, function(progressSet) {
fetchRecords(state.year, state.tpm, state.koji, function(records) {
if (progressSet) {
records = records.filter(function(r) { return progressSet[r[FIELD_KOJI].value]; });
}
fetchKojiMeta(function(kojiMeta) {
scrollWrap.innerHTML = '';
var table = document.createElement('table');
table.id = 'smc-gantt-table';
table.appendChild(buildHeaderRows(range.days));
table.appendChild(buildBodyRows(range, records, kojiMeta));
scrollWrap.appendChild(table);
if (onComplete) onComplete();
});
}, state.hacchusha);
});
}

// 印刷用：日付配列を「暦月2ヶ月」単位のグループに分割する（1ページ=2ヶ月分）。
function chunkDaysByTwoMonths(days) {
var groups = [];
var monthKey = null;
days.forEach(function(d) {
var key = d.getFullYear() + '-' + d.getMonth();
if (key !== monthKey) { groups.push([]); monthKey = key; }
groups[groups.length - 1].push(d);
});
var chunks = [];
for (var i = 0; i < groups.length; i += 2) {
var merged = groups[i].slice();
if (groups[i + 1]) merged = merged.concat(groups[i + 1]);
chunks.push(merged);
}
return chunks;
}

// 印刷はテーブルセル内に絶対配置すると、セル幅を超えた部分が印刷時にクリップされてしまう
// （画面表示では起きない、印刷レンダリング特有の挙動）。そのためバーはテーブルのセルには
// 入れず、テーブル全体に重ねる独立したオーバーレイ層としてラッパーdiv直下に配置する。
var PRINT_MONTH_ROW_H = 12;
var PRINT_DAY_ROW_H = 20;
var PRINT_HEADER_ROW_H = PRINT_MONTH_ROW_H + PRINT_DAY_ROW_H;

var PRINT_PAGE_BODY_HEIGHT = 980; // A3横の印刷可能領域からヘッダー・ロゴ余白を引いた概算値(px)

// この日付チャンクにおける、工事名ごとのバーと行の高さを事前計算する（ページ分割の判定に使う）。
function prepareChunkRows(chunkDays, records, allKojiList) {
var start = chunkDays[0];
var byKoji = {};
records.forEach(function(r) {
var koji = r[FIELD_KOJI].value;
if (!koji) return;
var startVal = r[FIELD_START].value;
var endVal = r[FIELD_END].value;
if (!startVal || !endVal) return;
var sd = new Date(startVal);
var ed = new Date(endVal);
var startIdx = daysBetween(start, sd);
var endIdx = daysBetween(start, ed);
if (endIdx < 0 || startIdx > chunkDays.length - 1) return;
if (!byKoji[koji]) byKoji[koji] = [];
byKoji[koji].push({
startIdx: Math.max(0, startIdx),
endIdx: Math.min(chunkDays.length - 1, endIdx),
naiyo: r[FIELD_NAIYO].value,
kubun: r[FIELD_KUBUN].value
});
});

return allKojiList.map(function(koji) {
var bars = byKoji[koji] || [];
var slotCount = bars.length ? assignSlots(bars) : 1;
var rowHeight = slotCount * (PRINT_BAR_HEIGHT + PRINT_BAR_GAP) + PRINT_ROW_PADDING;
return { koji: koji, bars: bars, rowHeight: rowHeight };
});
}

// 行を物理ページに分割する。ブラウザ自身の自動改ページに任せると、2ページ目以降に
// 日付ヘッダーが自動挿入されてしまい、バーの絶対座標計算とズレてしまう（ページが増えるほど
// ズレが拡大し、余白にはみ出す不具合の原因だった）。そのため、1ページに収まる行数だけを
// あらかじめ切り分けて、物理ページごとに独立したテーブルを作る。
function splitRowsIntoPages(rows) {
var pages = [];
var current = [];
var currentHeight = 0;
rows.forEach(function(row) {
if (current.length > 0 && currentHeight + row.rowHeight > PRINT_PAGE_BODY_HEIGHT) {
pages.push(current);
current = [];
currentHeight = 0;
}
current.push(row);
currentHeight += row.rowHeight;
});
if (current.length > 0) pages.push(current);
return pages;
}

// 印刷用：画面表示とは別に、印刷専用の縮小レイアウトでガントチャート表を組み立てる。
// rowsは1物理ページに収まる分だけに事前分割されたもの（prepareChunkRows/splitRowsIntoPages）。
function buildPrintPageTable(chunkDays, rows, kojiMeta) {
var wrapper = document.createElement('div');
wrapper.style.cssText = 'position:relative;';

var totalWidth = PRINT_ROW_HEAD_WIDTH + chunkDays.length * PRINT_COL_WIDTH;
var table = document.createElement('table');
table.className = 'smc-print-table';
// table-layout:fixedは、テーブル自体に明示的な幅がないと列幅が内容（長い工事名など）に
// 引っ張られて崩れることがあるため、幅を明示してcolgroupの列幅を確実に固定する。
table.style.cssText = 'border-collapse:collapse;table-layout:fixed;width:' + totalWidth + 'px;';
wrapper.style.width = totalWidth + 'px';

var colgroup = document.createElement('colgroup');
var rowheadCol = document.createElement('col');
rowheadCol.style.width = PRINT_ROW_HEAD_WIDTH + 'px';
colgroup.appendChild(rowheadCol);
chunkDays.forEach(function() {
var c = document.createElement('col');
c.style.width = PRINT_COL_WIDTH + 'px';
colgroup.appendChild(c);
});
table.appendChild(colgroup);

var thead = document.createElement('thead');
var monthRow = document.createElement('tr');
monthRow.style.height = PRINT_MONTH_ROW_H + 'px';
var dayRow = document.createElement('tr');
dayRow.style.height = PRINT_DAY_ROW_H + 'px';

var MONTH_CELL_BASE = 'box-sizing:border-box;overflow:hidden;line-height:1;height:' + PRINT_MONTH_ROW_H + 'px;';
var DAY_CELL_BASE = 'box-sizing:border-box;overflow:hidden;height:' + PRINT_DAY_ROW_H + 'px;';

// 画面版と同じく、凡例は見出しセルの右下に配置する。印刷版は縦の余白が
// ほぼ無い（高さ32px）ため、1行にまとめて収める。
var rh = document.createElement('th');
rh.rowSpan = 2;
rh.style.cssText = 'box-sizing:border-box;overflow:hidden;line-height:1;height:' + PRINT_HEADER_ROW_H + 'px;border:1px solid #999;background:#f2f2f2;font-size:9px;padding:2px 2px 0;position:relative;text-align:left;';
var rhLabel = document.createElement('span');
rhLabel.textContent = '工事名';
rhLabel.style.cssText = 'font-weight:bold;';
rh.appendChild(rhLabel);

var rhLegend = document.createElement('div');
rhLegend.style.cssText = 'position:absolute;right:2px;bottom:1px;white-space:nowrap;line-height:1;font-size:9px;font-weight:normal;';
var rhLegendRed = document.createElement('span');
rhLegendRed.style.color = '#c0392b';
rhLegendRed.textContent = '工事名：着打ち前';
var rhLegendBlack = document.createElement('span');
rhLegendBlack.style.color = '#000';
rhLegendBlack.style.marginLeft = '4px';
rhLegendBlack.textContent = '工事名：着打ち済';
rhLegend.appendChild(rhLegendRed);
rhLegend.appendChild(rhLegendBlack);
rh.appendChild(rhLegend);
monthRow.appendChild(rh);

var i = 0;
while (i < chunkDays.length) {
var m = chunkDays[i].getMonth();
var y = chunkDays[i].getFullYear();
var span = 0;
while (i < chunkDays.length && chunkDays[i].getMonth() === m && chunkDays[i].getFullYear() === y) { span++; i++; }
var mth = document.createElement('th');
mth.colSpan = span;
mth.textContent = y + '-' + pad2(m + 1);
mth.style.cssText = MONTH_CELL_BASE + 'border:1px solid #999;background:#f2f2f2;font-size:9px;padding-top:2px;';
monthRow.appendChild(mth);
}
thead.appendChild(monthRow);

chunkDays.forEach(function(d) {
var th = document.createElement('th');
var iso = fmtISO(d);
var bg = '#fff';
if (d.getDay() === 0 || HOLIDAYS.has(iso)) bg = '#fde0e0';
else if (d.getDay() === 6) bg = '#e0edfd';
th.style.cssText = DAY_CELL_BASE + 'border:1px solid #999;background:' + bg + ';font-size:7px;text-align:center;padding:1px 0 0;';
var dateLine = document.createElement('div');
dateLine.textContent = d.getDate();
dateLine.style.lineHeight = '1.3';
var wdLine = document.createElement('div');
wdLine.textContent = '(' + '日月火水木金土'[d.getDay()] + ')';
wdLine.style.lineHeight = '1.3';
th.appendChild(dateLine);
th.appendChild(wdLine);
dayRow.appendChild(th);
});
thead.appendChild(dayRow);
table.appendChild(thead);

var tbody = document.createElement('tbody');
var pendingBars = [];
rows.forEach(function(row) {
var koji = row.koji;
var bars = row.bars;
var rowHeight = row.rowHeight;

var tr = document.createElement('tr');
tr.style.height = rowHeight + 'px';
tr.style.pageBreakInside = 'avoid';

var rowhead = document.createElement('td');
rowhead.textContent = koji;
var meta = kojiMeta ? kojiMeta[koji] : null;
var color = '#000', bg = '#fff';
if (meta) {
color = (meta.chakkoMtg && meta.chakkoMtg.indexOf('済') !== -1) ? '#000' : '#c0392b';
bg = (meta.progress === '完成') ? '#ccc' : '#fff';
}
rowhead.style.cssText = 'box-sizing:border-box;max-width:' + PRINT_ROW_HEAD_WIDTH + 'px;border:1px solid #999;font-size:8px;padding:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:' + color + ';background:' + bg + ';';
tr.appendChild(rowhead);

chunkDays.forEach(function(d) {
var td = document.createElement('td');
var iso = fmtISO(d);
var bgc = '#fff';
if (d.getDay() === 0 || HOLIDAYS.has(iso)) bgc = '#fdf0f0';
else if (d.getDay() === 6) bgc = '#f0f6fd';
td.style.cssText = 'border:1px solid #ddd;background:' + bgc + ';';
tr.appendChild(td);
});
tbody.appendChild(tr);

bars.forEach(function(bar) {
pendingBars.push({
tr: tr,
slot: bar.slot,
startIdx: bar.startIdx,
endIdx: bar.endIdx,
naiyo: bar.naiyo,
kubun: bar.kubun
});
});
});
table.appendChild(tbody);
wrapper.appendChild(table);

return { wrapper: wrapper, pendingBars: pendingBars };
}

// pendingBarsの位置決めは、行の実際の描画結果（tr.offsetTop）を使う。
// 手計算の累積高さ（行数が増えるほど誤差が蓄積し、下の行ほどズレが大きくなる）を避けるため、
// テーブルが実際にDOMへ挿入され、ブラウザがレイアウトを確定させた後に呼び出すこと。
function placePendingBars(wrapper, pendingBars) {
pendingBars.forEach(function(bar) {
var div = document.createElement('div');
div.textContent = bar.naiyo || '';
var top = bar.tr.offsetTop + bar.slot * (PRINT_BAR_HEIGHT + PRINT_BAR_GAP) + PRINT_ROW_PADDING / 2;
var left = PRINT_ROW_HEAD_WIDTH + bar.startIdx * PRINT_COL_WIDTH;
var width = (bar.endIdx - bar.startIdx + 1) * PRINT_COL_WIDTH - 1;
var style = 'position:absolute;left:' + left + 'px;top:' + top + 'px;width:' + width + 'px;height:' + PRINT_BAR_HEIGHT + 'px;font-size:7px;line-height:' + PRINT_BAR_HEIGHT + 'px;padding:0 2px;overflow:hidden;white-space:nowrap;box-sizing:border-box;color:#fff;border-radius:2px;pointer-events:none;';
if (bar.kubun === '工事予定') {
style += 'background:#dcdcdc;border:1.5px dashed #000;color:#333;';
} else {
style += 'background:' + (KUBUN_COLOR[bar.kubun] || '#666') + ';';
}
div.style.cssText = style;
wrapper.appendChild(div);
});
}

// 指定した暦年・月（1始まり）からmonthCountヶ月分の日付配列を作る。
function daysForMonthRange(year, month, monthCount) {
var start = new Date(year, month - 1, 1);
var end = new Date(year, month - 1 + monthCount, 0);
var days = [];
var cur = new Date(start);
while (cur <= end) {
days.push(new Date(cur));
cur = addDays(cur, 1);
}
return days;
}

// 年度の4月始まりで、選択肢インデックス（0=4月, 1=5月, ... 11=3月）を暦年・月に変換する。
function fiscalMonthOptionToCalendar(fiscalYear, optionIdx) {
var y = fiscalYear + (optionIdx < 9 ? 0 : 1);
var m = optionIdx < 9 ? 4 + optionIdx : optionIdx - 8;
return { year: y, month: m };
}

// 印刷前に「①開始月を選ぶ（選択月＋翌月）」「②1年分（4月〜3月）」の2種類から選ばせる画面。
function openPrintRangeModal(range, records, kojiMeta) {
closePrintRangeModal();

var fiscalYear = range.start.getFullYear();
var monthLabels = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
var today = new Date();
var todayOptionIdx = -1;
for (var oi = 0; oi < 12; oi++) {
var cal = fiscalMonthOptionToCalendar(fiscalYear, oi);
if (cal.year === today.getFullYear() && cal.month === today.getMonth() + 1) { todayOptionIdx = oi; break; }
}

var overlay = document.createElement('div');
overlay.id = 'smc-print-range-modal';
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:999998;display:flex;align-items:center;justify-content:center;';

var box = document.createElement('div');
box.style.cssText = 'background:#fff;padding:16px 20px;border-radius:6px;min-width:320px;max-height:80vh;overflow:auto;';

var title1 = document.createElement('div');
title1.textContent = '・印刷開始月　※2ヶ月工程で印刷されます';
title1.style.cssText = 'font-weight:bold;margin-bottom:8px;';
box.appendChild(title1);

var monthGrid = document.createElement('div');
monthGrid.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:4px 10px;margin-bottom:14px;';
var monthCheckboxes = [];
monthLabels.forEach(function(label, idx) {
var row = document.createElement('label');
row.style.cssText = 'display:flex;align-items:center;cursor:pointer;white-space:nowrap;';
var cb = document.createElement('input');
cb.type = 'checkbox';
cb.checked = (idx === todayOptionIdx);
cb.style.marginRight = '4px';
monthCheckboxes.push(cb);
row.appendChild(cb);
row.appendChild(document.createTextNode(label));
monthGrid.appendChild(row);
});
box.appendChild(monthGrid);

var title2 = document.createElement('div');
title2.textContent = '・1年分を印刷';
title2.style.cssText = 'font-weight:bold;margin-bottom:8px;';
box.appendChild(title2);

var yearRow = document.createElement('label');
yearRow.style.cssText = 'display:flex;align-items:center;cursor:pointer;margin-bottom:4px;';
var yearCb = document.createElement('input');
yearCb.type = 'checkbox';
yearCb.style.marginRight = '4px';
yearRow.appendChild(yearCb);
yearRow.appendChild(document.createTextNode('4月〜3月'));
box.appendChild(yearRow);

var btnRow = document.createElement('div');
btnRow.style.cssText = 'margin-top:14px;text-align:right;';

var cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.textContent = 'キャンセル';
cancelBtn.style.marginRight = '8px';
cancelBtn.addEventListener('click', closePrintRangeModal);
btnRow.appendChild(cancelBtn);

var okBtn = document.createElement('button');
okBtn.type = 'button';
okBtn.textContent = '印刷';
okBtn.addEventListener('click', function() {
var chunks = [];
var selectedIdxs = [];
monthCheckboxes.forEach(function(cb, idx) {
if (!cb.checked) return;
selectedIdxs.push(idx);
var cal = fiscalMonthOptionToCalendar(fiscalYear, idx);
chunks.push(daysForMonthRange(cal.year, cal.month, 2));
});
if (yearCb.checked) {
chunks = chunks.concat(chunkDaysByTwoMonths(range.days));
selectedIdxs.push(0);
}
if (chunks.length === 0) {
alert('印刷する期間を1つ以上選択してください。');
return;
}
// ファイル名は「工程表_yyyy年度_mm月〜」。mmは選択した開始月のうち年度順で一番早いもの
// （1年分を選んだ場合は4月扱い）。
var minIdx = Math.min.apply(null, selectedIdxs);
var mm = fiscalMonthOptionToCalendar(fiscalYear, minIdx).month;
var filename = '工程表_' + fiscalYear + '年度_' + pad2(mm) + '月〜';
closePrintRangeModal();
openPrintOverlay(chunks, records, kojiMeta, filename);
});
btnRow.appendChild(okBtn);

box.appendChild(btnRow);
overlay.appendChild(box);
document.body.appendChild(overlay);
}

function closePrintRangeModal() {
var overlay = document.getElementById('smc-print-range-modal');
if (overlay) overlay.remove();
}

var printOriginalTitle = null;

function openPrintOverlay(chunks, records, kojiMeta, filename) {
closePrintOverlay();

// PDFで保存した際の既定ファイル名は、印刷時点のdocument.titleがブラウザに使われる。
if (filename) {
printOriginalTitle = document.title;
document.title = filename;
}

var overlay = document.createElement('div');
overlay.id = 'smc-print-overlay';
overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:999999;overflow:auto;padding:16px;';

var closeBtn = document.createElement('button');
closeBtn.textContent = '閉じる';
closeBtn.style.cssText = 'margin-bottom:12px;padding:6px 12px;cursor:pointer;';
closeBtn.addEventListener('click', closePrintOverlay);
overlay.appendChild(closeBtn);

// 表示中の全工事名を先に確定させ、その2ヶ月間にバーがなくても行自体は
// 全ページ共通で表示する（画面表示と同じ挙動に合わせる）。
var allKojiSet = {};
records.forEach(function(r) {
var koji = r[FIELD_KOJI].value;
if (koji) allKojiSet[koji] = true;
});
var allKojiList = sortKojiByShubetsu(Object.keys(allKojiSet), kojiMeta);

// まず日付チャンクごとに「工事名の行と高さ」を確定させ、1物理ページに収まる分だけに
// 分割する。ブラウザの自動改ページに任せると、2ページ目以降に日付ヘッダーが自動挿入されて
// バーの座標計算とズレる（ページが増えるほどズレが拡大する）ため、物理ページ＝1テーブルに
// なるようあらかじめ分けておく。
var physicalPages = [];
chunks.forEach(function(chunkDays) {
var rows = prepareChunkRows(chunkDays, records, allKojiList);
var rowPages = splitRowsIntoPages(rows);
rowPages.forEach(function(rowPage) {
physicalPages.push({ chunkDays: chunkDays, rows: rowPage });
});
});

var built = physicalPages.map(function(p, idx) {
var page = document.createElement('div');
page.className = 'smc-print-page';
page.style.cssText = 'position:relative;' + (idx < physicalPages.length - 1 ? 'page-break-after:always;' : '');

var result = buildPrintPageTable(p.chunkDays, p.rows, kojiMeta);
// ロゴ分の高さだけテーブルを下にずらし、右上端の日付列と重ならないようにする。
result.wrapper.style.marginTop = '28px';

// ページ自体の幅は画面幅いっぱいに広がる（実際の表より広い）ため、ページではなく
// 表の実際の幅を持つwrapper基準で配置しないと、表の右端よりずっと外側にずれてしまう
// （テキスト表示時に発覚した不具合。ロゴ画像自体は最初から問題なかった）。
var logo = document.createElement('img');
logo.src = PRINT_LOGO_DATA_URI;
logo.style.cssText = 'position:absolute;top:calc(-24px - 2mm);right:0;height:24px;';
result.wrapper.appendChild(logo);

page.appendChild(result.wrapper);
overlay.appendChild(page);
return result;
});

document.body.appendChild(overlay);

// tr.offsetTopは実際にDOMへ挿入され、レイアウトが確定してから初めて正しい値になるため、
// バーの配置はここ（appendChildの後）でまとめて行う。
built.forEach(function(result) {
placePendingBars(result.wrapper, result.pendingBars);
});

var style = document.createElement('style');
style.id = 'smc-print-style';
style.textContent =
'#smc-print-overlay, #smc-print-overlay * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }' +
'@media print {' +
'@page { size: A3 landscape; margin: 8mm; }' +
'body > *:not(#smc-print-overlay) { display: none !important; }' +
'#smc-print-overlay { position: static !important; padding: 0 !important; overflow: visible !important; }' +
'#smc-print-overlay button { display: none !important; }' +
'.smc-print-table thead { display: table-header-group; }' +
'.smc-print-page { page-break-after: always; }' +
'}';
document.head.appendChild(style);

window.addEventListener('afterprint', closePrintOverlay);
// 描画完了を待ってからprint()する。
setTimeout(function() { window.print(); }, 200);
}

function closePrintOverlay() {
window.removeEventListener('afterprint', closePrintOverlay);
var overlay = document.getElementById('smc-print-overlay');
if (overlay) overlay.remove();
var style = document.getElementById('smc-print-style');
if (style) style.remove();
if (printOriginalTitle !== null) {
document.title = printOriginalTitle;
printOriginalTitle = null;
}
}

kintone.events.on('app.record.index.show', function(event) {
applyLayoutStyle();
applyRowheadWidth();
var space = kintone.app.getHeaderMenuSpaceElement();
if (!space) return event;
var state = parseState();
render(space, state);
return event;
});
})();
