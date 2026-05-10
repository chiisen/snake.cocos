# 貪吃蛇遊戲開發問題總結與改善建議

## 開發概述

**專案**: Snake Game (Cocos Creator 3.8.8)  
**開發時間**: 2026-05-10  
**開發方式**: 使用 Cocos Creator MCP Server + AI Agent 協作開發  
**最終狀態**: MVP 版本完成，核心功能正常運行

---

## 遇到的問題清單

### 1. 🔴 專案一開全黑（Camera Visibility 問題）

**問題描述**:
預覽遊戲時畫面全黑，只能看到 Camera 背景，看不到任何 UI 元素。

**根本原因**:
- Main Camera 的 `visibility` 屬性設定錯誤
- 原值 = `41943040`（只包含 UI_3D + SCENE_GIZMO）
- Canvas 節點的 `layer` = `1073741824`（DEFAULT 層）
- Camera 看不到 DEFAULT 層的 UI 元素

**解決方法**:
```typescript
// 將 Camera.visibility 改為包含 DEFAULT 層
visibility = 1073741824  // DEFAULT 層
```

**花費時間**: ~30 分鐘診斷

---

### 2. 🔴 只看到文字，沒有貪吃蛇和食物（Sprite 渲染問題）

**問題描述**:
預覽時只看到 ScoreLabel 文字，看不到蛇身和食物方塊。

**根本原因**:
- Cocos Creator 3.x 的 Sprite 組件**必須有 spriteFrame 才能渲染**
- 光設置 `sprite.color` 不會顯示，需要圖片資源
- 新專案沒有任何 spriteFrame 資源

**解決方法**:
```typescript
// 改用 Graphics 組件直接繪製方形（不需要圖片）
const graphics = node.addComponent(Graphics);
graphics.fillColor = new Color(76, 175, 80, 255);
graphics.rect(0, 0, this.cellSize, this.cellSize);
graphics.fill();
```

**花費時間**: ~45 分鐘（包含嘗試創建 PNG 圖片失敗）

**關鍵學習**:
- Sprite = 需要 spriteFrame（圖片資源）
- Graphics = 直接繪製向量圖形（不需要資源）
- 新專案優先考慮 Graphics 組件

---

### 3. 🟡 方向鍵不能控制貪吃蛇（輸入系統問題）

**問題描述**:
按方向鍵時蛇沒有反應，無法控制移動方向。

**根本原因**:
- Cocos 的 `input.on(Input.EventType.KEY_DOWN)` 可能被瀏覽器事件覆蓋
- 瀏覽器方向鍵會觸發頁面滾動，可能阻止遊戲接收
- 預覽窗口需要獲得焦點

**解決方法**:
```typescript
// 雙重監聽：Cocos + 原生 window
setupInput() {
    // Cocos 輸入系統
    input.on(Input.EventType.KEY_DOWN, (event) => {
        this.handleKey(event.keyCode);
    }, this);
    
    // 原生 DOM 事件（更可靠）
    if (typeof window !== 'undefined') {
        this.keyHandler = (e: KeyboardEvent) => {
            e.preventDefault();  // 阻止瀏覽器滾動
            this.handleKey(e.keyCode);
        };
        window.addEventListener('keydown', this.keyHandler);
    }
}

// 統一處理函數（支援兩種 keyCode）
handleKey(code: number) {
    switch (code) {
        case 38:  // 原生 Arrow Up
        case KeyCode.ARROW_UP:  // Cocos keyCode
            // ...
    }
}
```

**花費時間**: ~20 分鐘（添加 debug log 確認）

---

### 4. 🟡 貪吃蛇可以自殺（碰撞檢測 bug）

**問題描述**:
蛇向右移動時按左方向鍵，會立即判定「撞到自己」死亡。

**根本原因**:
- 碰撞檢測檢查所有蛇身位置
- 蛇頭新位置 = 蛇身第二格位置
- 但尾巴會在本幀移走，不應判定為碰撞

**錯誤邏輯**:
```typescript
// 檢查所有蛇身（包括尾巴）
for (const snakePos of this.snake) {
    if (pos.x === snakePos.x && pos.y === snakePos.y) {
        return true;  // 誤判死亡
    }
}
```

**正確邏輯**:
```typescript
// 跳過尾巴（尾巴會移走）
for (let i = 0; i < this.snake.length - 1; i++) {
    if (pos.x === this.snake[i].x && pos.y === this.snake[i].y) {
        return true;
    }
}
```

