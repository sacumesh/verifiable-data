import * as Factory from 'factory.ts';

import * as Wallet from '@transmute/universal-wallet';
import * as DidKey from '@transmute/universal-wallet-did-key-plugin';
import * as DidWeb from '@transmute/universal-wallet-did-web-plugin';
import * as Vc from '@transmute/universal-wallet-vc-plugin';
// import * as Edv from '@transmute/universal-wallet-edv-plugin';

export interface FastifyWalletFactory
  extends Wallet.Wallet,
    DidKey.DidKeyPlugin,
    DidWeb.DidWebPlugin,
    Vc.VcPlugin {}

export const walletFactory = Factory.Sync.makeFactory<FastifyWalletFactory>({
  ...Wallet.walletDefaults,
  ...DidKey.factoryDefaults,
  ...DidWeb.factoryDefaults,
  ...Vc.factoryDefaults,
  //   ...Edv.factoryDefaults,
})
  .combine(Wallet.walletFactory)
  .combine(DidKey.pluginFactory)
  .combine(DidWeb.pluginFactory)
  .combine(Vc.pluginFactory);
//   .combine(Edv.pluginFactory);