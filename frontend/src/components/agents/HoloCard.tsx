'use client'

import { useRef, useState, useCallback } from 'react'
import { Star, Shield, Zap, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentDetail } from '@/types'

interface HoloCardProps {
  agent: AgentDetail
}

function getScoreColor(score: number): string {
  if (score >= 4) return 'text-green-400'
  if (score >= 3) return 'text-yellow-400'
  return 'text-red-400'
}

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad'
  if (chainId === 10143) return 'Testnet'
  return `Chain ${chainId}`
}

function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function isNewbie(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score)
  const partial = score - fullStars
  const emptyStars = 5 - fullStars - (partial > 0 ? 1 : 0)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="size-4 fill-yellow-400 text-yellow-400" />
      ))}
      {partial > 0 && (
        <div className="relative">
          <Star className="size-4 text-muted-foreground/30" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${partial * 100}%` }}>
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="size-4 text-muted-foreground/30" />
      ))}
    </div>
  )
}

export function HoloCard({ agent }: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x, y })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setMousePos({ x: 0.5, y: 0.5 })
  }, [])

  const rotateX = isHovering ? (mousePos.y - 0.5) * -30 : 0
  const rotateY = isHovering ? (mousePos.x - 0.5) * 30 : 0

  // Clamp rotation to +-15 degrees
  const clampedRotateX = Math.max(-15, Math.min(15, rotateX))
  const clampedRotateY = Math.max(-15, Math.min(15, rotateY))

  // Glow position for the border effect
  const glowX = mousePos.x * 100
  const glowY = mousePos.y * 100

  const tags: { label: string; icon: React.ReactNode; className: string }[] = []
  if (isNewbie(agent.created_at)) {
    tags.push({
      label: 'Newbie',
      icon: <Sparkles className="size-3" />,
      className: 'border-green-400/40 bg-green-400/10 text-green-400',
    })
  }
  if (agent.x402_support) {
    tags.push({
      label: 'X402-Verified',
      icon: <Shield className="size-3" />,
      className: 'border-cyan-accent/40 bg-cyan-accent/10 text-cyan-accent',
    })
  }
  if (agent.reputation_score >= 4.5) {
    tags.push({
      label: 'High Score',
      icon: <Zap className="size-3" />,
      className: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400',
    })
  }

  return (
    <div
      className="holo-perspective"
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        className={cn(
          'holo-card relative w-full max-w-[380px] rounded-2xl',
          'cursor-pointer select-none',
          'motion-safe:will-change-transform',
          'motion-reduce:!transform-none',
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${clampedRotateX}deg) rotateY(${clampedRotateY}deg)`,
          transition: isHovering
            ? 'transform 0.1s ease-out'
            : 'transform 0.5s ease-out',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glow border effect */}
        <div
          className={cn(
            'holo-card-glow absolute -inset-[2px] rounded-2xl opacity-0 transition-opacity duration-300',
            isHovering && 'opacity-100',
          )}
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, oklch(0.70 0.25 285 / 0.6), oklch(0.78 0.15 195 / 0.3), transparent 70%)`,
          }}
        />

        {/* Card body */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/95 backdrop-blur-sm">
          {/* Holographic shimmer overlay */}
          <div
            className={cn(
              'holo-card-shimmer pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300',
              isHovering && 'opacity-30',
            )}
            style={{
              background: `conic-gradient(
                from ${mousePos.x * 360}deg at ${mousePos.x * 100}% ${mousePos.y * 100}%,
                oklch(0.75 0.2 0) 0deg,
                oklch(0.75 0.2 30) 30deg,
                oklch(0.75 0.2 60) 60deg,
                oklch(0.75 0.2 90) 90deg,
                oklch(0.75 0.2 120) 120deg,
                oklch(0.75 0.2 150) 150deg,
                oklch(0.75 0.2 180) 180deg,
                oklch(0.75 0.2 210) 210deg,
                oklch(0.75 0.2 240) 240deg,
                oklch(0.75 0.2 270) 270deg,
                oklch(0.75 0.2 300) 300deg,
                oklch(0.75 0.2 330) 330deg,
                oklch(0.75 0.2 360) 360deg
              )`,
              mixBlendMode: 'color-dodge',
            }}
          />

          {/* Secondary shimmer layer for depth */}
          <div
            className={cn(
              'holo-card-shimmer-secondary pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300',
              isHovering && 'opacity-20',
            )}
            style={{
              background: `linear-gradient(
                ${mousePos.x * 180 + 90}deg,
                transparent 20%,
                oklch(0.90 0.15 285 / 0.4) 45%,
                oklch(0.90 0.15 195 / 0.4) 55%,
                transparent 80%
              )`,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Agent Image Section */}
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-b from-primary/20 to-transparent">
            {agent.image ? (
              <img
                src={agent.image}
                alt={agent.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-violet-dim/30 to-cyan-accent/20">
                <span className="text-6xl font-bold text-primary/40">
                  {agent.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            {/* Image gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
          </div>

          {/* Card Content */}
          <div className="relative z-20 space-y-4 p-5">
            {/* Agent Name */}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {agent.name || `Agent #${agent.agent_id}`}
              </h2>
              {agent.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {agent.description}
                </p>
              )}
            </div>

            {/* Service Category Badges */}
            {agent.categories && agent.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {agent.categories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 text-xs"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            {/* Reputation Score */}
            <div className="flex items-center gap-3">
              <span className={cn('text-3xl font-bold tabular-nums', getScoreColor(agent.reputation_score))}>
                {agent.reputation_score.toFixed(1)}
              </span>
              <div className="space-y-1">
                <StarRating score={agent.reputation_score} />
                <p className="text-xs text-muted-foreground">
                  {agent.feedback_count} feedback{agent.feedback_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Tags Row */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag.label}
                    variant="outline"
                    className={cn('gap-1 text-xs px-2 py-0.5', tag.className)}
                  >
                    {tag.icon}
                    {tag.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Bottom: Chain + Owner */}
            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-2',
                  agent.chain_id === 143
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                )}
              >
                {getChainLabel(agent.chain_id)}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {truncateAddress(agent.owner)}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