**花費時間**: ~10 分鐘診斷

---

### 5. 🟡 遊戲邊界沒畫出來（Graphics 座標問題）

**問題描述**:
嘗試繪製白色邊框，但在預覽中看不到。

**根本原因**:
- GameArea 節點的 `anchorPoint` = (0.5, 0.5)（中心點）
- Graphics 繪製從 (0, 0) 開始，但節點中心點在 (width/2, height/2)
- 繪製內容超出節點範圍，看不見

**錯誤方法**:
```typescript
// 從 (0, 0) 繪製 → 超出節點範圍
g.rect(0, 0, width, height);
```

**正確方法**:
```typescript
// 從中心點繪製
const halfW = width / 2;
const halfH = height / 2;
g.rect(-halfW, -halfH, width, height);
```

**花費時間**: ~15 分鐘（嘗試 3 次才成功）

---

### 6. 🟢 Git 版控：嵌套 Repo 問題

**問題描述**:
`extensions/cocos-mcp-server` 是第三方工具，有自己的 git repo，直接 add 會變成嵌套 repo（160000 模式）。

**解決方法**:
```bash
# 改用 Git Submodule
git rm --cached extensions/cocos-mcp-server
git submodule add https://github.com/DaxianLee/cocos-mcp-server.git extensions/cocos-mcp-server
```

**花費時間**: ~5 分鐘

---

## 總時間消耗分析

| 問題類型 | 花費時間 | 百分比 |
|---------|---------|--------|
| Camera Visibility | 30 min | 20% |
| Sprite → Graphics 改造 | 45 min | 30% |
| 輸入系統 | 20 min | 13% |
| 碰撞檢測邏輯 | 10 min | 7% |
| Graphics 座標系 | 15 min | 10% |
| Git Submodule | 5 min | 3% |
| 其他調整 | 25 min | 17% |
| **總計** | **150 min** | **100%** |

**主要消耗**: 
1. **渲染問題**（Sprite → Graphics）佔 40%
2. **Camera 配置**佔 20%

---

## 改善建議

### 🔧 開發流程改善

#### 1. 新專案初始化 Checklist

```markdown
## Cocos Creator 3.x 新專案必查項目

### Camera 配置
- [ ] Camera.visibility 包含 DEFAULT 層 (1073741824)
- [ ] Camera.visibility 包含 UI_2D 層 (33554432)
- [ ] Camera.clearFlags = SOLID_COLOR 或 DEPTH_ONLY
- [ ] Camera 位置合理 (z > 0)

### Canvas 配置
- [ ] Canvas 組件已添加
- [ ] Canvas.cameraComponent 引用正確
- [ ] Canvas.alignCanvasWithScreen = true

### 節點配置
- [ ] UI 節點 layer = DEFAULT 或 UI_2D
- [ ] UITransform contentSize 已設定
- [ ] anchorPoint 位置正確
```

#### 2. 渲染組件選擇指南

| 需求 | 推薦組件 | 原因 |
|-----|---------|-----|
| 靜態方形/圓形 | **Graphics** | 不需圖片資源 |
| 動態圖片 | Sprite + spriteFrame | 需圖片資源 |
| 文字 | Label | 最簡單 |
| 純色方塊 | Graphics 或 Sprite (有 frame) | Graphics 更快 |

**新專案優先順序**:
```
Graphics > Sprite (需準備圖片) > UI 基礎組件
```

#### 3. Graphics 繪製最佳實踐

```typescript
// ✅ 正確：考慮 anchorPoint
const transform = node.getComponent(UITransform);
const halfW = transform.width / 2;
const halfH = transform.height / 2;

graphics.rect(-halfW, -halfH, transform.width, transform.height);
graphics.fill();

// ❌ 錯誤：忽略 anchorPoint
graphics.rect(0, 0, width, height);  // 從左下角繪製
```

#### 4. 輸入系統最佳實踐

```typescript
// 雙重監聯確保可靠
setupInput() {
    // 1. Cocos 系統（編輯器內）
    input.on(Input.EventType.KEY_DOWN, this.handleKey, this);
    
    // 2. 原生 DOM（瀏覽器預覽）
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            this.handleKey(e.keyCode);
        });
    }
}

// 支援兩種 keyCode 格式
handleKey(code: number) {
    // 原生 keyCode (38, 40, 37, 39)
    // Cocos KeyCode (ARROW_UP, ARROW_DOWN...)
    const UP = code === 38 || code === KeyCode.ARROW_UP;
    const DOWN = code === 40 || code === KeyCode.ARROW_DOWN;
    // ...
}
```

