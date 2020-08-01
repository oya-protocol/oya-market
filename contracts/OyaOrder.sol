pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

interface IOyaController {
  function reward(address recipient) external;
  function clearOrder() external;
}

contract OyaOrder {
  using SafeMath for uint256;

  address payable private seller;
  address payable private buyer;
  address payable private arbitrator;
  address payable private affiliate;
  IERC20 private paymentToken;
  uint256 private balance;
  uint256 private affiliateCut;
  IOyaController private controller;

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

  event OrderCreated(string[]);
  event BuyerRefunded();
  event AffiliatePaid();
  event SellerPaid();

  constructor(
    address payable _buyer,
    address payable _seller,
    address payable _arbitrator,
    address payable _affiliate,
    IERC20 _paymentToken,
    uint256 _paymentAmount,
    uint256 _affiliateCut,
    string[] memory _productHashes
  ) public payable {
    buyer = _buyer;
    seller = _seller;
    arbitrator = _arbitrator;
    affiliate = _affiliate;
    paymentToken = _paymentToken;
    balance = _paymentAmount;
    affiliateCut = _affiliateCut;
    controller = IOyaController(msg.sender);
    emit OrderCreated(_productHashes);
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

  // Confirm the item was received and accepted, paying the seller
  function acceptDelivery()
    external
    onlyBuyer
  {
    _reward(buyer);
    _payAffiliate();
    _paySeller();
    selfdestruct(seller);
  }

  function _payAffiliate()
    internal
  {
    emit AffiliatePaid();
    paymentToken.transfer(affiliate, affiliateCut);
    balance = balance.sub(affiliateCut);
    _reward(affiliate);
  }

  function _paySeller()
    internal
  {
    emit SellerPaid();
    paymentToken.transfer(seller, balance);
    _reward(seller);
    controller.clearOrder();
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
