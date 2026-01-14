// 多链配置
export const SUPPORTED_CHAINS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV',
    v4SubgraphUrl: '', // V4 待补充
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/id/43Hwfi3dJSoGpyas9VwNoDAv55yjgGrPpNSmbQZArzMG',
    v4SubgraphUrl: '',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/id/F85MNzUGYqgSHSHRGgeVMNsdnW1KtZSvaoHdFuj8yqPR',
    v4SubgraphUrl: '',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
} as const

export type ChainKey = keyof typeof SUPPORTED_CHAINS

export const DEFAULT_CHAIN: ChainKey = 'ethereum'
