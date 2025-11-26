# Cloudflare 設定文件更新說明

**更新日期**: 2025-11-19
**原因**: 修正 Durable Objects 配置方式，符合 Wrangler 3.x/4.x 最佳實踐

---

## 🔧 已修正的問題

### 1. TypeScript 型別衝突
**問題**: `Event` 型別與 DOM 的 `Event` 型別衝突，導致編譯錯誤
```
error TS2345: Argument of type '(event: Event) => void' is not assignable
```

**修正**:
- 將自定義的 `Event` 型別重新命名為 `ActivityEvent`
- WebSocket error handler 參數改名為 `ev` 避免衝突

**影響檔案**:
- `workers/src/durableObjects/EventRoom.ts`

### 2. wrangler.toml 配置錯誤

**問題**:
- 使用舊的配置格式（`[durable_objects]` 而非 `[[durable_objects.bindings]]`）
- 缺少 `script_name` 欄位
- 沒有正確的環境變數設定

**修正**:
```toml
# 舊的（錯誤）
[durable_objects]
bindings = [
  { name = "EVENT_ROOM", class_name = "EventRoom" }
]

# 新的（正確）
[[durable_objects.bindings]]
name = "EVENT_ROOM"
class_name = "EventRoom"
script_name = "snap-wall-api"  # 必須與主要 name 一致
```

**影響檔案**:
- `workers/wrangler.toml`

### 3. 文件中的錯誤指引

**問題**:
- 文件指示在 Dashboard 手動建立 Durable Object namespace
- 這在 Wrangler 3.x/4.x 中是**不必要且錯誤**的做法

**修正**:
- 說明 Wrangler 會自動建立 DO namespace
- 移除手動建立的步驟
- 新增本地測試的正確方法（`--local` 參數）

**影響檔案**:
- `CLOUDFLARE_SETUP.md`

---

## ✅ 主要更新內容

### 1. 步驟 2: 了解 Durable Objects 配置
- ❌ **舊**: "在 Dashboard 手動建立 DO namespace"
- ✅ **新**: "Wrangler 會自動建立，無需手動操作"

### 2. 步驟 3: wrangler.toml 配置
更新為正確的配置格式：
```toml
name = "snap-wall-api"
main = "src/index.ts"
compatibility_date = "2024-11-17"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "EVENT_ROOM"
class_name = "EventRoom"
script_name = "snap-wall-api"

[[migrations]]
tag = "v1"
new_classes = ["EventRoom"]

[env.dev]
name = "snap-wall-api-dev"
vars = { CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000" }
```

### 3. 步驟 4: 測試與部署
新增詳細的測試方法：

**本地測試（完全離線）**:
```bash
wrangler dev --local
```

**本地測試（連接 Cloudflare）**:
```bash
wrangler dev
```

**部署到不同環境**:
```bash
wrangler deploy --env dev
wrangler deploy --env staging
wrangler deploy --env production
```

### 4. 步驟 6: 驗證部署
新增完整的驗證流程：
- 本地健康檢查
- 測試 Durable Object 建立
- WebSocket 連接測試

### 5. 常見問題
新增更實用的問題解答：
- Durable Object binding not found
- 本地測試 DO 的方法
- 付費計畫與免費額度說明

---

## 🎯 現在可以執行的命令

### 本地完全離線測試
```bash
cd workers
pnpm dev --local
```

在另一個終端機：
```bash
# 健康檢查
curl http://localhost:8787/health

# 建立活動
curl -X POST http://localhost:8787/events \
  -H "Content-Type: application/json" \
  -d '{"title": "測試活動"}'
```

### 部署到 Cloudflare

**首次部署**需要：
1. 執行 `wrangler login`
2. 升級到 Workers Paid 計畫（$5/月，有大量免費額度）
3. 執行部署命令

```bash
cd workers
wrangler deploy --env dev
```

Wrangler 會自動：
- ✅ 建立 Durable Object namespace
- ✅ 執行 migrations
- ✅ 部署 Worker

---

## 📋 檢查清單

在部署前檢查：

- [x] TypeScript 編譯成功（已修正型別衝突）
- [x] wrangler.toml 配置正確
- [x] 本地測試可運行（`wrangler dev --local`）
- [ ] Cloudflare 帳號已登入（`wrangler login`）
- [ ] 已升級到 Workers Paid 計畫（首次部署 DO 時需要）
- [ ] 環境變數正確設定

---

## 🔗 相關檔案

### 已更新
- ✅ `workers/wrangler.toml` - 修正 DO 配置
- ✅ `workers/src/durableObjects/EventRoom.ts` - 修正型別衝突
- ✅ `CLOUDFLARE_SETUP.md` - 完整更新指南

### 相關文件
- `IMPLEMENTATION_STATUS.md` - 整體實作進度
- `README.md` - 專案概覽
- `specs/001-event-photo-wall/plan.md` - 技術規劃

---

## ⚠️ 重要提醒

1. **不要在 Dashboard 手動建立 DO namespace** - 這會導致 migrations 問題
2. **script_name 必須與 name 一致** - 否則 binding 會失敗
3. **本地測試使用 --local** - 不需要 Cloudflare 帳號
4. **首次部署 DO 需要付費計畫** - 但有豐富的免費額度

---

## 🚀 下一步

1. ✅ 本地測試 Worker（`wrangler dev --local`）
2. ⏳ 登入 Cloudflare（`wrangler login`）
3. ⏳ 部署到 dev 環境測試（`wrangler deploy --env dev`）
4. ⏳ 測試前端連接
5. ⏳ 部署到 production
