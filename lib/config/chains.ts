// 多链配置
export const SUPPORTED_CHAINS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    subgraphUrl: 'https://api.goldsky.com/api/public/project_clrp03lzo6s5v01wmewv17koy/subgraphs/uniswap-v3-ethereum/1.0.0/gn',
    v4SubgraphUrl: '', // V4 待补充
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    subgraphUrl: 'https://api.goldsky.com/api/public/project_clrp03lzo6s5v01wmewv17koy/subgraphs/uniswap-v3-base/1.0.0/gn',
    v4SubgraphUrl: '',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    subgraphUrl: 'https://api.goldsky.com/api/public/project_clrp03lzo6s5v01wmewv17koy/subgraphs/uniswap-v3-bsc/1.0.0/gn',
    v4SubgraphUrl: '',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
} as const

export type ChainKey = keyof typeof SUPPORTED_CHAINS

export const DEFAULT_CHAIN: ChainKey = 'ethereum'
