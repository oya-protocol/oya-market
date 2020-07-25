const { expect } = require("chai");
const chalk = require("chalk");
const log = console.log;
const OyaOrder = require('../artifacts/OyaOrder');
const OyaController = require('../artifacts/OyaController');
const Token = require('../artifacts/Token');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const explanation = chalk.cyanBright;

describe("Controller", function() {
  this.timeout(100000);
  it("Controller should be able to deploy order contract", async function() {
    const [updater, buyer, seller, affiliate, arbitrator, trustedForwarder] = await ethers.getSigners();
    const provider = ethers.getDefaultProvider();
    updaterAddress = await updater.getAddress();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    affiliateAddress = await affiliate.getAddress();
    arbitratorAddress = await arbitrator.getAddress();
    trustedForwarderAddress = await trustedForwarder.getAddress();

    log(explanation('\nSetting up some addresses from ethers.getSigners...'));
    log(chalk`
      {whiteBright Updater}: ${updaterAddress}
      {greenBright Buyer}: ${buyerAddress}
      {yellowBright Seller}: ${sellerAddress}
      {blueBright Affiliate}: ${affiliateAddress}
      {redBright Arbitrator}: ${arbitratorAddress}
    `);


    log(explanation("Note: Right now " + chalk.whiteBright("Updater") + " is just a regular address.\n"));


    const Dai = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaToken = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaControllerFactory = new ethers.ContractFactory(
      OyaController.abi,
      OyaController.bytecode,
      updater
    );

    const daiToken = await Dai.deploy("Fake Dai", "fDAI");
    await daiToken.deployed();

    log(explanation("Deploying a " + chalk.whiteBright("Fake Dai") + " contract."));
    log(chalk`
      {whiteBright Fake Dai}: ${daiToken.address}
    `);


    await daiToken.mint(buyerAddress, 100);
    let buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    log(explanation("We're giving the " + chalk.greenBright("buyer") + " 100 " + chalk.whiteBright("Fake Dai.\n")));
    log(chalk.greenBright("Buyer") + " Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);

    const oyaToken = await OyaToken.deploy("Oya", "OYA");
    await oyaToken.deployed();

    const controller = await OyaControllerFactory.deploy(updaterAddress);
    await controller.deployed();

    log(explanation("\nLet's deploy " + chalk.whiteBright("Oya Token") + "and the " + chalk.whiteBright("Controller") + "..."));
    log(chalk`
      {whiteBright Oya Token}: ${oyaToken.address}
      {whiteBright Controller}: ${controller.address}
    `);


    await controller.connect(updater).setToken(oyaToken.address);
    await controller.connect(updater).setArbitrator(arbitratorAddress);
    await controller.connect(updater).setRewardAmount(10);
    await controller.connect(updater).setTrustedForwarder(trustedForwarderAddress);

    log(explanation("\nThe " + chalk.whiteBright("Updater") + " sets the " + chalk.magentaBright("reward amount") + ", the " + chalk.whiteBright("Oya Token") + " contract address, and default " + chalk.redBright("arbitrator ") + "address in the " + chalk.whiteBright("Controller") + "."));
    log(chalk`
      {magentaBright uint256 rewardAmount}: ${10}
      {magentaBright address oyaToken}: ${oyaToken.address}
      {magentaBright address arbitrator}: ${arbitratorAddress}
    `);


    await oyaToken.connect(updater).grantRole(
      ethers.utils.id("MINTER_ROLE"),
      controller.address
    );
    log(explanation("The " + chalk.whiteBright("Updater") + " grants the " + chalk.magentaBright("minter") + " role for " + chalk.whiteBright("Oya Token") + " contract to the " + chalk.whiteBright("Controller") + ".\n"));


    await daiToken.connect(buyer).approve(controller.address, buyerBalance);
    let orderAddress;
    log(explanation("The " + chalk.greenBright("Buyer") + " approves the " + chalk.whiteBright("Controller") + " to transfer " + chalk.hex('#F4B731')("Đ") + buyerBalance + ", then calls " + chalk.magentaBright("createOrder") + " with the order params."));
    log(chalk`
      {magentaBright address buyerAddress}: ${buyerAddress}
      {magentaBright address sellerAddress}: ${sellerAddress}
      {magentaBright address paymentToken}: ${daiToken.address}
      {magentaBright uint256 paymentAmount}: ${100}
    `);

    let productHashes = [
      'QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t',
      'QmT4AeWE9Q9EaoyLJiqaZuYQ8mJeq4ZBncjjFH9dQ9uDVA'
    ];

    let tx = await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      affiliateAddress,
      daiToken.address,
      100,
      10,
      productHashes
    );

    controller.on("OrderCreated", (newOrder, event) => {
      orderAddress = newOrder;
      event.removeListener();
    });

    await tx.wait(1);

    log(explanation("The " + chalk.whiteBright("Controller") + " creates the " + chalk.whiteBright("Order") + " contract, which holds the payment from the " + chalk.greenBright("buyer") + " in escrow.\n"));

    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await daiToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    log(chalk.greenBright("Buyer") + " Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Controller") + " Balance: " + chalk.hex('#F4B731')("Đ") + controllerBalance);
    log(chalk.whiteBright("Order") + " Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance + "\n");
    log(explanation("The " + chalk.whiteBright("Order") + " contract now has the payment from the " + chalk.greenBright("buyer") + ".\n"));

  });
});

