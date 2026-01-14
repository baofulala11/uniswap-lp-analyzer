import { NextRequest, NextResponse } from 'next/server'
import { querySubgraph } from '@/lib/subgraph/client'
import { GET_TOP_POOLS } from '@/lib/subgraph/queries'
import { calculateBaseAPR } from '@/lib/utils/apr-calculator'
import { ChainKey } from '@/lib/config/chains'
import { MOCK_POOLS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

// Flag to use mock data when Subgraph is unavailable
const USE_MOCK_DATA = true

interface PoolQueryResult {
  pools: Array<{
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
      volumeUSD: string
      tvlUSD: string
      feesUSD: string
    }>
  }>
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const chain = (searchParams.get('chain') || 'ethereum') as ChainKey
  const orderBy = searchParams.get('orderBy') || 'totalValueLockedUSD'
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    let data: PoolQueryResult

    if (USE_MOCK_DATA) {
      // Use mock data
      const mockPools = MOCK_POOLS[chain] || MOCK_POOLS.ethereum
      data = { pools: mockPools.slice(0, limit) }
    } else {
      // 查询 Subgraph
      data = await querySubgraph<PoolQueryResult>(
        chain,
        GET_TOP_POOLS,
        {
          first: limit,
          orderBy: orderBy,
          orderDirection: 'desc',
        }
      )
    }

    // 处理数据并计算 APR
    const pools = data.pools.map((pool) => {
      const volume24h = pool.poolDayData[0]?.volumeUSD || '0'
      const fees24h = pool.poolDayData[0]?.feesUSD || '0'

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

      return {
        id: pool.id,
        chain: chain,
        protocol: 'v3' as const,
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
        tvl: parseFloat(pool.totalValueLockedUSD),
        volume24h: parseFloat(volume24h),
        fees24h: parseFloat(fees24h),
        apr: apr,
        currentTick: parseInt(pool.tick),
        token0Price: parseFloat(pool.token0Price),
        token1Price: parseFloat(pool.token1Price),
      }
    })

    // 按 APR 排序
    pools.sort((a, b) => b.apr - a.apr)

    return NextResponse.json({
      success: true,
      chain: chain,
      count: pools.length,
      pools: pools,
    })
  } catch (error) {
    console.error('Error fetching pools:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pools',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
