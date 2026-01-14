# Uniswap V3/V4 LP 收益分析网站

一个用于分析 Uniswap V3 和 V4 流动性池收益的 Web 应用，支持 Ethereum、Base 和 BSC 链。

## 核心功能

- ✅ **多链支持**: Ethereum、Base、BSC
- ✅ **实时数据**: 从 Uniswap V3 Subgraph 获取实时池子数据
- ✅ **APR 计算**: 基于 24h 成交量、TVL 和价格区间计算预估 APR
- ✅ **池子排行**: 按 APR、TVL、24h 成交量排序
- ✅ **交互式计算器**: 输入价格区间，预估实际收益
- ✅ **集中流动性支持**: 考虑价格区间的杠杆效应

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **样式**: TailwindCSS 4
- **数据源**: The Graph (Uniswap V3 Subgraph)
- **区块链交互**: viem, wagmi
- **图表**: Recharts

## 项目结构

```
alpha-frontend/
├── app/
│   ├── page.tsx              # 主页面
│   ├── layout.tsx            # 根布局
│   └── api/
│       └── pools/            # API 路由
│           ├── route.ts      # 获取池子列表
│           └── [id]/         # 获取池子详情
│               └── route.ts
├── components/
│   ├── PoolList.tsx          # 池子列表组件
│   └── APRCalculator.tsx     # APR 计算器组件
├── lib/
│   ├── config/
│   │   └── chains.ts         # 多链配置
│   ├── subgraph/
│   │   ├── client.ts         # Subgraph 客户端
│   │   └── queries.ts        # GraphQL 查询
│   └── utils/
│       └── apr-calculator.ts # APR 计算逻辑
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
cd alpha-frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 使用说明

### 查看池子列表

1. 选择链（Ethereum / Base / BSC）
2. 查看热门池子，按 APR / TVL / 24h Volume 排序
3. 点击池子查看详情

### 计算 APR

1. 从列表中选择一个池子
2. 在右侧 APR Calculator 中输入：
   - Lower Price（价格下限）
   - Upper Price（价格上限）
   - Liquidity Amount（投入金额 USD）
3. 或使用快捷预设（±5%, ±10%, ±20%）
4. 查看预估 APR 和每日/月/年收益

### APR 计算公式

```typescript
基础 APR = (24h 手续费收益 / TVL) × 365 × 100%

集中流动性 APR = 基础 APR × 流动性集中系数

流动性集中系数 = 全范围区间 / 用户价格区间（最高 10 倍）

每日收益 = 投入金额 × APR / 365
```

## API 端点

### GET /api/pools

获取热门池子列表

**参数:**
- `chain`: ethereum | base | bsc (默认 ethereum)
- `limit`: 返回数量 (默认 20)
- `orderBy`: 排序字段 (默认 totalValueLockedUSD)

**响应示例:**
```json
{
  "success": true,
  "chain": "ethereum",
  "count": 20,
  "pools": [
    {
      "id": "0x...",
      "pair": "WETH/USDC",
      "feeTier": 3000,
      "feePercent": 0.3,
      "tvl": 250000000,
      "volume24h": 120000000,
      "apr": 45.5,
      "token0Price": 3500.5,
      "token1Price": 0.000285
    }
  ]
}
```

### GET /api/pools/[id]

获取单个池子详情

**参数:**
- `chain`: ethereum | base | bsc (默认 ethereum)

## 核心组件说明

### PoolList.tsx

显示池子列表，支持：
- 实时数据获取
- 排序（APR/TVL/Volume）
- 选择池子

### APRCalculator.tsx

APR 计算器，功能：
- 价格区间输入
- 快捷预设
- 实时 APR 计算
- 收益预估（日/月/年）
- In Range 状态检查

## Uniswap V4 支持（待实现）

V4 的数据获取更复杂，因为它使用 Singleton 合约架构：

### V4 关键挑战

1. **PoolKey 结构**: 不再是独立合约地址
   ```typescript
   type PoolKey = {
     currency0: Address
     currency1: Address
     fee: number
     tickSpacing: number
     hooks: Address
   }
   ```

2. **事件监听**: 需要监听 PoolManager 的 Initialize 事件
   ```solidity
   event Initialize(
     PoolId indexed id,
     Currency indexed currency0,
     Currency indexed currency1,
     uint24 fee,
     int24 tickSpacing,
     IHooks hooks
   )
   ```

3. **后端索引服务**: 建议创建后台服务持续索引 V4 池子

### V4 实现计划

```typescript
// 1. 创建 V4 事件监听服务
// lib/v4/event-listener.ts

// 2. 建立 PoolKey 数据库索引
// lib/v4/pool-indexer.ts

// 3. 创建 V4 API 端点
// app/api/v4/pools/route.ts

// 4. 更新前端支持 V4
// components/PoolList.tsx (添加 V4 过滤)
```

## 数据缓存策略

当前实现从 Subgraph 实时获取数据。生产环境建议：

1. **Redis 缓存**: 缓存池子列表 30-60 秒
2. **增量更新**: 只更新变化的池子
3. **WebSocket**: 推送实时价格变化

## 性能优化建议

1. **分页加载**: 池子列表分页（每页 20 条）
2. **虚拟滚动**: 长列表使用虚拟滚动
3. **数据预取**: 预加载常用池子数据
4. **CDN**: 静态资源使用 CDN

## 环境变量配置（可选）

创建 `.env.local`:

```bash
# The Graph API Key (可选，提高请求限制)
NEXT_PUBLIC_GRAPH_API_KEY=your_api_key

# RPC URLs (可选，覆盖默认)
NEXT_PUBLIC_ETHEREUM_RPC=https://eth.llamarpc.com
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_BSC_RPC=https://bsc-dataseed1.binance.org
```

## 故障排查

### 1. Subgraph 查询失败

- 检查网络连接
- 验证 Subgraph URL 是否正确
- 确认 The Graph 服务状态

### 2. APR 显示为 0

- 检查池子是否有 24h 成交量数据
- 验证 poolDayData 是否存在

### 3. 构建错误

```bash
# 清除缓存
rm -rf .next
npm run build
```

## 未来功能规划

- [ ] Uniswap V4 完整支持
- [ ] 用户钱包连接
- [ ] 实时持仓追踪
- [ ] 无常损失计算
- [ ] 历史收益图表
- [ ] 多语言支持
- [ ] 移动端优化
- [ ] 价格提醒通知

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 相关资源

- [Uniswap V3 Documentation](https://docs.uniswap.org/protocol/concepts/V3-overview/concentrated-liquidity)
- [The Graph Documentation](https://thegraph.com/docs)
- [Uniswap V3 Subgraph](https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3)
- [Next.js Documentation](https://nextjs.org/docs)
