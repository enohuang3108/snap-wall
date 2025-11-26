# Google Cloud 開發者設定指南

本指南協助開發者設定 Google Cloud 專案和 Drive API，讓照片牆系統可以存取公開的 Google Drive 資料夾。

## 架構說明

### 系統運作方式 ✨

```
主辦方建立活動時：
1. 在 Google Drive 建立公開資料夾
2. 取得資料夾 ID
3. 在系統中輸入資料夾 ID

參與者上傳照片時：
1. 在手機選擇照片
2. 照片透過系統的 API 上傳到主辦方的公開資料夾
3. 系統取得照片的公開 URL
4. 廣播給所有連接的客戶端
5. 顯示在大螢幕上
```

### 關鍵特點

- ✅ **參與者無需登入**：不需要 Google 帳號
- ✅ **統一管理**：所有照片在主辦方的資料夾中
- ✅ **簡單易用**：參與者只需選擇照片即可上傳
- ✅ **開發者控制**：使用開發者的 Google Cloud 專案和 API Key
- ⚠️ **注意**：照片存在主辦方的 Google Drive（不是參與者的）

---

## 設定步驟

### 步驟 1：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊頂部的專案下拉選單
3. 點擊「新增專案」
4. 輸入專案名稱（例如：`snap-wall-app`）
5. 點擊「建立」

### 步驟 2：啟用 Google Drive API

1. 在左側選單中，選擇「API 和服務」→「程式庫」
2. 搜尋「Google Drive API」
3. 點擊進入後，點擊「啟用」
4. 同樣啟用「Google Picker API」

### 步驟 3：建立 API Key

**這是主要的存取方式！**

1. 在「憑證」頁面點擊「建立憑證」→「API 金鑰」
2. 複製生成的 API Key
3. 點擊「限制金鑰」設定安全性：

#### 設定 API Key 限制

**應用程式限制**：
- 選擇「HTTP 參照網址（網站）」
- 新增網站限制：
  ```
  http://localhost:5173/*
  http://localhost:3000/*
  https://your-production-domain.com/*
  ```

**API 限制**：
- 選擇「限制金鑰」
- 僅選取：**Google Drive API**

點擊「儲存」

⚠️ **重要**：妥善保存這個 API Key，這是系統存取 Google Drive 的唯一憑證。

### 步驟 4：設定環境變數

#### 前端環境變數 (`.env.local`)

在專案根目錄建立 `.env.local` 檔案：

```bash
# Google Drive API Key (主要憑證)
VITE_GOOGLE_API_KEY=你的API_KEY

# API 端點
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787
```

#### Workers 環境變數 (`workers/.dev.vars`)

通常不需要，因為前端直接使用 API Key 存取公開資料夾。

如果需要後端驗證：

```bash
# Google API Key (用於後端驗證)
GOOGLE_API_KEY=你的API_KEY
```

⚠️ **安全提醒**：
- 絕不要將 `.env.local` 或 `.dev.vars` 提交到 Git
- 這些檔案已經在 `.gitignore` 中
- 生產環境請使用環境變數或 Secrets 管理

---

## 實作整合

### 方式一：使用 Google Drive REST API（推薦）✨

這是最簡單的方式，直接使用 fetch 呼叫 Drive API。

#### 上傳照片到公開資料夾

在 `src/lib/googleDrive.ts` 建立：

```typescript
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

/**
 * 上傳照片到 Google Drive 公開資料夾
 * @param file 照片檔案
 * @param folderId Google Drive 資料夾 ID
 * @returns 照片的公開 URL
 */
export async function uploadPhotoToDrive(
  file: File,
  folderId: string
): Promise<{
  fileId: string;
  thumbnailUrl: string;
  fullUrl: string;
  width: number;
  height: number;
}> {
  // 步驟 1: 建立檔案 metadata
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId],
  };

  // 步驟 2: 建立 multipart upload request
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  // 步驟 3: 上傳檔案
  const uploadResponse = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${API_KEY}`,
    {
      method: 'POST',
      body: form,
    }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    throw new Error(`上傳失敗: ${error.error?.message || '未知錯誤'}`);
  }

  const fileData = await uploadResponse.json();
  const fileId = fileData.id;

  // 步驟 4: 設定檔案為公開可讀
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    }
  );

  // 步驟 5: 取得檔案詳細資訊（包含縮圖和完整 URL）
  const fileInfoResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink,webContentLink,imageMediaMetadata&key=${API_KEY}`
  );

  const fileInfo = await fileInfoResponse.json();

  // 步驟 6: 取得圖片尺寸
  const dimensions = await getImageDimensions(file);

  return {
    fileId,
    thumbnailUrl: fileInfo.thumbnailLink || `https://drive.google.com/thumbnail?id=${fileId}`,
    fullUrl: fileInfo.webContentLink || `https://drive.google.com/uc?id=${fileId}`,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * 取得圖片尺寸
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
}
```

#### 使用範例

在 `src/components/PhotoUpload.tsx`：

```typescript
import { uploadPhotoToDrive } from '../lib/googleDrive';

