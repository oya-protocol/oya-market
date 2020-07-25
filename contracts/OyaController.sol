pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import './OyaOrder.sol';
import './Token.sol';
import "@nomiclabs/buidler/console.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";

interface IAffiliateRegistry {
  function hasAffiliate(address seller, address affiliate) external view returns (bool);
}

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
  IAffiliateRegistry affiliateRegistry;

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
    address payable _affiliate,
    IERC20 _paymentToken,
    uint256 _paymentAmount,
    uint256 _affiliateCut,
    string[] calldata _productHashes
  )
    external
    payable
  {
    require (_msgSender() == _buyer);
    if (_affiliateCut > 0) {
      require (affiliateRegistry.hasAffiliate(_seller, _affiliate), "Affiliate must be approved by seller.");
    }
    OyaOrder newOrder = new OyaOrder(
      _buyer,
      _seller,
      arbitrator,
      _affiliate,
      trustedForwarder,
      _paymentToken,
      _paymentAmount,
      _affiliateCut,
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

  function setAffiliateRegistry(address _affiliateRegistry) onlyUpdater public {
    affiliateRegistry = IAffiliateRegistry(_affiliateRegistry);
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
