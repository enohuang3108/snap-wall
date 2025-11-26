# 系統級 OAuth 設定指南

## 🎯 架構說明

```
系統管理員 (你) → 一次性 Google 授權
  ↓
系統取得並儲存 OAuth Token
  ↓
所有使用者上傳照片 → 使用系統的 Token → 上傳到你的 Google Drive
```

**重點:**
- ✅ 只需要**你**授權一次
- ✅ 使用者**不需要**登入 Google
- ✅ 照片上傳到**你的** Google Drive
- ✅ Token 會自動更新,不會過期

---

## 📋 設定步驟

### 步驟 1: 設定 Google OAuth (如果還沒做)

參考 [GOOGLE_DRIVE_OAUTH_SETUP.md](GOOGLE_DRIVE_OAUTH_SETUP.md) 取得:
- Client ID
- Client Secret

### 步驟 2: 設定環境變數

#### 開發環境

編輯 `workers/.dev.vars`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### 生產環境 (之後部署時)

```bash
cd workers
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### 步驟 3: 啟動 Worker

```bash
cd workers
pnpm dev
```

---

## 🔐 完成系統授權 (一次性)

### 步驟 1: 取得授權連結

```bash
curl http://localhost:8787/admin/auth/google | jq .
```

**輸出範例:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&state=system-auth"
}
```

### 步驟 2: 完成授權

1. **複製** 上面輸出的 `authUrl`
2. **在瀏覽器中開啟** 該連結
3. **選擇你的 Google 帳號** (擁有 Drive 資料夾的帳號)
4. **點擊「允許」** 授權應用程式存取 Google Drive
5. 看到 **「🎉 系統授權成功!」** 頁面

### 步驟 3: 驗證授權狀態

```bash
curl http://localhost:8787/admin/token/status | jq .
```

**成功輸出:**
```json
{
  "authorized": true,
  "hasRefreshToken": true,
  "expiresAt": 1763655000000,
  "expiresIn": 3600000,
  "needsRefresh": false,
  "source": "KV storage",
  "updatedAt": 1763651400000
}
```

✅ 如果看到 `"authorized": true`,表示設定成功!

---

## 📤 測試上傳流程

現在使用者可以直接上傳照片,**不需要登入 Google**!

### 1. 建立活動

```bash
curl -X POST http://localhost:8787/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試活動",
    "driveFolderId": "1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6"
  }' | jq .
```

記下 `activityId` (例如: `123456`)

### 2. 直接上傳照片 (不需要授權!)

```bash
curl -X POST http://localhost:8787/upload \
  -F "file=@test.JPG" \
  -F "activityId=123456" | jq .
```

**成功輸出:**
```json
{
  "driveFileId": "1ABC123xyz",
  "thumbnailUrl": "https://drive.google.com/thumbnail?id=1ABC123xyz",
  "fullUrl": "https://drive.google.com/uc?id=1ABC123xyz",
  "width": 1920,
  "height": 1080
}
```

### 3. 檢查 Google Drive

開啟你的資料夾:
```
https://drive.google.com/drive/folders/1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6
```

應該會看到剛上傳的照片! 🎉

---

## 🔄 Token 自動更新

系統會自動管理 Token:

1. **Access Token** 每 1 小時過期
2. 系統會**自動使用 Refresh Token** 更新
3. **你不需要重新授權**
4. **使用者完全感覺不到**

查看自動更新的 logs:
```bash
cd workers
pnpm wrangler tail
```

上傳照片時,如果 Token 快過期會看到:
```
System access token expired, refreshing...
System token refreshed successfully
```

---

## 🎯 完整測試腳本

複製並執行:

