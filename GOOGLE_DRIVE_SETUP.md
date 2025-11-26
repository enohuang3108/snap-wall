# Google Drive Service Account 設定指南

本專案使用 **Google Service Account** 進行 Google Drive 照片上傳，無需使用者 OAuth 登入流程。

## 為什麼使用 Service Account？

- ✅ **無需使用者登入** - 背景執行，參與者不需要 Google 帳號
- ✅ **伺服器端認證** - 憑證安全存放在後端
- ✅ **完整權限** - 可上傳、修改權限、建立檔案
- ✅ **簡化架構** - 統一由後端處理所有 Drive 操作

## 設定步驟

### 1. 建立 Service Account

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立一個專案
3. 啟用 **Google Drive API**：
   - 導航至 **APIs & Services** → **Library**
   - 搜尋 "Google Drive API"
   - 點擊 **Enable**

4. 建立 Service Account：
   - 導航至 **APIs & Services** → **Credentials**
   - 點擊 **Create Credentials** → **Service Account**
   - 填寫名稱（例如：`snap-wall-uploader`）
   - 點擊 **Create and Continue**
   - 跳過授予權限步驟（點擊 **Continue**）
   - 點擊 **Done**

### 2. 下載 JSON 金鑰

1. 在 Service Accounts 列表中，點擊剛建立的 Service Account
2. 切換到 **Keys** 標籤
3. 點擊 **Add Key** → **Create new key**
4. 選擇 **JSON** 格式
5. 點擊 **Create** - 系統會自動下載 JSON 檔案

**⚠️ 重要：請妥善保管此 JSON 檔案，這是唯一的憑證！**

### 3. 分享 Google Drive 資料夾 ⚠️ **必須步驟**

**重要:** Service Account 本身沒有儲存空間,必須上傳到已分享的資料夾!

1. 在**您自己的 Google Drive** 中建立一個新資料夾 (例如:`Snap Wall Photos`)
2. 點擊資料夾右上角的「共用」按鈕
3. 在「與使用者和群組共用」欄位中，輸入 Service Account 的 email
   - Email 格式：`xxx@xxx.iam.gserviceaccount.com`
   - 可在 JSON 檔案的 `client_email` 欄位找到
   - 範例：`snap-wall@snap-wall-478514.iam.gserviceaccount.com`
4. **將權限設定為「編輯者」** (不是檢視者)
5. 點擊「傳送」
6. 複製資料夾 ID (網址列最後一段)
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
                                            ^^^^^^^^^^^^^^
   ```
7. 這個 `FOLDER_ID` 就是前端上傳時需要傳入的 `folderId`

### 4. 設定環境變數

#### 開發環境（本地）

1. 複製 `workers/.dev.vars.example` 為 `workers/.dev.vars`：
   ```bash
   cp workers/.dev.vars.example workers/.dev.vars
   ```

2. 開啟下載的 JSON 檔案，填入以下資訊到 `.dev.vars`：

   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
   GOOGLE_PROJECT_ID=your-project-id
   ```

   **注意事項**：
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`：JSON 中的 `client_email`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`：JSON 中的 `private_key`（保留 `\n` 換行符號，用雙引號包住）
   - `GOOGLE_PROJECT_ID`：JSON 中的 `project_id`

#### 生產環境（Cloudflare Workers）

使用 Wrangler CLI 設定 secrets：

```bash
cd workers

# 設定 Service Account Email
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL

# 設定 Private Key（複製整個 key 包含 BEGIN/END 標記）
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

# 設定 Project ID
npx wrangler secret put GOOGLE_PROJECT_ID
```

### 5. 前端環境變數

在專案根目錄的 `.env` 檔案中設定後端 URL：

```env
# 開發環境
VITE_BACKEND_URL=http://localhost:8787

# 生產環境（部署後替換為實際網址）
# VITE_BACKEND_URL=https://your-worker.your-subdomain.workers.dev
```

## 驗證設定

啟動開發伺服器並測試上傳：

```bash
# 啟動後端
cd workers
pnpm dev

# 啟動前端（另開終端機）
cd ..
pnpm dev
```

前往應用程式，嘗試上傳照片。成功的話會看到照片出現在您分享的 Google Drive 資料夾中。

## 常見問題

### Q: 上傳時出現 "storageQuotaExceeded" 或 403 錯誤
**A:** Service Account 本身沒有儲存空間!請確認:
1. 已在您的 Google Drive 中建立資料夾
2. 已將該資料夾**分享**給 Service Account email (設定為「編輯者」)
3. 使用正確的資料夾 ID 進行上傳

### Q: 上傳時出現 "Permission denied" 錯誤
**A:** 請確認:
1. Service Account 的 email 已加入 Drive 資料夾的「編輯者」
2. 權限設定為「編輯者」而非「檢視者」
3. 使用的是已分享資料夾的正確 ID

### Q: 上傳時出現 "Invalid credentials" 錯誤
**A:** 請檢查：
1. Private Key 是否完整複製（包含 BEGIN/END 標記）
2. Private Key 中的 `\n` 是否保留
3. 環境變數是否正確設定

### Q: 如何取得 Drive 資料夾 ID？
**A:** 開啟資料夾，網址列中最後一段就是 Folder ID：
```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
                                         ^^^^^^^^^^^^^^
```

### Q: Service Account 有使用限制嗎？
**A:** Service Account 受 Google Drive API 配額限制：
- 每個專案每天 1,000,000,000 queries
- 每位使用者每 100 秒 1,000 queries
- 詳見：https://developers.google.com/drive/api/guides/limits

## 安全性建議

1. **絕對不要**將 `.dev.vars` 或包含 Service Account 金鑰的檔案提交到版本控制
2. 定期輪換 Service Account 金鑰
3. 僅授予 Service Account 必要的資料夾存取權限
4. 在生產環境使用 Cloudflare Workers Secrets 而非環境變數
5. 監控 API 使用量，設定異常警報

## 架構說明

```
┌─────────────┐                ┌──────────────────┐                ┌─────────────┐
│   Frontend  │   FormData     │ Cloudflare       │  Service Acc.  │   Google    │
│   (React)   │───────────────>│ Workers          │───────────────>│   Drive     │
│             │   /upload      │ (Backend)        │  JWT Auth      │             │
└─────────────┘                └──────────────────┘                └─────────────┘
                                       │
                                       │ stores
                                       ▼
                                ┌──────────────┐
                                │   Secrets    │
                                │  (env vars)  │
                                └──────────────┘
```

- **前端**：壓縮圖片後透過 FormData 上傳到後端
- **後端**：使用 Service Account 憑證取得 access token，上傳至 Drive
- **Drive**：檔案自動設定為公開讀取，返回 URL 給前端

## 相關連結

- [Google Drive API 文件](https://developers.google.com/drive/api/guides/about-sdk)
- [Service Account 認證](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
