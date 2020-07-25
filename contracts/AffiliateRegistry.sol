pragma solidity >=0.6.0 <0.7.0;

contract AffiliateRegistry {
  mapping(address => address[]) sellerToAffiliates;

  function addAffiliate(address seller, address affiliate) public {
    require(msg.sender == seller, "Only sellers can add their affiliates.");
    sellerToAffiliates[seller].push(affiliate);
  }

  function removeAffiliate(address seller, address affiliate) public {
    require(msg.sender == seller, "Only sellers can remove their affiliates.");
    sellerToAffiliates[seller].push(affiliate);
  }
}
