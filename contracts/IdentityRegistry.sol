// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IdentityRegistry {
    error NameTaken();
    error Unauthorized();
    error InvalidAccount();

    struct Identity {
        address account;
        bytes32 deviceCommitment;
        uint64 registeredAt;
    }

    mapping(bytes32 nameHash => Identity) public identities;
    mapping(address account => bytes32 nameHash) public names;

    event IdentityRegistered(bytes32 indexed nameHash, address indexed account, bytes32 deviceCommitment);
    event DeviceRotated(bytes32 indexed nameHash, bytes32 previousCommitment, bytes32 nextCommitment);

    function register(bytes32 nameHash, address account, bytes32 deviceCommitment) external {
        if (account == address(0)) revert InvalidAccount();
        if (identities[nameHash].account != address(0)) revert NameTaken();
        if (msg.sender != account) revert Unauthorized();
        identities[nameHash] = Identity(account, deviceCommitment, uint64(block.timestamp));
        names[account] = nameHash;
        emit IdentityRegistered(nameHash, account, deviceCommitment);
    }

    function rotateDevice(bytes32 nameHash, bytes32 nextCommitment) external {
        Identity storage identity = identities[nameHash];
        if (msg.sender != identity.account) revert Unauthorized();
        bytes32 previous = identity.deviceCommitment;
        identity.deviceCommitment = nextCommitment;
        emit DeviceRotated(nameHash, previous, nextCommitment);
    }
}
