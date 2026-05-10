# Snake Game - AI Agent 開發規範

## 專案概況

- **引擎**: Cocos Creator 3.8.8
- **語言**: TypeScript
- **類型**: 2D UI 遊戲
- **渲染**: Graphics 組件（無圖片資源）

---

## ⚠️ 必讀陷阱清單

開始任何開發前，先確認以下陷阱是否會發生：

### 🚨 高風險陷阱

| 陷阱 | 症狀 | 立即檢查 |
|-----|-----|---------|
| **Camera visibility** | 全黑畫面 | `visibility` 必須包含 `DEFAULT` (1073741824) |
| **Sprite無spriteFrame** | 元素不顯示 | 用 **Graphics** 組件代替 |
| **Graphics 座標錯誤** | 繪製看不見 | 從中心點繪製 `rect(-halfW, -halfH, w, h)` |
| **輸入不響應** | 鍵盤無效 | 雙重監聯: `input.on` + `window.addEventListener` |
| **碰撞自殺** | 反向死亡 | 跳過尾巴檢查 `for (i=0; i<length-1)` |

---

## 📋 新功能開發 Checklist

每次添加新功能前執行：

### Phase 1: 環境確認

```typescript
// 1. Camera 檢查
Main Camera.visibility === 1073741824  // DEFAULT 層
Main Camera.position.z > 0             // 在 UI 前方

// 2. Canvas 檢查
Canvas.cameraComponent 引用正確
Canvas.alignCanvasWithScreen === true

// 3. 節點檢查
新節點.layer === 1073741824  // DEFAULT
新節點.addComponent(UITransform)
```

### Phase 2: 組件選擇

```
需求                    →  使用組件
純色方塊/圓形           →  Graphics（優先）
圖片/動畫               →  Sprite + spriteFrame
文字                    →  Label
按鈕                    →  Button + Graphics/Label
```

### Phase 3: 繪製/定位

```typescript
// Graphics 繪製（正確）
const transform = node.getComponent(UITransform);
const halfW = transform.width / 2;
const halfH = transform.height / 2;
graphics.rect(-halfW, -halfH, w, h);  // ✅ 從中心

// Graphics 繪製（錯誤）
graphics.rect(0, 0, w, h);  // ❌ 從左下角（可能超出範圍）
```

---

## 🛠️ 最佳實踐

### 1. 渲染組件優先級

```
新專案/新功能:
  Graphics > Sprite (需圖片) > 原生 UI

原因:
  Graphics 不需資源，立即可用
  Sprite 需要 spriteFrame，否則不渲染
```

### 2. 輸入系統標準模板

```typescript
// 所有遊戲輸入都用這個模板
setupInput() {
    // Cocos 輸入（編輯器）
    input.on(Input.EventType.KEY_DOWN, this.handleKey, this);
    
    // DOM 輸入（瀏覽器）+ 阻止滾動
    if (typeof window !== 'undefined') {
        this.keyHandler = (e: KeyboardEvent) => {
            e.preventDefault();  // 🔴 重要！阻止瀏覽器行為
            this.handleKey(e.keyCode);
        };
        window.addEventListener('keydown', this.keyHandler);
    }
}

// 支援兩種 keyCode 格式
handleKey(code: number) {
    const UP = code === 38 || code === KeyCode.ARROW_UP;    // 原生 + Cocos
    const DOWN = code === 40 || code === KeyCode.ARROW_DOWN;
    const LEFT = code === 37 || code === KeyCode.ARROW_LEFT;
    const RIGHT = code === 39 || code === KeyCode.ARROW_RIGHT;
}
```

### 3. 碰撞檢測標準模板

```typescript
// 貪吃蛇類遊戲：跳過「會移走」的部分
checkCollision(pos: Vec3): boolean {
    // 牆壁碰撞
    if (pos.x < 0 || pos.x >= gridWidth) return true;
    if (pos.y < 0 || pos.y >= gridHeight) return true;
    
    // 蛇身碰撞（跳過最後一格 = 尾巴）
    for (let i = 0; i < this.snake.length - 1; i++) {  // 🔴 length-1
        if (pos.x === this.snake[i].x && pos.y === this.snake[i].y) {
            return true;
        }
    }
    
    return false;
}
```

### 4. 節點創建標準模板

```typescript
// 動態創建遊戲元素
createNode(name: string, parent: Node, size: number, color: Color): Node {
    const node = new Node(name);
    node.parent = parent;  // 🔴 必須先設 parent
    node.layer = 1073741824;  // DEFAULT 層
    
    const transform = node.addComponent(UITransform);
    transform.setContentSize(size, size);
    
    const graphics = node.addComponent(Graphics);  // 🔴 用 Graphics
    graphics.fillColor = color;
    graphics.rect(-size/2, -size/2, size, size);  // 🔴 從中心繪製
    graphics.fill();
    
    return node;
}
```

