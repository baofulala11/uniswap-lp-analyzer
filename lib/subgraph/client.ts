import { GraphQLClient } from 'graphql-request'
import { SUPPORTED_CHAINS, ChainKey } from '../config/chains'

// 创建 Subgraph 客户端
export function createSubgraphClient(chain: ChainKey) {
  const config = SUPPORTED_CHAINS[chain]
  return new GraphQLClient(config.subgraphUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// 通用查询函数
export async function querySubgraph<T>(
  chain: ChainKey,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const client = createSubgraphClient(chain)
  try {
    const data = await client.request<T>(query, variables)
    return data
  } catch (error) {
    console.error(`Subgraph query error on ${chain}:`, error)
    throw error
  }
}
