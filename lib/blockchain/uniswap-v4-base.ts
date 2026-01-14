// Uniswap V4 on Base - Direct blockchain data reader
import { createPublicClient, http, parseAbi, Address } from 'viem'
import { base } from 'viem/chains'

// Uniswap V4 PoolManager address on Base
const POOL_MANAGER_ADDRESS = '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829' as Address

// V4 PoolManager ABI (minimal for reading pools)
const POOL_MANAGER_ABI = parseAbi([
  'function getPoolKey(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) external view returns (bytes32)',
  'function getLiquidity(bytes32 poolId) external view returns (uint128)',
  'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint24 lpFee)',
  'event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks)',
])

// ERC20 ABI
const ERC20_ABI = parseAbi([
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address) external view returns (uint256)',
])

interface V4Pool {
  poolId: string
  currency0: Address
  currency1: Address
  fee: number
  tickSpacing: number
  hooks: Address
  liquidity?: string
  sqrtPriceX96?: string
  tick?: number
  token0Symbol?: string
  token1Symbol?: string
  token0Name?: string
  token1Name?: string
}

export async function fetchUniswapV4Pools(): Promise<V4Pool[]> {
  // Use LlamaRPC for better rate limits
  const client = createPublicClient({
    chain: base,
    transport: http('https://base.llamarpc.com'),
  })

  try {
    // Get current block
    const currentBlock = await client.getBlockNumber()

    // Reduce range to last 100k blocks (~1 week) to avoid RPC limits
    // V4 was deployed around block 23500000 on Base (December 2024)
    const bigInt100k = BigInt(100000)
    const v4DeployBlock = BigInt(23500000)
    const fromBlock = currentBlock > bigInt100k ? currentBlock - bigInt100k : v4DeployBlock

    console.log(`Fetching V4 pools from block ${fromBlock} to ${currentBlock}`)

    const logs = await client.getLogs({
      address: POOL_MANAGER_ADDRESS,
      event: {
        type: 'event',
        name: 'Initialize',
        inputs: [
          { type: 'bytes32', indexed: true, name: 'id' },
          { type: 'address', indexed: true, name: 'currency0' },
          { type: 'address', indexed: true, name: 'currency1' },
          { type: 'uint24', indexed: false, name: 'fee' },
          { type: 'int24', indexed: false, name: 'tickSpacing' },
          { type: 'address', indexed: false, name: 'hooks' },
        ],
      },
      fromBlock,
      toBlock: currentBlock,
    })

    console.log(`Found ${logs.length} V4 pool initialization events`)

    const pools: V4Pool[] = []

    // Process each pool (limit to first 50 for performance)
    for (const log of logs.slice(0, 50)) {
      try {
        const poolId = log.args.id as string
        const currency0 = log.args.currency0 as Address
        const currency1 = log.args.currency1 as Address
        const fee = log.args.fee as number
        const tickSpacing = log.args.tickSpacing as number
        const hooks = log.args.hooks as Address

        // Get pool state
        const [liquidity, slot0] = await Promise.all([
          client.readContract({
            address: POOL_MANAGER_ADDRESS,
            abi: POOL_MANAGER_ABI,
            functionName: 'getLiquidity',
            args: [poolId as `0x${string}`],
          }).catch(() => BigInt(0)),
          client.readContract({
            address: POOL_MANAGER_ADDRESS,
            abi: POOL_MANAGER_ABI,
            functionName: 'getSlot0',
            args: [poolId as `0x${string}`],
          }).catch(() => [BigInt(0), 0, 0, 0]),
        ])

        // Only include pools with liquidity
        if (liquidity === BigInt(0)) continue

        // Get token info
        let token0Symbol = 'UNKNOWN', token0Name = 'Unknown', token1Symbol = 'UNKNOWN', token1Name = 'Unknown'

        try {
          // Check if it's native ETH (address 0x0)
          if (currency0 === '0x0000000000000000000000000000000000000000') {
            token0Symbol = 'ETH'
            token0Name = 'Ether'
          } else {
            [token0Symbol, token0Name] = await Promise.all([
              client.readContract({ address: currency0, abi: ERC20_ABI, functionName: 'symbol' }),
              client.readContract({ address: currency0, abi: ERC20_ABI, functionName: 'name' }),
            ])
          }

          if (currency1 === '0x0000000000000000000000000000000000000000') {
            token1Symbol = 'ETH'
            token1Name = 'Ether'
          } else {
            [token1Symbol, token1Name] = await Promise.all([
              client.readContract({ address: currency1, abi: ERC20_ABI, functionName: 'symbol' }),
              client.readContract({ address: currency1, abi: ERC20_ABI, functionName: 'name' }),
            ])
          }
        } catch (error) {
          console.error('Error fetching token info:', error)
        }

        pools.push({
          poolId,
          currency0,
          currency1,
          fee,
          tickSpacing,
          hooks,
          liquidity: liquidity.toString(),
          sqrtPriceX96: Array.isArray(slot0) ? slot0[0].toString() : '0',
          tick: Array.isArray(slot0) ? Number(slot0[1]) : 0,
          token0Symbol,
          token1Symbol,
          token0Name,
          token1Name,
        })

        console.log(`✓ ${token0Symbol}/${token1Symbol} - Liquidity: ${liquidity}`)
      } catch (error) {
        console.error('Error processing pool:', error)
        continue
      }
    }

    return pools
  } catch (error) {
    console.error('Error fetching V4 pools:', error)
    throw error
  }
}

// Convert V4 pool to our standard format
export function convertV4ToStandardFormat(v4Pools: V4Pool[]) {
  return v4Pools.map((pool) => ({
    id: pool.poolId,
    token0: {
      id: pool.currency0,
      symbol: pool.token0Symbol || 'UNKNOWN',
      name: pool.token0Name || 'Unknown',
      decimals: '18',
    },
    token1: {
      id: pool.currency1,
      symbol: pool.token1Symbol || 'UNKNOWN',
      name: pool.token1Name || 'Unknown',
      decimals: '18',
    },
    feeTier: pool.fee.toString(),
    liquidity: pool.liquidity || '0',
    sqrtPrice: pool.sqrtPriceX96 || '0',
    tick: pool.tick?.toString() || '0',
    token0Price: '1', // We'd need to calculate this from sqrtPriceX96
    token1Price: '1',
    volumeUSD: '0', // V4 doesn't expose volume directly yet
    totalValueLockedUSD: '0', // We'd need price oracles to calculate
    txCount: '0',
    totalValueLockedToken0: pool.liquidity || '0',
    totalValueLockedToken1: pool.liquidity || '0',
    poolDayData: [{
      volumeUSD: '0',
      tvlUSD: '0',
      feesUSD: '0',
    }],
  }))
}
