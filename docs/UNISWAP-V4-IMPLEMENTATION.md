# Uniswap V4 数据获取实现指南

## V4 架构概述

Uniswap V4 采用了全新的 **Singleton 架构**，与 V3 有本质区别：

| 特性 | V3 | V4 |
|------|----|----|
| 池子合约 | 每个池子独立合约 | 统一 PoolManager 合约 |
| 池子标识 | 合约地址 | PoolId (hash) |
| 池子配置 | 构造函数参数 | PoolKey 结构体 |
| Hooks 支持 | ❌ | ✅ |
| Gas 效率 | 较低 | 极高（闪电贷免费） |

## PoolKey 结构

```solidity
struct PoolKey {
    Currency currency0;    // Token0 地址
    Currency currency1;    // Token1 地址
    uint24 fee;           // 费率（如 3000 = 0.3%）
    int24 tickSpacing;    // Tick 间距
    IHooks hooks;         // Hooks 合约地址（0x0 表示无 hooks）
}

// PoolId 计算
bytes32 poolId = keccak256(abi.encode(poolKey));
```

## 核心挑战

### 1. 无法直接枚举池子

V3 可以通过工厂合约的 `allPools()` 枚举所有池子，但 V4 没有这个接口。

**解决方案:**
- 监听 `Initialize` 事件
- 建立链下索引数据库

### 2. PoolKey 组合爆炸

理论上任意两个代币可以有无限种 PoolKey 组合（不同 fee、tickSpacing、hooks）。

**解决方案:**
- 只索引有实际流动性的池子
- 按 TVL 过滤小池子

### 3. Subgraph 支持不完善

V4 的 Subgraph 尚未成熟，需要自建索引。

## 实现方案

### 方案 A: 事件监听 + 数据库索引（推荐）

#### 架构

```
┌─────────────────┐
│  Ethereum Node  │
│   (RPC/WSS)     │
└────────┬────────┘
         │ 监听事件
         ▼
┌─────────────────┐
│  Event Listener │
│   (Node.js)     │
└────────┬────────┘
         │ 写入
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Pool Index)  │
└────────┬────────┘
         │ 查询
         ▼
┌─────────────────┐
│   Next.js API   │
│   (Frontend)    │
└─────────────────┘
```

#### 实现代码

**1. 事件监听服务**

```typescript
// services/v4-indexer/event-listener.ts
import { createPublicClient, http, parseAbiItem, Log } from 'viem'
import { mainnet } from 'viem/chains'
import { db } from './database'

const POOL_MANAGER_ADDRESS = '0x...' // V4 PoolManager 地址
const START_BLOCK = 20000000 // V4 部署区块

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com')
})

// Initialize 事件 ABI
const INITIALIZE_EVENT = parseAbiItem(
  'event Initialize(bytes32 indexed poolId, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks)'
)

async function listenToPoolCreation() {
  console.log('Starting V4 pool indexer...')

  let currentBlock = await db.getLastIndexedBlock() || START_BLOCK
  const latestBlock = await client.getBlockNumber()

  while (currentBlock < latestBlock) {
    const toBlock = Math.min(currentBlock + 10000, latestBlock)

    console.log(`Indexing blocks ${currentBlock} to ${toBlock}`)

    // 获取 Initialize 事件
    const logs = await client.getLogs({
      address: POOL_MANAGER_ADDRESS,
      event: INITIALIZE_EVENT,
      fromBlock: BigInt(currentBlock),
      toBlock: BigInt(toBlock)
    })

    // 处理每个事件
    for (const log of logs) {
      await processInitializeEvent(log)
    }

    await db.updateLastIndexedBlock(toBlock)
    currentBlock = toBlock + 1
  }

  // 实时监听新事件
  client.watchEvent({
    address: POOL_MANAGER_ADDRESS,
    event: INITIALIZE_EVENT,
    onLogs: async (logs) => {
      for (const log of logs) {
        await processInitializeEvent(log)
      }
    }
  })
}

async function processInitializeEvent(log: Log) {
  const { poolId, currency0, currency1, fee, tickSpacing, hooks } = log.args

  // 构建 PoolKey
  const poolKey = {
    currency0,
    currency1,
    fee,
    tickSpacing,
    hooks
  }

  // 存入数据库
  await db.pools.create({
    data: {
      poolId: poolId as string,
      currency0: currency0 as string,
      currency1: currency1 as string,
      fee: fee as number,
      tickSpacing: tickSpacing as number,
      hooks: hooks as string,
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash
    }
  })

  console.log(`Indexed new pool: ${poolId}`)
}

listenToPoolCreation()
```

