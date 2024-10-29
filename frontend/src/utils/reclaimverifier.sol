//  SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReclaimVerifier {
    struct Provider {
        uint256 id;
        string name;
    }

    struct User {
        address userAddress;
        mapping(uint256 => bool) providerVerifications;
        bool isEligibleForAirdrop;
    }

    mapping(uint256 => Provider) public providers;
    mapping(address => User) public users;
    address[] public userAddresses;

    uint256 public nextProviderId = 1;
    uint256 public requiredVerifications = 2; // Number of verifications required for airdrop eligibility

    event ProofSubmitted(address indexed user, uint256 indexed providerId);
    event UserVerified(address indexed user, uint256 indexed providerId);
    event AirdropEligibilityUpdated(address indexed user, bool isEligible);

    function addProvider(string memory name) public {
        providers[nextProviderId] = Provider(nextProviderId, name);
        nextProviderId++;
    }

    function submitProof(uint256 providerId) public {
        require(providers[providerId].id != 0, "Invalid provider");
        if (users[msg.sender].userAddress == address(0)) {
            userAddresses.push(msg.sender);
            users[msg.sender].userAddress = msg.sender;
        }
        emit ProofSubmitted(msg.sender, providerId);
    }

    function verifyUser(address userAddress, uint256 providerId) public {
        require(users[userAddress].userAddress != address(0), "User not found");
        require(providers[providerId].id != 0, "Invalid provider");

        users[userAddress].providerVerifications[providerId] = true;
        emit UserVerified(userAddress, providerId);

        updateAirdropEligibility(userAddress);
    }

    function updateAirdropEligibility(address userAddress) internal {
        uint256 verificationCount = 0;
        for (uint256 i = 1; i < nextProviderId; i++) {
            if (users[userAddress].providerVerifications[i]) {
                verificationCount++;
            }
        }

        bool isEligible = verificationCount >= requiredVerifications;
        if (isEligible != users[userAddress].isEligibleForAirdrop) {
            users[userAddress].isEligibleForAirdrop = isEligible;
            emit AirdropEligibilityUpdated(userAddress, isEligible);
        }
    }

    function checkAirdropEligibility(address userAddress) public view returns (bool) {
        return users[userAddress].isEligibleForAirdrop;
    }

    function getProviders() public view returns (Provider[] memory) {
        Provider[] memory allProviders = new Provider[](nextProviderId - 1);
        for (uint256 i = 1; i < nextProviderId; i++) {
            allProviders[i - 1] = providers[i];
        }
        return allProviders;
    }

    function getUsers() public view returns (address[] memory) {
        return userAddresses;
    }

    function getUserVerifications(address userAddress) public view returns (bool[] memory) {
        bool[] memory verifications = new bool[](nextProviderId - 1);
        for (uint256 i = 1; i < nextProviderId; i++) {
            verifications[i - 1] = users[userAddress].providerVerifications[i];
        }
        return verifications;
    }
}