async function handlePhotoUpload(file: File, folderId: string) {
  try {
    // 顯示上傳中狀態
    setUploading(true);

    // 上傳到 Google Drive
    const photoData = await uploadPhotoToDrive(file, folderId);

    // 透過 WebSocket 廣播給所有人
    websocket.send(JSON.stringify({
      type: 'photo_added',
      driveFileId: photoData.fileId,
      thumbnailUrl: photoData.thumbnailUrl,
      fullUrl: photoData.fullUrl,
      width: photoData.width,
      height: photoData.height,
    }));

    setUploading(false);
  } catch (error) {
    console.error('上傳失敗:', error);
    setError(error.message);
  }
}
```

---

## 測試設定

### 本地測試

1. 建立測試用的 Google Drive 資料夾：
   - 開啟 Google Drive
   - 建立新資料夾「測試照片牆」
   - 設定為「知道連結的人可以檢視」
   - 複製資料夾 ID

2. 啟動開發伺服器：
   ```bash
   pnpm dev
   ```

3. 測試上傳流程：
   - 開啟 `http://localhost:5173`
   - 建立新活動，輸入測試資料夾 ID
   - 選擇照片並上傳
   - 檢查照片是否出現在 Google Drive 資料夾中

### 驗證 API 設定

在瀏覽器 Console 測試 API 連接：

```javascript
// 測試 API Key 是否有效
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const FOLDER_ID = 'your-test-folder-id';

fetch(`https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}`)
  .then(res => res.json())
  .then(data => console.log('API 測試成功:', data))
  .catch(err => console.error('API 測試失敗:', err));
```

---

## 發布到生產環境

### 更新 API Key 限制

在「憑證」中更新 API Key：
- 新增生產環境網域到「HTTP 參照網址」
- 確保 API 限制僅包含 Google Drive API

### 設定生產環境變數

在建置時設定環境變數：

```bash
# Cloudflare Pages 設定
VITE_GOOGLE_API_KEY=你的API_KEY
VITE_API_URL=https://your-workers.your-subdomain.workers.dev
VITE_WS_URL=wss://your-workers.your-subdomain.workers.dev
```

---

## 常見問題

### Q1: 參與者需要登入 Google 帳號嗎？

**A**: **不需要！** 這是關鍵差異：
- 參與者只需選擇照片
- 照片透過系統的 API Key 上傳到主辦方的公開資料夾
- 完全不需要 OAuth 授權流程

### Q2: API Key 會不會被濫用？

**A**: 已設定多層保護：
- **HTTP 參照網址限制**：只有你的網域可以使用
- **API 限制**：只能存取 Google Drive API
- **資料夾權限**：只能上傳到指定的公開資料夾

### Q3: 為什麼要設定資料夾為「公開」？

**A**: 因為：
- 大螢幕需要直接存取照片 URL
- 不同參與者的裝置需要載入照片
- 公開連結不需要額外授權

但請注意：
- 「公開」= 知道連結的人可以檢視
- 不會被搜尋引擎索引
- 可以隨時變更權限或刪除

### Q4: 照片會存多久？

**A**:
- 照片存在主辦方的 Google Drive 中
- 活動結束後，主辦方可以：
  - 保留照片作為記錄
  - 下載後刪除資料夾
  - 變更權限為私人

### Q5: API 有配額限制嗎？

**A**: 是的，Google Drive API 有配額：
- **讀取**：1,000 requests / 100 seconds / user
- **寫入**：300 requests / 100 seconds / user

對於一般活動（100-500 人）完全足夠。如果需要更高配額，可以申請增加。

### Q6: 可以上傳影片嗎？

**A**: 技術上可以，但建議：
- 限制檔案大小（例如 20MB）
- 影片載入較慢，影響使用者體驗
- 目前系統設計為照片牆，影片支援需要額外開發

### Q7: 如果 API Key 洩漏怎麼辦？

**A**:
1. 立即到 Google Cloud Console 刪除該 API Key
2. 建立新的 API Key
3. 更新環境變數並重新部署
4. 檢查是否有異常使用（Quota 頁面）

---

## 安全性最佳實踐

1. **保護 API Key**
   - ⚠️ API Key 會暴露在前端，這是正常的
   - 使用 HTTP 參照網址限制來保護
   - 限制只能存取 Google Drive API
   - 定期輪換（建議每 6-12 個月）

2. **資料夾權限管理**
   - 主辦方的資料夾設定為「知道連結的人可以檢視」
   - 不要使用「任何人」（會被搜尋引擎索引）
   - 活動結束後可以變更為私人

3. **檔案大小限制**
   - 在前端限制檔案大小（建議 20MB）
   - 防止濫用上傳大量檔案

4. **Rate Limiting**
   - 系統已實作每位參與者上傳頻率限制
   - 每 60 秒最多 20 張照片
   - 防止惡意大量上傳

5. **使用環境變數**
   - 開發：`.env.local`
   - 生產：Cloudflare Pages 環境變數
   - 絕不提交 `.env.local` 到 Git

---

## 下一步

設定完成後，你可以：

1. 實作照片上傳元件（參考 `src/components/PhotoUpload.tsx`）
2. 整合 Google Picker 到上傳流程
3. 測試完整的上傳和顯示流程

需要程式碼實作範例嗎？
