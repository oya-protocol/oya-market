pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import './OyaOrder.sol';
import './Token.sol';
import "@nomiclabs/buidler/console.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";

contract OyaController is BaseRelayRecipient {

  struct Order {
    bool exists;
    address seller;
    address buyer;
    address arbitrator;
  }

  mapping (address => Order) orders;

  Token oyaToken;
  address updater;
  address payable arbitrator;
  uint256 rewardAmount;

  event OrderCreated(address);

  modifier onlyUpdater() {
    require(
        _msgSender() == updater,
        "Only updater can call this."
    );
    _;
  }

  constructor(
    address _updater
  ) public {
    updater = _updater;
  }

  function createOrder(
    address payable _buyer,
    address payable _seller,
    IERC20 _paymentToken,
    uint256 _paymentAmount,
    string[] calldata _productHashes
  )
    external
    payable
  {
    require (_msgSender() == _buyer);
    OyaOrder newOrder = new OyaOrder(
      _buyer,
      _seller,
      arbitrator,
      trustedForwarder,
      _paymentToken,
      _paymentAmount,
      _productHashes
    );

    _paymentToken.transferFrom(_msgSender(), address(newOrder), _paymentAmount);

    emit OrderCreated(address(newOrder));

    orders[address(newOrder)] = Order(true, _seller, _buyer, arbitrator);
  }

  // upgrade functions -- will be controlled by Updater
  function setToken(address tokenAddress) onlyUpdater external {
    oyaToken = Token(tokenAddress);
  }

  function setUpdater(address payable _updater) onlyUpdater external {
    updater = _updater;
  }

  function setArbitrator(address payable _arbitrator) onlyUpdater external {
    arbitrator = _arbitrator;
  }

  function setRewardAmount(uint256 _rewardAmount) onlyUpdater external {
    rewardAmount = _rewardAmount;
  }

  function setTrustedForwarder(address _trustedForwarder) onlyUpdater public {
    trustedForwarder = _trustedForwarder;
  }

  // order management functions
  function reward(address recipient) external {
    require (orders[_msgSender()].exists == true);
    oyaToken.mint(recipient, rewardAmount);
  }

  function clearOrder() external {
    require (orders[_msgSender()].exists == true);
    delete(orders[_msgSender()]);
  }

  // OpenGSN function
  function versionRecipient() external virtual view
  	override returns (string memory) {
  		return "1.0";
    }
}
