pragma solidity >=0.6.0 <0.7.0;

import './OyaOrder.sol';

contract OyaController {
  mapping (address => address[]) sellerOrders;
  mapping (address => address[]) buyerOrders;

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
    returns (address newOrder)
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

    sellerOrders[_seller].push(address(newOrder));
    buyerOrders[_buyer].push(address(newOrder));

    emit OrderCreated(address(newOrder));

    return address(newOrder);
  }

  function getBuyerOrders(address user) public view returns (address[] memory) {
    return buyerOrders[user];
  }

  function getSellerOrders(address user) public view returns (address[] memory) {
    return sellerOrders[user];
  }
}
