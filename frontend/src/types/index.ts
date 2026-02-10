// ============================================================
// Agent Types
// ============================================================

/** Agent metadata from EIP-8004 agentURI JSON */
export interface AgentMetadata {
  version: string
  endpoints: Array<{
    url: string
    protocol: string
  }>
  capabilities: string[]
  [key: string]: unknown
}

/** Agent summary (used in list views) */
export interface Agent {
  agent_id: number
  chain_id: number
  owner: string
  name: string
  description: string
  image: string
  categories: string[]
  x402_support: boolean
  active: boolean
  reputation_score: number
  feedback_count: number
  created_at: string
}

/** Agent detail (single agent view) */
export interface AgentDetail extends Agent {
  uri: string
  metadata: AgentMetadata | null
  positive_feedback_count: number
  negative_feedback_count: number
}

// ============================================================
// Feedback Types
// ============================================================

export interface Feedback {
  id: number
  agent_id: number
  chain_id: number
  client_address: string
  feedback_index: number
  value: number
  value_decimals: number
  tag1: string
  tag2: string
  endpoint: string
  feedback_uri: string
  feedback_hash: string
  revoked: boolean
  tx_hash: string
  created_at: string
}

// ============================================================
// Activity Types
// ============================================================

export type EventType =
  | 'Registered'
  | 'URIUpdated'
  | 'MetadataSet'
  | 'NewFeedback'
  | 'FeedbackRevoked'
  | 'ResponseAppended'

export type EventCategory = 'identity' | 'reputation' | 'labor'

export interface Activity {
  id: number
  agent_id: number
  chain_id: number
  event_type: EventType
  event_data: Record<string, unknown>
  block_number: number
  tx_hash: string
  log_index: number
  created_at: string
}

// ============================================================
// Leaderboard Types
// ============================================================

export interface LeaderboardEntry {
  rank: number
  agent_id: number
  chain_id: number
  name: string
  image: string
  categories: string[]
  x402_support: boolean
  reputation_score: number
  feedback_count: number
  owner: string
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface CategoryCount {
  category: string
  count: number
}

export interface DashboardStats {
  total_agents: number
  total_feedbacks: number
  total_chains: number
  agents_by_chain: Record<string, number>
  top_categories: CategoryCount[]
  recent_registrations_24h: number
  recent_feedbacks_24h: number
}

// ============================================================
// Reputation History
// ============================================================

export interface ReputationHistoryPoint {
  date: string
  score: number
  feedback_count: number
}

export interface ReputationHistory {
  agent_id: number
  chain_id: number
  current_score: number
  history: ReputationHistoryPoint[]
  feedbacks: Feedback[]
}

export type ReputationRange = '7d' | '30d' | '90d' | 'all'

// ============================================================
// Pagination & API
// ============================================================

export interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  [key: string]: T[] | number
}

export interface AgentsResponse {
  agents: Agent[]
  total: number
  page: number
  limit: number
}

export interface ActivitiesResponse {
  activities: Activity[]
  total: number
  page: number
  limit: number
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
}

export interface ApiError {
  error: string
  message: string
  status: number
}

// ============================================================
// Query Param Types
// ============================================================

export type SortOrder = 'recent' | 'score' | 'name'

export interface AgentFilters {
  chain_id?: number
  search?: string
  category?: string
  sort?: SortOrder
  page?: number
  limit?: number
}

export interface ActivityFilters {
  event_type?: EventCategory
  page?: number
  limit?: number
}

export interface LeaderboardFilters {
  chain_id?: number
  category?: string
  limit?: number
}
