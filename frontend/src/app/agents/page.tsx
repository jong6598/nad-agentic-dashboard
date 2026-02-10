'use client'

import { useMemo } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentBrowseTable } from '@/components/agents/AgentBrowseTable'
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

function AgentColumn({
  title,
  agents,
  isLoading,
}: {
  title: string
  agents: Agent[]
  isLoading: boolean
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))
          : agents.map((agent) => (
              <AgentCard key={`${agent.chain_id}-${agent.agent_id}`} agent={agent} />
            ))}
      </div>
    </div>
  )
}

export default function AgentsPage() {
  // Fetch agents for card sections (no filters — always show global top)
  const { data: scoreData, isLoading: isLoadingScore } = useAgents({
    sort: 'score',
    limit: 18,
  })

  const { data: recentData, isLoading: isLoadingRecent } = useAgents({
    sort: 'recent',
    limit: 18,
  })

  // Derive sections from the data — 3 cards each
  const topScored = useMemo(() => {
    return (scoreData?.agents || []).slice(0, 3)
  }, [scoreData])

  const recentlyDeployed = useMemo(() => {
    return (recentData?.agents || []).slice(0, 3)
  }, [recentData])

  const recentReputation = useMemo(() => {
    const agents = [...(scoreData?.agents || [])]
    return agents
      .sort((a, b) => b.feedback_count - a.feedback_count)
      .slice(0, 3)
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

      {/* Three sections side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AgentColumn
          title="Top Scored"
          agents={topScored}
          isLoading={isLoading}
        />
        <AgentColumn
          title="Recently Deployed"
          agents={recentlyDeployed}
          isLoading={isLoading}
        />
        <AgentColumn
          title="Recent Reputation"
          agents={recentReputation}
          isLoading={isLoading}
        />
      </div>

      {/* Agent Browse Table — has its own search/sort/pagination */}
      <AgentBrowseTable />
    </div>
  )
}
