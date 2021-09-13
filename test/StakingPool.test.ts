import { ethers, network, deployments } from "hardhat"
import { expect } from "chai"
import { Signer, BigNumberish } from "ethers"
import { StakingPool } from "../typechain"

describe("Staking Pool", () => {
    let stakingPool: StakingPool;
    let deployer: Signer, owner: Signer;

    const user1Address: string = "0x56178a0d5F301bAf6CF3e1Cd53d9863437345Bf9";
    const user2Address: string = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    beforeEach(async () => {
        [deployer, owner] = await ethers.getSigners();

        await deployments.fixture();

        stakingPool = await ethers.getContract("StakingPool");
    });

    it("Handles one user claiming rewards", async function () {
        await stakingPool.connect(owner).increaseStake(user1Address, 1000);
        await stakingPool.connect(owner).increaseRewards(100);

        expect(await stakingPool.getTotalRewards()).to.equal(100);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(100);
        await expect(stakingPool.connect(owner).claimRewards(user1Address)).to.emit(stakingPool, "RewardsClaimed").withArgs(user1Address, 100);

        expect(await stakingPool.getTotalRewards()).to.equal(0);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(0);
        await expect(stakingPool.connect(owner).claimRewards(user1Address)).to.be.revertedWith("No rewards to claim");
    });

    it("Handles two users claiming rewards", async function () {
        await stakingPool.connect(owner).increaseStake(user1Address, 1000);
        await stakingPool.connect(owner).increaseStake(user2Address, 3000);
        await stakingPool.connect(owner).increaseRewards(100);

        expect(await stakingPool.getTotalRewards()).to.equal(100);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(25);
        expect(await stakingPool.getUserClaimableRewards(user2Address)).to.equal(75);

        // User 1 claims rewards
        await expect(stakingPool.connect(owner).claimRewards(user1Address)).to.emit(stakingPool, "RewardsClaimed").withArgs(user1Address, 25);

        expect(await stakingPool.getTotalRewards()).to.equal(75);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(0);
        expect(await stakingPool.getUserClaimableRewards(user2Address)).to.equal(75);

        await expect(stakingPool.connect(owner).claimRewards(user2Address)).to.emit(stakingPool, "RewardsClaimed").withArgs(user2Address, 75);

        expect(await stakingPool.getTotalRewards()).to.equal(0);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(0);
        expect(await stakingPool.getUserClaimableRewards(user2Address)).to.equal(0);

        await expect(stakingPool.connect(owner).claimRewards(user1Address)).to.be.revertedWith("No rewards to claim");
        await expect(stakingPool.connect(owner).claimRewards(user2Address)).to.be.revertedWith("No rewards to claim");
    });

    it("Handles two users claiming rewards with a reward increase", async function () {
        await stakingPool.connect(owner).increaseStake(user1Address, 1000);
        await stakingPool.connect(owner).increaseStake(user2Address, 3000);
        await stakingPool.connect(owner).increaseRewards(100);

        expect(await stakingPool.getTotalRewards()).to.equal(100);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(25);
        expect(await stakingPool.getUserClaimableRewards(user2Address)).to.equal(75);

        // User 1 claims rewards
        await expect(stakingPool.connect(owner).claimRewards(user1Address)).to.emit(stakingPool, "RewardsClaimed").withArgs(user1Address, 25);

        // User 1 fully withdraws stake
        await stakingPool.connect(owner).decreaseStake(user1Address, 1000);

        // Rewards increased by 50
        await stakingPool.connect(owner).increaseRewards(50);

        expect(await stakingPool.getTotalRewards()).to.equal(125);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(0);

        // Value is 124 and not 125 due to division rounding error
        expect(await stakingPool.getUserClaimableRewards(user2Address)).to.equal(124);

        await expect(stakingPool.connect(owner).claimRewards(user2Address)).to.emit(stakingPool, "RewardsClaimed").withArgs(user2Address, 124);

        expect(await stakingPool.getTotalRewards()).to.equal(1);      
        expect(await stakingPool.getUserClaimableRewards(user1Address)).to.equal(0);
        expect(await stakingPool.getUserClaimableRewards(user2Address)).to.equal(0);

        await expect(stakingPool.connect(owner).claimRewards(user1Address)).to.be.revertedWith("No rewards to claim");
        await expect(stakingPool.connect(owner).claimRewards(user2Address)).to.be.revertedWith("No rewards to claim");
    });
});