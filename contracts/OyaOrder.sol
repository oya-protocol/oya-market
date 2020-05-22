pragma solidity >=0.6.0 <0.7.0;

import './OyaController.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
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

contract OyaOrder is ChainlinkClient {
  address payable public seller;
  address payable public buyer;
  IERC20 public paymentToken;
  uint256 public balance;
  bytes32 public shippingProvider;
  bytes32 public trackingNumber;
  bytes32 public shippingStatus;
  OyaController public controller;
  uint256 deliveryDate;


  struct Tracking {
    bool exists;
    address seller;
    address buyer;
  }

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
    controller = OyaController(msg.sender);
  }

  function cancelOrder()
    public
    inState(State.Created)
  {
    require(msg.sender == buyer || msg.sender == seller);
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
    _reward(buyer);
    _paySeller();
  }

  function requestStatus
  (
    address _oracle,
    bytes32 _jobId,
    uint256 _oraclePayment
  )
    public
    onlySeller
  {
    Chainlink.Request memory req = buildChainlinkRequest(_jobId, address(this), this.fulfill.selector);
    req.add("car", bytes32ToString(shippingProvider));
    req.add("code", bytes32ToString(trackingNumber));
    req.add("copyPath", "status");
    sendChainlinkRequestTo(_oracle, req, _oraclePayment);
  }

  function fulfill(bytes32 _requestId, bytes32 _status)
    public
    recordChainlinkFulfillment(_requestId)
  {
    shippingStatus = _status;
    if (shippingStatus == bytes32("Delivered")) {
      state = State.Delivered;
      deliveryDate = now;
    }
  }

  /// Seller claims payment after buyer deadline has passed.
  function confirmReceivedAutomatically()
    public
    inState(State.Delivered)
  {
    require (now > deliveryDate + 15 days);
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

  // utility function
  function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
    bytes memory bytesArray = new bytes(32);
    for (uint256 i; i < 32; i++) {
      bytesArray[i] = _bytes32[i];
    }
    return string(bytesArray);
  }
}
