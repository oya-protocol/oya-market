// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");

async function main() {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await bre.run('compile');

  const contracts = ['AffiliateRegistry', 'OyaController', 'OyaToken'];

  const AffiliateRegistry = await ethers.getContractFactory("AffiliateRegistry");
  const affiliateRegistry = await AffiliateRegistry.deploy();

  await affiliateRegistry.deployed();

  console.log("AffiliateRegistry deployed to:", affiliateRegistry.address);

  const OyaController = await ethers.getContractFactory("OyaController");
  const controller = await OyaController.deploy(process.env.ROPSTEN_ADDRESS);

  await controller.deployed();

  console.log("OyaController deployed to:", controller.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
