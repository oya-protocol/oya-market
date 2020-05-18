const { expect } = require("chai");
const OyaOrder = require('../artifacts/OyaOrder');

describe("Controller", function() {
  it("Controller should be able to deploy order contract", async function() {
    const [buyer, seller] = await ethers.getSigners();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    const TestToken = await ethers.getContractFactory("Token");
    const LinkToken = await ethers.getContractFactory("Token");
    const OyaController = await ethers.getContractFactory("OyaController");

    const testToken = await TestToken.deploy("Test", "TEST");

    await testToken.mint(buyerAddress, 100);
    let buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const linkToken = await LinkToken.deploy("Link", "LINK");

    const controller = await OyaController.deploy();

    await testToken.connect(buyer).approve(controller.address, 100);

    const order = await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      testToken.address,
      100,
      linkToken.address
    );

    buyerOrders = await controller.getBuyerOrders(buyerAddress);
    orderAddress = buyerOrders[0];
    console.log("Order contract address:", orderAddress);

    buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);
    console.log("Buyer balance:", buyerBalance.toString());

    controllerBalance = await testToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);
    console.log("Controller balance:", controllerBalance.toString());

    orderBalance = await testToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);
    console.log("Order balance:", orderBalance.toString());
  });
});

describe("Order", function() {
  it("Seller should be able to set tracking information", async function() {
    const [buyer, seller] = await ethers.getSigners();
    const provider = waffle.provider;
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    const TestToken = await ethers.getContractFactory("Token");
    const LinkToken = await ethers.getContractFactory("Token");
    const OyaController = await ethers.getContractFactory("OyaController");

    const testToken = await TestToken.deploy("Test", "TEST");

    await testToken.mint(buyerAddress, 100);
    let buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const linkToken = await LinkToken.deploy("Link", "LINK");

    const controller = await OyaController.deploy();

    await testToken.connect(buyer).approve(controller.address, 100);

    await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      testToken.address,
      100,
      linkToken.address
    );

    buyerOrders = await controller.getBuyerOrders(buyerAddress);
    orderAddress = buyerOrders[0];

    buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await testToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await testToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    let order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(seller).setTracking(
      ethers.utils.formatBytes32String("USPS"),
      ethers.utils.formatBytes32String("954901983837217")
    );
    let trackingInfo = await order.getTracking();
    expect(ethers.utils.parseBytes32String(trackingInfo[0])).to.equal("USPS");
    expect(ethers.utils.parseBytes32String(trackingInfo[1])).to.equal("954901983837217");

    let sellerBalance = await testToken.balanceOf(sellerAddress);
    console.log("Buyer balance:", buyerBalance.toString());
    console.log("Seller balance:", sellerBalance.toString());
    console.log("Order balance:", orderBalance.toString());
  });

  it("Buyer should be able to get refund", async function() {
    const [buyer, seller] = await ethers.getSigners();
    const provider = waffle.provider;
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    const TestToken = await ethers.getContractFactory("Token");
    const LinkToken = await ethers.getContractFactory("Token");
    const OyaController = await ethers.getContractFactory("OyaController");

    const testToken = await TestToken.deploy("Test", "TEST");

    await testToken.mint(buyerAddress, 100);
    let buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const linkToken = await LinkToken.deploy("Link", "LINK");

    const controller = await OyaController.deploy();

    await testToken.connect(buyer).approve(controller.address, 100);

    await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      testToken.address,
      100,
      linkToken.address
    );

    buyerOrders = await controller.getBuyerOrders(buyerAddress);
    orderAddress = buyerOrders[0];

    buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await testToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await testToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    let order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(buyer).demandRefund();
    buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);
    orderBalance = await testToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(0);

    let sellerBalance = await testToken.balanceOf(sellerAddress);
    console.log("Buyer balance:", buyerBalance.toString());
    console.log("Seller balance:", sellerBalance.toString());
    console.log("Order balance:", orderBalance.toString());
  });

  it("Seller should be able to get paid if buyer accepts item", async function() {
    const [buyer, seller] = await ethers.getSigners();
    const provider = waffle.provider;
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    const TestToken = await ethers.getContractFactory("Token");
    const LinkToken = await ethers.getContractFactory("Token");
    const OyaController = await ethers.getContractFactory("OyaController");

    const testToken = await TestToken.deploy("Test", "TEST");

    await testToken.mint(buyerAddress, 100);
    let buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(100);

    const linkToken = await LinkToken.deploy("Link", "LINK");

    const controller = await OyaController.deploy();

    await testToken.connect(buyer).approve(controller.address, 100);

    await controller.connect(buyer).createOrder(
      buyerAddress,
      sellerAddress,
      testToken.address,
      100,
      linkToken.address
    );

    buyerOrders = await controller.getBuyerOrders(buyerAddress);
    orderAddress = buyerOrders[0];

    buyerBalance = await testToken.balanceOf(buyerAddress);
    expect(buyerBalance).to.equal(0);

    controllerBalance = await testToken.balanceOf(controller.address);
    expect(controllerBalance).to.equal(0);

    orderBalance = await testToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(100);

    let order = new ethers.Contract(orderAddress, OyaOrder.abi, provider);

    await order.connect(buyer).acceptItem();
    let sellerBalance = await testToken.balanceOf(sellerAddress);
    expect(sellerBalance).to.equal(100);
    orderBalance = await testToken.balanceOf(orderAddress);
    expect(orderBalance).to.equal(0);

    console.log("Buyer balance:", buyerBalance.toString());
    console.log("Seller balance:", sellerBalance.toString());
    console.log("Order balance:", orderBalance.toString());
  });
});
