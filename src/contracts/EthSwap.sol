// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.11;

import "./Token.sol";

contract EthSwap{
    string public name = "Instant EthSwap Exchange"; // state variable (lives on the blockchain)
    Token public token;
    uint public rate = 100;
    
    event TokensPurchased(
        address account,
        address token,
        uint amount,
        uint rate
    );

    event TokensSold(
        address account,
        address token,
        uint amount,
        uint rate
    );

    constructor(Token _token){
        token = _token; // _token is a local variable (not on the blockchain)
    }

    function buyTokens() public payable {

        uint tokenAmount = msg.value * rate;

        // require that eth swap has enough DApp tokens
        require(token.balanceOf(address(this)) >= tokenAmount);

        // if requirement fullfilled, this code gets executed

        // msg.sender = user
        token.transfer(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, address(token), tokenAmount, rate);
    }

    
    function sellTokens(uint _amount) public  { 

        require(token.balanceOf(msg.sender) >= _amount);

        uint etherAmount = _amount / rate;

        // require that ethswap has enough ether
        require(address(this).balance >= etherAmount);

        //from: msg.sender = user, to: address(this) = exchange, amount
        token.transferFrom(msg.sender, address(this), _amount);
        payable(msg.sender).transfer(etherAmount);

        emit TokensSold(msg.sender, address(token), etherAmount, rate);
    }
}