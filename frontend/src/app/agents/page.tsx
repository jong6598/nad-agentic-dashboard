'use client'

import { useState, useMemo } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { AgentCard } from '@/components/agents/AgentCard'
import { SearchBar } from '@/components/agents/SearchBar'
import { CategoryFilter } from '@/components/agents/CategoryFilter'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { Skeleton } from '@/components/ui/skeleton'
import type { Agent } from '@/types'

function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/80 p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

function AgentSection({
  title,
  agents,
  isLoading,
}: {
  title: string
  agents: Agent[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (agents.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={`${agent.chain_id}-${agent.agent_id}`} agent={agent} />
        ))}
      </div>
    </section>
  )
}

export default function AgentsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [chainId, setChainId] = useState<number | undefined>(undefined)

  // Fetch agents with score sort for "Top Scored"
  const { data: scoreData, isLoading: isLoadingScore } = useAgents({
    sort: 'score',
    search: search || undefined,
    category: category || undefined,
    chain_id: chainId,
    limit: 18,
  })

  // Fetch agents with recent sort for "Recently Deployed"
  const { data: recentData, isLoading: isLoadingRecent } = useAgents({
    sort: 'recent',
    search: search || undefined,
    category: category || undefined,
    chain_id: chainId,
    limit: 18,
  })

  // Derive sections from the data
  const topScored = useMemo(() => {
    return (scoreData?.agents || []).slice(0, 6)
  }, [scoreData])

  const recentlyDeployed = useMemo(() => {
    return (recentData?.agents || []).slice(0, 6)
  }, [recentData])

  // "Recent Reputation" — agents from score data sorted by feedback count (as proxy for recent reputation activity)
  const recentReputation = useMemo(() => {
    const agents = [...(scoreData?.agents || [])]
    return agents
      .sort((a, b) => b.feedback_count - a.feedback_count)
      .slice(0, 6)
  }, [scoreData])

  const isLoading = isLoadingScore || isLoadingRecent

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="py-8 text-center sm:py-12">
        <h1 className="text-gradient-glow text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Discover AI Agents on Monad
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Explore, evaluate, and interact with EIP-8004 registered agents.
          View reputation scores, service categories, and on-chain activity.
        </p>
      </section>

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            className="w-full sm:max-w-xs"
          />
          <ChainFilter selected={chainId} onSelect={setChainId} />
        </div>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </section>

      {/* Agent Sections */}
      <div className="space-y-10">
        <AgentSection
          title="Top Scored"
          agents={topScored}
          isLoading={isLoading}
        />
        <AgentSection
          title="Recently Deployed"
          agents={recentlyDeployed}
          isLoading={isLoading}
        />
        <AgentSection
          title="Recent Reputation"
          agents={recentReputation}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
