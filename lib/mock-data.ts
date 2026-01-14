// Mock data for demo when Subgraph is unavailable
const createPool = (data: any) => ({
  ...data,
  sqrtPrice: '1461446703485210103287273052203988822378723970342',
  txCount: '123456',
  totalValueLockedToken0: data.liquidity,
  totalValueLockedToken1: data.liquidity,
})

export const MOCK_POOLS: Record<string, any[]> = {
  ethereum: [
    createPool({
      id: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      token0: { id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: '6' },
      token1: { id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' },
      feeTier: '500',
      liquidity: '4567890123456789',
      tick: '202920',
      token0Price: '3456.789',
      token1Price: '0.000289',
      volumeUSD: '856234567.89',
      totalValueLockedUSD: '234567890.12',
      poolDayData: [{ volumeUSD: '45678901.23', tvlUSD: '234567890.12', feesUSD: '228394.51' }]
    }),
    createPool({
      id: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
      token0: { id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: '6' },
      token1: { id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' },
      feeTier: '3000',
      liquidity: '3456789012345678',
      tick: '202850',
      token0Price: '3450.123',
      token1Price: '0.000290',
      volumeUSD: '678901234.56',
      totalValueLockedUSD: '189012345.67',
      poolDayData: [{ volumeUSD: '34567890.12', tvlUSD: '189012345.67', feesUSD: '103703.67' }]
    }),
    createPool({
      id: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
      token0: { id: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: '8' },
      token1: { id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' },
      feeTier: '3000',
      liquidity: '2345678901234567',
      tick: '257420',
      token0Price: '18.456',
      token1Price: '0.0542',
      volumeUSD: '456789012.34',
      totalValueLockedUSD: '145678901.23',
      poolDayData: [{ volumeUSD: '23456789.01', tvlUSD: '145678901.23', feesUSD: '70370.37' }]
    }),
    createPool({
      id: '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
      token0: { id: '0x6b175474e89094c44da98b954eedeac495271d0f', symbol: 'DAI', name: 'Dai Stablecoin', decimals: '18' },
      token1: { id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' },
      feeTier: '3000',
      liquidity: '1234567890123456',
      tick: '202780',
      token0Price: '3448.901',
      token1Price: '0.000290',
      volumeUSD: '234567890.12',
      totalValueLockedUSD: '98765432.10',
      poolDayData: [{ volumeUSD: '12345678.90', tvlUSD: '98765432.10', feesUSD: '37037.04' }]
    }),
    createPool({
      id: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
      token0: { id: '0x6b175474e89094c44da98b954eedeac495271d0f', symbol: 'DAI', name: 'Dai Stablecoin', decimals: '18' },
      token1: { id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: '6' },
      feeTier: '100',
      liquidity: '987654321098765',
      tick: '-2',
      token0Price: '1.0001',
      token1Price: '0.9999',
      volumeUSD: '123456789.01',
      totalValueLockedUSD: '87654321.09',
      poolDayData: [{ volumeUSD: '6789012.34', tvlUSD: '87654321.09', feesUSD: '6789.01' }]
    })
  ],
  base: [
    createPool({
      id: '0xd0b53d9277642d899df5c87a3966a349a798f224',
      token0: { id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', name: 'USD Coin', decimals: '6' },
      token1: { id: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' },
      feeTier: '500',
      liquidity: '2345678901234567',
      tick: '202890',
      token0Price: '3452.345',
      token1Price: '0.000290',
      volumeUSD: '456789012.34',
      totalValueLockedUSD: '123456789.01',
      poolDayData: [{ volumeUSD: '23456789.01', tvlUSD: '123456789.01', feesUSD: '117283.95' }]
    }),
    createPool({
      id: '0x4c36388be6f416a29c8d8eee81c771ce6be14b18',
      token0: { id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', name: 'USD Coin', decimals: '6' },
      token1: { id: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: '18' },
      feeTier: '3000',
      liquidity: '1234567890123456',
      tick: '202850',
      token0Price: '3450.678',
      token1Price: '0.000290',
      volumeUSD: '234567890.12',
      totalValueLockedUSD: '98765432.10',
      poolDayData: [{ volumeUSD: '12345678.90', tvlUSD: '98765432.10', feesUSD: '37037.04' }]
    })
  ],
  bsc: [
    createPool({
      id: '0x133b3d95bad5405d14d53473671200e9342896bf',
      token0: { id: '0x55d398326f99059ff775485246999027b3197955', symbol: 'USDT', name: 'Tether USD', decimals: '18' },
      token1: { id: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', decimals: '18' },
      feeTier: '500',
      liquidity: '1234567890123456',
      tick: '276320',
      token0Price: '612.345',
      token1Price: '0.001633',
      volumeUSD: '345678901.23',
      totalValueLockedUSD: '89012345.67',
      poolDayData: [{ volumeUSD: '17283950.61', tvlUSD: '89012345.67', feesUSD: '86419.75' }]
    })
  ]
}
