import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer, owner} = await getNamedAccounts();

  await deploy("StakingPool", {
    from: deployer,
    proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [owner],
        }
    }
  });
}

export default func;