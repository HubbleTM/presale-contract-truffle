pragma solidity ^0.5.0;

import "./minime/MiniMeToken.sol";
import "./openzeppelin-solidity/math/SafeMath.sol";

contract VestingToken is MiniMeToken {
    using SafeMath for uint256;

    event TokensReleased(address beneficiary, uint256 amount);

    bool private _initiated;

    // Durations and timestamps are expressed in UNIX time, the same units as block.timestamp.
    uint256 private _cliff;
    uint256 private _start;
    uint256 private _duration;

    mapping (address => uint256) private _released;

    constructor (
        address tokenFactory, address payable parentToken, uint parentSnapShotBlock,
        string memory tokenName, uint8 decimalUnits, string memory tokenSymbol, bool transfersEnabled
    )
        public
        MiniMeToken(tokenFactory, parentToken, parentSnapShotBlock, tokenName, decimalUnits, tokenSymbol, transfersEnabled)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev Returns true if the token can be released, and false otherwise.
     */
    function initiated() public view returns (bool) {
        return _initiated;
    }

    /**
     * @return the cliff time of the token vesting.
     */
    function cliff() public view returns (uint256) {
        return _cliff;
    }

    /**
     * @return the start time of the token vesting.
     */
    function start() public view returns (uint256) {
        return _start;
    }

    /**
     * @return the duration of the token vesting.
     */
    function duration() public view returns (uint256) {
        return _duration;
    }

    /**
     * @notice Makes vested tokens releasable.
     * @param start the time (as Unix time) at which point vesting starts
     * @param cliffDuration duration in seconds of the cliff in which tokens will begin to vest
     * @param duration duration in seconds of the period in which the tokens will vest
     */
    function initiate(uint256 start, uint256 cliffDuration, uint256 duration) public beforeInitiated onlyController {
        require(!_initiated, "VestingToken: already initiated");

        _initiated = true;

        enableTransfers(false);

        // solhint-disable-next-line max-line-length
        require(cliffDuration <= duration, "VestingToken: cliff is longer than duration");
        require(duration > 0, "VestingToken: duration is 0");
        // solhint-disable-next-line max-line-length
        require(start.add(duration) > block.timestamp, "VestingToken: final time is before current time");

        _duration = duration;
        _cliff = start.add(cliffDuration);
        _start = start;
    }

    /**
     * @dev This is the actual transfer function in the token contract.
     * @param from The address holding the tokens being transferred
     * @param to The address of the recipient
     * @param amount The amount of tokens to be transferred
     */
    function doTransfer(address from, address to, uint amount) internal beforeInitiated {
        super.doTransfer(from, to, amount);
    }

    /**
     * @notice Destroys releasable tokens.
     * @param beneficiary the beneficiary of the tokens.
     */
    function destroyReleasableTokens(address beneficiary) public afterInitiated onlyController returns (uint256 unreleased) {
        unreleased = releasableAmount(beneficiary);

        require(unreleased > 0, "VestingToken: no tokens are due");

        _released[beneficiary] = _released[beneficiary].add(unreleased);

        require(destroyTokens(beneficiary, unreleased), "VestingToken: failed to destroy tokens");
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     * @param beneficiary the beneficiary of the tokens.
     */
    function releasableAmount(address beneficiary) public view returns (uint256) {
        return _vestedAmount(beneficiary).sub(_released[beneficiary]);
    }

    /**
     * @dev Calculates the amount that has already vested.
     * @param beneficiary the beneficiary of the tokens.
     */
    function _vestedAmount(address beneficiary) private view returns (uint256) {
        if (!_initiated) {
            return 0;
        }

        uint256 currentVestedAmount = balanceOf(beneficiary);
        uint256 totalVestedAmount = currentVestedAmount.add(_released[beneficiary]);

        if (block.timestamp < _cliff) {
            return 0;
        } else if (block.timestamp >= _start.add(_duration)) {
            return totalVestedAmount;
        } else {
            return totalVestedAmount.mul(block.timestamp.sub(_start)).div(_duration);
        }
    }
}
