# Cloudflare 手動設定指南

本文件說明如何手動設定 Cloudflare Workers 和 Durable Objects 來運行活動照片牆應用程式。

## 前置需求

1. **Cloudflare 帳號**
   - 前往 https://dash.cloudflare.com/sign-up 註冊帳號
   - 需要綁定信用卡才能使用 Durable Objects（有免費額度）

2. **安裝 Wrangler CLI**
   ```bash
   pnpm add -g wrangler
   # 或
   npm install -g wrangler
   ```

3. **驗證 Wrangler 安裝**
   ```bash
   wrangler --version
   ```

## 步驟 1: 登入 Cloudflare

在終端機執行以下命令登入 Cloudflare:

```bash
wrangler login
```

這會開啟瀏覽器視窗，請完成授權流程。

## 步驟 2: 了解 Durable Objects 配置

**重要**: 使用 Wrangler 3.x/4.x 時，**不需要**在 Dashboard 手動建立 Durable Object namespace！

Wrangler 會在首次部署時自動建立 Durable Object。你只需要：
1. 在 `wrangler.toml` 中正確配置（已完成）
2. 執行部署命令，Wrangler 會自動處理建立

**注意**: Durable Objects 需要付費計畫（有免費額度），首次使用時 Cloudflare 會要求你升級帳號。

## 步驟 3: 驗證 wrangler.toml 配置

確認 `workers/wrangler.toml` 設定正確（已設定好）：

```toml
name = "snap-wall-api"
main = "src/index.ts"
compatibility_date = "2024-11-17"
compatibility_flags = ["nodejs_compat"]

# Durable Objects configuration
[[durable_objects.bindings]]
name = "EVENT_ROOM"
class_name = "EventRoom"
script_name = "snap-wall-api"  # 必須與 name 一致

# Durable Objects migrations
[[migrations]]
tag = "v1"
new_classes = ["EventRoom"]

# Development environment (本地測試)
[env.dev]
name = "snap-wall-api-dev"
vars = { CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000" }

# Staging environment
[env.staging]
name = "snap-wall-api-staging"
vars = { CORS_ALLOWED_ORIGINS = "https://staging.yourdomain.com,http://localhost:3000" }

# Production environment
[env.production]
name = "snap-wall-api-production"
vars = { CORS_ALLOWED_ORIGINS = "https://yourdomain.com" }
```

**重要設定說明:**

- `name`: Worker 的名稱（會成為 `<name>.<your-subdomain>.workers.dev`）
- `[[durable_objects.bindings]]`: 定義 Durable Object 綁定（注意使用雙方括號）
- `script_name`: 必須與主要的 `name` 欄位一致
- `[[migrations]]`: 定義 DO schema 遷移（首次部署時自動執行）
- `[env.xxx]`: 不同環境的配置
- `vars`: 環境變數（每個環境可以有不同值）

## 步驟 4: 測試與部署 Workers

### 本地測試（完全離線，不需要 Cloudflare 帳號）

在 `workers/` 目錄下執行:

```bash
cd workers
pnpm dev --local
# 或
wrangler dev --local
```

- `--local` 參數: 完全在本地運行，不連接 Cloudflare
- 預設在 http://localhost:8787
- Durable Objects 在本地記憶體中模擬

### 本地測試（連接 Cloudflare，需要登入）

```bash
cd workers
pnpm dev
# 或
wrangler dev
```

- 會連接到 Cloudflare 的 development 環境
- 可以測試真實的 Durable Objects
- 需要先執行 `wrangler login`

### 部署到 Cloudflare

**重要**: 首次部署時，Wrangler 會自動：
1. 建立 Durable Object namespace
2. 執行 migrations（建立 EventRoom class）
3. 部署 Worker

#### 部署到 dev 環境（測試用）

```bash
cd workers
pnpm deploy --env dev
# 或
wrangler deploy --env dev
```

#### 部署到 staging 環境

```bash
pnpm deploy --env staging
# 或
wrangler deploy --env staging
```

#### 部署到 production 環境

