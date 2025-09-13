// migrations/1_deploy_contracts.js

const EventTicket = artifacts.require("EventTicket");

module.exports = function (deployer, network, accounts) {
  // The first account from Ganache will be the owner of the contract
  const owner = accounts[0];
  deployer.deploy(EventTicket);
};