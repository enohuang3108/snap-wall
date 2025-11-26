# 部署指南

本專案包含前端應用和後端 Workers API,分為 Beta 和 Production 兩個環境。

## 環境說明

### Beta 環境
- **前端**: https://snap-wall.oddlabcc.workers.dev
- **後端 API**: https://snap-wall-api-beta.oddlabcc.workers.dev
- **用途**: 測試新功能

### Production 環境
- **前端**: https://snap-wall.oddlabcc.workers.dev (透過不同建置部署)
- **後端 API**: https://snap-wall-api-production.oddlabcc.workers.dev
- **用途**: 正式環境

## 快速部署指令

### 部署 Beta 環境

#### 1. 部署後端 Workers API
```bash
pnpm run deploy:workers:beta
```

#### 2. 部署前端應用
```bash
pnpm run build && npx wrangler deploy
```

### 部署 Production 環境

#### 1. 部署後端 Workers API
```bash
pnpm run deploy:workers:production
```

#### 2. 部署前端應用
```bash
pnpm run deploy:production
```

## 完整部署步驟

### Beta 環境完整部署

```bash
# 1. 確認環境變數配置 (.env 檔案應指向 beta API)
cat .env

# 2. 部署後端 API
pnpm run deploy:workers:beta

# 3. 建置並部署前端
pnpm run build
npx wrangler deploy

# 4. 驗證部署
curl https://snap-wall-api-beta.oddlabcc.workers.dev/health
```

### Production 環境完整部署

```bash
# 1. 確認環境變數配置 (.env.production 檔案應指向 production API)
cat .env.production

# 2. 部署後端 API
pnpm run deploy:workers:production

# 3. 建置並部署前端 (使用 production 模式)
pnpm run deploy:production

# 4. 驗證部署
curl https://snap-wall-api-production.oddlabcc.workers.dev/health
```

## 環境變數配置

### `.env` (Beta 環境,預設)
```bash
VITE_API_URL=https://snap-wall-api-beta.oddlabcc.workers.dev
VITE_WS_URL=wss://snap-wall-api-beta.oddlabcc.workers.dev
VITE_BACKEND_URL=https://snap-wall-api-beta.oddlabcc.workers.dev
```

### `.env.production` (Production 環境)
```bash
VITE_API_URL=https://snap-wall-api-production.oddlabcc.workers.dev
VITE_WS_URL=wss://snap-wall-api-production.oddlabcc.workers.dev
VITE_BACKEND_URL=https://snap-wall-api-production.oddlabcc.workers.dev
```

## 常見部署場景

### 場景 1: 只更新前端
```bash
# Beta
pnpm run build && npx wrangler deploy

# Production
pnpm run deploy:production
```

### 場景 2: 只更新後端 API
```bash
# Beta
pnpm run deploy:workers:beta

# Production
pnpm run deploy:workers:production
```

### 場景 3: 前端 + 後端一起更新
```bash
# Beta
pnpm run deploy:workers:beta
pnpm run build && npx wrangler deploy

# Production
pnpm run deploy:workers:production
pnpm run deploy:production
```

## 部署前檢查清單

- [ ] 確認 `.env` 或 `.env.production` 檔案存在且正確
- [ ] 確認 Workers API 的 CORS 設定包含前端網址
- [ ] 本地測試通過 (`pnpm dev` 和 `pnpm dev:workers`)
- [ ] Lint 檢查通過 (`pnpm lint`)
- [ ] 單元測試通過 (`pnpm test`)

## 回滾步驟

如果部署出現問題,可以透過 Cloudflare Dashboard 回滾到前一個版本:

1. 進入 Cloudflare Dashboard
2. 選擇對應的 Worker
3. 進入 **Deployments** 頁面
4. 選擇前一個穩定版本並點擊 **Rollback**

## 本地開發

### 啟動前端
```bash
pnpm dev
```

### 啟動後端 Workers API
```bash
pnpm dev:workers
```

### 同時啟動前端 + 後端
```bash
pnpm dev:all
```

## 疑難排解

### 問題: 前端呼叫到錯誤的 API
**解決**: 確認建置時使用正確的環境變數
```bash
# 檢查建置後的 API URL
grep -r "snap-wall-api" dist/server/assets/*.js | head -3
```

### 問題: CORS 錯誤
**解決**: 更新 `workers/wrangler.toml` 的 CORS 設定,並重新部署後端
```bash
pnpm run deploy:workers:beta  # 或 production
```

### 問題: Durable Objects 錯誤
**解決**: 確認 `workers/wrangler.toml` 中的 `script_name` 與環境名稱一致

## 相關文件

- [workers/wrangler.toml](workers/wrangler.toml) - Workers API 配置
- [wrangler.jsonc](wrangler.jsonc) - 前端 Worker 配置
- [.env](.env) - Beta 環境變數
- [.env.production](.env.production) - Production 環境變數
