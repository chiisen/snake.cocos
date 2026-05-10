# CHANGELOG

## [未發布]

### 修正
- 修正 `SnakeGame.ts` 中的 TypeScript 類型錯誤，將匿名鍵盤事件處理函式改為具名方法 `onKeyDown`。
- 補上缺失的 `EventKeyboard` 型別匯入。
- 修正 `onDestroy` 時無法正確解除註冊鍵盤事件的邏輯漏洞。