describe("Order", function() {
  it("Buyer should be able to cancel order", async function() {
    log(explanation("\nIf the " + chalk.yellowBright("seller") + " has not accepted the order yet, the " + chalk.greenBright("buyer") + " can cancel and automatically get their money back.\n"));

    const [updater, buyer, seller, affiliate, arbitrator, trustedForwarder] = await ethers.getSigners();
    const provider = ethers.getDefaultProvider();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    affiliateAddress = await affiliate.getAddress();
    arbitratorAddress = await arbitrator.getAddress();
    updaterAddress = await updater.getAddress();
    trustedForwarderAddress = await trustedForwarder.getAddress();
    const Dai = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaToken = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaControllerFactory = new ethers.ContractFactory(
      OyaController.abi,
      OyaController.bytecode,
      updater
    );

    const daiToken = await Dai.deploy("Dai", "DAI");
    await daiToken.deployed();

    await daiToken.mint(buyerAddress, 100);
    let buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const oyaToken = await OyaToken.deploy("Oya", "OYA");
    await oyaToken.deployed();

    const controller = await OyaControllerFactory.deploy(updaterAddress);
    await controller.deployed();
    await controller.connect(updater).setToken(oyaToken.address);
    await controller.connect(updater).setArbitrator(arbitratorAddress);
    await controller.connect(updater).setRewardAmount(10);
    await controller.connect(updater).setTrustedForwarder(trustedForwarderAddress);

    await oyaToken.connect(updater).grantRole(
      ethers.utils.id("MINTER_ROLE"),
      controller.address
    );

    await daiToken.connect(buyer).approve(controller.address, 100);

    let orderAddress;

    let productHashes = [
      'QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t',
      'QmT4AeWE9Q9EaoyLJiqaZuYQ8mJeq4ZBncjjFH9dQ9uDVA'
    ];

    let tx = await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      affiliateAddress,
      daiToken.address,
      100,
      10,
      productHashes
    );

    controller.on("OrderCreated", (newOrder, event) => {
      orderAddress = newOrder;
      event.removeListener();
    });

    await tx.wait(1);

    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await daiToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    log(explanation("The " + chalk.greenBright("buyer") + " orders and the " + chalk.whiteBright("Order") + " contract now has the payment.\n"));
    log(chalk.greenBright("Buyer") + " Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance + "\n");


    const order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(buyer).cancelOrder();
    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);
    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(0);

    log(explanation("The " + chalk.greenBright("buyer") + " cancels the order and gets their money back.\n"));
    log(chalk.greenBright("Buyer") + " Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance + "\n");


    let sellerBalance = await daiToken.balanceOf(sellerAddress);
  });

  it("Seller should be able to cancel order", async function() {
    log(explanation("\nIf the " + chalk.yellowBright("seller") + " realizes they can not fulfill the order, they can cancel it and the " + chalk.greenBright("buyer") + " will automatically get their money back.\n"));

    const [updater, buyer, seller, affiliate, arbitrator, trustedForwarder] = await ethers.getSigners();
    const provider = ethers.getDefaultProvider();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    affiliateAddress = await affiliate.getAddress();
    arbitratorAddress = await arbitrator.getAddress();
    updaterAddress = await updater.getAddress();
    trustedForwarderAddress = await trustedForwarder.getAddress();
    const Dai = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaToken = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaControllerFactory = new ethers.ContractFactory(
      OyaController.abi,
      OyaController.bytecode,
      updater
    );

    const daiToken = await Dai.deploy("Dai", "DAI");
    await daiToken.deployed();

    await daiToken.mint(buyerAddress, 100);
    let buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const oyaToken = await OyaToken.deploy("Oya", "OYA");
    await oyaToken.deployed();

    const controller = await OyaControllerFactory.deploy(updaterAddress);
    await controller.deployed();
    await controller.connect(updater).setToken(oyaToken.address);
    await controller.connect(updater).setArbitrator(arbitratorAddress);
    await controller.connect(updater).setRewardAmount(10);
    await controller.connect(updater).setTrustedForwarder(trustedForwarderAddress);

    await oyaToken.connect(updater).grantRole(
      ethers.utils.id("MINTER_ROLE"),
      controller.address
    );

    await daiToken.connect(buyer).approve(controller.address, 100);

    let orderAddress;

    let productHashes = [
      'QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t',
      'QmT4AeWE9Q9EaoyLJiqaZuYQ8mJeq4ZBncjjFH9dQ9uDVA'
    ];

    let tx = await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      affiliateAddress,
      daiToken.address,
      100,
      10,
      productHashes
    );

    controller.on("OrderCreated", (newOrder, event) => {
      orderAddress = newOrder;
      event.removeListener();
    });

    await tx.wait(1);

    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await daiToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    log(explanation("The " + chalk.greenBright("buyer") + " orders and the " + chalk.whiteBright("Order") + " contract now has the payment.\n"));
    log(chalk.greenBright("Buyer") + " Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance + "\n");


    const order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(seller).cancelOrder();
    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);
    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(0);

    log(explanation("The " + chalk.yellowBright("seller") + " cancels the order and the " + chalk.greenBright("buyer") + " gets their money back.\n"));
    log(chalk.greenBright("Buyer") + " Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance + "\n");


    let sellerBalance = await daiToken.balanceOf(sellerAddress);
  });

  it("Seller should be able to get paid if buyer accepts item", async function() {
    log(explanation("\nIn most cases, the " + chalk.greenBright("buyer") + " will mark an item as accepted, to earn " + chalk.whiteBright("Oya Token") + " rewards. This also automatically pays the " + chalk.yellowBright("seller") + ".\n"));

    const [updater, buyer, seller, affiliate, arbitrator, trustedForwarder] = await ethers.getSigners();
    const provider = ethers.getDefaultProvider();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    affiliateAddress = await affiliate.getAddress();
    arbitratorAddress = await arbitrator.getAddress();
    updaterAddress = await updater.getAddress();
    trustedForwarderAddress = await trustedForwarder.getAddress();
    const Dai = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaToken = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaControllerFactory = new ethers.ContractFactory(
      OyaController.abi,
      OyaController.bytecode,
      updater
    );

    const daiToken = await Dai.deploy("Dai", "DAI");
    await daiToken.deployed();

    await daiToken.mint(buyerAddress, 100);
    let buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const oyaToken = await OyaToken.deploy("Oya", "OYA");
    await oyaToken.deployed();

    const controller = await OyaControllerFactory.deploy(updaterAddress);
    await controller.deployed();
    await controller.connect(updater).setToken(oyaToken.address);
    await controller.connect(updater).setArbitrator(arbitratorAddress);
    await controller.connect(updater).setRewardAmount(10);
    await controller.connect(updater).setTrustedForwarder(trustedForwarderAddress);

    await oyaToken.connect(updater).grantRole(
      ethers.utils.id("MINTER_ROLE"),
      controller.address
    );

    await daiToken.connect(buyer).approve(controller.address, 100);

    let orderAddress;

    let productHashes = [
      'QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t',
      'QmT4AeWE9Q9EaoyLJiqaZuYQ8mJeq4ZBncjjFH9dQ9uDVA'
    ];

    let tx = await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      affiliateAddress,
      daiToken.address,
      100,
      10,
      productHashes
    );

    controller.on("OrderCreated", (newOrder, event) => {
      orderAddress = newOrder;
      event.removeListener();
    });

    await tx.wait(1);

    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await daiToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    log(explanation("The " + chalk.greenBright("buyer") + " orders and the " + chalk.whiteBright("Order") + " contract now has the payment.\n"));
    log(chalk.greenBright("Buyer") + " Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance + "\n");


    const order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(buyer).acceptDelivery();

    let sellerBalance = await daiToken.balanceOf(sellerAddress);
    expect(sellerBalance).to.equal(90);
    let affiliateBalance = await daiToken.balanceOf(affiliateAddress);
    expect(affiliateBalance).to.equal(10);
    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(0);

    log(explanation("The " + chalk.greenBright("buyer") + " marks the item as accepted after delivery, and the " + chalk.yellowBright("seller") + " automatically gets paid.\n"));
    log(chalk.greenBright("Buyer") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance);
    log(chalk.whiteBright("Seller") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + sellerBalance + "\n");


    let sellerRewards = await oyaToken.balanceOf(sellerAddress);
    expect(sellerRewards).to.equal(10);
    let buyerRewards = await oyaToken.balanceOf(buyerAddress);
    expect(buyerRewards).to.equal(10);

    log(explanation("The " + chalk.greenBright("buyer") + " and the " + chalk.yellowBright("seller") + " automatically get " + chalk.whiteBright("Oya Token") + " rewards, ERC-20 tokens which give them greater voting power over protocol changes.\n"));
    log(explanation("Seller Oya Token Balance: " + chalk.hex('#FF69B4')('ⓨ ') + sellerRewards));
    log(explanation("Buyer Oya Token Balance: " + chalk.hex('#FF69B4')('ⓨ ') + buyerRewards + "\n"));

  });

  it("Buyer should be able to get paid if arbitrator rules in their favor", async function() {
    log(explanation("\nIf the " + chalk.greenBright("buyer") + " raises a dispute, the " + chalk.redBright("arbitrator") + " reviews the case and chooses to pay either the " + chalk.greenBright("buyer") + " or the " + chalk.yellowBright("seller") + ".\n"));

    const [updater, buyer, seller, affiliate, arbitrator, trustedForwarder] = await ethers.getSigners();
    const provider = ethers.getDefaultProvider();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    affiliateAddress = await affiliate.getAddress();
    arbitratorAddress = await arbitrator.getAddress();
    updaterAddress = await updater.getAddress();
    trustedForwarderAddress = await trustedForwarder.getAddress();
    const Dai = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaToken = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaControllerFactory = new ethers.ContractFactory(
      OyaController.abi,
      OyaController.bytecode,
      updater
    );

    const daiToken = await Dai.deploy("Dai", "DAI");
    await daiToken.deployed();

    await daiToken.mint(buyerAddress, 100);
    let buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const oyaToken = await OyaToken.deploy("Oya", "OYA");
    await oyaToken.deployed();

    const controller = await OyaControllerFactory.deploy(updaterAddress);
    await controller.deployed();
    await controller.connect(updater).setToken(oyaToken.address);
    await controller.connect(updater).setArbitrator(arbitratorAddress);
    await controller.connect(updater).setRewardAmount(10);
    await controller.connect(updater).setTrustedForwarder(trustedForwarderAddress);

    await oyaToken.connect(updater).grantRole(
      ethers.utils.id("MINTER_ROLE"),
      controller.address
    );

    await daiToken.connect(buyer).approve(controller.address, 100);

    let orderAddress;

    let productHashes = [
      'QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t',
      'QmT4AeWE9Q9EaoyLJiqaZuYQ8mJeq4ZBncjjFH9dQ9uDVA'
    ];

    let tx = await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      affiliateAddress,
      daiToken.address,
      100,
      10,
      productHashes
    );

    controller.on("OrderCreated", (newOrder, event) => {
      orderAddress = newOrder;
      event.removeListener();
    });

    await tx.wait(1);

    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await daiToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    let sellerBalance = await daiToken.balanceOf(sellerAddress);
    expect(controllerBalance).to.equal(0);

    log(explanation("The " + chalk.greenBright("buyer") + " orders and the " + chalk.whiteBright("Order") + " contract now has the payment.\n"));
    log(chalk.greenBright("Buyer") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance);
    log(chalk.yellowBright("Seller") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + sellerBalance + "\n");


    const order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(seller).acceptOrder();
    await order.connect(buyer).demandRefund();
    await order.connect(arbitrator).settleDispute(buyerAddress);

    sellerBalance = await daiToken.balanceOf(sellerAddress);
    expect(sellerBalance).to.equal(0);
    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);
    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(0);

    log(explanation("The " + chalk.redBright("arbitrator") + " rules in favor of the " + chalk.greenBright("buyer") + ", who gets their money back.\n"));
    log(chalk.greenBright("Buyer") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance);
    log(chalk.yellowBright("Seller") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + sellerBalance + "\n");

  });

  it("Seller should be able to get paid if arbitrator rules in their favor", async function() {
    const [updater, buyer, seller, affiliate, arbitrator, trustedForwarder] = await ethers.getSigners();
    const provider = ethers.getDefaultProvider();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    affiliateAddress = await affiliate.getAddress();
    arbitratorAddress = await arbitrator.getAddress();
    updaterAddress = await updater.getAddress();
    trustedForwarderAddress = await trustedForwarder.getAddress();
    const Dai = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaToken = new ethers.ContractFactory(
      Token.abi,
      Token.bytecode,
      updater
    );
    const OyaControllerFactory = new ethers.ContractFactory(
      OyaController.abi,
      OyaController.bytecode,
      updater
    );

    const daiToken = await Dai.deploy("Dai", "DAI");
    await daiToken.deployed();

    await daiToken.mint(buyerAddress, 100);
    let buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const oyaToken = await OyaToken.deploy("Oya", "OYA");
    await oyaToken.deployed();

    const controller = await OyaControllerFactory.deploy(updaterAddress);
    await controller.deployed();
    await controller.connect(updater).setToken(oyaToken.address);
    await controller.connect(updater).setArbitrator(arbitratorAddress);
    await controller.connect(updater).setRewardAmount(10);
    await controller.connect(updater).setTrustedForwarder(trustedForwarderAddress);

    await oyaToken.connect(updater).grantRole(
      ethers.utils.id("MINTER_ROLE"),
      controller.address
    );

    await daiToken.connect(buyer).approve(controller.address, 100);

    let orderAddress;

    let productHashes = [
      'QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t',
      'QmT4AeWE9Q9EaoyLJiqaZuYQ8mJeq4ZBncjjFH9dQ9uDVA'
    ];

    let tx = await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      affiliateAddress,
      daiToken.address,
      100,
      10,
      productHashes
    );

    controller.on("OrderCreated", (newOrder, event) => {
      orderAddress = newOrder;
      event.removeListener();
    });

    await tx.wait(1);

    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await daiToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    let sellerBalance = await daiToken.balanceOf(sellerAddress);
    expect(controllerBalance).to.equal(0);

    log(explanation("The " + chalk.greenBright("buyer") + " orders and the " + chalk.whiteBright("Order") + " contract now has the payment.\n"));
    log(chalk.greenBright("Buyer") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance);
    log(chalk.yellowBright("Seller") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + sellerBalance + "\n");


    const order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(seller).acceptOrder();
    await order.connect(buyer).demandRefund();
    await order.connect(arbitrator).settleDispute(sellerAddress);

    sellerBalance = await daiToken.balanceOf(sellerAddress);
    expect(sellerBalance).to.equal(100);
    buyerBalance = await daiToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);
    orderBalance = await daiToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(0);

    log(explanation("The " + chalk.redBright("arbitrator") + " rules in favor of the " + chalk.yellowBright("seller") + ", who receives payment for the item.\n"));
    log(chalk.greenBright("Buyer") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + buyerBalance);
    log(chalk.whiteBright("Order") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + orderBalance);
    log(chalk.yellowBright("Seller") + " Dai Balance: " + chalk.hex('#F4B731')("Đ") + sellerBalance + "\n");


    log(explanation("\nThe " + chalk.whiteBright("Oya Token") + " holders can use the " + chalk.whiteBright("Updater") + " to vote to fire the " + chalk.redBright("arbitrator") + " and replace them with a new one if they aren't happy with their performance or decisionmaking.\n"));


    log(explanation("\nThis is a simple change of the " + chalk.redBright("arbitrator") + " address in the " + chalk.whiteBright("Controller") + ".\n"));

  });
});



