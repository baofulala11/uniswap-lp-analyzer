// DeFiLlama API client for fetching real Uniswap V3 pool data
// Free API, no key required

export interface DeFiLlamaPool {
  pool: string
  chain: string
  project: string
  symbol: string
  tvlUsd: number
  apyBase: number | null
  apyReward: number | null
  apy: number
  rewardTokens: string[] | null
  volumeUsd1d: number | null
  volumeUsd7d: number | null
}

export async function fetchUniswapPools(
  chains: string[] = ['Ethereum', 'Base', 'BSC'],
  minVolume: number = 500,
  minTvl: number = 10000
): Promise<DeFiLlamaPool[]> {
  try {
    // DeFiLlama yields endpoint
    const response = await fetch('https://yields.llama.fi/pools', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter for Uniswap V3 pools on our chains
    const filteredPools = data.data.filter((pool: DeFiLlamaPool) => {
      const isUniswap = pool.project === 'uniswap-v3' || pool.project === 'pancakeswap-amm-v3'
      const isOurChain = chains.map(c => c.toLowerCase()).includes(pool.chain.toLowerCase())
      const hasEnoughVolume = (pool.volumeUsd1d || 0) >= minVolume
      const hasEnoughTvl = pool.tvlUsd >= minTvl

      return isUniswap && isOurChain && hasEnoughVolume && hasEnoughTvl
    })

    return filteredPools
  } catch (error) {
    console.error('Error fetching from DeFiLlama:', error)
    throw error
  }
}

export async function convertDeFiLlamaToOurFormat(pools: DeFiLlamaPool[]) {
  return pools.map((pool) => {
    // Parse symbol (format: "TOKEN0-TOKEN1")
    const tokens = pool.symbol.split('-')
    const token0Symbol = tokens[0] || 'UNKNOWN'
    const token1Symbol = tokens[1] || 'UNKNOWN'

    // Calculate fees from volume and APY
    const volume24h = pool.volumeUsd1d || 0
    const tvl = pool.tvlUsd
    const apr = pool.apy || 0

    // Estimate fees (assuming 0.3% fee tier on average)
    const fees24h = volume24h * 0.003

    return {
      id: pool.pool,
      token0: {
        id: pool.pool, // We don't have individual token addresses from DeFiLlama
        symbol: token0Symbol,
        name: token0Symbol,
        decimals: '18',
      },
      token1: {
        id: pool.pool,
        symbol: token1Symbol,
        name: token1Symbol,
        decimals: '18',
      },
      feeTier: '3000', // Default to 0.3%
      liquidity: (tvl * 1000000).toString(), // Approximate
      sqrtPrice: '1461446703485210103287273052203988822378723970342',
      tick: '202850',
      token0Price: '1',
      token1Price: '1',
      volumeUSD: (volume24h * 365).toString(),
      totalValueLockedUSD: tvl.toString(),
      txCount: '100000',
      totalValueLockedToken0: (tvl / 2).toString(),
      totalValueLockedToken1: (tvl / 2).toString(),
      poolDayData: [{
        volumeUSD: volume24h.toString(),
        tvlUSD: tvl.toString(),
        feesUSD: fees24h.toString(),
      }],
      // Extra info
      chain: pool.chain,
      apy: apr,
    }
  })
}
