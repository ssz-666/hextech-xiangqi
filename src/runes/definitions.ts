import type { Color, GameState, Piece, Square } from '../engine'

export type RuneRarity = 'silver' | 'gold' | 'prismatic'
export type RuneType = 'passive' | 'active' | 'board' | 'aura'
export type RuneTiming = 'draft' | 'turn' | 'capture' | 'manual'

export interface RuneContext {
  color: Color
  target?: Square
  secondaryTarget?: Square
}

export interface RuneDefinition {
  id: string
  name: string
  rarity: RuneRarity
  points: number
  type: RuneType
  timing: RuneTiming
  energyCost?: number
  strength: number
  description: string
  flavor: string
}

export const RUNE_BUDGET = 9
export const RUNE_SLOTS = 3
export const DRAFT_POOL_SIZE = 8

export const runes: RuneDefinition[] = [
  {
    id: 'mechanical-cannon',
    name: '机械炮台',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '你的炮第一次吃子无需炮架。',
    flavor: '齿轮咬合，第一声炮响无需等待回声。',
  },
  {
    id: 'untamed-horse',
    name: '不羁之马',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '你的马免疫蹩马腿。',
    flavor: '海克斯缰绳只负责点燃方向，从不负责约束。',
  },
  {
    id: 'reverse-soldier',
    name: '逆行卒',
    rarity: 'silver',
    points: 2,
    type: 'passive',
    timing: 'draft',
    strength: 2,
    description: '你的过河兵可以后退一格。',
    flavor: '退后一步，不是怯懦，是重新校准弹道。',
  },
  {
    id: 'steel-fortress',
    name: '钢铁堡垒',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '开局时将/帅周围一格内己方棋子获得 1 层护盾。',
    flavor: '王座周围升起细密的金色电弧。',
  },
  {
    id: 'hex-teleport',
    name: '海克斯传送',
    rarity: 'prismatic',
    points: 5,
    type: 'active',
    timing: 'manual',
    energyCost: 4,
    strength: 4,
    description: '将一枚己方棋子瞬移到任意空格；不能直接造成将军。',
    flavor: '空间折叠时，棋盘像一枚被拧亮的符文。',
  },
  {
    id: 'chrono-swap',
    name: '时空错位',
    rarity: 'gold',
    points: 3,
    type: 'active',
    timing: 'manual',
    energyCost: 3,
    strength: 3,
    description: '交换两枚相邻己方棋子的位置。',
    flavor: '一瞬之前和一瞬之后互相借位。',
  },
  {
    id: 'rune-shield',
    name: '符文护盾',
    rarity: 'silver',
    points: 2,
    type: 'active',
    timing: 'manual',
    energyCost: 2,
    strength: 2,
    description: '给一枚己方棋子增加 1 层免吃护盾。',
    flavor: '薄如晨光，却足以挡下一次命运。',
  },
  {
    id: 'dead-return',
    name: '亡者归来',
    rarity: 'prismatic',
    points: 5,
    type: 'active',
    timing: 'manual',
    energyCost: 6,
    strength: 4,
    description: '复活一枚被吃掉的卒/兵，放回我方底线空格。',
    flavor: '被记录的牺牲，会以电流的形式返场。',
  },
  {
    id: 'hex-portals',
    name: '海克斯传送门',
    rarity: 'gold',
    points: 3,
    type: 'board',
    timing: 'draft',
    strength: 3,
    description: '生成一对传送门，棋子落入后可穿梭到另一端。',
    flavor: '棋盘上多了两个会呼吸的青色裂口。',
  },
  {
    id: 'rift-file',
    name: '裂隙',
    rarity: 'silver',
    points: 2,
    type: 'board',
    timing: 'draft',
    strength: 2,
    description: '允许你的象/相在中线一列跨越楚河汉界。',
    flavor: '河界被切出一条只供巨象理解的通道。',
  },
  {
    id: 'rally-call',
    name: '集结号令',
    rarity: 'gold',
    points: 3,
    type: 'aura',
    timing: 'capture',
    strength: 3,
    description: '每吃掉一枚敌方棋子，额外获得 1 能量。',
    flavor: '胜利不是终点，是下一次充能。',
  },
  {
    id: 'chain-reaction',
    name: '连锁反应',
    rarity: 'gold',
    points: 3,
    type: 'aura',
    timing: 'capture',
    strength: 3,
    description: '车吃子后可获得战术提示：顺势再走一格。',
    flavor: '车轮碾过火花，火花继续追逐车轮。',
  },
  {
    id: 'golden-capacitor',
    name: '黄金电容',
    rarity: 'silver',
    points: 2,
    type: 'aura',
    timing: 'turn',
    strength: 2,
    description: '能量上限体验提升：开局额外获得 1 能量。',
    flavor: '第一枚火花被提前储存在掌心。',
  },
  {
    id: 'river-scouts',
    name: '渡河侦察',
    rarity: 'silver',
    points: 2,
    type: 'passive',
    timing: 'draft',
    strength: 2,
    description: '过河兵的横向机动在 UI 中获得高亮提示。',
    flavor: '河风会把敌阵的缝隙吹亮。',
  },
  {
    id: 'arc-lance',
    name: '电弧长枪',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '士/仕附近的己方车获得更高 AI 估值。',
    flavor: '仪仗并非装饰，它们把电压导向前线。',
  },
  {
    id: 'prism-core',
    name: '棱彩核心',
    rarity: 'prismatic',
    points: 5,
    type: 'aura',
    timing: 'turn',
    strength: 5,
    description: '开局获得 2 能量，但占用大量预算。',
    flavor: '最亮的核心，总会索取最多的空间。',
  },
  {
    id: 'circuit-map',
    name: '电路图谱',
    rarity: 'silver',
    points: 2,
    type: 'passive',
    timing: 'draft',
    strength: 2,
    description: '显示更多战术信息：将军状态与可走数。',
    flavor: '线条不是装饰，是棋局正在泄露的秘密。',
  },
  {
    id: 'last-stand',
    name: '终局立场',
    rarity: 'prismatic',
    points: 5,
    type: 'aura',
    timing: 'turn',
    strength: 4,
    description: '己方将/帅获得 1 层护盾。',
    flavor: '王座最后亮起的不是恐惧，是协议。',
  },
  {
    id: 'silent-engine',
    name: '静默引擎',
    rarity: 'silver',
    points: 2,
    type: 'active',
    timing: 'manual',
    energyCost: 1,
    strength: 1,
    description: '消耗 1 能量跳过符文动作，转化为稳定性评分。',
    flavor: '并非所有引擎都需要轰鸣。',
  },
]

export const runeById = Object.fromEntries(runes.map((rune) => [rune.id, rune])) as Record<
  string,
  RuneDefinition
>

export function generateDraftPool(seed = Date.now(), count = DRAFT_POOL_SIZE): RuneDefinition[] {
  let value = seed % 2147483647
  const random = () => {
    value = (value * 48271) % 2147483647
    return value / 2147483647
  }
  return [...runes]
    .sort(() => random() - 0.5)
    .slice(0, count)
    .sort((a, b) => a.points - b.points || a.name.localeCompare(b.name, 'zh-Hans-CN'))
}

export function canAffordRune(state: GameState, color: Color, rune: RuneDefinition) {
  return (
    !state.players[color].runes.includes(rune.id) &&
    state.players[color].runes.length < RUNE_SLOTS &&
    state.players[color].budgetUsed + rune.points <= RUNE_BUDGET
  )
}

export function isOwnPiece(piece: Piece | null, color: Color): piece is Piece {
  return Boolean(piece && piece.color === color)
}
