import { NextRequest, NextResponse } from 'next/server'
import { querySubgraph } from '@/lib/subgraph/client'
import { GET_POOL_DETAILS } from '@/lib/subgraph/queries'
import { calculateBaseAPR } from '@/lib/utils/apr-calculator'
import { ChainKey } from '@/lib/config/chains'

export const dynamic = 'force-dynamic'

interface PoolDetailsResult {
  pool: {
    id: string
    token0: {
      id: string
      symbol: string
      name: string
      decimals: string
    }
    token1: {
      id: string
      symbol: string
      name: string
      decimals: string
    }
    feeTier: string
    liquidity: string
    sqrtPrice: string
    tick: string
    token0Price: string
    token1Price: string
    volumeUSD: string
    totalValueLockedUSD: string
    poolDayData: Array<{
      date: number
      volumeUSD: string
      tvlUSD: string
      feesUSD: string
    }>
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const chain = (searchParams.get('chain') || 'ethereum') as ChainKey

  try {
    const data = await querySubgraph<PoolDetailsResult>(
      chain,
      GET_POOL_DETAILS,
      { poolId: id }
    )

    if (!data.pool) {
      return NextResponse.json(
        { success: false, error: 'Pool not found' },
        { status: 404 }
      )
    }

    const pool = data.pool
    const volume24h = pool.poolDayData[0]?.volumeUSD || '0'

    const apr = calculateBaseAPR({
      liquidity: pool.liquidity,
      volumeUSD: pool.volumeUSD,
      volume24h: volume24h,
      feeTier: parseInt(pool.feeTier),
      totalValueLockedUSD: pool.totalValueLockedUSD,
      token0Price: pool.token0Price,
      token1Price: pool.token1Price,
      currentTick: parseInt(pool.tick),
    })

    // 处理历史数据
    const history = pool.poolDayData.map((day) => ({
      date: day.date,
      volume: parseFloat(day.volumeUSD),
      tvl: parseFloat(day.tvlUSD),
      fees: parseFloat(day.feesUSD),
    }))

    return NextResponse.json({
      success: true,
      pool: {
        id: pool.id,
        chain: chain,
        token0: {
          address: pool.token0.id,
          symbol: pool.token0.symbol,
          name: pool.token0.name,
        },
        token1: {
          address: pool.token1.id,
          symbol: pool.token1.symbol,
          name: pool.token1.name,
        },
        feeTier: parseInt(pool.feeTier),
        tvl: parseFloat(pool.totalValueLockedUSD),
        volume24h: parseFloat(volume24h),
        apr: apr,
        currentTick: parseInt(pool.tick),
        token0Price: parseFloat(pool.token0Price),
        token1Price: parseFloat(pool.token1Price),
        history: history,
      },
    })
  } catch (error) {
    console.error('Error fetching pool details:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pool details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
