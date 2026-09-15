// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PermissionPolicy} from "./PermissionPolicy.sol";

contract SidebandAccount {
    using PermissionPolicy for PermissionPolicy.Policy;

    error Unauthorized();
    error InvalidSignature();
    error InvalidNonce();
    error ExecutionFailed(bytes reason);

    address public owner;
    uint256 public nonce;
    mapping(bytes32 capability => PermissionPolicy.Policy) public policies;

    event Executed(address indexed target, uint256 value, uint256 nonce);
    event PolicySet(bytes32 indexed capability, address indexed application, uint96 spendLimit);
    event PolicyRevoked(bytes32 indexed capability);
    event OwnerRotated(address indexed previousOwner, address indexed nextOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert Unauthorized();
        owner = initialOwner;
    }

    receive() external payable {}

    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 expectedNonce,
        bytes calldata signature
    ) external returns (bytes memory result) {
        if (expectedNonce != nonce) revert InvalidNonce();
        bytes32 digest = keccak256(abi.encode(block.chainid, address(this), target, value, keccak256(data), expectedNonce));
        if (_recover(_ethSigned(digest), signature) != owner) revert InvalidSignature();
        unchecked { nonce++; }
        (bool ok, bytes memory response) = target.call{value: value}(data);
        if (!ok) revert ExecutionFailed(response);
        emit Executed(target, value, expectedNonce);
        return response;
    }

    function executeWithPolicy(
        bytes32 capability,
        address target,
        address asset,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes memory result) {
        policies[capability].enforce(msg.sender, asset, amount);
        (bool ok, bytes memory response) = target.call(data);
        if (!ok) revert ExecutionFailed(response);
        emit Executed(target, 0, nonce);
        return response;
    }

    function setPolicy(bytes32 capability, PermissionPolicy.Policy calldata policy) external onlyOwner {
        policies[capability] = policy;
        emit PolicySet(capability, policy.application, policy.spendLimit);
    }

    function revoke(bytes32 capability) external onlyOwner {
        policies[capability].active = false;
        emit PolicyRevoked(capability);
    }

    function rotateOwner(address nextOwner) external onlyOwner {
        if (nextOwner == address(0)) revert Unauthorized();
        address previous = owner;
        owner = nextOwner;
        emit OwnerRotated(previous, nextOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    function _ethSigned(bytes32 digest) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        if (signature.length != 65) revert InvalidSignature();
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
        signer = ecrecover(digest, v, r, s);
    }
}
