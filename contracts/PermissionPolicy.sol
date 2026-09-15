// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library PermissionPolicy {
    error Revoked();
    error Expired();
    error InvalidOrigin();
    error AssetNotAllowed();
    error SpendLimitExceeded();

    struct Policy {
        address application;
        uint48 expiresAt;
        uint96 spendLimit;
        address allowedAsset;
        bool active;
    }

    function enforce(
        Policy storage self,
        address origin,
        address asset,
        uint256 amount
    ) internal view {
        if (!self.active) revert Revoked();
        if (self.expiresAt <= block.timestamp) revert Expired();
        if (self.application != origin) revert InvalidOrigin();
        if (self.allowedAsset != address(0) && self.allowedAsset != asset) revert AssetNotAllowed();
        if (amount > self.spendLimit) revert SpendLimitExceeded();
    }
}
