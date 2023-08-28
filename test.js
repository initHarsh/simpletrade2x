
    function precisonTo(number,precison) {

        let csplit = number.toString().split(".")

        csplit[csplit.length - 1] = csplit[csplit.length - 1].substring(0,precison) 

        let result = Number( csplit.join(".") )
        console.log(number , result , precison)
        return result
    }

    function convertToUsdt(amountInr){
        return ( amountInr / 90)
    }
    
    function convertToInrt(amountUsdt){
        return ( amountUsdt * 90)
    }

//     //Name of the file : sha256-hmac.js
// //Loading the crypto module in node.js
// var crypto = require('crypto');
// //creating hmac object 
// var hmac = crypto.createHmac('sha256', '2b5eb11e18796d12d88f13dc27dbbd02c2cc51ff7059765ed9821957d82bb4d9');
// //passing the data to be hashed
// data = hmac.update("symbol=BTCUSDT&side=BUY&type=LIMIT&quantity=1&price=9000&timeInForce=GTC&recvWindow=5000&timestamp=1591702613943");
// //Creating the hmac in the required format
// gen_hmac= data.digest('hex');
// //Printing the output on the console
// console.log("hmac : " + gen_hmac);

    

    



let crypto = require('crypto')

let B = {
    apiKey : "b3a954faf46c6e626117ae9a7eb540630154f2129104c7e58ffd837e109bfd34" ,
    secretKey : "f6f10851b0ddc7b1e54cbb0bc0f73c8dba0b35e27d80f4118c2612ec0c512193" ,
    baseUrl : "https://testnet.binancefuture.com" ,

}


function createSignature(query){
    let hmac = crypto.createHmac('sha256', B.secretKey);
    let data = hmac.update(query);
    let gen_hmac= data.digest('hex');

    return gen_hmac
}

async function getPrice(symbol){

    let query = "?symbol="+symbol
    let url = B.baseUrl + "/fapi/v1/ticker/price" + query

    let fetchOptions = {
        method: "GET",
        // headers : {
        //     "X-MBX-APIKEY" : B.apiKey 
        // }
    }

    let response = await fetch(url , fetchOptions)

    return response.json()
}

async function sss(){

    let amount = 100
    let symbolPrice = await getPrice("BTCUSDT")

    let usdt = convertToUsdt(amount)

    let leverage = 100

    let usdtBalance = usdt * leverage
    let usdtForFee = usdtBalance * 0.0005

    usdtBalance = usdtBalance - usdtForFee


    let symbolQuantity = usdtBalance / symbolPrice.price

    // get only precison upto 3 
    
    symbolQuantity = Math.floor(symbolQuantity)

    let symbolQuantityCost = symbolPrice.price * symbolQuantity

    
    console.log({
        amount: amount,
        usdtBalance: usdtBalance,
        usdtForFee: usdtForFee,
        symbolQuantity: symbolQuantity,
        symbolQuantityCost: symbolQuantityCost
    })

    let detail = {
        symbol : "BTCUSDT" ,
        side : "BUY" ,
        positionSide : "LONG" ,
        type : "MARKET" ,
        quantity : symbolQuantity ,

    }
    console.log(detail)

    let fillOrder = await binanceNewTrade(detail)
    console.log( fillOrder)

    let queryFillOrder = await getTradeDetail({ symbol : "BTCUSDT", orderId : fillOrder.orderId })
    console.log(queryFillOrder)


    let stopLossPrice = queryFillOrder.avgPrice - (queryFillOrder.avgPrice * 0.01  )
    stopLossPrice = precisonTo( stopLossPrice , 2 )
    let stopLossDetail = {
        symbol : "BTCUSDT" ,
        side : "SELL" ,
        positionSide : "LONG" ,
        type : "STOP_MARKET" ,
        timeInForce : "GTE_GTC" ,
        quantity : symbolQuantity ,
        stopPrice : stopLossPrice

    }

    let stopLossOrder = await setStopLossOrder(stopLossDetail)
    console.log(stopLossOrder)
 

    let takeProfitPrice = Number(queryFillOrder.avgPrice) + ( Number(queryFillOrder.avgPrice) * 0.01  )
    console.log(takeProfitPrice)
    takeProfitPrice = precisonTo( takeProfitPrice , 2 )
    let takeProfitDetail = {
        symbol : "BTCUSDT" ,
        side : "SELL" ,
        positionSide : "LONG" ,
        type : "TAKE_PROFIT_MARKET" ,
        timeInForce : "GTE_GTC" ,
        quantity : symbolQuantity ,
        stopPrice : takeProfitPrice

    }

    let takeProfitOrder = await setTakeProfitOrder(takeProfitDetail)
    console.log(takeProfitOrder)


}

sss()


async function getTradeDetail(detail) {

    let query = "symbol="+ detail.symbol 
    query += "&orderId=" + detail.orderId
    query += "&timestamp=" + Date.now()

    query += "&signature=" + createSignature(query)


    let url = B.baseUrl + "/fapi/v1/order" + "?" + query

    let fetchOptions = {
        method : "GET" ,
        headers : {
            "X-MBX-APIKEY" : B.apiKey ,
            "Content-Type" : "application/json"
        }
    }

    let response = await fetch( url , fetchOptions )

    return response.json()
}

async function binanceNewTrade(detail){

    let query = "symbol="+ detail.symbol 
    query += "&side=" + detail.side
    query += "&positionSide=" + detail.positionSide
    query += "&type=" + detail.type
    query += "&quantity=" + detail.quantity
    query += "&timestamp=" + Date.now()

    query += "&signature=" + createSignature(query)


    let url = B.baseUrl + "/fapi/v1/order" + "?" + query

    let fetchOptions = {
        method : "POST" ,
        headers : {
            "X-MBX-APIKEY" : B.apiKey ,
            "Content-Type" : "application/json"
        }
    }

    let response = await fetch( url , fetchOptions )

    return response.json()
}

async function setStopLossOrder(detail){

    let query = "symbol="+ detail.symbol 
    query += "&side=" + detail.side
    query += "&positionSide=" + detail.positionSide
    query += "&type=" + detail.type
    query += "&timeInForce=" + detail.timeInForce
    query += "&quantity=" + detail.quantity
    query += "&stopPrice=" + detail.stopPrice
    query += "&timestamp=" + Date.now()

    query += "&signature=" + createSignature(query)


    let url = B.baseUrl + "/fapi/v1/order" + "?" + query

    let fetchOptions = {
        method : "POST" ,
        headers : {
            "X-MBX-APIKEY" : B.apiKey ,
            "Content-Type" : "application/json"
        }
    }

    let response = await fetch( url , fetchOptions )

    return response.json()
}



async function setTakeProfitOrder(detail){

    let query = "symbol="+ detail.symbol 
    query += "&side=" + detail.side
    query += "&positionSide=" + detail.positionSide
    query += "&type=" + detail.type
    query += "&timeInForce=" + detail.timeInForce
    query += "&quantity=" + detail.quantity
    query += "&stopPrice=" + detail.stopPrice
    query += "&timestamp=" + Date.now()

    query += "&signature=" + createSignature(query)


    let url = B.baseUrl + "/fapi/v1/order" + "?" + query

    let fetchOptions = {
        method : "POST" ,
        headers : {
            "X-MBX-APIKEY" : B.apiKey ,
            "Content-Type" : "application/json"
        }
    }

    let response = await fetch( url , fetchOptions )

    return response.json()
}





