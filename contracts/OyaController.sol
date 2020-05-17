pragma solidity >=0.6.0 <0.7.0;

import './OyaOrder.sol';

contract OyaController {
  OyaOrder[] public orders;

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
    returns (OyaOrder newOrder)
  {
    require (msg.sender == _buyer);
    newOrder = new OyaOrder(
      _buyer,
      _seller,
      _paymentToken,
      _paymentAmount,
      _link
    );

    _paymentToken.transferFrom(msg.sender, address(newOrder), _paymentAmount);

    orders.push(newOrder);

    emit OrderCreated(address(newOrder));

    return newOrder;
  }
}
