pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

// TODO:
// * Remove unused boilerplate (DONE)
// * Payments in ERC20 tokens (DONE)
// * Accept constructor parameters from PurchaseFactory contract (DONE)
// * Only require the payment for the item to be sent by buyer (DONE)
// * Escrow the payments from buyer (DONE)
// * Function for seller to set tracking details
// * Function for buyer to reclaim funds if tracking details not set in timed
// * Track shipment via Chainlink EasyPost integration
// * Function for seller to claim funds if item was confirmed delivered and wait time has passe
// * Add self-destruct function that gives gas refund and emits event

contract OyaOrder is ChainlinkClient {
  address payable public seller;
  address payable public buyer;
  IERC20 public paymentToken;
  uint256 public balance;
  uint256 public sellerDeadline;
  uint256 public buyerDeadline;
  uint256 public createTime;
  /* TODO: define required variables for tracking */

  enum State { Created, Refunded, Locked, Accepted, Delivered, Paid }
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

  event OrderRefunded();
  event TrackingSet();
  event ItemAccepted();
  event SellerPaid();

  constructor(
    address payable _buyer,
    address payable _seller,
    IERC20 _paymentToken,
    uint256 _paymentAmount,
    address _link
  ) public payable {
    // Set the address for the LINK token for the network.
    if(_link == address(0)) {
      // Useful for deploying to public networks.
      setPublicChainlinkToken();
    } else {
      // Useful if you're deploying to a local network.
      setChainlinkToken(_link);
    }
    buyer = _buyer;
    seller = _seller;
    paymentToken = _paymentToken;
    // TODO: use create2 to pre-approve contract to accept tokens during deploy
    // paymentToken.transferFrom(_buyer, address(this), _paymentAmount);
    balance = _paymentAmount;
    createTime = now;
  }

  /// Confirm that you (the buyer) received the item.
  /// This will release the locked payment.
  function demandRefund()
    public
    onlyBuyer
    /* TODO: this can happen in multiple states */
    inState(State.Created)
  {
    /* TODO: get return shipment tracking from buyer */
    /* TODO: check that return package was delivered? */
    emit OrderRefunded();
    state = State.Refunded;
    paymentToken.transfer(buyer, balance);
  }

  /// Set tracking information for the delivery as the seller.
  function setTracking(/*TODO: fill in tracking details*/)
    public
    onlySeller
    inState(State.Created)
  {
    emit TrackingSet();
    /* TODO: set tracking details */
    state = State.Locked;
  }

  /// Confirm that you (the buyer) received and accept the item.
  /// This will unlock the payment.
  function acceptItem()
    public
    onlyBuyer
  {
    emit ItemAccepted();
    state = State.Accepted;
    _paySeller();
  }

  /// Seller claims payment after buyer deadline has passed.
  function confirmReceivedAutomatically()
    public
    inState(State.Delivered)
  {
    emit ItemAccepted();
    state = State.Accepted;
    _paySeller();
  }

  /// This internal function pays the seller.
  function _paySeller()
    internal
    inState(State.Accepted)
  {
    emit SellerPaid();
    state = State.Paid;
    paymentToken.transfer(seller, balance);
  }
}