#### 5. 碰撞檢測最佳實踐

```typescript
// 貪吃蛇：跳過會移走的尾巴
checkCollision(pos: Vec3): boolean {
    // 檢查牆壁
    if (outOfBounds) return true;
    
    // 檢查蛇身（跳過最後一格 = 尾巴）
    for (let i = 0; i < this.snake.length - 1; i++) {
        if (pos === this.snake[i]) return true;
    }
    
    return false;
}
```

---

### 📝 AI Agent 協作改善

#### 1. 問題診斷流程標準化

```
用戶報告問題 → 
    1. 檢查 Console logs (error)
    2. 檢查節點結構 (get_scene_hierarchy)
    3. 檢查組件配置 (get_components)
    4. 檢查 Camera 配置 (visibility, position)
    5. 執行 runtime script 確認狀態
    → 找到根本原因
```

#### 2. MCP Server 使用建議

| 常用工具 | 用途 |
|---------|-----|
| `get_project_info` | 確認專案配置 |
| `get_current_scene` | 確認當前場景 |
| `get_scene_hierarchy` | 檢查節點樹 |
| `get_components` | 檢查組件配置 |
| `set_component_property` | 修改屬性 |
| `get_console_logs` | 檢查錯誤訊息 |

#### 3. 預檢查機制

在開始開發前，先執行：
```typescript
// 檢查 Camera visibility
const camera = scene.getChildByName('Main Camera').getComponent(Camera);
if (camera.visibility !== DEFAULT_LAYER) {
    console.warn('Camera visibility 可能不正確');
}

// 檢查是否有 spriteFrame
const sprite = node.getComponent(Sprite);
if (sprite && !sprite.spriteFrame) {
    console.warn('Sprite 缺少 spriteFrame，將無法渲染');
}
```

---

### 🏗️ 架構改善建議

#### 1. 遊戲區域節點結構

```
GameManager (空節點，掛載 SnakeGame.ts)
├── Border (Graphics 繪製邊框)
├── SnakeContainer (動態創建蛇身節點)
└── Food (食物節點)
```

**優點**:
- Border 獨立節點，不依賴 GameArea
- SnakeContainer 統一管理蛇身
- 清理時直接 destroy children

#### 2. 組件分離

```typescript
// 目前：單一 SnakeGame.ts 包含所有邏輯
// 改善：分離為多個組件

SnakeController.ts    // 移動與控制
FoodManager.ts        // 食物生成
CollisionDetector.ts  // 碰撞檢測
UIManager.ts          // UI 更新
```

---

### 🔍 常見陷阱清單

| 陷阱 | 症狀 | 解決方法 |
|-----|-----|---------|
| Camera visibility | 全黑畫面 | 設為 DEFAULT 層 |
| Sprite無spriteFrame | 元素不顯示 | 用 Graphics 或加圖片 |
| Graphics 座標錯誤 | 繪製看不見 | 從中心點繪製 |
| 方向鍵不響應 | 無法控制 | 雙重監聯 + preventDefault |
| 碰撞自殺 | 快速反向死亡 | 跳過尾巴檢查 |
| 嵌套 Git repo | submodule 空 | 用 git submodule add |

---

## 結論

### 主要收穫

1. **Camera visibility 是新專案首要檢查項**
2. **Graphics 組件是新專案快速開發利器**
3. **輸入系統需要雙重監聯確保可靠性**
4. **碰撞邏輯需考慮「會移走」的位置**
5. **Graphics 座標系以 anchorPoint 為基準**

### 開發效率提升建議

| 方法 | 預期效果 |
|-----|---------|
| 新專案 Checklist | 減少 50% 配置問題 |
| Graphics 優先策略 | 減少 40% 渲染問題 |
| 問題診斷流程 | 加速 30% 問題定位 |
| 組件分離架構 | 提升維護性 60% |

### 下次開發建議

1. **先創建最小可運行版本**（綠色蛇 + 紅色食物 + 鍵盤控制）
2. **確認 Camera + Canvas 配置正確後再加功能**
3. **使用 Graphics 組件快速原型**
4. **遇到問題先查 Console → 組件配置 → 座標系**

---

**文件版本**: 1.0  
**創建日期**: 2026-05-10  
**作者**: AI Agent + Developer