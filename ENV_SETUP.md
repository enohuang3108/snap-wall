# 環境變數設定指南

## 📁 環境檔案結構

```
snap-wall/
├── .env.example          # 範例檔案 (提交到 Git)
├── .env.local            # 本地開發環境 (不提交)
├── .env.beta             # Beta 測試環境 (不提交)
├── .env.production       # 正式環境 (不提交)
└── workers/
    ├── .dev.vars.example # API Worker 範例 (提交到 Git)
    └── .dev.vars         # API Worker 本地開發 (不提交)
```

## 🚀 快速開始

### 1. 設定前端環境變數

複製範例檔案:
```bash
cp .env.example .env.local
```

預設已經設定好本地開發環境 (localhost:8787)

### 2. 設定 API Worker 環境變數

```bash
cd workers
cp .dev.vars.example .dev.vars
```

編輯 `workers/.dev.vars` 並填入你的 Google OAuth 憑證:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📝 環境變數說明

### 前端環境變數

| 變數 | 說明 | 範例 |
|------|------|------|
| `VITE_API_URL` | API Worker 的 HTTP URL | `http://localhost:8787` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:8787` |
| `VITE_BACKEND_URL` | 後端 API URL (通常與 API_URL 相同) | `http://localhost:8787` |

### API Worker 環境變數

| 變數 | 說明 | 必填 |
|------|------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | ✅ |
| `CORS_ALLOWED_ORIGINS` | 允許的 CORS 來源 (逗號分隔) | ✅ |

## 🔧 使用方式

### 本地開發 (預設)

```bash
# 啟動前端 (使用 .env.local)
pnpm dev

# 啟動 API Worker
pnpm dev:workers

# 同時啟動前後端
pnpm dev:all
```

Vite 會自動載入 `.env.local` 檔案。

### 連接到 Beta 環境

```bash
# 前端連接到 Beta API
pnpm dev:beta
```

會使用 `.env.beta` 的設定。

### 連接到正式環境

```bash
# 前端連接到 Production API
pnpm dev:production
```

會使用 `.env.production` 的設定。

## 🌍 環境對照表

### Local (本地開發)

**.env.local**
```env
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787
VITE_BACKEND_URL=http://localhost:8787
```

**用途**: 本地全端開發,前後端都在本機運行

### Beta (測試環境)

**.env.beta**
```env
VITE_API_URL=https://snap-wall-api-beta.oddlabcc.workers.dev
VITE_WS_URL=wss://snap-wall-api-beta.oddlabcc.workers.dev
VITE_BACKEND_URL=https://snap-wall-api-beta.oddlabcc.workers.dev
```

**用途**: 前端本地開發,連接遠端 Beta API

### Production (正式環境)

**.env.production**
```env
VITE_API_URL=https://snap-wall-api-production.oddlabcc.workers.dev
VITE_WS_URL=wss://snap-wall-api-production.oddlabcc.workers.dev
VITE_BACKEND_URL=https://snap-wall-api-production.oddlabcc.workers.dev
```

**用途**: 前端連接正式環境 API (除錯用)

## 📦 部署

### 部署到 Beta

```bash
# 建置並部署前端
pnpm build          # 使用 .env.beta
pnpm deploy

# 部署 API Worker
pnpm deploy:workers:beta
```

### 部署到 Production

```bash
# 建置並部署前端
pnpm build:production   # 使用 .env.production
pnpm deploy:production

# 部署 API Worker
pnpm deploy:workers:production
```

## 🔐 安全性

### ⚠️ 重要提醒

1. **絕對不要** 將 `.env.local`, `.env.beta`, `.env.production` 提交到 Git
2. **絕對不要** 將 `workers/.dev.vars` 提交到 Git
3. 這些檔案已經在 `.gitignore` 中被排除
4. 只有 `.env.example` 和 `.dev.vars.example` 應該被提交

### 檢查敏感資訊

提交前檢查:
```bash
git status
```

如果看到 `.env.*` 或 `.dev.vars`,請確認 `.gitignore` 設定正確。

## 🛠️ Cloudflare 環境變數設定

### 前端 (Cloudflare Pages)

1. 前往 Cloudflare Dashboard > Pages > 你的專案
2. Settings > Environment variables
3. 新增變數 (分別設定 Production 和 Preview):

**Production**:
```
VITE_API_URL=https://snap-wall-api-production.oddlabcc.workers.dev
VITE_WS_URL=wss://snap-wall-api-production.oddlabcc.workers.dev
VITE_BACKEND_URL=https://snap-wall-api-production.oddlabcc.workers.dev
```

**Preview** (Beta):
```
VITE_API_URL=https://snap-wall-api-beta.oddlabcc.workers.dev
VITE_WS_URL=wss://snap-wall-api-beta.oddlabcc.workers.dev
VITE_BACKEND_URL=https://snap-wall-api-beta.oddlabcc.workers.dev
```

### API Worker (Secrets)

使用 wrangler 設定敏感資訊:

```bash
cd workers

# Beta 環境
wrangler secret put GOOGLE_CLIENT_ID --env beta
wrangler secret put GOOGLE_CLIENT_SECRET --env beta

# Production 環境
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

## ❓ 常見問題

### Q: 為什麼有這麼多 .env 檔案?

**A**: 不同的環境需要不同的 API URL:
- `.env.local`: 本地開發,使用本地 API (localhost:8787)
- `.env.beta`: 連接遠端測試環境 API
- `.env.production`: 連接正式環境 API

### Q: 我應該使用哪個檔案?

**A**:
- 大部分時候用 `pnpm dev` (自動使用 .env.local)
- 只在本地前端開發但想用遠端 API 時用 `pnpm dev:beta`

### Q: 如何確認目前使用哪個環境?

**A**: 查看瀏覽器 console,或檢查網路請求的 URL

### Q: 前端還是連到 beta API?

**A**: 檢查:
1. 確認 `.env.local` 檔案存在且內容正確
2. 重新啟動 dev server (`pnpm dev`)
3. 清除瀏覽器快取

### Q: 可以不用 .env 檔案嗎?

**A**: 可以,但程式碼預設值是 `http://localhost:8787`,如果你的 API Worker 在其他 port 就需要設定。

## 📚 相關文件

- [CONFIGURATION.md](CONFIGURATION.md) - 完整配置管理指南
- [SYSTEM_AUTH_SETUP.md](SYSTEM_AUTH_SETUP.md) - 系統級 OAuth 設定
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
