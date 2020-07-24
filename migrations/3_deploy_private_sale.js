const { BN, constants, ether } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const VestingToken = artifacts.require('VestingToken');
const Privatesale = artifacts.require('Privatesale');
const fs = require('fs');
const accounts = require('../test_accounts.json');

const wallet = '0xF8e1d287C5Cc579dd2A2ceAe6ccf4FbfBe4CA2F5';
const decimal = new BN('18');
const totalSupply = ether('7200000');

module.exports = async function (deployer) {
  if (process.env.PRIVATESALE) {
    let token, sale;

    await deployer.deploy(VestingToken,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      0,
      'Privatesale Tokamak Network Token',
      18,
      'PrivateTON',
      true,
    ).then(async () => { token = await VestingToken.deployed(); })
      .then(() => deployer.deploy(Privatesale,
        wallet,
        token.address,
      ))
      .then(async () => { sale = await Privatesale.deployed(); })
      .then(() => token.generateTokens(sale.address, totalSupply))
      .catch((e) => {
        console.error(e);
        throw e;
      });
    const data = JSON.parse(fs.readFileSync('deployed.json').toString());
    data.privateTon = token.address;
    fs.writeFile('deployed.json', JSON.stringify(data), (err) => {
      if (err) throw err;
    });
  } else if (process.env.DAEMONTEST) {
    let token;
    await deployer.deploy(VestingToken,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      0,
      'Privatesale Tokamak Network Token',
      18,
      'PrivateTON',
      true,
    ).then(async () => { token = await VestingToken.deployed(); })
      .then(() => token.generateTokens(accounts.owner, totalSupply));
    const data = JSON.parse(fs.readFileSync('deployed_test.json').toString());
    data.privateTon = token.address;
    fs.writeFile('deployed_test.json', JSON.stringify(data), (err) => {
      if (err) throw err;
    });
    await token.transfer(accounts.holder1, ether('11.11'));
    await token.transfer(accounts.holder2, ether('22.22'));
    await token.transfer(accounts.holder3, ether('33.33'));
    await token.transfer(accounts.holder4, ether('44.44'));
    await token.transfer(accounts.holder6, ether('55.55'));
  }
};
