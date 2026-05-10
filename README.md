# 貪吃蛇遊戲 (Snake Game)

一個使用 Cocos Creator 3.8.8 開發的經典貪吃蛇遊戲。

## 遊戲特性

- ✅ **經典復古風格** - 像素化方塊設計
- ✅ **簡潔 UI** - 分數顯示、遊戲區域
- ✅ **流暢控制** - 方向鍵控制蛇移動
- ✅ **碰撞檢測** - 碰牆/碰自己死亡
- ✅ **分數系統** - 吃食物增長並加分

## 操作方式

### 鍵盤控制
- **↑ 上方向鍵** - 向上移動
- **↓ 下方向鍵** - 向下移動
- **← 左方向鍵** - 向左移動
- **→ 右方向鍵** - 向右移動

### 遊戲規則
1. 蛇自動向前移動
2. 吃到食物（紅色方塊）後蛇身增長，分數 +10
3. 碰到牆壁或自己的身體會死亡
4. 死亡後可以點擊按鈕重新開始

## 技術架構

### 文件結構
```
assets/
├── scripts/
│   └── SnakeGame.ts    # 主遊戲控制器
└── scenes/
    └── Game.scene      # 遊戲場景
```

### 核心組件
- **SnakeGame.ts** - 包含所有遊戲邏輯：
  - 蛇移動與控制
  - 食物生成
  - 碰撞檢測
  - 分數管理
  - UI 更新

### 節點結構
```
Game Scene
├── Canvas (UI容器)
│   ├── GameArea (遊戲區域背景)
│   ├── ScoreLabel (分數顯示)
│   ├── StartButton (開始/重新開始按鈕)
│   └── GameManager (遊戲控制器)
│       └── SnakeGame (腳本)
└── Main Camera (主相機)
```

## 遊戲配置

### 网格设置
- **网格大小**: 20 x 15 格
- **格子尺寸**: 30 像素
- **游戏区域**: 600 x 450 像素

### 蛇设置
- **初始长度**: 3 节
- **移动速度**: 0.2 秒/格
- **蛇身颜色**: #4CAF50 (绿色)
- **食物颜色**: #FF5722 (橙红色)

## 預覽遊戲

1. 在 Cocos Creator 中打開 `assets/scenes/Game.scene`
2. 點擊編輯器頂部的 "播放" 按鈕
3. 或使用快捷鍵 `Ctrl + P` 預覽遊戲
4. 在瀏覽器中使用方向鍵控制蛇移動

## 開發說明

### 使用 MCP Server 開發
本遊戲使用 Cocos Creator MCP Server 進行開發，實現了：
- 場景創建與配置
- 節點自動化生成
- 腳本自動編譯與掛載
- 屬性引用自動配置

### MCP 工具使用示例
```bash
# 創建場景
curl -X POST http://127.0.0.1:3000/mcp \
  -d '{"method":"tools/call","params":{"name":"scene_create_scene","arguments":{"sceneName":"Game"}}}'

# 創建節點
curl -X POST http://127.0.0.1:3000/mcp \
  -d '{"method":"tools/call","params":{"name":"node_create_node","arguments":{"name":"Canvas"}}}'

# 挂載腳本
curl -X POST http://127.0.0.1:3000/mcp \
  -d '{"method":"tools/call","params":{"name":"component_attach_script","arguments":{"nodeUuid":"xxx"}}}'
```

## 版本信息

- **Cocos Creator**: 3.8.8
- **TypeScript**: 5.x
- **遊戲版本**: 1.0.0 MVP

## License

MIT License