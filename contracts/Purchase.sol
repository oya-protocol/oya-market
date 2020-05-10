pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO:
// * Remove unused boilerplate (DONE)
// * Payments in Dai
// * Track shipment via Chainlink EasyPost integration
// * Calculate block to automatically unlock payment based on date of delivery
// * Only require the payment for the item to be sent by buyer
// * Add self-destruct function that gives gas refund and emits event
// * Accept constructor parameters from PurchaseFactory contract

contract Purchase {
  address payable public seller;
  address payable public buyer;
  IERC20 public paymentToken;

  enum State { Created, Released, Inactive }
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

  event ItemReceived();
  event SellerPaid();

  constructor(address payable _seller, address payable _buyer, IERC20 _paymentToken) public payable {
    seller = _seller;
    buyer = _buyer;
    paymentToken = _paymentToken;
  }

  /// Confirm that you (the buyer) received the item.
  /// This will release the locked payment.
  function confirmReceived()
    public
    onlyBuyer
    inState(State.Created)
  {
    emit ItemReceived();
    state = State.Released;
  }

  /// This function pays the seller
  function paySeller()
    public
    onlySeller
    inState(State.Released)
  {
    emit SellerPaid();
    state = State.Inactive;
  }
}
