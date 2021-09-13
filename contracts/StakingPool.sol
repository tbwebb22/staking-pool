// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract StakingPool is
    Initializable,
    OwnableUpgradeable
{

    uint256 private totalRewardsAmount;
    uint256 private totalStakedAmount;
    uint256 private totalRewardRate;
    mapping(address => uint256) private userRewardRate;
    mapping(address => uint256) private userAccumulatedRewards;
    mapping(address => uint256) private userStakedAmounts;

    event UserStakeIncreased(address user, uint256 stakeIncreaseAmount);
    event UserStakeDecreased(address user, uint256 stakeDecreaseAmount);
    event RewardsIncreased(uint256 rewardsIncreaseAmount);
    event RewardsClaimed(address user, uint256 rewardsClaimedAmount);


    function initialize(address owner_) public initializer {
        __Ownable_init();
        transferOwnership(owner_);
    }

    /// @param user The address of the user
    /// @param stakeIncreaseAmount The amount to increase the user's stake by
    function increaseStake(address user, uint256 stakeIncreaseAmount) external onlyOwner {
        _updateUserRewards(user);

        userStakedAmounts[user] += stakeIncreaseAmount;
        totalStakedAmount += stakeIncreaseAmount;

        emit UserStakeIncreased(user, stakeIncreaseAmount);
    }

    /// @param user The address of the user
    /// @param stakeDecreaseAmount The amount to decrease the user's stake by
    function decreaseStake(address user, uint256 stakeDecreaseAmount) external onlyOwner {
        _updateUserRewards(user);

        userStakedAmounts[user] -= stakeDecreaseAmount;
        totalStakedAmount -= stakeDecreaseAmount;

        emit UserStakeDecreased(user, stakeDecreaseAmount);
    }

    /// @param rewardsIncreaseAmount The amount to increase rewards by
    function increaseRewards(uint256 rewardsIncreaseAmount) external onlyOwner {
        require(totalStakedAmount > 0, "No tokens staked to receive rewards");

        totalRewardsAmount += rewardsIncreaseAmount;
        totalRewardRate += rewardsIncreaseAmount * 10**18 / totalStakedAmount;

        emit RewardsIncreased(rewardsIncreaseAmount);
    }

    /// @param user The address of the user
    /// @return rewardsAmount The amount of the rewards token claimed by the user
    function claimRewards(address user) external onlyOwner returns (uint256 rewardsAmount) {
        _updateUserRewards(user);
        rewardsAmount = userAccumulatedRewards[user];

        require(rewardsAmount > 0, "No rewards to claim");

        userAccumulatedRewards[user] = 0;
        totalRewardsAmount -= rewardsAmount;

        emit RewardsClaimed(user, rewardsAmount);
    }

    function _updateUserRewards(address user) private {
        userAccumulatedRewards[user] += (totalRewardRate - userRewardRate[user]) * userStakedAmounts[user] / 10**18;

        userRewardRate[user] = totalRewardRate;
    }

    /// @param user The address of the user
    /// @return claimableRewards The amount of rewards that can be claimed
    function getUserClaimableRewards(address user) external view returns (uint256 claimableRewards) {
        claimableRewards = userAccumulatedRewards[user] + (totalRewardRate - userRewardRate[user]) * userStakedAmounts[user] / 10**18;
    }

    /// @return The total amount of rewards available
    function getTotalRewards() external view returns (uint256) {
        return totalRewardsAmount;
    }
}