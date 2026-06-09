# 天工楚汉棋

天工楚汉棋是一款纯前端网页游戏：以标准中国象棋为规则骨架，加入楚汉兵法、天工机关、国策三选一、机策征召、能量经济、本地双人与人机 AI。

在线试玩：https://ssz-666.github.io/hextech-xiangqi/

## 本地运行

```bash
npm install
npm run dev
```

常用检查：

```bash
npm test
npm run lint
npm run build
```

## 玩法概览

- 开局先进入“天工国策三选一”：系统从更大的国策池里每局随机 3 个候选，双方看到同一组并各选一个。
- 随后进入“兵书机策征召”：双方共享同一候选池，按蛇形顺序选择机策。
- 双方各有 3 个机策位和 9 点预算。
- 对局开始后红方先行；每个行动方回合开始获得 1 点势能，上限 10。
- 常策在征召后生效，主动机策需要消耗势能并选择目标。
- 吃子会触发“斩获”反馈，将军会触发军令横幅。
- 支持本地双人与人机对战；AI 会结合标准象棋引擎与天工机策权重评估局面。

## 已实现规则

引擎位于 `src/engine/`，不依赖 UI，可独立测试。

- 9x10 中国象棋棋盘。
- 将/帅、士/仕、象/相、马/傌、车/俥、炮/砲、卒/兵。
- 马蹩腿、象眼、象/相不过河、炮隔山、九宫、将帅照面。
- 将军、将死、困毙。
- 国策与机策通过 hook/modifier 扩展，不污染基础规则。

## 公平性

机策数据位于 `src/runes/definitions.ts`，平衡表位于 `src/runes/balance.md`。

- 双方候选池完全相同。
- 双方国策候选完全相同，但可以做不同选择。
- 双方机策预算相同。
- 势能增长规则对称。
- 主动机策不能直接跳过对抗造成将死。

## GitHub Pages

仓库包含 `.github/workflows/deploy.yml`。推送到 `main` 后会自动安装依赖、测试、构建并发布 `dist/`。

当前仓库部署在项目页路径：

```ts
base: '/hextech-xiangqi/'
```

如果改成自定义域名，需要把 `vite.config.ts` 的 `base` 改回 `/`，并添加 `public/CNAME`。

## 素材说明

资源位于 `public/assets/`。当前版本使用本地 SVG 和图片资产实现 Logo、阵营头像、结算背景与 UI 纹理，不依赖运行时外部图片 CDN。

## AI 与许可证

- 强引擎：`fairy-stockfish-nnue.wasm`，GPL-3.0，运行时资源位于 `public/fairy-stockfish/`。
- Cross-origin isolation：`coi-serviceworker`，MIT，资源位于 `public/coi-serviceworker.min.js`。
- 因为 Fairy-Stockfish 是 GPL-3.0，本项目分发时应保持源码可获得，并遵守 GPL-3.0 兼容要求。
