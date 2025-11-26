# SnapWall 快速開始指南

## 🚀 本地開發設定 (5 分鐘)

### 步驟 1: 安裝依賴

```bash
# 安裝根目錄依賴
pnpm install

# 安裝 workers 依賴
cd workers && pnpm install && cd ..
```

### 步驟 2: 設定環境變數

#### 前端環境變數

```bash
# .env.local 已經預設好本地開發設定,不需要額外設定
# 如果不存在,執行:
cp .env.example .env.local
```

#### API Worker 環境變數 (重要!)

```bash
cd workers
cp .dev.vars.example .dev.vars
```

編輯 `workers/.dev.vars`,填入你的 Google OAuth 憑證:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

> 📝 如何取得 Google OAuth 憑證?請參考 [GOOGLE_DRIVE_OAUTH_SETUP.md](GOOGLE_DRIVE_OAUTH_SETUP.md)

### 步驟 3: 完成系統級 OAuth 授權

這是**一次性**設定,讓系統能代表你上傳照片到 Google Drive。

#### 3.1 啟動 API Worker

```bash
# 在 workers 目錄
pnpm dev

# 或在根目錄
pnpm dev:workers
```

#### 3.2 取得授權連結

```bash
curl http://localhost:8787/admin/auth/google | jq -r '.authUrl'
```

會輸出類似:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=...
```

#### 3.3 在瀏覽器開啟該連結

1. 複製上面的 URL
2. 在瀏覽器中開啟
3. 選擇你的 Google 帳號
4. 點擊「允許」授權應用程式存取 Google Drive
5. 看到「🎉 系統授權成功!」頁面

#### 3.4 驗證授權狀態

```bash
curl http://localhost:8787/admin/token/status | jq .
```

應該會看到:
```json
{
  "authorized": true,
  "hasRefreshToken": true,
  ...
}
```

✅ 如果看到 `"authorized": true`,表示設定成功!

### 步驟 4: 啟動開發伺服器

#### 方式 1: 同時啟動前後端 (推薦)

```bash
pnpm dev:all
```

#### 方式 2: 分別啟動

```bash
# Terminal 1 - 前端 (port 3000)
pnpm dev

# Terminal 2 - API Worker (port 8787)
pnpm dev:workers
```

### 步驟 5: 開啟瀏覽器

前往 http://localhost:3000

## 📋 常用指令

### 開發

```bash
# 前端 (連接本地 API)
pnpm dev

# 前端 (連接 Beta API)
pnpm dev:beta

# 前端 (連接 Production API)
pnpm dev:production

# API Worker
pnpm dev:workers

# 同時啟動前後端
pnpm dev:all
```

### 測試

```bash
# 單元測試
pnpm test

# E2E 測試
pnpm test:e2e

# 所有測試
pnpm test:all
```

### 建置

```bash
# 建置前端 (Beta)
pnpm build

# 建置前端 (Production)
pnpm build:production

# 建置 API Worker
pnpm build:workers
```

### 部署

```bash
# 部署 API Worker 到 Beta
pnpm deploy:workers:beta

# 部署 API Worker 到 Production
pnpm deploy:workers:production
```

## 🔧 環境切換

### 本地開發 (預設)
- 前端: http://localhost:3000
- API: http://localhost:8787

```bash
pnpm dev:all
```

### 前端連 Beta API
```bash
pnpm dev:beta
```

### 前端連 Production API
```bash
pnpm dev:production
```

## ❓ 常見問題

### Q: 上傳照片時出現 "System not authorized"

**A**: 你還沒完成步驟 3 的系統級 OAuth 授權。請依照步驟 3 完成授權。

### Q: Workers 啟動失敗,顯示 "Using redirected Wrangler configuration"

**A**: 已修復!確保你的 `workers/package.json` 包含 `--config wrangler.toml` 參數。

### Q: 前端還是連到遠端 API

**A**:
1. 確認 `.env.local` 檔案存在
2. 重新啟動 dev server
3. 檢查瀏覽器 console 的 API URL

### Q: port 8787 被佔用

**A**:
```bash
# 清理 port
lsof -ti:8787 | xargs kill -9

# 重新啟動
pnpm dev:workers
```

## 📚 詳細文件

- [ENV_SETUP.md](ENV_SETUP.md) - 環境變數詳細設定
- [CONFIGURATION.md](CONFIGURATION.md) - 完整配置管理
- [SYSTEM_AUTH_SETUP.md](SYSTEM_AUTH_SETUP.md) - 系統級 OAuth 詳細說明
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南

## 🎯 下一步

1. ✅ 完成本地開發設定
2. ✅ 完成系統級 OAuth 授權
3. 📝 建立你的第一個活動
4. 📸 測試照片上傳功能
5. 🚀 部署到 Cloudflare

開始開發吧! 🎉
