const { table } = require('table');
const { createCurrency, createCurrencyRatio } = require('@makerdao/currency');

const { BN, balance, constants, ether, expectEvent, expectRevert, send } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const VestingToken = artifacts.require('VestingToken');
const Privatesale = artifacts.require('Privatesale');

const chai = require('chai');

chai.should();

const { toBN } = web3.utils;

const PTON = createCurrency('PTON');
const ETH = createCurrency('ETH');
const PTON_ETH = createCurrencyRatio(PTON, ETH);

// token amount calculation error
const e = ether('0.0001');

const payments = [
  {
    purchaser: '0x1c0a5Dbec8A67490013e96eDbcc18fAcd90dcDa7',
    _ETH: ETH('600.00000000000'),
    _PTON: PTON(9024.000000),
    _PTON_ETH: PTON_ETH(15.040000),
  },

  {
    purchaser: '0x32C5cc35c5696953162004b666712d28BF89a125',
    _ETH: ETH('717.38000000000'),
    _PTON: PTON(10789.395200),
    _PTON_ETH: PTON_ETH(15.040000),
  },

  {
    purchaser: '0x5D76EA2Fca6e00CfF91588eabF4DE37bAfd73469',
    _ETH: ETH('500.00000000000'),
    _PTON: PTON(7520.000000),
    _PTON_ETH: PTON_ETH(15.040000),
  },

  {
    purchaser: '0x3F17EdC8Cf0Eb20f011C7ecE6C1c4C1fC84eCF00',
    _ETH: ETH('500.00000000000'),
    _PTON: PTON(7520.000000),
    _PTON_ETH: PTON_ETH(15.040000),
  },

  {
    purchaser: '0x72cCC4BEDE1a7d09aa20d97355543d0640c661F1',
    _ETH: ETH('342.20000000000'),
    _PTON: PTON(5146.688000),
    _PTON_ETH: PTON_ETH(15.040000),
  },
  // Mr. Jeon
  {
    purchaser: '0x443a8e36753ccd89108f1b0fc92f24eea7c7fdbc',
    _ETH: ETH('783.33072223092600'),
    _PTON: PTON('12000.000000'),
    _PTON_ETH: PTON_ETH(15.319200),
  },
  // GTR (1/2)
  {
    purchaser: '0x6765715Ed59CCBa57204704Cdb0A442f7f643041',
    _ETH: ETH('317.32333192300'),
    _PTON: PTON('4799.95964800'),
    _PTON_ETH: PTON_ETH('15.126400'),
  },
  // GTR (2/2)
  {
    purchaser: '0x9f42C2886BF25fe99D5dF51eE0a653903C92131F',
    _ETH: ETH('740.43000000000'),
    _PTON: PTON('11200.04035200'),
    _PTON_ETH: PTON_ETH('15.126400'),
  },
  // 블로코어
  {
    purchaser: '0x2818824255db21f1451D359D1eEE282b3d1818D9',
    _ETH: ETH('675.33418586663500000'),
    _PTON: PTON('8000.00000000'),
    _PTON_ETH: PTON_ETH('11.845987020091200'),
  },
  // GTR 추가
  {
    purchaser: '0x9f42C2886BF25fe99D5dF51eE0a653903C92131F',
    _ETH: ETH('328.34252692408700000'),
    _PTON: PTON('4000.00000000'),
    _PTON_ETH: PTON_ETH('12.18240001'),
  },
  // 스카이테일
  {
    purchaser: '0x9f42c2886bf25fe99d5df51ee0a653903c92131d',
    _ETH: ETH('697.44734272562400000'),
    _PTON: PTON('8000.00000697'),
    _PTON_ETH: PTON_ETH('11.470400010000'),
  },
  // Mr Jeon (2)
  {
    name: 'Mr Jeon (2)',
    purchaser: '0x9f42c2886bf25fe99d5df51ee0a653903c92131a',
    _ETH: ETH('301.98707495319200000'),
    _PTON: PTON('4000.00000301987000'),
    _PTON_ETH: PTON_ETH('13.245600000000'),
  },
  // 100&100(추가)
  {
    name: '100&100(추가)',
    purchaser: '0xe300edA0ED3E6D1C89B1568d47b8D5377FD21327',
    _ETH: ETH('529.85746834101600000'),
    _PTON: PTON('8000.00000000000000'),
    _PTON_ETH: PTON_ETH('15.098400000010'),
  },
  // GTR(추가1)
  {
    name: 'GTR(추가1)',
    purchaser: '0x1e648B44697351a3dCBdE89D41Bc21E3497Aa04E',
    _ETH: ETH('100.67291898479300000'),
    _PTON: PTON('1520.00000000000000'),
    _PTON_ETH: PTON_ETH('15.098400000010'),
  },
  // GTR(추가2)
  {
    name: 'GTR(추가2)',
    purchaser: '0xBA928D5ABD577E3024880b1F00fca3033BCa89C4',
    _ETH: ETH('164.25581518571500000'),
    _PTON: PTON('2480.00000000000000'),
    _PTON_ETH: PTON_ETH('15.098400000010'),
  },
  // 블로코어(추가)
  {
    name: '블로코어(추가)',
    purchaser: '0x56Df45D0c4aE9d11aD48A51921398675ca82e355',
    _ETH: ETH('105.97149366820300000'),
    _PTON: PTON('1600.00000000000000'),
    _PTON_ETH: PTON_ETH('15.098400000010'),
  },
];

