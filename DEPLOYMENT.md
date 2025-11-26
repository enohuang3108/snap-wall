# 部署指南

本專案使用 **GitHub Actions CI/CD** 自動部署,推送到指定分支即可自動部署到對應環境。

## 環境說明

### Beta 環境
- **Git 分支**: `beta`
- **前端**: https://snap-wall.oddlabcc.workers.dev
- **後端 API**: https://snap-wall-api-beta.oddlabcc.workers.dev
- **用途**: 測試新功能
- **觸發方式**: Push 到 `beta` 分支

### Production 環境
- **Git 分支**: `main`
- **前端**: https://snap-wall.oddlabcc.workers.dev
- **後端 API**: https://snap-wall-api-production.oddlabcc.workers.dev
- **用途**: 正式環境
- **觸發方式**: Push 到 `main` 分支

---

## 🚀 快速部署 (GitHub Actions 自動化)

### 部署到 Beta 環境

```bash
# 1. 切換到 beta 分支
git checkout beta

# 2. 合併功能分支
git merge feature/your-feature

# 3. 推送到 GitHub (自動觸發 CI/CD)
git push origin beta
```

**GitHub Actions 會自動執行**:
1. ✅ Lint 檢查
2. ✅ 型別檢查
3. ✅ 單元測試
4. ✅ 建置 Workers API
5. ✅ 部署後端到 Beta
6. ✅ 建置前端 (Beta 模式)
7. ✅ 部署前端到 Beta

### 部署到 Production 環境

```bash
# 1. 切換到 main 分支
git checkout main

# 2. 合併 beta 分支
git merge beta

# 3. 推送到 GitHub (自動觸發 CI/CD)
git push origin main
```

**GitHub Actions 會自動執行**:
1. ✅ Lint 檢查
2. ✅ 型別檢查
3. ✅ 單元測試
4. ✅ 建置 Workers API
5. ✅ 部署後端到 Production
6. ✅ 建置前端 (Production 模式)
7. ✅ 部署前端到 Production

---

## ⚙️ 初始設定 (只需執行一次)

### 1. 建立 Beta 分支

```bash
git checkout -b beta
git push -u origin beta
```

### 2. 設定 GitHub Secrets

前往 GitHub Repository Settings:

1. **Settings** → **Secrets and variables** → **Actions**
2. 點擊 **New repository secret**
3. 新增以下 secrets:

#### 必要的 Secrets

| Secret 名稱 | 取得方式 | 說明 |
|------------|---------|------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Edit Cloudflare Workers | 用於部署 Workers |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → 右側欄位可以看到 Account ID | 你的 Cloudflare 帳號 ID |

#### 取得 Cloudflare API Token 步驟

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 點擊右上角個人頭像 → **My Profile** → **API Tokens**
3. 點擊 **Create Token**
4. 選擇 **Edit Cloudflare Workers** 範本
5. 權限設定:
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Zone** → **Workers Routes** → **Edit**
6. 點擊 **Continue to summary** → **Create Token**
7. 複製產生的 Token (只會顯示一次!)

---

## 📋 完整開發流程

### 1. 開發新功能

```bash
# 從 beta 建立功能分支
git checkout beta
git pull origin beta
git checkout -b feature/new-upload-ui

# 本地開發與測試
pnpm dev:all

# 提交變更
git add .
git commit -m "feat: 新增上傳介面"
git push origin feature/new-upload-ui
```

### 2. 測試環境部署 (Beta)

```bash
# 合併到 beta
git checkout beta
git merge feature/new-upload-ui
git push origin beta

# ✅ GitHub Actions 自動部署到 Beta
# 查看部署狀態: https://github.com/your-repo/actions
```

### 3. 正式環境部署 (Production)

```bash
# Beta 測試通過後,合併到 main
git checkout main
git pull origin main
git merge beta
git push origin main

# ✅ GitHub Actions 自動部署到 Production
```

---

## 🔍 查看部署狀態

### GitHub Actions

1. 前往 Repository → **Actions** 頁面
2. 查看最新的 workflow run:
   - **Deploy Beta Environment** (beta 分支)
   - **Deploy Production Environment** (main 分支)
3. 點擊進入查看詳細日誌

### Cloudflare Dashboard

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → 選擇對應的 Worker:
   - `snap-wall` (前端)
   - `snap-wall-api-beta` (後端 Beta)
   - `snap-wall-api-production` (後端 Production)
3. 查看 **Deployments** 歷史記錄

---

## 🛠️ 本地開發

