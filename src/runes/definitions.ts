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
export const DRAFT_POOL_SIZE = 9
export const CORE_POOL_SIZE = 3

export interface CoreAugmentDefinition {
  id: string
  name: string
  risk: 'low' | 'medium' | 'high'
  description: string
  balance: string
  flavor: string
}

export const coreAugments: CoreAugmentDefinition[] = [
  {
    id: 'chrono-storm',
    name: '胡服骑射',
    risk: 'medium',
    description: '你的马免疫蹩马腿；每回合第一次走马后获得 1 能量。',
    balance: '强化机动但不直接吃子或将死；双方从同一候选池中选择。',
    flavor: '骑军轻装入阵，马蹄越过旧制。',
  },
  {
    id: 'river-reactor',
    name: '鸿沟水运',
    risk: 'medium',
    description: '你的兵/卒过河后吃子，额外获得 1 能量。',
    balance: '鼓励推进与交锋，收益来自公开的过河兵线。',
    flavor: '水路既分楚汉，也运粮运势。',
  },
  {
    id: 'quantum-anchor',
    name: '兵马俑魂',
    risk: 'high',
    description: '你的第一枚被吃掉的非将/帅棋子会立刻回到己方底线最近空点。',
    balance: '每方各触发一次，只保护第一次损失，不能复活将/帅。',
    flavor: '陶土中尚有军魂，败而复列。',
  },
  {
    id: 'arcane-tithe',
    name: '均输平准',
    risk: 'medium',
    description: '你吃子时，若你的能量少于对手，额外获得 1 能量。',
    balance: '追赶机制，避免滚雪球，只奖励落后方主动交换。',
    flavor: '强者多缴，弱者得济，局势由此再平。',
  },
  {
    id: 'golden-aegis',
    name: '金城汤池',
    risk: 'low',
    description: '你的将/帅和两个士/仕开局获得 1 层护盾。',
    balance: '增强防守，减缓速杀，不提升主动进攻。',
    flavor: '城池如金，汤沸成壕。',
  },
  {
    id: 'singularity-gates',
    name: '木牛流马',
    risk: 'high',
    description: '棋盘中央生成两对公开转运道，双方都可利用。',
    balance: '公共地形，双方都可利用；强在路线变化而非单方爆发。',
    flavor: '车辙入蜀道，远近忽然倒转。',
  },
  {
    id: 'great-wall-beacons',
    name: '烽燧长城',
    risk: 'low',
    description: '你的五枚兵/卒开局获得 1 层护盾。',
    balance: '防守与推进并重，只保护低价值棋子。',
    flavor: '烽火未起，戍卒已列墙下。',
  },
  {
    id: 'hundred-schools',
    name: '百家争鸣',
    risk: 'medium',
    description: '你的主动符文能量消耗降低 1 点，最低为 1。',
    balance: '提升符文频率，但受能量上限与回合节奏限制。',
    flavor: '诸子并起，一策未平，一策又生。',
  },
  {
    id: 'royal-road',
    name: '驰道九州',
    risk: 'high',
    description: '棋盘两翼生成一对公开驰道，双方棋子落入后可互通。',
    balance: '公共路线，双方可抢可守，不直接制造胜势。',
    flavor: '秦道通九州，兵锋也通。',
  },
  {
    id: 'warring-states',
    name: '战国变法',
    risk: 'medium',
    description: '开局获得 2 能量，用更快节奏启动主动符文。',
    balance: '快启动但不改变棋子位置；仍受能量上限与符文位限制。',
    flavor: '法令一出，国势骤疾。',
  },
]

export const coreAugmentById = Object.fromEntries(coreAugments.map((augment) => [augment.id, augment])) as Record<
  string,
  CoreAugmentDefinition
>

