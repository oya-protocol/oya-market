pragma solidity >=0.6.0 <0.7.0;

import './OyaOrder.sol';
import './Token.sol';
import "@nomiclabs/buidler/console.sol";

contract OyaController {

  struct Order {
    bool exists;
    address seller;
    address buyer;
  }

  mapping (address => Order) orders;

  Token oyaToken;
  uint256 rewardAmount = 10;

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
      _paymentToken,
      _paymentAmount,
      _link
    );

    _paymentToken.transferFrom(msg.sender, address(newOrder), _paymentAmount);

    emit OrderCreated(address(newOrder));

    orders[address(newOrder)] = Order(true, _seller, _buyer);
  }

  function setToken(address tokenAddress) public {
    oyaToken = Token(tokenAddress);
  }

  function reward(address recipient) public {
    require (orders[msg.sender].exists == true);
    oyaToken.mint(recipient, rewardAmount);
  }

  function clearOrder() public {
    require (orders[msg.sender].exists == true);
    delete(orders[msg.sender]);
  }
}