### 啟動前端
```bash
pnpm dev              # 使用 local 環境
pnpm dev:beta         # 使用 beta API
pnpm dev:production   # 使用 production API
```

### 啟動後端 Workers API
```bash
pnpm dev:workers
```

### 同時啟動前端 + 後端
```bash
pnpm dev:all
```

---

## 🔧 手動部署 (緊急情況)

如果 CI/CD 失敗或需要緊急修復:

### 部署 Beta 環境

```bash
# 1. 確認環境變數
cat .env

# 2. 部署後端 API
pnpm run deploy:workers:beta

# 3. 建置並部署前端
pnpm run build && npx wrangler deploy

# 4. 驗證部署
curl https://snap-wall-api-beta.oddlabcc.workers.dev/health
```

### 部署 Production 環境

```bash
# 1. 確認環境變數
cat .env.production

# 2. 部署後端 API
pnpm run deploy:workers:production

# 3. 建置並部署前端
pnpm run deploy:production

# 4. 驗證部署
curl https://snap-wall-api-production.oddlabcc.workers.dev/health
```

---

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

---

## 🔄 回滾步驟

### 方法 1: 透過 Git 回滾

```bash
# 1. 查看最近的 commits
git log --oneline -5

# 2. 回滾到前一個 commit
git checkout beta  # 或 main
git reset --hard HEAD~1

# 3. 強制推送 (觸發重新部署)
git push --force origin beta  # 或 main
```

### 方法 2: 透過 Cloudflare Dashboard

1. 進入 Cloudflare Dashboard
2. 選擇對應的 Worker
3. 進入 **Deployments** 頁面
4. 選擇前一個穩定版本並點擊 **Rollback**

---

## ✅ 部署前檢查清單

在推送到 `beta` 或 `main` 前,請確認:

- [ ] 本地測試通過 (`pnpm dev:all`)
- [ ] Lint 檢查通過 (`pnpm lint`)
- [ ] 型別檢查通過 (`pnpm typecheck`)
- [ ] 單元測試通過 (`pnpm test`)
- [ ] 環境變數配置正確
- [ ] CORS 設定包含正確的前端網址
- [ ] commit message 清楚描述變更內容

---

## 🐛 疑難排解

### 問題 1: CI/CD 部署失敗

**可能原因**:
- GitHub Secrets 未設定或過期
- Lint/Test 失敗
- Cloudflare API Token 權限不足

**解決方式**:
1. 檢查 GitHub Actions 日誌
2. 確認 Secrets 設定正確
3. 本地執行 `pnpm lint && pnpm test` 確認通過

### 問題 2: 前端呼叫到錯誤的 API

**解決方式**:
```bash
# 檢查建置後的 API URL
grep -r "snap-wall-api" dist/server/assets/*.js | head -3

# 確認使用正確的建置指令
pnpm run build              # Beta (使用 .env)
pnpm run build:production   # Production (使用 .env.production)
```

### 問題 3: CORS 錯誤

**解決方式**:
更新 `workers/wrangler.toml` 的 CORS 設定,並重新部署:
```bash
pnpm run deploy:workers:beta         # 或
pnpm run deploy:workers:production
```

### 問題 4: Durable Objects 錯誤

**解決方式**:
確認 `workers/wrangler.toml` 中的 `script_name` 與環境名稱一致:
- Beta: `script_name = "snap-wall-api-beta"`
- Production: `script_name = "snap-wall-api-production"`

---

## 📚 相關文件

- [.github/workflows/deploy-beta.yml](.github/workflows/deploy-beta.yml) - Beta 環境 CI/CD
- [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml) - Production 環境 CI/CD
- [workers/wrangler.toml](workers/wrangler.toml) - Workers API 配置
- [wrangler.jsonc](wrangler.jsonc) - 前端 Worker 配置
- [.env](.env) - Beta 環境變數
- [.env.production](.env.production) - Production 環境變數

---

## 🎯 快速指令參考

| 操作 | 指令 |
|-----|------|
| 部署到 Beta | `git checkout beta && git push origin beta` |
| 部署到 Production | `git checkout main && git push origin main` |
| 本地開發 | `pnpm dev:all` |
| 執行測試 | `pnpm test` |
| Lint 檢查 | `pnpm lint` |
| 型別檢查 | `pnpm typecheck` |
| 手動部署 Beta | `pnpm run deploy:workers:beta && pnpm run build && npx wrangler deploy` |
| 手動部署 Production | `pnpm run deploy:workers:production && pnpm run deploy:production` |
