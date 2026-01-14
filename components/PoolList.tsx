'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, BarChart3, Loader2, RefreshCw } from 'lucide-react'
import { formatAPR, formatUSD } from '@/lib/utils/apr-calculator'

export interface Pool {
  id: string
  chain: string
  protocol: 'v3' | 'v4'
  pair: string
  token0: {
    symbol: string
    address: string
  }
  token1: {
    symbol: string
    address: string
  }
  feeTier: number
  feePercent: number
  tvl: number
  volume24h: number
  fees24h: number
  apr: number
  currentTick: number
  token0Price: number
  token1Price: number
}

interface PoolListProps {
  chain: string
  onSelectPool?: (pool: Pool) => void
}

export default function PoolList({ chain, onSelectPool }: PoolListProps) {
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'apr' | 'tvl' | 'volume24h'>('apr')

  const fetchPools = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pools?chain=${chain}&limit=20`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch pools')
      }

      setPools(data.pools)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching pools:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPools()
  }, [chain])

  const sortedPools = [...pools].sort((a, b) => {
    switch (sortBy) {
      case 'apr':
        return b.apr - a.apr
      case 'tvl':
        return b.tvl - a.tvl
      case 'volume24h':
        return b.volume24h - a.volume24h
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-400">Loading pools...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-3">Error: {error}</p>
        <button
          onClick={fetchPools}
          className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg text-red-300 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with sorting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            Top Pools on {chain.charAt(0).toUpperCase() + chain.slice(1)}
          </h2>
          <button
            onClick={fetchPools}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex gap-2">
          {(['apr', 'tvl', 'volume24h'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === sort
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {sort === 'apr'
                ? 'APR'
                : sort === 'tvl'
                ? 'TVL'
                : '24h Volume'}
            </button>
          ))}
        </div>
      </div>

      {/* Pools table */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  Pool
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                  Fee
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                  TVL
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                  24h Volume
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                  24h Fees
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                  APR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {sortedPools.map((pool) => (
                <tr
                  key={pool.id}
                  onClick={() => onSelectPool?.(pool)}
                  className="hover:bg-gray-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {pool.token0.symbol[0]}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold -ml-2">
                          {pool.token1.symbol[0]}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {pool.pair}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pool.protocol.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-300">
                      {pool.feePercent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-white">
                      {formatUSD(pool.tvl)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-300">
                      {formatUSD(pool.volume24h)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-green-400">
                      {formatUSD(pool.fees24h)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-bold text-green-400">
                        {formatAPR(pool.apr)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Total TVL</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatUSD(pools.reduce((sum, p) => sum + p.tvl, 0))}
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">24h Volume</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatUSD(pools.reduce((sum, p) => sum + p.volume24h, 0))}
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Avg APR</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatAPR(
              pools.reduce((sum, p) => sum + p.apr, 0) / pools.length || 0
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
