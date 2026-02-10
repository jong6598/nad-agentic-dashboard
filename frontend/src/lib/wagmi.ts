import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { monadMainnet, monadTestnet } from './chains'

export const config = getDefaultConfig({
  appName: 'NAD-8004 Dashboard',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'nad8004_dev',
  chains: [monadMainnet, monadTestnet],
})
