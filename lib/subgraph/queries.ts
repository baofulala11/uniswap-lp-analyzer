import { gql } from 'graphql-request'

// 获取热门池子列表
export const GET_TOP_POOLS = gql`
  query GetTopPools($first: Int!, $orderBy: String!, $orderDirection: String!) {
    pools(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { totalValueLockedUSD_gt: "10000" }
    ) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      liquidity
      sqrtPrice
      tick
      token0Price
      token1Price
      volumeUSD
      txCount
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedUSD
      poolDayData(first: 1, orderBy: date, orderDirection: desc) {
        volumeUSD
        tvlUSD
        feesUSD
      }
    }
  }
`

// 获取单个池子详情
export const GET_POOL_DETAILS = gql`
  query GetPoolDetails($poolId: ID!) {
    pool(id: $poolId) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      liquidity
      sqrtPrice
      tick
      token0Price
      token1Price
      volumeUSD
      totalValueLockedUSD
      poolDayData(first: 7, orderBy: date, orderDirection: desc) {
        date
        volumeUSD
        tvlUSD
        feesUSD
      }
    }
  }
`

// 获取池子的 Tick 数据
export const GET_POOL_TICKS = gql`
  query GetPoolTicks($poolId: String!, $skip: Int!) {
    ticks(
      first: 1000
      skip: $skip
      where: { poolAddress: $poolId }
      orderBy: tickIdx
      orderDirection: asc
    ) {
      tickIdx
      liquidityGross
      liquidityNet
      price0
      price1
    }
  }
`

// 获取代币价格
export const GET_TOKEN_PRICES = gql`
  query GetTokenPrices($tokenIds: [ID!]!) {
    tokens(where: { id_in: $tokenIds }) {
      id
      symbol
      derivedETH
    }
    bundle(id: "1") {
      ethPriceUSD
    }
  }
`
