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
  address payable arbitrator;
  uint256 rewardAmount;

  event OrderCreated(address);

  function createOrder(
    address payable _buyer,
    address payable _seller,
    IERC20 _paymentToken,
    uint256 _paymentAmount,
    address _link
  )
    public
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
  function setToken(address tokenAddress) public {
    oyaToken = Token(tokenAddress);
  }

  function setArbitrator(address payable _arbitrator) public {
    arbitrator = _arbitrator;
  }

  function setRewardAmount(uint256 _rewardAmount) public {
    rewardAmount = _rewardAmount;
  }

  // order management functions
  function reward(address recipient) public {
    require (orders[msg.sender].exists == true);
    oyaToken.mint(recipient, rewardAmount);
  }

  function clearOrder() public {
    require (orders[msg.sender].exists == true);
    delete(orders[msg.sender]);
  }
}