export const runes: RuneDefinition[] = [
  {
    id: 'mechanical-cannon',
    name: '神机火炮',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '你的炮第一次吃子无需炮架。',
    flavor: '火器初鸣，声先破阵。',
  },
  {
    id: 'untamed-horse',
    name: '燕云铁骑',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '你的马免疫蹩马腿。',
    flavor: '塞上马疾，不受沟垒所困。',
  },
  {
    id: 'reverse-soldier',
    name: '背水卒',
    rarity: 'silver',
    points: 2,
    type: 'passive',
    timing: 'draft',
    strength: 2,
    description: '你的过河兵可以后退一格。',
    flavor: '背水并非无退，是退亦为阵。',
  },
  {
    id: 'steel-fortress',
    name: '玄甲禁军',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '开局时将/帅周围一格内己方棋子获得 1 层护盾。',
    flavor: '禁军环卫，甲光如夜。',
  },
  {
    id: 'hex-teleport',
    name: '奇门遁甲',
    rarity: 'prismatic',
    points: 5,
    type: 'active',
    timing: 'manual',
    energyCost: 4,
    strength: 4,
    description: '将一枚己方棋子转移到任意空点；不能直接造成将军。',
    flavor: '门开生死，位换乾坤。',
  },
  {
    id: 'chrono-swap',
    name: '移形换阵',
    rarity: 'gold',
    points: 3,
    type: 'active',
    timing: 'manual',
    energyCost: 3,
    strength: 3,
    description: '交换两枚相邻己方棋子的位置。',
    flavor: '阵脚一错，锋线顿生。',
  },
  {
    id: 'rune-shield',
    name: '藤甲护军',
    rarity: 'silver',
    points: 2,
    type: 'active',
    timing: 'manual',
    energyCost: 2,
    strength: 2,
    description: '给一枚己方棋子增加 1 层免吃护盾。',
    flavor: '藤甲轻覆，先挡一击。',
  },
  {
    id: 'dead-return',
    name: '招魂归营',
    rarity: 'prismatic',
    points: 5,
    type: 'active',
    timing: 'manual',
    energyCost: 6,
    strength: 4,
    description: '复活一枚被吃掉的卒/兵，放回我方底线空点。',
    flavor: '军籍未除，魂可归营。',
  },
  {
    id: 'hex-portals',
    name: '栈道暗门',
    rarity: 'gold',
    points: 3,
    type: 'board',
    timing: 'draft',
    strength: 3,
    description: '生成一对转运道，棋子落入后可穿梭到另一端。',
    flavor: '明修栈道，暗度棋盘。',
  },
  {
    id: 'rift-file',
    name: '决河开道',
    rarity: 'silver',
    points: 2,
    type: 'board',
    timing: 'draft',
    strength: 2,
    description: '允许你的象/相在中线一列跨越楚河汉界。',
    flavor: '河防一决，巨象得渡。',
  },
  {
    id: 'rally-call',
    name: '鸣金聚军',
    rarity: 'gold',
    points: 3,
    type: 'aura',
    timing: 'capture',
    strength: 3,
    description: '每吃掉一枚敌方棋子，额外获得 1 能量。',
    flavor: '金声一响，众军再进。',
  },
  {
    id: 'chain-reaction',
    name: '破竹连营',
    rarity: 'gold',
    points: 3,
    type: 'aura',
    timing: 'capture',
    strength: 3,
    description: '车吃子后获得战术提示：顺势再走一格。',
    flavor: '势如破竹，一营接一营。',
  },
  {
    id: 'golden-capacitor',
    name: '太仓积粟',
    rarity: 'silver',
    points: 2,
    type: 'aura',
    timing: 'turn',
    strength: 2,
    description: '开局额外获得 1 能量。',
    flavor: '粮足则兵稳，兵稳则势长。',
  },
  {
    id: 'river-scouts',
    name: '斥候渡河',
    rarity: 'silver',
    points: 2,
    type: 'passive',
    timing: 'draft',
    strength: 2,
    description: '过河兵的横向机动在 UI 中获得高亮提示。',
    flavor: '先渡者先见敌阵缝隙。',
  },
  {
    id: 'arc-lance',
    name: '陌刀压阵',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '士/仕附近的己方车获得更高 AI 估值。',
    flavor: '陌刀列前，车阵不退。',
  },
  {
    id: 'prism-core',
    name: '传国玉玺',
    rarity: 'prismatic',
    points: 5,
    type: 'aura',
    timing: 'turn',
    strength: 5,
    description: '开局获得 2 能量，但占用大量预算。',
    flavor: '玺在掌中，诸令皆急。',
  },
  {
    id: 'circuit-map',
    name: '河图洛书',
    rarity: 'silver',
    points: 2,
    type: 'passive',
    timing: 'draft',
    strength: 2,
    description: '显示更多战术信息：将军状态与可走数。',
    flavor: '观其纹理，知其胜负。',
  },
  {
    id: 'last-stand',
    name: '白帝托孤',
    rarity: 'prismatic',
    points: 5,
    type: 'aura',
    timing: 'turn',
    strength: 4,
    description: '己方将/帅获得 1 层护盾。',
    flavor: '孤城有托，王命不坠。',
  },
  {
    id: 'silent-engine',
    name: '空城计',
    rarity: 'silver',
    points: 2,
    type: 'active',
    timing: 'manual',
    energyCost: 1,
    strength: 1,
    description: '消耗 1 能量跳过符文动作，保留当前局势。',
    flavor: '城门大开，虚实自辨。',
  },
  {
    id: 'fire-ox-array',
    name: '火牛阵',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '你的过河兵/卒可以斜向前进一步。',
    flavor: '火牛冲阵，斜破敌线。',
  },
  {
    id: 'yue-family-guard',
    name: '岳家护阵',
    rarity: 'gold',
    points: 3,
    type: 'passive',
    timing: 'draft',
    strength: 3,
    description: '你的士/仕可以在九宫内横直移动一格。',
    flavor: '守阵如山，横竖皆成壁。',
  },
  {
    id: 'mozi-city',
    name: '墨守城规',
    rarity: 'silver',
    points: 2,
    type: 'passive',
    timing: 'draft',
    strength: 2,
    description: '你的两枚车开局获得 1 层护盾。',
    flavor: '墨者善守，车垒先固。',
  },
  {
    id: 'white-horse-raiders',
    name: '白马义从',
    rarity: 'gold',
    points: 3,
    type: 'aura',
    timing: 'capture',
    strength: 3,
    description: '你的马吃子后额外获得 1 能量。',
    flavor: '白马突阵，得胜而还。',
  },
  {
    id: 'tiger-tally',
    name: '虎符发兵',
    rarity: 'gold',
    points: 3,
    type: 'active',
    timing: 'manual',
    energyCost: 3,
    strength: 3,
    description: '给一枚己方车/马/炮增加 1 层护盾。',
    flavor: '虎符合掌，精锐出营。',
  },
  {
    id: 'sun-bin-feint',
    name: '孙膑减灶',
    rarity: 'prismatic',
    points: 5,
    type: 'active',
    timing: 'manual',
    energyCost: 5,
    strength: 4,
    description: '交换任意两枚己方棋子的位置；不能让己方被将军。',
    flavor: '灶烟渐少，伏兵渐近。',
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

export function generateCorePool(seed = Date.now(), count = CORE_POOL_SIZE): CoreAugmentDefinition[] {
  let value = (seed + 7919) % 2147483647
  const random = () => {
    value = (value * 48271) % 2147483647
    return value / 2147483647
  }
  return [...coreAugments].sort(() => random() - 0.5).slice(0, count)
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