**2. 数据库 Schema**

```sql
-- PostgreSQL Schema
CREATE TABLE v4_pools (
  pool_id VARCHAR(66) PRIMARY KEY,
  currency0 VARCHAR(42) NOT NULL,
  currency1 VARCHAR(42) NOT NULL,
  fee INTEGER NOT NULL,
  tick_spacing INTEGER NOT NULL,
  hooks VARCHAR(42) NOT NULL,

  -- 缓存数据
  liquidity NUMERIC(78, 0),
  sqrt_price NUMERIC(78, 0),
  current_tick INTEGER,

  -- 统计数据
  volume_24h NUMERIC(20, 2),
  tvl_usd NUMERIC(20, 2),
  fees_24h NUMERIC(20, 2),

  -- 元数据
  block_number BIGINT NOT NULL,
  transaction_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_currencies (currency0, currency1),
  INDEX idx_tvl (tvl_usd DESC),
  INDEX idx_volume (volume_24h DESC)
);

CREATE TABLE indexer_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_indexed_block BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**3. 定时更新池子数据**

```typescript
// services/v4-indexer/pool-updater.ts
import { createPublicClient, http } from 'viem'
import { db } from './database'

const POOL_MANAGER_ABI = [
  {
    name: 'getSlot0',
    type: 'function',
    inputs: [{ name: 'poolId', type: 'bytes32' }],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      // ...
    ]
  },
  // ... 其他函数
]

async function updatePoolData() {
  const pools = await db.pools.findMany({
    where: { tvl_usd: { gt: 10000 } } // 只更新 TVL > 1万的池子
  })

  for (const pool of pools) {
    try {
      // 获取 Slot0 数据
      const slot0 = await client.readContract({
        address: POOL_MANAGER_ADDRESS,
        abi: POOL_MANAGER_ABI,
        functionName: 'getSlot0',
        args: [pool.poolId]
      })

      // 计算 TVL 和 Volume
      const tvl = await calculateTVL(pool)
      const volume24h = await calculate24hVolume(pool)

      // 更新数据库
      await db.pools.update({
        where: { poolId: pool.poolId },
        data: {
          sqrtPrice: slot0.sqrtPriceX96.toString(),
          currentTick: slot0.tick,
          tvl_usd: tvl,
          volume_24h: volume24h,
          updated_at: new Date()
        }
      })
    } catch (error) {
      console.error(`Failed to update pool ${pool.poolId}:`, error)
    }
  }
}

// 每 30 秒更新一次
setInterval(updatePoolData, 30000)
```

**4. Next.js API 端点**

```typescript
// app/api/v4/pools/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const orderBy = searchParams.get('orderBy') || 'tvl_usd'

  const pools = await db.v4_pools.findMany({
    where: {
      tvl_usd: { gt: 10000 } // 过滤小池子
    },
    orderBy: { [orderBy]: 'desc' },
    take: limit,
    include: {
      token0: true,
      token1: true
    }
  })

  return NextResponse.json({
    success: true,
    pools: pools.map(pool => ({
      id: pool.poolId,
      protocol: 'v4',
      pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      fee: pool.fee,
      tvl: pool.tvl_usd,
      volume24h: pool.volume_24h,
      hooks: pool.hooks !== '0x0000000000000000000000000000000000000000'
    }))
  })
}
```

### 方案 B: 使用第三方索引服务

如果不想自建索引服务，可以使用：

1. **Dune Analytics API**
   - 查询已有的 V4 Dashboard
   - 适合非实时数据

2. **Moralis / QuickNode**
   - 提供事件索引 API
   - 按需付费

3. **GoldRush (Covalent)**
   - 支持多链事件查询

**示例: Dune Analytics**

```typescript
import axios from 'axios'

const DUNE_API_KEY = process.env.DUNE_API_KEY

