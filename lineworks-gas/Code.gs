/**
 * kintone 作業日報 → LINE WORKS グループトーク 通知スクリプト
 *
 * 設定値はすべて「スクリプトのプロパティ」に保存する（コードには書かない）。
 * GASエディタ左メニュー「プロジェクトの設定」→「スクリプト プロパティ」で以下を登録:
 *
 *   LW_CLIENT_ID       LINE WORKS Developer Console で発行された Client ID
 *   LW_CLIENT_SECRET   同上 Client Secret
 *   LW_SERVICE_ACCOUNT 同上 Service Account（メールアドレス形式の文字列）
 *   LW_PRIVATE_KEY     同上でダウンロードした秘密鍵の中身（-----BEGIN PRIVATE KEY----- を含む全文）
 *   LW_BOT_ID          作成した Bot の Bot ID
 *   LW_CHANNEL_ID      送信先グループトークの Channel ID（最後の試験時に設定）
 *   KINTONE_DOMAIN     例: yourcompany.cybozu.com
 *   KINTONE_API_TOKEN  作業日報アプリで発行したAPIトークン（レコード編集権限つき）
 */

// kintone の Webhook がここに POST してくる
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const record = payload.record;

    if (!record || !record['ステータス']) {
      return ContentService.createTextOutput('ignored: no status field');
    }
    if (record['ステータス'].value !== 'LINEWORKS送信') {
      return ContentService.createTextOutput('skip: status is ' + record['ステータス'].value);
    }

    const comment = record['送信コメント'] ? record['送信コメント'].value : '';
    const message = (comment ? comment + '\n' : '') + payload.url;

    sendLineWorksMessage(message);
    updateKintoneStatus(payload.app.id, record['$id'].value, '送信済み');

    return ContentService.createTextOutput('done');
  } catch (err) {
    Logger.log(err);
    return ContentService.createTextOutput('error: ' + err.message);
  }
}

// 動作確認用：この関数をGASエディタから直接実行してテスト送信できる
function sendTestMessage() {
  sendLineWorksMessage('【テスト送信】LINE WORKS連携の疎通確認です。');
}

function sendLineWorksMessage(text) {
  const props = PropertiesService.getScriptProperties();
  const botId = props.getProperty('LW_BOT_ID');
  const channelId = props.getProperty('LW_CHANNEL_ID');
  const accessToken = getAccessToken();

  const res = UrlFetchApp.fetch(
    'https://www.worksapis.com/v1.0/bots/' + botId + '/channels/' + channelId + '/messages',
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + accessToken },
      payload: JSON.stringify({ content: { type: 'text', text: text } }),
      muteHttpExceptions: true
    }
  );

  if (res.getResponseCode() !== 201) {
    throw new Error('LINE WORKS送信失敗 (' + res.getResponseCode() + '): ' + res.getContentText());
  }
}

function getAccessToken() {
  const props = PropertiesService.getScriptProperties();
  const jwt = createJWT();

  const res = UrlFetchApp.fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
    method: 'post',
    payload: {
      assertion: jwt,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      client_id: props.getProperty('LW_CLIENT_ID'),
      client_secret: props.getProperty('LW_CLIENT_SECRET'),
      scope: 'bot'
    },
    muteHttpExceptions: true
  });

  const json = JSON.parse(res.getContentText());
  if (!json.access_token) {
    throw new Error('アクセストークン取得失敗: ' + res.getContentText());
  }
  return json.access_token;
}

function createJWT() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('LW_CLIENT_ID');
  const serviceAccount = props.getProperty('LW_SERVICE_ACCOUNT');
  const privateKey = props.getProperty('LW_PRIVATE_KEY');

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: clientId,
    sub: serviceAccount,
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header)).replace(/=+$/, '');
  const encodedClaims = Utilities.base64EncodeWebSafe(JSON.stringify(claims)).replace(/=+$/, '');
  const signatureInput = encodedHeader + '.' + encodedClaims;

  const signatureBytes = Utilities.computeRsaSha256Signature(signatureInput, privateKey);
  const encodedSignature = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, '');

  return signatureInput + '.' + encodedSignature;
}

function updateKintoneStatus(appId, recordId, status) {
  const props = PropertiesService.getScriptProperties();
  const domain = props.getProperty('KINTONE_DOMAIN');
  const token = props.getProperty('KINTONE_API_TOKEN');

  const res = UrlFetchApp.fetch('https://' + domain + '/k/v1/record.json', {
    method: 'put',
    contentType: 'application/json',
    headers: { 'X-Cybozu-API-Token': token },
    payload: JSON.stringify({
      app: appId,
      id: recordId,
      record: { 'ステータス': { value: status } }
    }),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() !== 200) {
    Logger.log('kintoneステータス更新失敗: ' + res.getContentText());
  }
}
