// Contract addresses per chain
export const CONTRACT_ADDRESSES = {
  // Monad Mainnet (chain ID 143)
  143: {
    identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const,
    reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const,
  },
  // Monad Testnet (chain ID 10143)
  10143: {
    identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const,
    reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const,
  },
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES

// IdentityRegistry ABI (minimal — key functions and events only)
export const identityRegistryAbi = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'uri', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    name: 'getIdentity',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'uri', type: 'string' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'Registered',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'uri', type: 'string', indexed: false },
    ],
  },
  {
    name: 'URIUpdated',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'oldUri', type: 'string', indexed: false },
      { name: 'newUri', type: 'string', indexed: false },
    ],
  },
] as const

// ReputationRegistry ABI (minimal — key functions and events only)
export const reputationRegistryAbi = [
  {
    name: 'submitFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int256' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackUri', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'feedbackIndex', type: 'uint256' }],
  },
  {
    name: 'NewFeedback',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'feedbackIndex', type: 'uint256', indexed: false },
      { name: 'value', type: 'int256', indexed: false },
      { name: 'tag1', type: 'string', indexed: false },
      { name: 'tag2', type: 'string', indexed: false },
    ],
  },
  {
    name: 'FeedbackRevoked',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'feedbackIndex', type: 'uint256', indexed: false },
    ],
  },
] as const
