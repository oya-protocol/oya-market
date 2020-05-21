pragma solidity >=0.6.0 <0.7.0;

import './OyaOrder.sol';
import "@nomiclabs/buidler/console.sol";

contract OyaController {

  struct Order {
    address seller;
    address buyer;
  }

  mapping (address => Order) orders;

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

    orders[address(newOrder)] = Order(_seller, _buyer);

    console.log(address(newOrder));
  }

}
