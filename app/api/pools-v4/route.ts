import { NextRequest, NextResponse } from 'next/server'
import { fetchUniswapV4Pools, convertV4ToStandardFormat } from '@/lib/blockchain/uniswap-v4-base'
import { calculateBaseAPR } from '@/lib/utils/apr-calculator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Cache V4 data for 5 minutes (since blockchain calls are expensive)
let cachedV4Data: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    // Check cache
    const now = Date.now()
    if (cachedV4Data && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached V4 data')
      return NextResponse.json({
        success: true,
        chain: 'base',
        protocol: 'v4',
        count: cachedV4Data.pools.length,
        pools: cachedV4Data.pools.slice(0, limit),
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000),
      })
    }

    console.log('Fetching fresh V4 data from blockchain...')

    // Fetch V4 pools from blockchain
    const v4Pools = await fetchUniswapV4Pools()

    if (v4Pools.length === 0) {
      return NextResponse.json({
        success: true,
        chain: 'base',
        protocol: 'v4',
        count: 0,
        pools: [],
        message: 'No V4 pools found. V4 may not be deployed yet or no liquidity.',
      })
    }

    // Convert to standard format
    const standardPools = convertV4ToStandardFormat(v4Pools)

    // Process and calculate APR (will be low/zero without volume data)
    const pools = standardPools.map((pool) => {
      const volume24h = pool.poolDayData[0]?.volumeUSD || '0'
      const fees24h = pool.poolDayData[0]?.feesUSD || '0'

      // For V4, we don't have volume data yet, so APR will be 0
      const apr = 0 // calculateBaseAPR would return 0 anyway

      return {
        id: pool.id,
        chain: 'base',
        protocol: 'v4' as const,
        token0: {
          address: pool.token0.id,
          symbol: pool.token0.symbol,
          name: pool.token0.name,
          decimals: parseInt(pool.token0.decimals),
        },
        token1: {
          address: pool.token1.id,
          symbol: pool.token1.symbol,
          name: pool.token1.name,
          decimals: parseInt(pool.token1.decimals),
        },
        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        feeTier: parseInt(pool.feeTier),
        feePercent: parseInt(pool.feeTier) / 10000,
        liquidity: pool.liquidity,
        tvl: 0, // Can't calculate without price oracle
        volume24h: parseFloat(volume24h),
        fees24h: parseFloat(fees24h),
        apr: apr,
        currentTick: parseInt(pool.tick),
        token0Price: parseFloat(pool.token0Price),
        token1Price: parseFloat(pool.token1Price),
        hooks: v4Pools.find(p => p.poolId === pool.id)?.hooks || '0x0',
      }
    })

    // Sort by liquidity (raw value)
    pools.sort((a, b) => {
      const aLiq = BigInt(a.liquidity)
      const bLiq = BigInt(b.liquidity)
      return aLiq > bLiq ? -1 : aLiq < bLiq ? 1 : 0
    })

    // Cache the result
    cachedV4Data = { pools }
    cacheTimestamp = now

    return NextResponse.json({
      success: true,
      chain: 'base',
      protocol: 'v4',
      count: pools.length,
      pools: pools.slice(0, limit),
      cached: false,
      note: 'V4 data fetched from blockchain. Volume/APR data not available yet.',
    })
  } catch (error) {
    console.error('Error fetching V4 pools:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch V4 pools',
        message: error instanceof Error ? error.message : 'Unknown error',
        hint: 'V4 may not be deployed on Base yet, or RPC may be rate limiting',
      },
      { status: 500 }
    )
  }
}
