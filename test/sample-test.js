const { expect } = require("chai");

describe("Greeter", function() {
  it("Should return the new greeting once it's changed", async function() {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");

    await greeter.deployed();
    expect(await greeter.greet()).to.equal("Hello, world!");

    await greeter.setGreeting("Hola, mundo!");
    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});

describe("Order", function() {
  it("Buyer should be able to get refund", async function() {
    const [buyer, seller] = await ethers.getSigners();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    const TestToken = await ethers.getContractFactory("Token");
    const LinkToken = await ethers.getContractFactory("Token");
    const Order = await ethers.getContractFactory("Order");
    const testToken = await TestToken.deploy("Test", "TEST");
    console.log(testToken.address);
    await testToken.mint(buyerAddress, 100);
    const linkToken = await LinkToken.deploy("Link", "LINK");
    console.log(linkToken.address);
    // TODO: Deploy Order using create2 to pre-transfer tokens to smart contract
    const order = await Order.deploy(
      buyerAddress,
      sellerAddress,
      testToken.address,
      100,
      linkToken.address
    );
    console.log(order.address);
    await testToken.connect(buyer).transfer(order.address, 100);
    let buyerBalance = await testToken.balanceOf(buyerAddress);
    console.log(buyerBalance.toString());
    await order.connect(buyer).demandRefund();
    buyerBalance = await testToken.balanceOf(buyerAddress);
    console.log(buyerBalance.toString());
  });

  it("Seller should be able to get paid", async function() {
    const [buyer, seller] = await ethers.getSigners();
    buyerAddress = await buyer.getAddress();
    sellerAddress = await seller.getAddress();
    const TestToken = await ethers.getContractFactory("Token");
    const LinkToken = await ethers.getContractFactory("Token");
    const Order = await ethers.getContractFactory("Order");
    const testToken = await TestToken.deploy("Test", "TEST");
    console.log(testToken.address);
    await testToken.mint(buyerAddress, 100);
    const linkToken = await LinkToken.deploy("Link", "LINK");
    console.log(linkToken.address);
    // TODO: Deploy Order using create2 to pre-transfer tokens to smart contract
    const order = await Order.deploy(
      buyerAddress,
      sellerAddress,
      testToken.address,
      100,
      linkToken.address
    );
    console.log(order.address);
    await testToken.connect(buyer).transfer(order.address, 100);
    let buyerBalance = await testToken.balanceOf(buyerAddress);
    console.log(buyerBalance.toString());
    await order.connect(buyer).acceptItem();
    let sellerBalance = await testToken.balanceOf(sellerAddress);
    console.log(sellerBalance.toString());
  });
});