```bash
pnpm deploy --env production
# 或
wrangler deploy --env production
```

**首次部署注意事項**:
- Cloudflare 會要求你升級到付費計畫（Workers Paid plan）
- 有免費額度：每天 100 萬次請求
- 升級後才能使用 Durable Objects

## 步驟 5: 設定環境變數（選用）

**注意**: 基本的環境變數（如 `CORS_ALLOWED_ORIGINS`）已經在 `wrangler.toml` 的 `vars` 欄位中設定。

如果需要設定 **機密資訊**（如 API keys），使用以下方法：

### 方法 1: 使用 Wrangler CLI（推薦）

```bash
# 設定 production 環境的 secret
cd workers
wrangler secret put SECRET_API_KEY --env production
# 輸入值後按 Enter（不會顯示在螢幕上）
```

### 方法 2: 使用 Cloudflare Dashboard

1. 前往 https://dash.cloudflare.com
2. 點選 **Workers & Pages**
3. 選擇你的 Worker (例如 `snap-wall-api-production`)
4. 點選 **Settings** > **Variables**
5. 在 **Environment Variables** 區域點選 **Add variable**
6. 設定變數:
   - Variable name: `SECRET_API_KEY`
   - Value: 你的機密值
   - ✅ 勾選 "Encrypt" 設為 Secret
7. 點選 **Save and Deploy**

**Secret vs Variable 差異**:
- **Variable** (`vars` in wrangler.toml): 明文，適合非機密設定
- **Secret** (使用 `wrangler secret put`): 加密，適合 API keys、passwords

## 步驟 6: 驗證部署

### 本地測試

先在本地測試 Worker：

```bash
cd workers
pnpm dev --local
```

開啟另一個終端機，測試：

```bash
# 健康檢查
curl http://localhost:8787/health

# 建立活動
curl -X POST http://localhost:8787/events \
  -H "Content-Type: application/json" \
  -d '{"title": "測試活動"}'
```

### 檢查已部署的 Worker

部署後，找到你的 Worker URL（會顯示在部署輸出中）：

```bash
# 例如部署到 production
wrangler deploy --env production
# 輸出會顯示: Published snap-wall-api-production
# URL: https://snap-wall-api-production.<your-subdomain>.workers.dev
```

測試已部署的 Worker：

```bash
# 替換成你的實際 URL
WORKER_URL="https://snap-wall-api-production.<your-subdomain>.workers.dev"

# 健康檢查
curl $WORKER_URL/health
```

預期回應:
```json
{
  "status": "ok",
  "timestamp": 1700000000000
}
```

### 測試 Durable Object

測試建立活動（這會測試 Durable Object 是否正常運作）:

```bash
curl -X POST $WORKER_URL/events \
  -H "Content-Type: application/json" \
  -d '{"title": "測試活動"}'
```

預期回應:
```json
{
  "event": {
    "id": "123456",
    "title": "測試活動",
    "createdAt": 1700000000000,
    "status": "active",
    "photoCount": 0,
    "participantCount": 0
  },
  "qrCodeUrl": "..."
}
```

### 測試 WebSocket 連接

```bash
# 使用 websocat 或其他 WebSocket 客戶端
# 安裝 websocat: brew install websocat

# 連接到活動的 WebSocket（使用上面回應的 id）
websocat "wss://snap-wall-api-production.<your-subdomain>.workers.dev/events/123456/ws"

# 發送 join 訊息（替換成實際的 sessionId）
{"sessionId": "test-session-123"}
```

## 步驟 7: 更新前端環境變數

在前端專案的 `.env` 檔案中設定 Worker URL:

```env
# .env.production
PUBLIC_API_URL=https://snap-wall-worker.<your-account>.workers.dev
PUBLIC_WS_URL=wss://snap-wall-worker.<your-account>.workers.dev
```

## 步驟 8: 設定自訂網域（選用）

### 使用 Cloudflare Dashboard

1. 前往 https://dash.cloudflare.com
2. 點選你的 Worker
3. 點選 **Triggers** 標籤
4. 在 **Custom Domains** 區域點選 **Add Custom Domain**
5. 輸入你的子網域（如 `api.yourdomain.com`）
6. 點選 **Add Custom Domain**

