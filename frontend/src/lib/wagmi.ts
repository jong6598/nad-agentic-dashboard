import { createConfig, http } from 'wagmi'
import { monadMainnet, monadTestnet } from './chains'

export const config = createConfig({
  chains: [monadMainnet, monadTestnet],
  transports: {
    [monadMainnet.id]: http(),
    [monadTestnet.id]: http(),
  },
})
