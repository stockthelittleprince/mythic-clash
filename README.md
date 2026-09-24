# 神話爭鋒 Mythic Clash

這是一個純前端 GitHub Pages 原型，不需要 Node、資料庫或後端。

## 已包含
- 30 名神話角色資料
- 50 張功能牌
- 角色 HP / 主動技能 / 神力資源
- 5 張起手牌、每回合抽 1 張
- 牌庫疲勞
- AI 對手
- 手牌上限 9
- 稀有度分類
- 基本攻防、恢復、控制、傳說牌
- 手機版 RWD
- 東方神話華麗、深色、金色 UI 方向
- 兩張你提供的參考圖已放在 `assets/`，目前只作為視覺方向參考

## 放到 GitHub Pages
1. 建立 GitHub Repository，例如 `mythic-clash`
2. 上傳本資料夾內所有檔案
3. Repository → Settings → Pages
4. Source 選 `Deploy from a branch`
5. Branch 選 `main` / `/root`
6. 儲存後等待 GitHub Pages 發布

## 下一階段建議
1. 把 emoji 角色圖替換成真正角色立繪。
2. 把卡牌改成 2:3 的完整卡框：上方立繪、中段名稱、下方技能文字、右上神力。
3. 把目前簡化的 AI 改成「評估傷害、致死、回血、神力曲線」的決策 AI。
4. 將規則拆成 `rules.js` / `effects.js` / `data.js`，方便之後平衡。
5. 增加 PVP 前端房間 + 後端同步時，再導入 Supabase / Firebase 或自建 WebSocket。

## 注意
目前是「可玩原型」，不是正式上線版。部分高階牌的效果保留了規則鉤子，方便下一輪定稿，而不是假裝所有 50 張牌都已完成正式平衡。
