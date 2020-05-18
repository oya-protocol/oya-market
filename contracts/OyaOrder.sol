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
// * Function for seller to claim funds if item was confirmed delivered and wait time has passed
// * Add self-destruct function that gives gas refund and emits event

contract OyaOrder is ChainlinkClient {
  address payable public seller;
  address payable public buyer;
  IERC20 public paymentToken;
  uint256 public balance;
  bytes32 public shippingProvider;
  bytes32 public trackingNumber;
  /* TODO: define required variables for tracking */

  enum State { Created, Locked, Delivered }
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

  modifier inState(State _state) {
    require(
        state == _state,
        "Invalid state."
    );
    _;
  }

  event BuyerRefunded();
  event TrackingSet(bytes32, bytes32);
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
    balance = _paymentAmount;
    // createTime = now;
  }

  /// Confirm that you (the buyer) received the item.
  /// This will release the locked payment.
  function demandRefund()
    public
    onlyBuyer
  {
    /* TODO: get return shipment tracking from buyer */
    /* TODO: check that return package was delivered? */
    _refundBuyer();
  }

  /// Set tracking information for the delivery as the seller.
  function setTracking(
    bytes32 _shippingProvider,
    bytes32 _trackingNumber
  )
    public
    onlySeller
    inState(State.Created)
  {
    shippingProvider = _shippingProvider;
    trackingNumber = _trackingNumber;
    emit TrackingSet(shippingProvider, trackingNumber);
    state = State.Locked;
  }

  function getTracking()
    external
    view
    inState(State.Locked)
    returns (bytes32, bytes32)
  {
    return (shippingProvider, trackingNumber);
  }

  /// Confirm that you (the buyer) received and accept the item.
  /// This will unlock the payment.
  function acceptItem()
    public
    onlyBuyer
  {
    _paySeller();
  }

  /// Seller claims payment after buyer deadline has passed.
  function confirmReceivedAutomatically()
    public
    inState(State.Delivered)
  {
    _paySeller();
  }

  /// This internal function pays the seller.
  function _paySeller()
    internal
  {
    emit SellerPaid();
    paymentToken.transfer(seller, balance);
    selfdestruct(seller);
  }

  function _refundBuyer()
    internal
  {
    emit BuyerRefunded();
    paymentToken.transfer(buyer, balance);
    selfdestruct(buyer);
  }
}
