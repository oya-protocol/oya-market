// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");

async function main() {
  // get token from deployed address
  // A Human-Readable ABI; any supported ABI format could be used
  const abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_updater",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "OrderCreated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "clearOrder",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "_buyer",
          "type": "address"
        },
        {
          "internalType": "address payable",
          "name": "_seller",
          "type": "address"
        },
        {
          "internalType": "address payable",
          "name": "_affiliate",
          "type": "address"
        },
        {
          "internalType": "contract IERC20",
          "name": "_paymentToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_paymentAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_affiliateCut",
          "type": "uint256"
        },
        {
          "internalType": "string[]",
          "name": "_productHashes",
          "type": "string[]"
        }
      ],
      "name": "createOrder",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        }
      ],
      "name": "reward",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_affiliateRegistry",
          "type": "address"
        }
      ],
      "name": "setAffiliateRegistry",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "_arbitrator",
          "type": "address"
        }
      ],
      "name": "setArbitrator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_rewardAmount",
          "type": "uint256"
        }
      ],
      "name": "setRewardAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenAddress",
          "type": "address"
        }
      ],
      "name": "setToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "_updater",
          "type": "address"
        }
      ],
      "name": "setUpdater",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
  const address = process.env.ROPSTEN_OYA_CONTROLLER_ADDRESS;
  const provider = ethers.getDefaultProvider('ropsten');
  const wallet = new ethers.Wallet(process.env.ROPSTEN_PRIVATE_KEY, provider);
  console.log("Wallet address:", wallet.address);

  const oyaController = new ethers.Contract(address, abi, provider);

  await oyaController.connect(wallet).setAffiliateRegistry(
    process.env.ROPSTEN_AFFILIATE_REGISTRY_ADDRESS
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
