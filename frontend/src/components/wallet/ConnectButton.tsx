'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { LogOut, Wallet, ChevronDown, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (!isConnected || !address) {
    return (
      <Button
        size="sm"
        onClick={() => {
          // Connect with the first available connector (usually injected/MetaMask)
          const connector = connectors[0]
          if (connector) {
            connect({ connector })
          }
        }}
        className="bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <Wallet className="size-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50 bg-card/60"
        >
          <span className={cn(
            'inline-block size-2 rounded-full',
            chain?.id === 143 ? 'bg-green-400' : 'bg-yellow-400'
          )} />
          <span className="text-sm font-mono">{truncateAddress(address)}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">Connected to</p>
          <p className="text-sm font-medium">{chain?.name || 'Unknown'}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(address)}
          className="cursor-pointer"
        >
          <Copy className="size-4" />
          Copy Address
        </DropdownMenuItem>
        {chain?.blockExplorers?.default && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <a
              href={`${chain.blockExplorers.default.url}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
