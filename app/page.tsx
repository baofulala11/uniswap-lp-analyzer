'use client'

import { useState } from 'react'
import { TrendingUp, BarChart3 } from 'lucide-react'
import PoolList from '@/components/PoolList'
import APRCalculator from '@/components/APRCalculator'
import type { Pool } from '@/components/PoolList'

export default function UniswapLPAnalyzer() {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'base' | 'bsc'>('ethereum')
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)

  const chains = [
    { id: 'ethereum' as const, name: 'Ethereum', icon: '⟠' },
    { id: 'base' as const, name: 'Base', icon: '🔵' },
    { id: 'bsc' as const, name: 'BSC', icon: '🟡' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-white">
            Uniswap V3 LP Analyzer
          </h1>
        </div>
        <p className="text-gray-400">
          Analyze liquidity pool returns across Ethereum, Base, and BSC
        </p>
      </div>

      {/* Chain Selector */}
      <div className="mb-6">
        <div className="flex gap-3">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => {
                setSelectedChain(chain.id)
                setSelectedPool(null)
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedChain === chain.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{chain.icon}</span>
              {chain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Pool List */}
        <div className="lg:col-span-2">
          <PoolList
            chain={selectedChain}
            onSelectPool={(pool) => setSelectedPool(pool)}
          />
        </div>

        {/* Right: APR Calculator */}
        <div className="lg:col-span-1">
          {selectedPool ? (
            <div className="space-y-4">
              {/* Selected Pool Info */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Selected Pool</div>
                <div className="text-2xl font-bold text-white mb-4">
                  {selectedPool.pair}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Fee Tier</div>
                    <div className="text-white font-semibold">
                      {selectedPool.feePercent}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">TVL</div>
                    <div className="text-white font-semibold">
                      ${(selectedPool.tvl / 1000000).toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">24h Volume</div>
                    <div className="text-white font-semibold">
                      ${(selectedPool.volume24h / 1000000).toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Base APR</div>
                    <div className="text-green-400 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {selectedPool.apr.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* APR Calculator */}
              <APRCalculator
                pool={{
                  feeTier: selectedPool.feeTier,
                  tvl: selectedPool.tvl,
                  volume24h: selectedPool.volume24h,
                  currentTick: selectedPool.currentTick,
                  token0Price: selectedPool.token0Price,
                  token1Price: selectedPool.token1Price,
                  pair: selectedPool.pair,
                }}
              />
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <div className="text-gray-400 mb-2">No pool selected</div>
              <div className="text-sm text-gray-600">
                Click on a pool from the list to calculate APR
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 font-medium">Data Source</span>
            </div>
            <p className="text-gray-500 text-xs">
              Real-time data from Uniswap V3 Subgraph via The Graph Protocol
            </p>
          </div>

          <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400 font-medium">APR Calculation</span>
            </div>
            <p className="text-gray-500 text-xs">
              Based on 24h fees, TVL, and concentrated liquidity multiplier
            </p>
          </div>

          <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-400 font-medium">Disclaimer</span>
            </div>
            <p className="text-gray-500 text-xs">
              Estimates only. Actual returns may vary. Consider impermanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