### 使用 Wrangler

在 `wrangler.toml` 中加入:

```toml
[env.production]
routes = [
  { pattern = "api.yourdomain.com/*", custom_domain = true }
]
```

然後重新部署:

```bash
wrangler publish --env production
```

## 常見問題

### Q: 部署時出現 "Durable Object binding not found" 錯誤

**A:** 檢查以下事項：
1. `wrangler.toml` 中的 `script_name` 必須與 `name` 一致
2. 確認 `[[durable_objects.bindings]]` 使用雙方括號
3. 嘗試清除快取後重新部署：`wrangler deploy --env production --legacy-env false`

### Q: 本地測試時 Durable Objects 無法使用

**A:** 使用 `--local` 參數可以在本地模擬 Durable Objects：
```bash
wrangler dev --local
```
注意：本地模式的 DO 資料儲存在記憶體中，重啟後會清空。

### Q: 首次部署時要求升級付費計畫

**A:** Durable Objects 需要 Workers Paid 計畫（$5/月起），但有大量免費額度：
- 每天 100 萬次請求免費
- 適合中小型應用
- 可以先升級，在免費額度內測試

### Q: WebSocket 連接失敗

**A:** 檢查以下事項:
1. Worker URL 是否正確（應使用 `wss://` 而非 `ws://`）
2. CORS 設定是否包含你的前端網域
3. 前端是否正確發送 session ID

### Q: 如何查看 Worker 日誌？

**A:** 使用以下命令:

```bash
wrangler tail --env production
```

或在 Cloudflare Dashboard 的 Worker 頁面查看 **Logs** 標籤。

### Q: Durable Object 的費用是多少？

**A:** Cloudflare 提供以下免費額度:
- 每天 100 萬次請求
- 每個帳號最多 50 個 DO 命名空間
- 超過免費額度後，每百萬次請求 $0.15

詳細價格: https://developers.cloudflare.com/workers/platform/pricing/

### Q: 如何更新 Worker 代碼？

**A:** 直接執行部署命令即可:

```bash
cd workers
pnpm build
wrangler publish --env production
```

Cloudflare 會自動進行無縫更新（零停機時間）。

## 監控與除錯

### 啟用分析

Cloudflare 自動提供 Workers 分析數據:

1. 前往 https://dash.cloudflare.com
2. 選擇你的 Worker
3. 查看 **Metrics** 標籤

### 設定告警

在 Cloudflare Dashboard 中:

1. 前往 **Notifications**
2. 點選 **Add**
3. 選擇 **Workers** 類型
4. 設定告警條件（如錯誤率 > 5%）

### 本地除錯

使用 Wrangler 的本地開發模式:

```bash
cd workers
wrangler dev --local
```

加上 `--local` 參數可以在完全本地環境運行（不連接到 Cloudflare）。

## 安全性建議

1. **定期更新依賴套件**
   ```bash
   cd workers
   pnpm update
   ```

2. **啟用速率限制**
   - 在 Worker 代碼中已實施 rate limiting
   - 可在 Cloudflare Dashboard 的 **Security** > **Rate Limiting** 設定額外防護

3. **使用 Secrets 管理敏感資訊**
   ```bash
   wrangler secret put SENSITIVE_KEY --env production
   ```

4. **啟用 Web Application Firewall (WAF)**
   - 在 Cloudflare Dashboard 的 **Security** > **WAF** 啟用

## 下一步

- 設定 CI/CD 自動化部署（參考 `.github/workflows/deploy.yml`）
- 設定前端 Cloudflare Pages 部署
- 設定 Google Drive API 憑證
- 進行負載測試

## 參考資源

- [Cloudflare Workers 文件](https://developers.cloudflare.com/workers/)
- [Durable Objects 文件](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [Wrangler CLI 文件](https://developers.cloudflare.com/workers/wrangler/)
- [WebSocket API 文件](https://developers.cloudflare.com/workers/runtime-apis/websockets/)
