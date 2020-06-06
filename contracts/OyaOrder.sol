pragma solidity >=0.6.0 <0.7.0;

import './OyaController.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@nomiclabs/buidler/console.sol";

// TODO:
// * Remove unused boilerplate (DONE)
// * Payments in ERC20 tokens (DONE)
// * Accept constructor parameters from PurchaseFactory contract (DONE)
// * Only require the payment for the item to be sent by buyer (DONE)
// * Escrow the payments from buyer (DONE)
// * Add self-destruct function that gives gas refund (DONE)
// * Function for seller to set tracking details (DONE)
// * Function for buyer to reclaim funds if tracking details not set in time (DONE)
// * Track shipment via Chainlink EasyPost integration (DONE)
// * Function for seller to claim funds if item was confirmed delivered and wait time has passed (DONE)

contract OyaOrder {
  address payable public seller;
  address payable public buyer;
  address payable public arbitrator;
  IERC20 public paymentToken;
  uint256 public balance;
  OyaController public controller;

  enum State { Created, Locked, Dispute }
  // The state variable has a default value of the first member, `State.created`
  State public state;

  modifier onlyBuyer() {
    require(
        msg.sender == buyer,
        "Only buyer can call this."
    );
    _;
  }

  modifier onlySeller() {
    require(
        msg.sender == seller,
        "Only seller can call this."
    );
    _;
  }

  modifier onlyArbitrator() {
    require(
        msg.sender == arbitrator,
        "Only arbitrator can call this."
    );
    _;
  }

  modifier inState(State _state) {
    require(
        state == _state,
        "Invalid state."
    );
    _;
  }

  event BuyerRefunded();
  event SellerPaid();

  constructor(
    address payable _buyer,
    address payable _seller,
    address payable _arbitrator,
    IERC20 _paymentToken,
    uint256 _paymentAmount
  ) public payable {
    buyer = _buyer;
    seller = _seller;
    arbitrator = _arbitrator;
    paymentToken = _paymentToken;
    balance = _paymentAmount;
    controller = OyaController(msg.sender);
  }

  function cancelOrder()
    external
    inState(State.Created)
  {
    require(msg.sender == buyer || msg.sender == seller);
    _refundBuyer();
  }

  // Dispute cases that require an arbitrator
  function demandRefund()
    external
    onlyBuyer
    inState(State.Locked)
  {
    state = State.Dispute;
  }

  function settleDispute(address _user)
    external
    onlyArbitrator
    inState(State.Dispute)
  {
    require (
      _user == buyer || _user == seller,
      "Revert: can only send funds to buyer or seller"
    );
    if (_user == buyer) {
      _refundBuyer();
    } else if (_user == seller) {
      _paySeller();
    }
  }

  // Lock order before shipping
  function acceptOrder() public onlySeller inState(State.Created) {
    state = State.Locked;
  }

  /// Confirm that you (the buyer) received and accept the item.
  /// This will unlock the payment.
  function acceptItem()
    external
    onlyBuyer
  {
    _reward(buyer);
    _paySeller();
  }

  /// This internal function pays the seller.
  function _paySeller()
    internal
  {
    emit SellerPaid();
    paymentToken.transfer(seller, balance);
    _reward(seller);
    controller.clearOrder();
    selfdestruct(seller);
  }

  function _refundBuyer()
    internal
  {
    emit BuyerRefunded();
    paymentToken.transfer(buyer, balance);
    controller.clearOrder();
    selfdestruct(buyer);
  }

  function _reward(address recipient)
    internal
  {
    controller.reward(recipient);
  }
}
