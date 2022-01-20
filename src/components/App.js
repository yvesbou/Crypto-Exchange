import React, { Component } from 'react'
import Web3 from 'web3'
import Token from '../abis/Token.json'
import EthSwap from '../abis/EthSwap.json'

import Navbar from './Navbar.js' 
import Main from './Main.js'
import './App.css'

class App extends Component {

  // will be automatically rendered
  async componentDidMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData(){
    const web3 = window.web3

    const accounts = await web3.eth.getAccounts()
    this.setState({'account': accounts[0]})
    
    const ethBalance = await web3.eth.getBalance(this.state.account)
    this.setState({'ethBalance': ethBalance})
    
    const networkId = await web3.eth.net.getId()
    const tokenData = Token.networks[networkId]
    if (tokenData) {
      const address = tokenData.address// where the smart contract lives (networkid = 5777 is from ganache)
      const abi = Token.abi  //abi tells how the functions of the smart contract look like
      const token = new web3.eth.Contract(abi, address)  // create a javascript version of the smartcontract for interaction
      this.setState({token: token})
      // in web3 two types of functions exist
      // call does request data form blockchain (without altering the blockchain)
      // send does alter the blockchain (making transactions) and thus costs gas fees
      let tokenBalance = await token.methods.balanceOf(this.state.account).call()
      this.setState({tokenBalance: tokenBalance.toString()})
    } else{
      window.alert('Token contract not deployed to connected network.')
    }

    const ethSwapData = EthSwap.networks[networkId]
    if (ethSwapData){
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address)
      this.setState({ethSwap: ethSwap})
    } else {
      window.alert('EthSwap contract not deployed to connected network.')
    }
    
    this.setState({loading: false})
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non ethereum browser encountered. Please connect to Metamask')
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({loading: true})
    this.state.ethSwap.methods.buyTokens()
                              .send({value: etherAmount, from: this.state.account})
                              .on('transactionHash', (hash) => {this.setState({loading: false})})
  }

  sellTokens = (tokenAmount) => {
    this.setState({loading:true})
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount)
                            .send({from: this.state.account})
                            .on('transactionHash', (hash) => {this.setState({loading: false})})

    this.state.ethSwap.methods.sellTokens(tokenAmount)
                              .send({from: this.state.account})
                              .on('transactionHash', (hash) => {this.setState({loading: false})})
  }

  constructor (props) {
    super(props)
    this.state = {
      'account': '',
      'ethBalance': '0',
      'token': {},
      'tokenBalance': '0',
      'ethSwap': {},
      loading: true
    }
  }

  render() {
    let content
    if (this.state.loading){
      content = <p id="loader" className="text center">Loading... </p>
    } else{
      content = <Main
        ethBalance={this.state.ethBalance}
        tokenBalance={this.state.tokenBalance}
        buyTokens={this.buyTokens}
        sellTokens={this.sellTokens}
        />
    }
    return (
      <div>
        <Navbar account={this.state.account}/>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>
                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
