pragma solidity ^0.6.2;
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract OyaToken is ERC20PresetMinterPauser {
  constructor() public ERC20PresetMinterPauser("Oya", "OYA") {}
}
