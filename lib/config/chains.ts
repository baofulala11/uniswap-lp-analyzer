// Multi-chain configuration for Uniswap V3/V4
export type ChainKey = 'ethereum' | 'base' | 'bsc'

export interface ChainConfig {
  id: number
  name: string
  rpcUrl: string
  subgraphUrl: string
  v4SubgraphUrl?: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export const SUPPORTED_CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    // Using Uniswap Labs official mirror endpoint
    subgraphUrl: 'https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/graphql',
    v4SubgraphUrl: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    // Using fallback to public endpoint for Base
    subgraphUrl: 'https://api.studio.thegraph.com/query/48427/uniswap-v3-base/version/latest',
    v4SubgraphUrl: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    // Using public Pancakeswap V3 (fork of Uniswap V3) endpoint for BSC
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
    v4SubgraphUrl: '',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
}

export function getChainConfig(chain: ChainKey): ChainConfig {
  return SUPPORTED_CHAINS[chain]
}
