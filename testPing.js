let crypto = require('crypto')
const dotenv = require('dotenv')
dotenv.config()

let B = {
    apiKey : process.env.APIKEY ,
    secretKey : process.env.SECRETKEY  ,
    baseUrl : process.env.BASEURL ,

}



// create signautre function
function createSignature(query){
    let hmac = crypto.createHmac('sha256', B.secretKey);
    let data = hmac.update(query);
    let gen_hmac= data.digest('hex');

    return gen_hmac
}



// get price function   
async function getPrice(symbol){

    let query = "?symbol="+symbol
    let url = "https://fapi.binance.com" + "/fapi/v1/ticker/price" + query

    let fetchOptions = {
        method: "GET"
    }

    let response = await fetch(url , fetchOptions)

    return response.json()
}

// get price function   
async function getBalance(){

    let query = "timestamp=" + Date.now()

    query += "&signature=" + createSignature(query)

    let url = B.baseUrl + "/fapi/v2/balance" + "?"+ query

    let fetchOptions = {
        method: "GET" ,
        headers : {
            "X-MBX-APIKEY" : B.apiKey 
        }
    }

    let response = await fetch(url , fetchOptions)

    return response.json()
}



async function test() {
    console.log( await getPrice("MATICUSDT"))
    console.log( await getBalance())

    
}

test()




















async function getPoolData(){
    let bodyres = { 
        "method":"eth_call",
        "params":
        [
            {
                "from":"0x7df206c9608bc86b46fb97109de0f6c0e676a547",
                "to":"0xc36442b4a4522e871399cd717abdd847ab11fe88",
                "data":"0xfc6f786500000000000000000000000000000000000000000000000000000000000fd8bd0000000000000000000000007df206c9608bc86b46fb97109de0f6c0e676a54700000000000000000000000000000000ffffffffffffffffffffffffffffffff00000000000000000000000000000000ffffffffffffffffffffffffffffffff"
            },
            "latest"
        ],
        "id":47,
        "jsonrpc":"2.0"
    }

    let a = await fetch("https://polygon-mainnet.infura.io/v3/099fc58e0de9451d80b18d7c74caa7c1", {
    "headers": {
        "origin" : "https://app.uniswap.org/",
        "Content-Type": "application/json"
    },
    "body": JSON.stringify(bodyres),
    "method": "POST",
    });
    return await a.json()
}
//
async function convertToReadable(){
    let response = await getPoolData()
    let MaticPrice =  await getPrice("MATICUSDT")

    let l1 = response.result.substring(0,66)
    let l2 = "0x" +response.result.substring(66 , response.result.length)
    console.log(l1 * 1/ Math.pow(10,18))
    console.log(l2 * 1/ Math.pow(10,6))
    console.log( "Matic Price : " + MaticPrice.price )


    console.log(  "Total fee collected : $" +( (l1 * 1/ Math.pow(10,18)) * Number(MaticPrice.price) + (l2 * 1/ Math.pow(10,6)) ) )
}


convertToReadable()






// // async function tests(){

// const uni = require("@uniswap/v3-sdk");
// // const { Position } = require("@uniswap/v3-sdk");
// // const { ethers } = require("ethers");
// // const { BigNumber } = require("@ethersproject/bignumber");


// // const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1);

// // /* GET POSITION LIQUIDITY */
// // // const USDEURPool = new Pool(tokenUSD, 
// // //                             tokenEUR, 
// // //                             Number.parseInt(immutables.fee), 
// // //                             state.sqrtPriceX96.toString(), 
// // //                             state.liquidity.toString(), 
// // //                             Number.parseInt(state.tick) );

// async function dd(){
//     let a = new uni.NonfungiblePositionManager.INTERFACE.getFunction("positions")
//     console.log(a())
//     // const positionInfo = await INonfungiblePositionManager.positions(1058);
//     // console.log( await positionInfo)
    
    
// }

// dd()

// }

// tests()

// tetss kh  j jn