```bash
#!/bin/bash

echo "==================================="
echo "📋 系統級 OAuth 測試流程"
echo "==================================="
echo ""

# 1. 檢查授權狀態
echo "1️⃣ 檢查系統授權狀態..."
AUTHORIZED=$(curl -s http://localhost:8787/admin/token/status | jq -r '.authorized')

if [ "$AUTHORIZED" != "true" ]; then
    echo "❌ 系統尚未授權"
    echo ""
    echo "請執行以下步驟:"
    echo "1. 取得授權連結:"
    AUTH_URL=$(curl -s http://localhost:8787/admin/auth/google | jq -r '.authUrl')
    echo "$AUTH_URL"
    echo ""
    echo "2. 在瀏覽器中開啟上面的連結完成授權"
    echo "3. 授權完成後重新執行此腳本"
    exit 1
fi

echo "✅ 系統已授權"
echo ""

# 2. 建立活動
echo "2️⃣ 建立測試活動..."
ACTIVITY_ID=$(curl -s -X POST http://localhost:8787/events \
  -H "Content-Type: application/json" \
  -d '{"title":"系統Token測試","driveFolderId":"1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6"}' \
  | jq -r '.event.id')

echo "✅ 活動已建立: $ACTIVITY_ID"
echo ""

# 3. 上傳照片
echo "3️⃣ 上傳照片 (使用系統 Token)..."
RESULT=$(curl -s -X POST http://localhost:8787/upload \
  -F "file=@test.JPG" \
  -F "activityId=$ACTIVITY_ID")

FILE_ID=$(echo "$RESULT" | jq -r '.driveFileId')

if [ "$FILE_ID" != "null" ] && [ -n "$FILE_ID" ]; then
    echo "✅ 上傳成功!"
    echo ""
    echo "檔案 ID: $FILE_ID"
    echo "檢視連結: https://drive.google.com/file/d/$FILE_ID/view"
    echo "資料夾: https://drive.google.com/drive/folders/1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6"
else
    echo "❌ 上傳失敗"
    echo "$RESULT" | jq .
    exit 1
fi

echo ""
echo "==================================="
echo "🎉 測試完成!"
echo "==================================="
echo ""
echo "✅ 使用者上傳照片不需要登入 Google"
echo "✅ 所有照片使用系統的 Token 上傳"
echo "✅ Token 會自動更新,永不過期"
```

儲存為 `test-system-auth.sh` 並執行:
```bash
chmod +x test-system-auth.sh
./test-system-auth.sh
```

---

## 🔧 進階:使用 Secrets 儲存 Token (生產環境)

如果不想使用 KV,可以手動設定 Secrets:

### 1. 完成授權後,從成功頁面複製 Tokens

### 2. 設定為 Secrets

```bash
cd workers

# 設定 Refresh Token
npx wrangler secret put SYSTEM_GOOGLE_REFRESH_TOKEN
# 貼上你的 refresh token

# 設定 Access Token (可選,會自動更新)
npx wrangler secret put SYSTEM_GOOGLE_ACCESS_TOKEN
# 貼上你的 access token
```

### 3. 系統會自動使用這些 Secrets

---

## ❓ 常見問題

### Q: 需要重新授權嗎?

**A:** 不需要! Refresh Token 會一直有效,除非:
1. 你手動撤銷授權
2. Google 帳號被刪除
3. 應用程式在 "Testing" 狀態超過 7 天

### Q: 多個使用者同時上傳會有問題嗎?

**A:** 不會! 系統級 Token 可以同時處理多個請求。

### Q: 如何撤銷授權?

**A:** 前往 https://myaccount.google.com/permissions 找到你的應用程式並移除。

### Q: 開發和生產環境需要分別授權嗎?

**A:** 是的,開發環境 (localhost) 和生產環境 (workers.dev) 有不同的 redirect URI,需要分別授權。

### Q: 如何監控 Token 狀態?

**A:**
```bash
# 查看當前狀態
curl http://localhost:8787/admin/token/status | jq .

# 查看 logs
cd workers && pnpm wrangler tail
```

---

## 🎉 完成!

現在你的系統已經設定完成:

- ✅ 系統使用你的 Google 帳號授權
- ✅ 所有使用者上傳使用系統的 Token
- ✅ 使用者不需要登入 Google
- ✅ Token 自動更新,永不過期
- ✅ 照片上傳到你的 Google Drive

**下一步:** 開始建立前端 UI,讓使用者可以輕鬆上傳照片!
