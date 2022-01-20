// to run the test write "truffle test" inside your console (ganache set up and running)


const { assert } = require('chai');
const { default: Web3 } = require('web3');

const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n){
    return web3.utils.toWei(n, 'ether');
}

contract('EthSwap', ([deployer, investor]) => {
    let token, ethSwap

    before(async ()=> {
        token = await Token.new()
        ethSwap = await EthSwap.new(token.address)
        await token.transfer(ethSwap.address, tokens('1000000'))
    })

    describe('Token deployment', async () => {
        it('contract has a name', async () => {

            const name = await token.name()
            assert.equal(name, 'DApp Token')
        })
    })

    describe('EthSwap deployment', async () => {
        it('contract has a name', async () => {
            const name = await ethSwap.name()
            assert.equal(name, 'Instant EthSwap Exchange')
        })

        it('contract has balance', async () =>{
            let balance = await token.balanceOf(ethSwap.address)
            assert.equal(balance, tokens('1000000'))

        })
    })

    describe('buyTokens()', async () => {
        let result

        before(async ()=> {
            result = await ethSwap.buyTokens({from: investor, value: web3.utils.toWei('1', 'ether')})
        })

        it('allows user to buy token for a fixed price', async () => {
            let investorBalance = await token.balanceOf(investor)
            assert.equal(investorBalance.toString(), tokens('100'))

            let ethSwapBalanceDAppToken = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapBalanceDAppToken.toString(), tokens('999900'))

            let ethSwapBalanceEth = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapBalanceEth.toString(), web3.utils.toWei('1', 'Ether'))

            // check if event emits the correct numbers
            const event = result.logs[0].args
            assert.equal(event.account, investor)
            assert.equal(event.token, token.address)
            assert.equal(event.amount, tokens('100'))
            assert.equal(event.rate, '100')

        })
    })

    describe('sellTokens()', async () => {
        let result

        before(async ()=> {
            // investor must approve selling the tokens
            await token.approve(ethSwap.address, tokens('100'), {from: investor})
            // investor sells the tokens
            result = await ethSwap.sellTokens(tokens('100'), {from: investor})
        })

        it('allows user to sell token to EthSwap for a fixed price', async () => {
            let investorBalance = await token.balanceOf(investor)
            assert.equal(investorBalance.toString(), tokens('0'))

            
            let ethSwapBalanceDAppToken = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapBalanceDAppToken.toString(), tokens('1000000'))
            let ethSwapBalanceEth = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapBalanceEth.toString(), web3.utils.toWei('0', 'Ether'))

            const event = result.logs[0].args
            assert.equal(event.account, investor)
            assert.equal(event.token, token.address)
            assert.equal(event.amount, tokens('1'))
            assert.equal(event.rate, '100')

            // FAILURE: the investor wants to sell more tokens than she actually has
            await ethSwap.sellTokens(tokens('500'), {from: investor}).should.be.rejected
        })
    })
})

