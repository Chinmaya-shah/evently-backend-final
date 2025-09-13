// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicket is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Mapping to track if a ticket has been used for check-in
    mapping(uint256 => bool) private _isUsed;

    constructor() ERC721("Evently Ticket", "EVT") {
        // In OpenZeppelin v4, the deployer is automatically set as the owner.
    }

    function mintTicket(address attendee) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(attendee, tokenId);
        return tokenId;
    }

    function markAsUsed(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist.");
        require(!_isUsed[tokenId], "Ticket has already been used.");
        _isUsed[tokenId] = true;
    }

    function isTicketUsed(uint256 tokenId) public view returns (bool) {
        return _isUsed[tokenId];
    }
}