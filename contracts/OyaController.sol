pragma solidity >=0.6.0 <0.7.0;

import './OyaOrder.sol';
import './Token.sol';
import "@nomiclabs/buidler/console.sol";

contract OyaController {

  struct Order {
    bool exists;
    address seller;
    address buyer;
    address arbitrator;
  }

  mapping (address => Order) orders;

  Token oyaToken;
  address updater;
  address payable arbitrator;
  uint256 rewardAmount;

  event OrderCreated(address);

  modifier onlyUpdater() {
    require(
        msg.sender == updater,
        "Only buyer can call this."
    );
    _;
  }

  constructor(
    address _updater
  ) public {
    updater = _updater;
  }

  function createOrder(
    address payable _buyer,
    address payable _seller,
    IERC20 _paymentToken,
    uint256 _paymentAmount,
    address _link
  )
    external
    payable
  {
    require (msg.sender == _buyer);
    OyaOrder newOrder = new OyaOrder(
      _buyer,
      _seller,
      arbitrator,
      _paymentToken,
      _paymentAmount,
      _link
    );

    _paymentToken.transferFrom(msg.sender, address(newOrder), _paymentAmount);

    emit OrderCreated(address(newOrder));

    orders[address(newOrder)] = Order(true, _seller, _buyer, arbitrator);
  }


  // upgrade functions -- will be controlled by Updater
  function setToken(address tokenAddress) onlyUpdater external {
    oyaToken = Token(tokenAddress);
  }

  function setUpdater(address payable _updater) onlyUpdater external {
    updater = _updater;
  }

  function setArbitrator(address payable _arbitrator) onlyUpdater external {
    arbitrator = _arbitrator;
  }

  function setRewardAmount(uint256 _rewardAmount) onlyUpdater external {
    rewardAmount = _rewardAmount;
  }

  // order management functions
  function reward(address recipient) external {
    require (orders[msg.sender].exists == true);
    oyaToken.mint(recipient, rewardAmount);
  }

  function clearOrder() external {
    require (orders[msg.sender].exists == true);
    delete(orders[msg.sender]);
  }
}
