pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO:
// * Remove unused boilerplate (DONE)
// * Payments in ERC20 tokens (DONE)
// * Accept constructor parameters from PurchaseFactory contract (DONE)
// * Only require the payment for the item to be sent by buyer (DONE)
// * Escrow the payments from buyer (DONE)
// * Track shipment via Chainlink EasyPost integration
// * Calculate block to automatically unlock payment based on date of delivery
// * Add self-destruct function that gives gas refund and emits event

contract Order {
  address payable public seller;
  address payable public buyer;
  IERC20 public paymentToken;
  uint256 public balance;

  enum State { Created, Refunded, Accepted, Paid }
  // The state variable has a default value of the first member, `State.created`
  State public state;

  modifier condition(bool _condition) {
    require(_condition);
    _;
  }

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

  modifier inState(State _state) {
    require(
        state == _state,
        "Invalid state."
    );
    _;
  }

  event OrderCreated();
  event OrderRefunded();
  event ItemAccepted();
  event SellerPaid();

  constructor(
    address payable _seller,
    address payable _buyer,
    IERC20 _paymentToken,
    uint256 _paymentAmount
  ) public payable {
    seller = _seller;
    buyer = _buyer;
    paymentToken = _paymentToken;
    paymentToken.transferFrom(_buyer, address(this), _paymentAmount);
    balance = _paymentAmount;
    emit OrderCreated();
  }

  /// Confirm that you (the buyer) received the item.
  /// This will release the locked payment.
  function demandRefund()
    public
    onlyBuyer
    inState(State.Created)
  {
    emit OrderRefunded();
    state = State.Refunded;
    paymentToken.transferFrom(address(this), buyer, balance);
  }

  /// Confirm that you (the buyer) received the item.
  /// This will release the locked payment.
  function confirmReceived()
    public
    onlyBuyer
    inState(State.Created)
  {
    emit ItemAccepted();
    state = State.Accepted;
  }

  /// This function pays the seller
  function paySeller()
    public
    onlySeller
    inState(State.Accepted)
  {
    emit SellerPaid();
    state = State.Paid;
    paymentToken.transferFrom(address(this), seller, balance);
  }
}
