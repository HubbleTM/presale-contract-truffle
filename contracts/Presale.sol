pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/payment/escrow/RefundEscrow.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract Presale is CappedCrowdsale, AllowanceCrowdsale, WhitelistCrowdsale, FinalizableCrowdsale {
    using SafeMath for uint256;

    // refund escrow used to hold funds while crowdsale is running
    RefundEscrow private escrow;

    mapping(address => uint256) private contributions;
    uint256 private individualMinCap;
    uint256 private individualMaxCap;

    constructor (
        uint256 _rate,
        address payable _wallet,
        IERC20 _token,
        address tokenWallet,
        uint256 _cap,
        uint256 _individualMinCap,
        uint256 _individualMaxCap,
        uint256 _openingTime,
        uint256 _closingTime
    )
        public
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap)
        AllowanceCrowdsale(tokenWallet)
        TimedCrowdsale(_openingTime, _closingTime)
    {
        escrow = new RefundEscrow(_wallet);

        individualMinCap = _individualMinCap;
        individualMaxCap = _individualMaxCap;
    }

    function setIndividualMinCap(uint256 newIndividualMinCap) external onlyWhitelistAdmin {
        individualMinCap = newIndividualMinCap;
    }

    function setIndividualMaxCap(uint256 newIndividualMaxCap) external onlyWhitelistAdmin {
        individualMaxCap = newIndividualMaxCap;
    }

    function getIndividualMinCap() public view returns (uint256) {
        return individualMinCap;
    }

    function getIndividualMaxCap() public view returns (uint256) {
        return individualMaxCap;
    }

    function finalize() public onlyWhitelistAdmin {
        super.finalize();

        escrow.close();
        escrow.beneficiaryWithdraw();
    }

    function refund() public onlyWhitelistAdmin {
        escrow.enableRefunds();
    }

    function claimRefund(address payable refundee) public {
        escrow.withdraw(refundee);
    }

    function hasClosed() public view returns (bool) {
        return !finalized();
    }

    function addWhitelistedList(address[] memory accounts) public onlyWhitelistAdmin {
        for(uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "Presale: account is the zero address");
            _addWhitelisted(accounts[i]);
        }
    }

    /**
     * @dev Extend parent behavior requiring purchase to respect the beneficiary's funding cap.
     * @param beneficiary Token purchaser
     * @param weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal view {
        super._preValidatePurchase(beneficiary, weiAmount);

        uint256 individualWeiAmount = contributions[beneficiary].add(weiAmount);
        require(individualWeiAmount >= individualMinCap, "Presale: less than min cap");
        require(individualWeiAmount <= individualMaxCap, "Presale: more than max cap");
    }

    /**
     * @dev Extend parent behavior to update beneficiary contributions.
     * @param beneficiary Token purchaser
     * @param weiAmount Amount of wei contributed
     */
    function _updatePurchasingState(address beneficiary, uint256 weiAmount) internal {
        super._updatePurchasingState(beneficiary, weiAmount);
        contributions[beneficiary] = contributions[beneficiary].add(weiAmount);
    }

    /**
     * @dev Overrides Crowdsale fund forwarding, sending funds to escrow.
     */
    function _forwardFunds() internal {
        escrow.deposit.value(msg.value)(msg.sender);
    }
}
