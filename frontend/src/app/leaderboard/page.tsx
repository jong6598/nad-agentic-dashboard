'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { CategoryFilter } from '@/components/agents/CategoryFilter'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { Skeleton } from '@/components/ui/skeleton'

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  )
}

export default function LeaderboardPage() {
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [category, setCategory] = useState('')

  const { data, isLoading } = useLeaderboard({
    chain_id: chainId,
    category: category || undefined,
    limit: 50,
  })

  return (
    <div className="space-y-8">
      {/* Title */}
      <section className="flex items-center gap-3 pt-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-yellow-500/10">
          <Trophy className="size-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Top agents ranked by reputation score
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ChainFilter selected={chainId} onSelect={setChainId} />
        </div>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-border/50 bg-card/50">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : (
          <LeaderboardTable entries={data?.leaderboard || []} />
        )}
      </section>
    </div>
  )
}