/* Chainlink tests */

// it("Seller should be able to set tracking information", async function() {
//   log(explanation("\nIf the order looks good, the " + chalk.yellowBright("seller") + " can accept the order to lock it and set tracking information."));
//
//   const [updater, buyer, seller, affiliate, arbitrator, trustedForwarder] = await ethers.getSigners();
//   const provider = ethers.getDefaultProvider();
//   buyerAddress = await buyer.getAddress();
//   sellerAddress = await seller.getAddress();
//   affiliateAddress = await affiliate.getAddress();
//   arbitratorAddress = await arbitrator.getAddress();
//   updaterAddress = await updater.getAddress();
//   const Dai = new ethers.ContractFactory(
//     Token.abi,
//     Token.bytecode,
//     updater
//   );
//   const LinkToken = new ethers.ContractFactory(
//     Token.abi,
//     Token.bytecode,
//     updater
//   );
//   const OyaToken = new ethers.ContractFactory(
//     Token.abi,
//     Token.bytecode,
//     updater
//   );
//   const OyaControllerFactory = new ethers.ContractFactory(
//     OyaController.abi,
//     OyaController.bytecode,
//     updater
//   );
//
//   const daiToken = await Dai.deploy("Dai", "DAI");
//   await daiToken.deployed();
//
//   await daiToken.mint(buyerAddress, 100);
//   let buyerBalance = await daiToken.balanceOf(buyerAddress);
//   expect(buyerBalance).to.equal(100);
//
//   const linkToken = await LinkToken.deploy("Link", "LINK");
//   await linkToken.deployed();
//
//   const oyaToken = await OyaToken.deploy("Oya", "OYA");
//   await oyaToken.deployed();
//
//   const controller = await OyaControllerFactory.deploy(updaterAddress);
//   await controller.deployed();
//   await controller.connect(updater).setToken(oyaToken.address);
//   await controller.connect(updater).setArbitrator(arbitratorAddress);
//   await controller.connect(updater).setRewardAmount(10);
//
//   await oyaToken.connect(updater).grantRole(
//     ethers.utils.id("MINTER_ROLE"),
//     controller.address
//   );
//
//   await daiToken.connect(buyer).approve(controller.address, 100);
//
//   let orderAddress;
//
//   let tx = await controller.connect(buyer).createOrder(
//     buyerAddress,
//     sellerAddress,
//     daiToken.address,
//     100,
//     linkToken.address
//   );
//
//   controller.on("OrderCreated", (newOrder, event) => {
//     orderAddress = newOrder;
//
//     event.removeListener();
//   });
//
//   await tx.wait(1);
//
//   buyerBalance = await daiToken.balanceOf(buyerAddress);
//   expect(buyerBalance).to.equal(0);
//
//   controllerBalance = await daiToken.balanceOf(controller.address);
//   expect(controllerBalance).to.equal(0);
//
//   orderBalance = await daiToken.balanceOf(orderAddress);
//   expect(orderBalance).to.equal(100);
//
//   const order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);
//
//   const shippingProvider = ethers.utils.formatBytes32String("USPS");
//   const trackingNumber = ethers.utils.formatBytes32String("954901983837217");
//
//   log(explanation("\nThe " + chalk.yellowBright("seller") + " calls " + chalk.magentaBright("setTracking") + " with the shipping provider and tracking number."));
//   log(chalk`
//     {magentaBright bytes32 shippingProvider}: ${shippingProvider}
//     {magentaBright bytes32 trackingNumber}: ${trackingNumber}
//   `);
//
//
//   await order.connect(seller).setTracking(
//     ethers.utils.formatBytes32String("USPS"),
//     ethers.utils.formatBytes32String("954901983837217")
//   );
//
//   log(explanation("These details are stored in " + chalk.whiteBright("Order") + " and can be used to confirm delivery with an " + chalk.whiteBright("Chainlink") + " integration with the " + chalk.whiteBright("EasyPost") + " API."));
//
//   log(explanation("\nIf the " + chalk.greenBright("buyer") + " doesn't explicitly mark the delivery as accepted, after a wait period for buyer returns, the " + chalk.yellowBright("seller") + " can confirm delivery with " + chalk.whiteBright("Chainlink") + " and automatically claim the payment.\n"));
//
//
//   const trackingInfo = await order.connect(buyer).getTracking();
//   expect(ethers.utils.parseBytes32String(trackingInfo[0])).to.equal("USPS");
//   expect(ethers.utils.parseBytes32String(trackingInfo[1])).to.equal("954901983837217");
//
//   log(explanation("\nNote: The wait period right now is 15 days, so we can't do a practical demo. You can see the code on GitHub!\n"));
//
// });
