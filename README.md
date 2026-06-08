# 海克斯象棋 Hextech Chess

海克斯象棋是一款纯前端网页游戏：以标准中国象棋为规则骨架，加入对称随机的海克斯符文征召、能量经济、主动技能、本地双人热座和人机 AI。

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

- 开局进入镜像符文征召：双方看到同一候选池，按蛇形顺序选择符文。
- 双方各有 3 个符文位和 9 点预算。
- 对局开始后红方先行；每个行动方回合开始获得 1 点能量，上限 10。
- 被动符文在征召后生效，主动符文需要消耗能量并选择目标。
- 支持本地双人和人机对战；AI 使用 minimax + alpha-beta，并会按启发式使用符文。

## 已实现规则

引擎位于 `src/engine/`，不依赖 UI，可独立测试。

- 9x10 中国象棋棋盘。
- 将/帅、士/仕、象/相、马/傌、车/俥、炮/砲、卒/兵。
- 马蹩腿、象眼、象/相不过河、炮隔山、九宫、将帅照面。
- 将军、将死、困毙。
- 符文 hook/modifier 扩展入口。

## 符文公平性

符文数据位于 `src/runes/definitions.ts`，平衡表位于 `src/runes/balance.md`。

公平性约束：

- 双方候选池完全相同。
- 双方符文预算相同。
- 能量增长规则对称。
- 主动符文不能直接跳过对抗造成将死。

## 部署到 GitHub Pages

仓库包含 `.github/workflows/deploy.yml`。推送到 `main` 后会自动安装依赖、测试、构建并发布 `dist/`。

如果使用自定义域名，`vite.config.ts` 的 `base` 保持 `/`，并把域名写入 `public/CNAME`。

如果部署到 `https://用户名.github.io/仓库名/`，把 `vite.config.ts` 中的：

```ts
base: '/'
```

改为：

```ts
base: '/仓库名/'
```

## 自定义域名

1. 购买域名。
2. 将域名填入 `public/CNAME`。
3. 在域名服务商处配置 DNS：
   - 子域名推荐 CNAME 指向 `用户名.github.io`。
   - 根域名可按 GitHub Pages 文档配置 A 记录。
4. 在 GitHub 仓库 Settings → Pages 中启用 Enforce HTTPS。

## 素材说明

项目资源放在 `public/assets/`，当前版本使用本地 SVG 资产实现 Logo、玩家头像、结算背景和 UI 纹理，不依赖任何运行时外部图片请求。