---

## 🔍 問題診斷流程

遇到問題時，依序執行：

### Step 1: 快速檢查（必做）

```bash
# MCP 命令
1. get_console_logs (filter=error) → 看錯誤訊息
2. get_scene_hierarchy → 看節點樹結構
3. get_components (Main Camera) → 看 Camera 配置
4. get_components (Canvas) → 看 Canvas 配置
```

### Step 2: 常見問題排查表

| 症狀 | 檢查項 | MCP 命令 |
|-----|-------|---------|
| 全黑畫面 | Camera.visibility | `get_component_info(Camera)` |
| 元素不顯示 | Sprite.spriteFrame | `get_components(節點)` |
| 位置錯誤 | UITransform.contentSize | `get_node_info(節點)` |
| 繪製看不見 | Graphics 座標 | 檢查程式碼 `rect(-half, -half)` |
| 鍵盤無效 | input listener | 檢查程式碼 `setupInput()` |

### Step 3: Runtime 验證（進階）

```typescript
// 在瀏覽器 Console (F12) 执行
console.log('Camera visibility:', camera.visibility);
console.log('Node layer:', node.layer);
console.log('Children count:', node.children.length);
```

---

## 📐 座標系指南

### Cocos Creator 3.x UI 座標

```
Canvas 中心點 = (width/2, height/2)
  例如: 1280x720 → 中心 = (640, 360)

節點 anchorPoint = (0.5, 0.5)  // 預設中心
  節點中心點 = (x, y)  // position
  
Graphics 繪製原點 = 節點中心點
  正確: rect(-halfW, -halfH, w, h)  // 從中心向四周
  錯誤: rect(0, 0, w, h)  // 從節點中心向右上（超出範圍）
```

### 座標轉換公式

```typescript
// 网格座標 → 世界座標（中心點）
gridToWorld(gridX, gridY): Vec3 {
    const offsetX = -(gridWidth * cellSize) / 2 + cellSize / 2;
    const offsetY = -(gridHeight * cellSize) / 2 + cellSize / 2;
    
    return new Vec3(
        offsetX + gridX * cellSize,
        offsetY + gridY * cellSize,
        0
    );
}
```

---

## 🎮 專案特定配置

### 网格設定（不可變）

```typescript
gridWidth = 20      // 水平 20 格
gridHeight = 15     // 垂直 15 格
cellSize = 30       // 每格 30px

遊戲區域 = 600 x 450 px
Canvas = 1280 x 720 px
```

### 顏色標準

```typescript
背景: Color(40, 40, 40)      // 深灰
蛇身: Color(76, 175, 80)    // 綠色
食物: Color(255, 87, 34)    // 橙紅
邊框: Color(255, 255, 255)  // 白色
```

---

## 🚫 禁止做的事

### ❌ 絕對禁止

```typescript
// 1. 禁止用 Sprite 但沒 spriteFrame
sprite.addComponent(Sprite);  // ❌ 會看不見
sprite.color = new Color(...); // ❌ 仍看不見

// 2. 禁止從 (0,0) 繪製 Graphics
graphics.rect(0, 0, w, h);  // ❌ 座標錯誤

// 3. 禁止碰撞檢查所有蛇身
for (const pos of this.snake) {  // ❌ 包含尾巴
    if (head === pos) return true;
}

// 4. 禁止只監聯 Cocos input（可能失效）
input.on(Input.EventType.KEY_DOWN, handler);  // ❌ 單一監聯

// 5. 禁止 Camera visibility 只看 UI_3D
camera.visibility = 41943040;  // ❌ 不含 DEFAULT
```

---

## ✅ 推薦做的事

### ✅ 每次必做

```typescript
// 1. 新節點必加 UITransform
node.addComponent(UITransform);
node.layer = 1073741824;

// 2. 繪製從中心點
graphics.rect(-halfW, -halfH, w, h);

// 3. 輸入雙重監聯
input.on(...) + window.addEventListener(...)

// 4. 碰撞跳過尾巴
for (let i = 0; i < snake.length - 1; i++) {...}

// 5. Camera 包含 DEFAULT
camera.visibility = 1073741824;
```

---

## 📚 參考文件

- 詳細問題分析: `docs/development-review.md`
- Cocos Creator 3.x 文檔: https://docs.cocos.com/creator/manual/zh/
- Graphics 組件 API: https://docs.cocos.com/creator/api/zh/class/Graphics

---

## 🔄 更新記錄

| 日期 | 版本 | 更新內容 |
|-----|------|---------|
| 2026-05-10 | 1.0 | 初版：基於貪吃蛇 MVP 開發經驗 |

---

**AI Agent 每次啟動時自動讀取此文件。遇到問題先查陷阱清單。**