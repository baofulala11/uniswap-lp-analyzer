import { NextRequest, NextResponse } from 'next/server'
import { querySubgraph } from '@/lib/subgraph/client'
import { GET_TOP_POOLS } from '@/lib/subgraph/queries'
import { calculateBaseAPR } from '@/lib/utils/apr-calculator'
import { ChainKey } from '@/lib/config/chains'
import { MOCK_POOLS } from '@/lib/mock-data'
import { fetchUniswapPools, convertDeFiLlamaToOurFormat } from '@/lib/data-sources/defillama'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for data fetching

// Data source selection
const USE_MOCK_DATA = false
const USE_DEFILLAMA = true // Use DeFiLlama for real data
const USE_SUBGRAPH = false // Subgraphs are deprecated

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
  const limit = parseInt(searchParams.get('limit') || '100')
  const minVolume = parseFloat(searchParams.get('minVolume') || '500')
  const minFees = parseFloat(searchParams.get('minFees') || '100')

  try {
    let data: PoolQueryResult

    if (USE_DEFILLAMA) {
      // Fetch from DeFiLlama (real data!)
      const chainName = chain === 'ethereum' ? 'Ethereum' : chain === 'base' ? 'Base' : 'BSC'
      const minTvl = minFees / 0.003 // If we want $100 in fees, we need ~$33,333 TVL with 0.3% fee

      const pools = await fetchUniswapPools([chainName], minVolume, minTvl)
      const formattedPools = await convertDeFiLlamaToOurFormat(pools)

      // Filter by fees
      const filtered = formattedPools.filter(pool => {
        const fees = parseFloat(pool.poolDayData[0]?.feesUSD || '0')
        return fees >= minFees
      })

      data = { pools: filtered.slice(0, limit) }
    } else if (USE_MOCK_DATA) {
      // Use mock data
      const mockPools = MOCK_POOLS[chain] || MOCK_POOLS.ethereum
      data = { pools: mockPools.slice(0, limit) }
    } else if (USE_SUBGRAPH) {
      // 查询 Subgraph (deprecated)
      data = await querySubgraph<PoolQueryResult>(
        chain,
        GET_TOP_POOLS,
        {
          first: limit,
          orderBy: orderBy,
          orderDirection: 'desc',
        }
      )
    } else {
      throw new Error('No data source configured')
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