async function getV4PoolsFromDune() {
  // 先在 Dune 上创建查询
  const queryId = 1234567 // 你的查询 ID

  const response = await axios.get(
    `https://api.dune.com/api/v1/query/${queryId}/results`,
    {
      headers: { 'X-Dune-API-Key': DUNE_API_KEY }
    }
  )

  return response.data.result.rows
}
```

### 方案 C: 监听 Swap 事件（轻量级）

如果只需要活跃池子，可以只监听 Swap 事件：

```typescript
// 只索引有交易活动的池子
const SWAP_EVENT = parseAbiItem(
  'event Swap(bytes32 indexed poolId, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
)

client.watchEvent({
  address: POOL_MANAGER_ADDRESS,
  event: SWAP_EVENT,
  onLogs: async (logs) => {
    for (const log of logs) {
      const poolId = log.args.poolId

      // 如果是新池子，获取 PoolKey
      if (!(await db.hasPool(poolId))) {
        const poolKey = await getPoolKeyFromPoolId(poolId)
        await db.savePool(poolId, poolKey)
      }

      // 更新交易量
      await db.updateVolume(poolId, log)
    }
  }
})
```

## Tick 数据获取

V4 的 Tick 数据需要通过链上调用获取：

```typescript
// lib/v4/ticks.ts
async function getPoolTicks(poolId: string) {
  // V4 没有批量获取 Tick 的方法，需要：

  // 1. 获取当前 tick 和流动性范围
  const slot0 = await poolManager.read.getSlot0([poolId])
  const currentTick = slot0.tick

  // 2. 扫描活跃 tick 范围
  const tickSpacing = 60 // 从 PoolKey 获取
  const range = 100 // 扫描 ±100 个 tick spacing

  const ticks = []

  for (let i = -range; i <= range; i++) {
    const tickIdx = currentTick + (i * tickSpacing)

    try {
      const tickInfo = await poolManager.read.getTick([poolId, tickIdx])

      if (tickInfo.liquidityGross > 0) {
        ticks.push({
          tickIdx,
          liquidityGross: tickInfo.liquidityGross,
          liquidityNet: tickInfo.liquidityNet
        })
      }
    } catch {
      // Tick 不存在，跳过
    }
  }

  return ticks
}
```

## 部署建议

### 开发环境

```bash
# 1. 启动本地索引服务
npm run indexer:dev

# 2. 启动 Next.js
npm run dev
```

### 生产环境

```bash
# 使用 PM2 管理索引服务
pm2 start services/v4-indexer/index.ts --name v4-indexer

# 部署 Next.js
npm run build
pm2 start npm --name nextjs -- start
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: uniswap_v4
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  indexer:
    build: ./services/v4-indexer
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:your_password@postgres:5432/uniswap_v4
      RPC_URL: https://eth.llamarpc.com
    restart: always

  nextjs:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:your_password@postgres:5432/uniswap_v4

volumes:
  postgres_data:
```

## 成本估算

| 组件 | 成本 |
|------|------|
| RPC 调用 | $50-200/月（Alchemy/Infura） |
| 数据库 | $10-50/月（Supabase/RDS） |
| 服务器 | $20-100/月（1-2 核） |
| **总计** | **$80-350/月** |

优化建议：
- 使用免费 RPC（LlamaRPC）降低成本
- Supabase 免费版足够开发使用
- Vercel Hobby Plan 免费部署前端

## 常见问题

### Q1: 如何获取 V4 的 PoolManager 地址？

A: V4 尚未在主网部署，当前可在测试网测试：
- Sepolia: `0x...`（查看 Uniswap GitHub）

### Q2: V4 的 hooks 如何影响数据？

A: Hooks 可以修改池子行为，需要：
- 识别常见 hooks 类型
- 特殊处理（如动态费率）

### Q3: 如何优化索引性能？

A:
- 使用 WebSocket 而非轮询
- 批量处理事件
- 只索引活跃池子（TVL > 门槛）

## 相关资源

- [Uniswap V4 Core](https://github.com/Uniswap/v4-core)
- [Uniswap V4 Docs](https://docs.uniswap.org/concepts/uniswap-protocol/v4)
- [Viem Documentation](https://viem.sh)
- [The Graph Subgraph](https://thegraph.com/docs)
