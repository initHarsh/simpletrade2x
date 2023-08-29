    
let crypto = require('crypto')
const dotenv = require('dotenv')
dotenv.config()

let B = {
    apiKey : process.env.APIKEY ,
    secretKey : process.env.SECRETKEY  ,
    baseUrl : "https://testnet.binancefuture.com" ,

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
    let url = B.baseUrl + "/fapi/v1/ticker/price" + query

    let fetchOptions = {
        method: "GET"
    }

    let response = await fetch(url , fetchOptions)

    return response.json()
}



// get order detail by orderId
async function queryOrder(detail) {

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


 
// Fill market order 
async function newOrder(detail){

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

//  set stop loss and take profit order function 


async function setStopOrder(detail){

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



// cancel order by orderId
async function cancelOrder(detail) {

    let query = "symbol="+ detail.symbol 
    query += "&orderId=" + detail.orderId
    query += "&timestamp=" + Date.now()

    query += "&signature=" + createSignature(query)


    let url = B.baseUrl + "/fapi/v1/order" + "?" + query

    let fetchOptions = {
        method : "DELETE" ,
        headers : {
            "X-MBX-APIKEY" : B.apiKey ,
            "Content-Type" : "application/json"
        }
    }

    let response = await fetch( url , fetchOptions )

    return response.json()
}


module.exports = { getPrice , queryOrder , newOrder , setStopOrder , cancelOrder }

console.log(B)


 



