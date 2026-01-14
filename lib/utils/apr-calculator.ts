// APR 计算核心逻辑

export interface PoolData {
  liquidity: string
  volumeUSD: string
  volume24h: string
  feeTier: number
  totalValueLockedUSD: string
  token0Price: string
  token1Price: string
  currentTick: number
}

export interface PositionParams {
  lowerTick: number
  upperTick: number
  liquidityUSD: number
}

/**
 * 计算池子的基础 APR（不考虑价格区间）
 * APR = (24h手续费收益 / TVL) * 365 * 100%
 */
export function calculateBaseAPR(pool: PoolData): number {
  const volume24h = parseFloat(pool.volume24h)
  const tvl = parseFloat(pool.totalValueLockedUSD)

  if (tvl === 0 || isNaN(volume24h) || isNaN(tvl)) {
    return 0
  }

  // 费率转换: feeTier 3000 = 0.3% = 0.003
  const feeRate = pool.feeTier / 1000000

  // 24小时手续费
  const fees24h = volume24h * feeRate

  // 年化收益率
  const apr = (fees24h / tvl) * 365 * 100

  return apr
}

/**
 * 计算指定价格区间的 APR
 * 考虑集中流动性的杠杆效应
 */
export function calculatePositionAPR(
  pool: PoolData,
  position: PositionParams
): number {
  const baseAPR = calculateBaseAPR(pool)

  if (baseAPR === 0) return 0

  // 计算价格区间比例
  const currentTick = pool.currentTick
  const { lowerTick, upperTick } = position

  // 检查是否在范围内
  if (currentTick < lowerTick || currentTick > upperTick) {
    return 0
  }

  // 计算集中流动性系数
  const liquidityMultiplier = calculateLiquidityMultiplier(
    lowerTick,
    upperTick,
    currentTick
  )

  // 实际 APR = 基础 APR × 流动性系数
  return baseAPR * liquidityMultiplier
}

/**
 * 计算流动性集中系数
 * 区间越窄,系数越大,最高不超过 10 倍
 */
function calculateLiquidityMultiplier(
  lowerTick: number,
  upperTick: number,
  currentTick: number
): number {
  // Tick 间距转价格比例
  const tickSpacing = upperTick - lowerTick

  if (tickSpacing <= 0) return 0

  // 全范围假设为 ±100% 价格区间 (约 13863 ticks)
  const fullRangeTicks = 13863

  // 流动性集中倍数 = 全范围 / 实际区间
  const multiplier = fullRangeTicks / tickSpacing

  // 限制最大 10 倍杠杆
  return Math.min(multiplier, 10)
}

/**
 * 从价格转换为 Tick
 * tick = log(price) / log(1.0001)
 */
export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001))
}

/**
 * 从 Tick 转换为价格
 * price = 1.0001 ^ tick
 */
export function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick)
}

/**
 * 计算预估的每日/月/年收益
 */
export function calculateEstimatedReturns(
  liquidityUSD: number,
  apr: number
): {
  daily: number
  monthly: number
  yearly: number
} {
  const yearly = (liquidityUSD * apr) / 100
  const monthly = yearly / 12
  const daily = yearly / 365

  return { daily, monthly, yearly }
}

/**
 * 格式化 APR 显示
 */
export function formatAPR(apr: number): string {
  if (apr === 0) return '0.00%'
  if (apr < 0.01) return '<0.01%'
  if (apr > 10000) return '>10,000%'
  return `${apr.toFixed(2)}%`
}

/**
 * 格式化美元金额
 */
export function formatUSD(amount: number): string {
  if (amount === 0) return '$0'
  if (amount < 0.01) return '<$0.01'
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(2)}K`
  }
  return `$${amount.toFixed(2)}`
}
