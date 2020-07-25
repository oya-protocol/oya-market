pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract AffiliateRegistry {
  using EnumerableSet for EnumerableSet.AddressSet;

  mapping(address => EnumerableSet.AddressSet) sellerAffiliates;

  function addAffiliate(address seller, address affiliate) external {
    require(msg.sender == seller, "Only sellers can add their affiliates.");
    sellerAffiliates[seller].add(affiliate);
  }

  function removeAffiliate(address seller, address affiliate) external {
    require(msg.sender == seller, "Only sellers can remove their affiliates.");
    sellerAffiliates[seller].remove(affiliate);
  }

  function hasAffiliate(address seller, address affiliate) external view returns (bool) {
    return sellerAffiliates[seller].contains(affiliate);
  }
}