contract('Privatesale', function ([owner, wallet, ...purchasers]) {
  const rates = [
    PTON_ETH('10.15'),
    PTON_ETH('20'),
  ];
  const caps = [
    ETH('300'),
    ETH('600'),
  ];

  const totalSupply = ether('224000.1');

  let smallPayment;

  beforeEach(async function () {
    this.token = await VestingToken.new(
      ZERO_ADDRESS, ZERO_ADDRESS, 0, 'PTON test token', 18, 'PTON-test', true, { from: owner }
    );

    this.sale = await Privatesale.new(
      wallet, this.token.address, { from: owner }
    );

    smallPayment = ETH((await this.sale.smallPayment()).toString(10), 'wei');

    await this.token.generateTokens(this.sale.address, totalSupply, { from: owner });
  });

  describe('permissions', function () {
    const i = 0;

    const purchaser = purchasers[i];
    const rate = rates[i];
    const cap = caps[i];

    it('only owner can call setCapAndPrice', async function () {
      await expectRevert.unspecified(
        this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'), { from: purchaser }),
        'WhitelistedRole: caller does not have the Whitelisted role'
      );
      await this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'), { from: owner });

      (await this.sale.getCap(purchaser)).should.be.bignumber.equal(cap.toFixed('wei'));
      (await this.sale.getPrice(purchaser)).should.be.bignumber.equal(rate.toFixed('wei'));
    });

    it('only owner can call setCap', async function () {
      await expectRevert.unspecified(
        this.sale.setCap(purchaser, cap.toFixed('wei'), { from: purchaser }),
        'CapperRole: caller does not have the Capper role',
      );
      await this.sale.setCap(purchaser, cap.toFixed('wei'), { from: owner });
    });

    it('only owner can call addWhitelisted', async function () {
      await expectRevert.unspecified(
        this.sale.addWhitelisted(purchaser, { from: purchaser }),
        'WhitelistedRole: caller does not have the Whitelisted role'
      );
      await this.sale.addWhitelisted(purchaser, { from: owner });
    });

    it('only owner can call setPrice', async function () {
      await expectRevert.unspecified(
        this.sale.setPrice(purchaser, rate.toFixed('wei'), { from: purchaser }),
        'CapperRole: caller does not have the Capper role',
      );
      await this.sale.setPrice(purchaser, rate.toFixed('wei'), { from: owner });
    });
  });

  describe('payment validation', function () {
    it('cannot buy tokens before whitelisted', async function () {
      const i = 0;

      const purchaser = purchasers[i];
      const rate = rates[i];

      const cap = caps[i];
      const amount = cap;

      await this.sale.setCap(purchaser, cap.toFixed('wei'));
      await this.sale.setPrice(purchaser, rate.toFixed('wei'));

      await expectRevert.unspecified(this.sale.buyTokens(purchaser, { from: purchaser, value: amount.toFixed('wei') }));
    });

    it('cannot buy tokens before cap set', async function () {
      const i = 0;

      const purchaser = purchasers[i];
      const rate = rates[i];

      const cap = caps[i];
      const amount = cap;

      await this.sale.addWhitelisted(purchaser);
      await this.sale.setPrice(purchaser, rate.toFixed('wei'));

      await expectRevert.unspecified(this.sale.buyTokens(purchaser, { from: purchaser, value: amount.toFixed('wei') }));
    });

    it('cannot buy tokens before price set', async function () {
      const i = 0;

      const purchaser = purchasers[i];
      const cap = caps[i];
      const amount = cap;

      await this.sale.addWhitelisted(purchaser);
      await this.sale.setCap(purchaser, cap.toFixed('wei'));

      await expectRevert(
        this.sale.buyTokens(purchaser, { from: purchaser, value: amount.toFixed('wei') }),
        'IndividuallyPricedCrowdsale: the price of purchaser must be set',
      );
    });

    it('can buy tokens with the exact amount of cap', async function () {
      const i = 0;

      const purchaser = purchasers[i];
      const rate = rates[i];

      const cap = caps[i];
      const amount = cap;
      const tokenAmount = cap.times(rate);

      await this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'));

      const { logs } = await this.sale.buyTokens(purchaser, { from: purchaser, value: amount.toFixed('wei') });

      expectEvent.inLogs(logs, 'TokensPurchased', {
        purchaser: purchaser,
        beneficiary: purchaser,
        value: amount.toFixed('wei'),
        amount: tokenAmount.toFixed('wei'),
      });
    });

    it('cannot buy tokens with amount more than individual cap', async function () {
      const i = 0;

      const purchaser = purchasers[i];
      const rate = rates[i];

      const cap = caps[i];
      const amount = cap.plus(ETH('1'));

      await this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'));

      await expectRevert(
        this.sale.buyTokens(purchaser, { from: purchaser, value: amount.toFixed('wei') }),
        'IndividuallyCappedCrowdsale: beneficiary\'s cap exceeded',
      );
    });

    it('cannot buy tokens with amount less than individual cap', async function () {
      const i = 0;

      const purchaser = purchasers[i];
      const rate = rates[i];

      const cap = caps[i];
      const amount = cap.minus(ETH('1'));

      await this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'));

      await expectRevert(
        this.sale.buyTokens(purchaser, { from: purchaser, value: amount.toFixed('wei') }),
        'Privatesale: wei amount should be equal to purchaser cap or equal to 0.03 ether',
      );
    });

    it('can buy tokens with 0.03 ether and the rest of the cap', async function () {
      const i = 0;

      const purchaser = purchasers[i];
      const rate = rates[i];

      const cap = caps[i];
      const ethAmount1 = smallPayment;
      const ethAmount2 = cap.minus(smallPayment);
      const tokenAmount1 = ethAmount1.times(rate);
      const tokenAmount2 = ethAmount2.times(rate);

      const walletBalance = await balance.tracker(wallet);

      await this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'));

      const { logs: logs1 } = await this.sale.buyTokens(purchaser, { from: purchaser, value: ethAmount1.toFixed('wei') });

      expectEvent.inLogs(logs1, 'TokensPurchased', {
        purchaser: purchaser,
        beneficiary: purchaser,
        value: ethAmount1.toFixed('wei'),
        amount: tokenAmount1.toFixed('wei'),
      });

      (await walletBalance.delta()).should.be.bignumber.equal(ethAmount1.toFixed('wei'));

      const { logs: logs2 } = await this.sale.buyTokens(purchaser, { from: purchaser, value: ethAmount2.toFixed('wei') });

      expectEvent.inLogs(logs2, 'TokensPurchased', {
        purchaser: purchaser,
        beneficiary: purchaser,
        value: ethAmount2.toFixed('wei'),
        amount: tokenAmount2.toFixed('wei'),
      });

      (await walletBalance.delta()).should.be.bignumber.equal(ethAmount2.toFixed('wei'));
    });
  });

  describe('price precision', function () {
    for (let i = 0; i < caps.length; i++) {
      const purchaser = purchasers[i];
      const rate = rates[i];
      const cap = caps[i];

      it(`token amount must be well calculated with (rate=${rate.toString(10)}, cap=${cap.toString(10)})`, async function () {
        const ethAmount = cap;
        const tokenAmount = ethAmount.times(rate); ;

        await this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'));

        const { logs } = await this.sale.buyTokens(purchaser, { from: purchaser, value: ethAmount.toFixed('wei') });

        expectEvent.inLogs(logs, 'TokensPurchased', {
          purchaser: purchaser,
          beneficiary: purchaser,
          value: ethAmount.toFixed('wei'),
          amount: tokenAmount.toFixed('wei'),
        });

        const tokens = await this.token.balanceOf(purchaser);
        tokens.should.be.bignumber.equal(tokenAmount.toFixed('wei'));
      });
    }

    for (const purchaser of purchasers) {
      const rate = PTON_ETH(Math.floor(Math.random() * 100) || 1);
      const cap = ETH(Math.floor(Math.random() * 1000) || 1);

      it(`token amount must be well calculated with (rate=${rate.toString(10)}, cap=${cap.toString(10)})`, async function () {
        const ethAmount = cap;
        const tokenAmount = ethAmount.times(rate);

        await this.sale.setCapAndPrice(purchaser, cap.toFixed('wei'), rate.toFixed('wei'));

        const { logs } = await this.sale.buyTokens(purchaser, { from: purchaser, value: ethAmount.toFixed('wei') });

        expectEvent.inLogs(logs, 'TokensPurchased', {
          purchaser: purchaser,
          beneficiary: purchaser,
          value: ethAmount.toFixed('wei'),
          amount: tokenAmount.toFixed('wei'),
        });

        const tokens = await this.token.balanceOf(purchaser);
        tokens.should.be.bignumber.equal(tokenAmount.toFixed('wei'));
      });
    }
  });

  it('should accept payments', async function () {
    purchasers.length.should.be.gt(payments.length, `use more than ${payments.length} accounts in testrpc`);

    const totalSupply = await this.token.totalSupply();

    const totalSupplyPTON = PTON(totalSupply.toString(10), 'wei');
    let totalFundedETH = ETH('0');
    let totalTransferedPTON = PTON('0');

    const paymentConfig = {
      columns: {
        0: {
          width: 35,
        },
        1: {
          width: 30,
          alignment: 'right',
        },
        2: {
          width: 30,
          alignment: 'right',
        },
      },
    };

    const summaryConfig = {
      columns: {
        0: {
          width: 25,
        },
        1: {
          width: 40,
          alignment: 'right',
        },
      },
    };

    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];

      const {
        purchaser: originalPurchaser,
        _ETH,
        _PTON_ETH,
        _PTON,
        name = '',
      } = payment;

      const _ETH1 = ETH('0.03'); // test payment (0.03 ETH)
      const _ETH2 = _ETH.minus(_ETH1);

      const _PTON1 = _ETH1.times(_PTON_ETH);
      const _PTON2 = _ETH2.times(_PTON_ETH);

      const expectedPTON = _ETH.times(_PTON_ETH);

      const data = [
        ['NAME', 'WEI', 'SYMBOL'],
        ['rate', _PTON_ETH.toFixed('wei'), _PTON_ETH.toString(10)],
        ['', '', ''],
        ['test payment (0.03 ETH)', _ETH1.toFixed('wei'), _ETH1.toString(10)],
        ['rest of cap', _ETH2.toFixed('wei'), _ETH2.toString(10)],
        ['cap', _ETH.toFixed('wei'), _ETH.toString(10)],
        ['', '', ''],
        ['PTON for test payment (0.03 ETH)', _PTON1.toFixed('wei'), _PTON1.toString(10)],
        ['PTON for rest of cap', _PTON2.toFixed('wei'), _PTON2.toString(10)],
        ['PTON for cap', _PTON.toFixed('wei'), _PTON.toString(10)],
        ['', '', ''],
        ['Expected PTON', expectedPTON.toFixed('wei'), expectedPTON.toString(10)],
      ];

      console.log('');
      console.log(`Test Payment#${i} ${name}`);
      console.log('-'.repeat(115));
      console.log(table(data, paymentConfig));
      console.log(`${name}: setCapAndPrice("${originalPurchaser}", ${_ETH.toFixed('wei')}, ${_PTON_ETH.toFixed('wei')})`);
      console.log();

      // check expected PTON amount
      // (_PTON.toFixed('wei')).should.be.equal(_ETH.times(_PTON_ETH).toFixed('wei'));

      toBN(_PTON.toFixed('wei')).sub(toBN(expectedPTON.toFixed('wei'))).abs()
        .should.be.bignumber.lte(e);

      totalSupply.should.be.bignumber.gte(
        totalTransferedPTON.toFixed('wei'),
        `${i}th purchaser cannot buy tokens more than total supply`,
      );

      const purchaser = purchasers[i];

      await this.sale.setCapAndPrice(purchaser, _ETH.toFixed('wei'), _PTON_ETH.toFixed('wei'));

      const { logs: logs1 } = await this.sale.buyTokens(purchaser, { from: purchaser, value: _ETH1.toFixed('wei') });

      expectEvent.inLogs(logs1, 'TokensPurchased', {
        purchaser: purchaser,
        beneficiary: purchaser,
        value: _ETH1.toFixed('wei'),
        // amount: _PTON1.toFixed('wei'),
      });

      (await this.token.balanceOf(purchaser)).sub(toBN(_PTON1.toFixed('wei'))).abs()
        .should.be.bignumber.lte(e);

      const { logs: logs2 } = await this.sale.buyTokens(purchaser, { from: purchaser, value: _ETH2.toFixed('wei') });

      expectEvent.inLogs(logs2, 'TokensPurchased', {
        purchaser: purchaser,
        beneficiary: purchaser,
        value: _ETH2.toFixed('wei'),
        // amount: _PTON2.toFixed('wei'),
      });

      const purchserBalance = await this.token.balanceOf(purchaser);

      purchserBalance.sub(toBN(_PTON.toFixed('wei'))).abs()
        .should.be.bignumber.lte(e);

      const result = [
        ['Funded ETH', _ETH.toString(10)],
        ['Trasnered PTON', PTON(purchserBalance.toString(10), 'wei').toString(10)],
      ];

      console.log(table(result, summaryConfig));

      totalFundedETH = totalFundedETH.plus(_ETH);
      totalTransferedPTON = totalTransferedPTON.plus(PTON(purchserBalance.toString(10), 'wei'));
    }

    console.log('Payments Summary');
    console.log('-'.repeat(115));

    const remains = PTON(await this.token.balanceOf(this.sale.address), 'wei');

    const summary = [
      ['Funded ETH', totalFundedETH.toString(10)],
      ['Trasnered PTON', totalTransferedPTON.toString(10)],
      ['Remained PTON', remains.toString(10)],
      ['Trasnered PTON (%)', (totalTransferedPTON.div(totalSupplyPTON).times(PTON('100'))).toFixed() + '%'],
    ];

    console.log(table(summary, summaryConfig));
  });
});
