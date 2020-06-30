usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-gas-reporter");
require('dotenv').config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ROPSTEN_PRIVATE_KEY = process.env.ROPSTEN_PRIVATE_KEY;
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solc: {
    version: "0.6.7",
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 21
  },
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      /*
      accounts: {
        mnemonic: "SOME MNEMONIC TEXT HERE"
      },*/
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${MAINNET_PRIVATE_KEY}`]
    },
  },
};
