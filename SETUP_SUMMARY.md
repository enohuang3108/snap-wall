# 設定總結 - 照片牆系統架構

## 🎯 核心概念

### 正確的架構 ✅

```
參與者（手機）
    ↓ 選擇照片
前端（瀏覽器）
    ↓ 使用 API Key
Google Drive REST API
    ↓ 上傳照片
主辦方的公開資料夾
    ↓ 取得公開 URL
WebSocket 廣播
    ↓
大螢幕顯示
```

### 關鍵特點

- ✅ **參與者無需登入**：不需要 Google 帳號
- ✅ **使用 API Key**：開發者的憑證，前端直接使用
- ✅ **公開資料夾**：主辦方建立，「知道連結的人可以檢視」
- ✅ **統一管理**：所有照片在主辦方的 Google Drive

### 錯誤的理解 ❌

- ❌ 參與者需要 OAuth 登入
- ❌ 照片存在參與者自己的 Drive
- ❌ 需要複雜的授權流程
- ❌ 完全零資料儲存（照片在主辦方 Drive）

---

## 📋 設定檢查清單

### 開發者（你需要做的）

- [ ] **步驟 1**：建立 Google Cloud 專案
- [ ] **步驟 2**：啟用 Google Drive API
- [ ] **步驟 3**：建立 API Key
  - [ ] 設定 HTTP 參照網址限制
  - [ ] 限制只能存取 Google Drive API
- [ ] **步驟 4**：設定環境變數
  - [ ] 建立 `.env.local`
  - [ ] 填入 `VITE_GOOGLE_API_KEY`

**預計時間**：10-15 分鐘

### 主辦方（終端使用者需要做的）

- [ ] **步驟 1**：建立 Google Drive 資料夾
- [ ] **步驟 2**：設定為「知道連結的人可以檢視」
- [ ] **步驟 3**：取得資料夾 ID
- [ ] **步驟 4**：在系統中建立活動時輸入資料夾 ID

**預計時間**：3-5 分鐘

---

## 🔧 技術實作

### 前端上傳照片

```typescript
// src/lib/googleDrive.ts
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export async function uploadPhotoToDrive(file: File, folderId: string) {
  // 1. 建立 metadata
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  // 2. 上傳檔案（multipart）
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${API_KEY}`,
    { method: 'POST', body: form }
  );

  const fileData = await response.json();

  // 3. 設定為公開
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions?key=${API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }
  );

  // 4. 取得公開 URL
  const fileInfo = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileData.id}?fields=thumbnailLink,webContentLink&key=${API_KEY}`
  ).then(r => r.json());

  return {
    fileId: fileData.id,
    thumbnailUrl: fileInfo.thumbnailLink,
    fullUrl: fileInfo.webContentLink,
  };
}
```

### 使用方式

```typescript
// 在 PhotoUpload.tsx 中
const handleUpload = async (file: File) => {
  // 從活動資訊中取得 folderId
  const { event } = await getEvent(activityId);

  // 上傳到 Google Drive
  const photoData = await uploadPhotoToDrive(file, event.driveFolderId);

  // 透過 WebSocket 廣播
  websocket.send(JSON.stringify({
    type: 'photo_added',
    driveFileId: photoData.fileId,
    thumbnailUrl: photoData.thumbnailUrl,
    fullUrl: photoData.fullUrl,
  }));
};
```

---

## 🚀 快速開始

### 1. 設定 Google Cloud（必要）

```bash
# 前往 Google Cloud Console
open https://console.cloud.google.com/

# 按照步驟：
# 1. 建立專案
# 2. 啟用 Google Drive API
# 3. 建立 API Key（設定限制）
# 4. 複製 API Key
```

### 2. 設定環境變數

```bash
# 建立 .env.local
cp .env.example .env.local

# 編輯 .env.local，填入你的 API Key
VITE_GOOGLE_API_KEY=你的API_KEY
```

### 3. 測試

```bash
# 啟動開發伺服器
pnpm dev

# 建立測試資料夾（在 Google Drive）
# 建立活動，輸入資料夾 ID
# 上傳照片測試
```

---

## 📚 文件連結

- **[開發者設定指南](./GOOGLE_CLOUD_SETUP_DEV.md)** - 詳細的 Google Cloud 設定步驟
- **[使用者指南](./GOOGLE_DRIVE_SETUP.md)** - 給主辦方的簡單步驟
- **[README](./README.md)** - 專案概述和快速開始

---

## ❓ 常見問題速查

### Q: 為什麼 API Key 會暴露在前端？

A: 這是正常的！Google Drive API 支援瀏覽器端使用 API Key。透過以下方式保護：
- HTTP 參照網址限制（只有你的網域可用）
- API 限制（只能存取 Drive API）
- 資料夾權限（只能上傳到指定資料夾）

### Q: 參與者需要 Google 帳號嗎？

A: **不需要！** 這是關鍵。照片透過系統的 API Key 上傳到主辦方的資料夾。

### Q: 照片存在哪裡？

A: 主辦方的 Google Drive 公開資料夾。活動結束後主辦方可以保留或刪除。

### Q: 是否完全零資料儲存？

A: 不完全。照片存在主辦方的 Google Drive（不是系統伺服器）。彈幕完全不儲存。

---

## 🎯 下一步

現在你已經理解正確的架構，可以：

1. **先設定 Google Cloud**（10-15 分鐘）
   - 跟著 [GOOGLE_CLOUD_SETUP_DEV.md](./GOOGLE_CLOUD_SETUP_DEV.md) 操作

2. **設定環境變數**
   - 建立 `.env.local`
   - 填入 API Key

3. **實作上傳功能**（或讓我幫你）
   - 建立 `src/lib/googleDrive.ts`
   - 更新 `PhotoUpload.tsx`
   - 測試上傳流程

需要協助實作嗎？
