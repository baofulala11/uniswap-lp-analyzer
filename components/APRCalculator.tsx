'use client'

import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react'
import {
  calculatePositionAPR,
  calculateEstimatedReturns,
  priceToTick,
  formatAPR,
  formatUSD,
  PoolData,
} from '@/lib/utils/apr-calculator'

interface APRCalculatorProps {
  pool: {
    feeTier: number
    tvl: number
    volume24h: number
    currentTick: number
    token0Price: number
    token1Price: number
    pair: string
  }
}

export default function APRCalculator({ pool }: APRCalculatorProps) {
  const [lowerPrice, setLowerPrice] = useState('')
  const [upperPrice, setUpperPrice] = useState('')
  const [liquidityAmount, setLiquidityAmount] = useState('')

  const currentPrice = pool.token0Price

  const result = useMemo(() => {
    const lower = parseFloat(lowerPrice)
    const upper = parseFloat(upperPrice)
    const liquidity = parseFloat(liquidityAmount)

    if (
      !lower ||
      !upper ||
      !liquidity ||
      lower >= upper ||
      lower <= 0 ||
      upper <= 0 ||
      liquidity <= 0
    ) {
      return null
    }

    const poolData: PoolData = {
      liquidity: '0',
      volumeUSD: '0',
      volume24h: pool.volume24h.toString(),
      feeTier: pool.feeTier,
      totalValueLockedUSD: pool.tvl.toString(),
      token0Price: pool.token0Price.toString(),
      token1Price: pool.token1Price.toString(),
      currentTick: pool.currentTick,
    }

    const apr = calculatePositionAPR(poolData, {
      lowerTick: priceToTick(lower),
      upperTick: priceToTick(upper),
      liquidityUSD: liquidity,
    })

    const returns = calculateEstimatedReturns(liquidity, apr)

    const inRange = currentPrice >= lower && currentPrice <= upper

    return { apr, returns, inRange }
  }, [lowerPrice, upperPrice, liquidityAmount, pool])

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-white">APR Calculator</h3>
      </div>

      <div className="text-sm text-gray-400">
        Calculate estimated APR based on your price range for{' '}
        <span className="text-white font-semibold">{pool.pair}</span>
      </div>

      {/* Current Price Info */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Current Price</div>
        <div className="text-2xl font-bold text-white">
          {currentPrice.toFixed(6)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {pool.pair.split('/')[1]} per {pool.pair.split('/')[0]}
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Lower Price
          </label>
          <input
            type="number"
            value={lowerPrice}
            onChange={(e) => setLowerPrice(e.target.value)}
            placeholder="e.g. 0.0005"
            step="any"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Upper Price
          </label>
          <input
            type="number"
            value={upperPrice}
            onChange={(e) => setUpperPrice(e.target.value)}
            placeholder="e.g. 0.002"
            step="any"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Liquidity Amount (USD)
          </label>
          <input
            type="number"
            value={liquidityAmount}
            onChange={(e) => setLiquidityAmount(e.target.value)}
            placeholder="e.g. 10000"
            step="any"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const lower = currentPrice * 0.8
            const upper = currentPrice * 1.2
            setLowerPrice(lower.toFixed(6))
            setUpperPrice(upper.toFixed(6))
          }}
          className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          ±20% Range
        </button>
        <button
          onClick={() => {
            const lower = currentPrice * 0.9
            const upper = currentPrice * 1.1
            setLowerPrice(lower.toFixed(6))
            setUpperPrice(upper.toFixed(6))
          }}
          className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          ±10% Range
        </button>
        <button
          onClick={() => {
            const lower = currentPrice * 0.95
            const upper = currentPrice * 1.05
            setLowerPrice(lower.toFixed(6))
            setUpperPrice(upper.toFixed(6))
          }}
          className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          ±5% Range
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          {/* In Range Status */}
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
              result.inRange
                ? 'bg-green-950/30 border border-green-900/50'
                : 'bg-yellow-950/30 border border-yellow-900/50'
            }`}
          >
            <AlertCircle
              className={`w-5 h-5 ${
                result.inRange ? 'text-green-400' : 'text-yellow-400'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                result.inRange ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {result.inRange
                ? 'Position is IN RANGE - earning fees'
                : 'Position is OUT OF RANGE - not earning fees'}
            </span>
          </div>

          {/* APR Display */}
          <div className="bg-gradient-to-br from-blue-950/50 to-purple-950/50 border border-blue-900/50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Estimated APR</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {formatAPR(result.apr)}
            </div>
            <div className="text-xs text-gray-500">
              Based on current 24h volume and your price range
            </div>
          </div>

          {/* Estimated Returns */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Daily</div>
              <div className="text-lg font-bold text-green-400">
                {formatUSD(result.returns.daily)}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Monthly</div>
              <div className="text-lg font-bold text-green-400">
                {formatUSD(result.returns.monthly)}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Yearly</div>
              <div className="text-lg font-bold text-green-400">
                {formatUSD(result.returns.yearly)}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
            <p className="text-xs text-yellow-200/70">
              ⚠ This is an estimate based on current metrics. Actual returns
              may vary significantly based on price volatility, volume changes,
              and impermanent loss.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
