# 配置管理指南

## 架構說明

專案包含兩個獨立的 Cloudflare Workers:

```
┌─────────────────────────────────────────────────────────────┐
│                     SnapWall 專案                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 前端 Worker (TanStack Start SSR)                        │
│     ├─ 配置: wrangler.jsonc                                 │
│     ├─ 啟動: pnpm dev (port 3000)                           │
│     └─ 環境變數: VITE_API_URL, VITE_WS_URL                 │
│                                                              │
│  2. API Worker (後端 API)                                   │
│     ├─ 配置: workers/wrangler.toml                          │
│     ├─ 啟動: pnpm dev:workers (port 8787)                   │
│     └─ 環境變數: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 配置檔案說明

### 前端配置

#### `wrangler.jsonc`
- **用途**: TanStack Start SSR 部署設定
- **環境變數**:
  - `VITE_API_URL`: API Worker 的 URL
  - `VITE_WS_URL`: WebSocket URL
  - `VITE_BACKEND_URL`: 後端 URL

#### `.env` (本地開發)
前端開發時使用的環境變數:
```env
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787
```

### 後端 API 配置

#### `workers/wrangler.toml`
- **用途**: API Worker 部署設定
- **包含**:
  - KV Namespace 綁定
  - Durable Objects 設定
  - 環境 (dev, beta, production)

#### `workers/.dev.vars`
API Worker 本地開發的秘密變數:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**⚠️ 重要**: 此檔案包含敏感資訊,已在 `.gitignore` 中排除

## 開發工作流程

### 本地開發 (同時啟動前後端)

```bash
# 方式 1: 同時啟動
pnpm dev:all

# 方式 2: 分別啟動
# Terminal 1 - 啟動前端
pnpm dev

# Terminal 2 - 啟動 API Worker
pnpm dev:workers
```

### 只開發前端

```bash
# 前端連接到遠端 API
pnpm dev
```

修改 `wrangler.jsonc`:
```json
{
  "vars": {
    "VITE_API_URL": "https://snap-wall-api-beta.oddlabcc.workers.dev"
  }
}
```

### 只開發後端 API

```bash
cd workers
pnpm dev
```

## 部署流程

### 部署前端到 Cloudflare Pages

```bash
# Beta 環境
pnpm build
pnpm deploy

# Production 環境
pnpm build:production
pnpm deploy:production
```

### 部署 API Worker

```bash
# Beta 環境
pnpm deploy:workers:beta

# Production 環境
pnpm deploy:workers:production
```

## 環境變數設定

### 前端環境變數 (Cloudflare Pages)

透過 Cloudflare Dashboard 設定:
1. 前往 Pages 專案設定
2. Settings > Environment variables
3. 新增變數:
   - `VITE_API_URL`
   - `VITE_WS_URL`
   - `VITE_BACKEND_URL`

### API Worker 秘密變數

```bash
cd workers

# 設定 Google OAuth
wrangler secret put GOOGLE_CLIENT_ID --env beta
wrangler secret put GOOGLE_CLIENT_SECRET --env beta

# Production 環境
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

## 系統級 OAuth 設定

API Worker 需要一次性的 Google OAuth 授權,詳見 [SYSTEM_AUTH_SETUP.md](SYSTEM_AUTH_SETUP.md)

### 快速設定

```bash
# 1. 確保 workers/.dev.vars 已設定 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET

# 2. 啟動 API Worker
cd workers
pnpm dev

# 3. 取得授權 URL
curl http://localhost:8787/admin/auth/google | jq -r '.authUrl'

# 4. 在瀏覽器中開啟該 URL 完成授權

# 5. 驗證授權狀態
curl http://localhost:8787/admin/token/status | jq .
```

## 常用腳本

### 開發

```bash
# 前端開發
pnpm dev

# API 開發
pnpm dev:workers

# 同時開發
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

### 部署

```bash
# 前端 Beta
pnpm deploy

# 前端 Production
pnpm deploy:production

# API Beta
pnpm deploy:workers:beta

# API Production
pnpm deploy:workers:production
```

## 環境對照表

| 環境 | 前端 URL | API URL | 說明 |
|------|---------|---------|------|
| Local | http://localhost:3000 | http://localhost:8787 | 本地開發 |
| Beta | https://snap-wall.pages.dev | https://snap-wall-api-beta.oddlabcc.workers.dev | 測試環境 |
| Production | https://snap-wall.oddlab.cc | https://snap-wall-api-production.oddlabcc.workers.dev | 正式環境 |

## 故障排除

### 前端無法連接 API

1. 檢查 `wrangler.jsonc` 中的 `VITE_API_URL`
2. 確認 API Worker 正在運行 (`pnpm dev:workers`)

### 上傳照片失敗 "System not authorized"

1. 確認 `workers/.dev.vars` 包含 Google OAuth 憑證
2. 完成系統級 OAuth 授權流程 (見上方說明)

### CORS 錯誤

檢查 API Worker 的 CORS 設定:
- Local: `workers/.dev.vars` 中的 `CORS_ALLOWED_ORIGINS`
- Deployed: `workers/wrangler.toml` 中各環境的 `vars.CORS_ALLOWED_ORIGINS`
