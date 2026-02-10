'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAgent } from '@/hooks/useAgent'
import { HoloCard } from '@/components/agents/HoloCard'
import { RatingChart } from '@/components/agents/RatingChart'
import { IdentityActivityTab } from '@/components/agents/IdentityActivityTab'
import { ReputationActivityTab } from '@/components/agents/ReputationActivityTab'
import { LaborTab } from '@/components/agents/LaborTab'

function getExplorerUrl(chainId: number, address: string): string {
  if (chainId === 143) return `https://monadexplorer.com/address/${address}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/address/${address}`
  return `#`
}

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad Mainnet'
  if (chainId === 10143) return 'Monad Testnet'
  return `Chain ${chainId}`
}

function CopyableAddress({ address, chainId }: { address: string; chainId: number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [address])

  return (
    <div className="flex items-center gap-2">
      <a
        href={getExplorerUrl(chainId, address)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-sm text-primary/80 hover:text-primary transition-colors"
      >
        {address}
        <ExternalLink className="ml-1 inline size-3" />
      </a>
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Copy address"
      >
        {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button skeleton */}
      <Skeleton className="mb-8 h-9 w-36" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
        {/* HoloCard skeleton */}
        <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
          <Skeleton className="h-[480px] w-full max-w-[380px] rounded-2xl" />
        </div>

        {/* Info panel skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function ErrorState({ agentId }: { agentId: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/agents">
        <Button variant="ghost" size="sm" className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
          <h2 className="text-xl font-semibold text-foreground">Agent Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Could not find agent with ID &quot;{agentId}&quot;.
          </p>
          <Link href="/agents">
            <Button variant="default" size="sm" className="mt-6">
              Browse All Agents
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = use(params)

  // Parse agentId format: "{chainId}-{agentId}" e.g. "143-1"
  const parts = agentId.split('-')
  const chainId = parts.length >= 2 ? parseInt(parts[0], 10) : 0
  const agentNumericId = parts.length >= 2 ? parts.slice(1).join('-') : agentId

  const { data: agent, isLoading, error } = useAgent(agentId)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !agent) {
    return <ErrorState agentId={agentId} />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link href="/agents">
        <Button variant="ghost" size="sm" className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>
      </Link>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
        {/* Left column: HoloCard (sticky on desktop) */}
        <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
          <HoloCard agent={agent} />
        </div>

        {/* Right column: Info + Tabs */}
        <div className="min-w-0 space-y-6">
          {/* Agent Header Info */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {agent.name || `Agent #${agent.agent_id}`}
            </h1>
            {agent.description && (
              <p className="text-base text-muted-foreground">
                {agent.description}
              </p>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/30 bg-card/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Chain:</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  agent.chain_id === 143
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
                )}
              >
                {getChainLabel(agent.chain_id)}
              </Badge>
            </div>
            <div className="hidden h-4 w-px bg-border/50 sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Agent ID:</span>
              <span className="font-mono text-sm text-foreground">#{agent.agent_id}</span>
            </div>
            <div className="hidden h-4 w-px bg-border/50 sm:block" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Owner:</span>
              <CopyableAddress address={agent.owner} chainId={agent.chain_id} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border/30 bg-card/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {(agent.reputation_score ?? 0).toFixed(1)}
              </p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Feedbacks</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {agent.feedback_count}
              </p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Positive</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-green-400">
                {agent.positive_feedback_count ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Negative</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-red-400">
                {agent.negative_feedback_count ?? 0}
              </p>
            </div>
          </div>

          {/* URI Info */}
          {agent.uri && (
            <div className="rounded-lg border border-border/30 bg-card/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">Agent URI</p>
              <p className="mt-1 break-all font-mono text-sm text-foreground/80">
                {agent.uri}
              </p>
            </div>
          )}

          {/* Rating Chart */}
          <RatingChart agentId={agentNumericId} chainId={chainId} />

          {/* Activity Tabs */}
          <Tabs defaultValue="reputation" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="identity" className="gap-1.5">
                Identity
              </TabsTrigger>
              <TabsTrigger value="reputation" className="gap-1.5">
                Reputation
              </TabsTrigger>
              <TabsTrigger value="labor" className="gap-1.5">
                Labor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identity">
              <IdentityActivityTab agentId={agentId} />
            </TabsContent>

            <TabsContent value="reputation">
              <ReputationActivityTab agentId={agentId} />
            </TabsContent>

            <TabsContent value="labor">
              <LaborTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
