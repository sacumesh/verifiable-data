import React from "react";

import { seed } from "@transmute/universal-wallet-test-vectors";
import { customWalletFactory } from "./customWalletFactory";
import { issue } from "./issue";
import { present } from "./present";
import { verify } from "./verify";

function App() {
  const [state, setState] = React.useState({});
  React.useEffect(() => {
    (async () => {
      const wallet = customWalletFactory.build({ contents: [] });
      // generate and add keys from seed
      const c0 = await wallet.generateContentFromSeed(Buffer.from(seed, "hex"));
      c0.forEach((c) => {
        wallet.add(c);
      });
      // issue credential from generated keys
      const c1 = await issue(wallet);
      c1.forEach((c) => {
        wallet.add(c);
      });
      // present credentials
      const c2 = await present(wallet);
      c2.forEach((c) => {
        wallet.add(c);
      });
      const c3 = await verify(wallet);
      c3.forEach((c) => {
        wallet.add(c);
      });
      setState({
        wallet,
      });
    })();
  }, []);
  return (
    <div className="Package">
      <h4>@transmute/universal-wallet</h4>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

export default App;
