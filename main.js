
// Modules 
const express = require('express')
const app = express()
const fs = require('fs')
var cookieParser = require('cookie-parser')
var crypto = require('crypto');
const { queryOrder } = require('./binance');


const { precisionTo } = require(__dirname+'/tc.js')

const binance = require(__dirname+"/binance.js")

//Server variables
const port = 3000
const dir = __dirname



//server modules uses
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(__dirname))



// Database 
let users = []



// Load databases from files
fs.readFile('users.json','utf-8',(err,data)=>{
    if (err) {
        
    } else {
        users = JSON.parse(data)
        console.log('*** Loaded users from databases')
        console.log(" Total Users : "+ users.length)

    }
})



// Database Functions 

function addUser(user){
    users.push(user)

    fs.writeFile('users.json',JSON.stringify(users),(err)=>{
        if (err) throw err
        console.log('New user Added')
        console.log(" Total Users : "+ users.length)
    })

}

// 


function addUserDeposit(userId , depositAmount ) {
    let result = {
        depositDone : false
    }

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].wallet.freeBalance += depositAmount
            users[i].wallet.totalDeposits += depositAmount

            result.depositDone = true

            // end loop
            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User deposited amount : '+ depositAmount)
            })
        
        }
    }

    return result

}


function findByEmail(email){

    let result = {
        userFound : false
     }

    for(let i = 0; i < users.length; i++ ){
        if(users[i].email == email) {

            result.userFound = true
            result.user = users[i]
            // stop loop
            i = users.length
        }
    }
    return result
}


function findByMobile(mobile){

    let result = {
        userFound : false
     }

    for(let i = 0; i < users.length; i++ ){
        if(users[i].mobile == mobile) {

            result.userFound = true
            result.user = users[i]
            // stop loop
            i = users.length
        }
    }
    return result
}

function findById(id){

    let result = {
        userFound : false
     }

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == id) {

            result.userFound = true
            result.user = users[i]
            // stop loop
            i = users.length
        }
    }
    return result
}


// admin functions

function blockUserTrade(userId) {

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].canPlaceTrade = false

            // end loop
            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User trade blocked ')
            })
        
        }
    }

}


function unblockUserTrade(userId) {

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].canPlaceTrade = true

            // end loop
            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User trade unblocked ')
            })
        
        }
    }

}






function addUserCookie(cookieHash,userId){
    let result = {
        cookieAdded: false
    }

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].cookie = {
                cookieHash: cookieHash,
                expireTime : Date.now() + 300000,
                
            }
            result.cookieAdded = true

            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User Cookie Updated')
            })
        
        }
    }



    return result
 
}




// cookie authenticator

function checkCookie(req,res,next){

    if (!req.cookies.user) {
        res.redirect('/login')
        return
    } 
    
    let idFound = findById(req.cookies.user.id)

    if(idFound.userFound == false ){
        res.redirect('/login')
        console.log('cookie user not found')

    } else if (idFound.user.cookie.cookieHash == req.cookies.user.hash) {
        if (idFound.user.cookie.expireTime < Date.now() ) {
        res.redirect('/login')
            console.log('cookie expired')
        
        } else {
            next()
            console.log("cookie accepted")
        }
    } else {
        res.redirect('/login')
    }

}


// trade functions

// trade functions 

function convertToUsdt(amountInr){
    return ( amountInr / 90)
}

function convertToInr(amountUsdt){
    return ( amountUsdt * 90)
}

async function placeTrade(userId , side , amount) {
    let result = {}


    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].tradeInProgress = true
            users[i].wallet.freeBalance -= amount
            users[i].wallet.inOrder += amount

            // end loop
            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User trade Initiated')
            })
        
        }
    }
    

    // calculate quantity 
    // let symbolName = "MATICUSDT"
    // let symbolQuantityPrecision = 0
    // let symbolPricePrecision = 4
    // let leverage = 50
    // let stopLossPercentage = 0.017
    // let takeProfitPercentage = 0.023

    let symbolName = "BTCUSDT"
    let symbolQuantityPrecision = 3
    let symbolPricePrecision = 2
    let leverage = 50
    let stopLossPercentage = 0.017
    let takeProfitPercentage = 0.023


    let symbolPrice = await binance.getPrice(symbolName)

    let usdt = convertToUsdt(amount)

    let usdtBalance = usdt * leverage
    // hold 0.05% for fee
    let usdtForFee = usdtBalance * 0.0005

    usdtBalance = usdtBalance - usdtForFee


    let symbolQuantity = usdtBalance / Number(symbolPrice.price)

    // get price precison to : 0
    symbolQuantity = precisionTo( symbolQuantity , symbolQuantityPrecision)

    let symbolQuantityCost = Number(symbolPrice.price) * symbolQuantity
    let symbolQuantityCostInr = convertToInr(symbolQuantityCost)

    console.log({
        amount,
        usdtBalance,
        usdtForFee,
        symbolQuantity,
        symbolQuantityCost
    })

    let positionSide = "LONG"
    let sideReverse = "SELL"

    if (side == "SELL") {
        positionSide = "SHORT"
        sideReverse = "BUY"
    } 

    let orderDetail = {
        symbol : symbolName ,
        side : side ,
        positionSide : positionSide ,
        type : "MARKET" ,
        quantity : symbolQuantity ,

    }

    console.log(orderDetail)
    let mainOrder = await binance.newOrder(orderDetail)
    console.log(mainOrder)

    let queryMainOrder = await binance.queryOrder({symbol : symbolName , orderId : mainOrder.orderId})
    console.log(queryMainOrder)


    // configure stop loss and take profit
    let stopLossPrice 
    let takeProfitPrice

    if (side == "BUY") {
        stopLossPrice = Number(queryMainOrder.avgPrice) - ( Number(queryMainOrder.avgPrice) * stopLossPercentage )
        takeProfitPrice = Number(queryMainOrder.avgPrice) + ( Number(queryMainOrder.avgPrice) * takeProfitPercentage )
        stopLossPrice = precisionTo(stopLossPrice , symbolPricePrecision)
        takeProfitPrice = precisionTo(takeProfitPrice , symbolPricePrecision)


    } else {
        stopLossPrice = Number(queryMainOrder.avgPrice) + ( Number(queryMainOrder.avgPrice) * stopLossPercentage )
        takeProfitPrice = Number(queryMainOrder.avgPrice) - ( Number(queryMainOrder.avgPrice) * takeProfitPercentage )
        stopLossPrice = precisionTo(stopLossPrice , symbolPricePrecision)
        takeProfitPrice = precisionTo(takeProfitPrice , symbolPricePrecision)
    }

    // send stop loss order

    let stopLossDetail = {
        symbol : symbolName ,
        side : sideReverse ,
        positionSide : positionSide ,
        type : "STOP_MARKET" ,
        timeInForce : "GTE_GTC" ,
        quantity : symbolQuantity ,
        stopPrice : stopLossPrice

    }
    console.log(stopLossDetail)
    let stopLossOrder = await binance.setStopOrder(stopLossDetail)
    console.log(stopLossOrder)
 

    // send take profit order


    let takeProfitDetail = {
        symbol : symbolName ,
        side : sideReverse ,
        positionSide : positionSide ,
        type : "TAKE_PROFIT_MARKET" ,
        timeInForce : "GTE_GTC" ,
        quantity : symbolQuantity ,
        stopPrice : takeProfitPrice

    }
    console.log(takeProfitDetail)
    let takeProfitOrder = await binance.setStopOrder(takeProfitDetail)
    console.log(takeProfitOrder)

    let tradeStatus = {}
    if ( queryMainOrder.status == "FILLED" && stopLossOrder.status == "NEW" && takeProfitOrder.status == "NEW") {
        tradeStatus.status ="FILLED"
        tradeStatus.progress = "PENDING"
        tradeStatus.amountInr = amount
        tradeStatus.symbolQuantityCost = symbolQuantityCost
        tradeStatus.symbolQuantityCostInr = symbolQuantityCostInr

        tradeStatus.symbolQuantity = symbolQuantity
        tradeStatus.side = side
        tradeStatus.avgPrice = queryMainOrder.avgPrice
        tradeStatus.stopLossPrice = stopLossOrder.stopPrice
        tradeStatus.takeProfitPrice = takeProfitOrder.stopPrice 

        tradeStatus.mainOrderId = queryMainOrder.orderId
        tradeStatus.stopLossOrderId = stopLossOrder.orderId
        tradeStatus.takeProfitOrderId= takeProfitOrder.orderId 


        tradeStatus.orderTime = Date.now()

        tradeStatus.orderDetails = [mainOrder, queryMainOrder , stopLossOrder ,takeProfitOrder]

    } else {
        tradeStatus.staus = "FAILED"
        tradeStatus.errors = [ mainOrder, queryMainOrder , stopLossOrder ,takeProfitOrder]
    }


    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {


            users[i].tradeList.push(tradeStatus)
            users[i].latestTade = tradeStatus

            // end loop
            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User trade placed')
            })
        
        }
    }

    // let trade = binanceFillTrade(userId ,side , amount ) 

    // if (trade.filledAll == true) {
        
    // } else {
    //     result.status ="failed"
    //     return result
    // }


}






// Routes 

app.get('/',(req,res)=>{
    res.sendFile(dir+'/home.html')
})


app.get('/signup',(req,res)=>{
    res.sendFile(dir+'/signup.html')
})


app.get('/login',(req,res)=>{
    res.sendFile(dir+'/login.html')
})

app.get('/user',checkCookie,(req,res)=>{
    res.sendFile(dir+'/user.html')
})

app.get('/trade',checkCookie,(req,res) => {
    res.sendFile(dir + '/trade.html')
})



// Post routes


app.post('/signup',(req,res)=>{
    console.log(req.body)
    
    let errors = ""
    // check if any property is empty 

    if (req.body.name == "" || req.body.name.length < 3) {
        errors += "Name can't be empty and must be 3 character long"

    } else if (req.body.email == "" || req.body.email.length < 4) {
        errors += "Email can't be empty and must be 4 character long"

    }else if (req.body.mobile == "" || req.body.mobile.length < 4) {
        errors += "Mobile number can't be empty and must be 4 character long"

    }else if (req.body.password == "" || req.body.password.length < 4) {
        errors += "Password can't be empty and must be 4 character long"

    }
    
    // check if email or mobile already exist 
    if (errors == "" ) {
        let emailFound = findByEmail(req.body.email)
        let mobileFound = findByMobile(req.body.mobile)

        
        if(emailFound.userFound == true){
            errors += "Email already registered"

        } else if(mobileFound.userFound == true){
            errors += "Mobile Number already registered"

        }
    }


    
    // response
    if (!errors == "" ) {
        res.send( { status: "failed" , msg: errors} )
        console.log(errors)
    } else {

        let user = {
            id : Math.random(),

            name : req.body.name,
            email : req.body.email,
            mobile : req.body.mobile,
            password : req.body.password,

            canPlaceTrade : true ,
            tradeInProgress : false,
            tradeList : [] ,
            latestTade : {} ,

            wallet : {
                freeBalance : 0,
                inOrder : 0,
                totalDeposits : 0,
                totalWitdraws : 0,
                totalProfits : 0,
                totalLosses : 0
            },

            cookie: {
                cookieHash: 0,
                expireTime: 1
            },

            registerTime : Date.now() ,
            regiterHeaders : req.headers,
            registerIp : req.ip
        }

        addUser(user)

        res.send( { status: "passed" , msg: "Registered" , redirect: true , redirectLink: "/login"} )
    }

})


app.post('/login',(req,res) => {
    console.log(req.body)

    let errors = ""
    let loginUser = false
    let userId

    // check if any property is empty 

    if (req.body.email == "" ) {
        errors += "Please enter a vaild Email"

    }else if (req.body.password == "" || req.body.password.length < 4) {
        errors += "Please enter a valid Password"

    }
    


    // check if email exist (only when there are no errors)
    if (errors == "") {
        let emailFound = findByEmail(req.body.email)

        if (emailFound.userFound == true) {
            
            if (emailFound.user.password == req.body.password) {
                userId = emailFound.user.id
                loginUser = true
            } else {
                errors += "Email or Password is incorrect"
            }

        } else {
            errors += "Email or Password is incorrect"
        }
    }


    // response
    if (!errors == "") {
        res.send({ status: "failed", msg: errors })
        console.log(errors)

    } else if (loginUser == true) {

        let cookieHash = Math.random()

        addUserCookie(cookieHash , userId)
        res.cookie("user",{ id: userId , hash : cookieHash} ,{maxAge:600000 , httpOnly: true})

        res.send({ status: "passed" , msg: "Loged In" , redirect: true , redirectLink: "/user"})
        
    }


})





// data route protector

function dataCheckCookie(req,res,next){


    if (!req.cookies.user) {
        res.send({staus : "failed" , msg :  "No cookie" , redirect : true , redirectLink : "/login"})
        console.log("No cookie")
        return
    } 
    
    let idFound = findById(req.cookies.user.id)

    if(idFound.userFound == false ){
        res.send({staus : "failed" , msg :  "No cookie" , redirect : true , redirectLink : "/login"})
        console.log('cookie user not found')

    } else if (idFound.user.cookie.cookieHash == req.cookies.user.hash) {

        if (idFound.user.cookie.expireTime < Date.now() ) {

            res.send({staus : "failed" , msg :  "No cookie" , redirect : true , redirectLink : "/login"})
            console.log('cookie expired')
     
        } else {
            res.locals.user = idFound.user
            console.log( res.locals)
            console.log("cookie accepted")
            next()
        }
    }


}



// data routes


app.get('/data/user/wallet', dataCheckCookie ,(req,res)=>{
    res.send({status : "passed" , msg : res.locals.user.wallet })
})

app.get('/data/user/trade', dataCheckCookie ,(req,res)=>{
    res.send({status : "passed" , msg : res.locals.user.latestTade })
})




// Admin routes

app.get('/admin', (req,res) => {
    res.sendFile(dir+'/admin.html')
    
})

// Admin data routes 

app.post('/admin/query/user',(req,res) => {

    if(req.body.email == ""|| !req.body.email ){
        res.send({ status:"failed" , msg: "Please send a valid email : "+req.body.email })
        return
    }

    let emailFound = findByEmail(req.body.email)

    if (emailFound.userFound == false) {
        res.send({ status:"failed" , msg:"No user found with this email : "+req.body.email })
        return

    } else {
        let userDetails = {
            name : emailFound.user.name , 
            email : emailFound.user.email ,
            mobile : emailFound.user.mobile ,
            password : emailFound.user.password ,

            canPlaceTrade : emailFound.user.canPlaceTrade ,

            wallet : emailFound.user.wallet ,

            tradeInProgress : emailFound.user.tradeInProgress ,
            latestTade : emailFound.user.latestTade ,
            tradeList : emailFound.user.tradeList ,

            registerTime : emailFound.user.registerTime
        }
        res.send({ status:"passed" , msg: userDetails })
        
    }
})

// update data routes



app.post('/admin/add/deposit',(req,res) => {
    console.log(req.body)

    if (!req.body.email || req.body.email == "" ) {
        res.send({ status:"failed" , msg: "provide email" })

    } else if (!req.body.amount) {
        res.send({ status:"failed" , msg: "provide deposit amount" })

    } else {
        emailFound = findByEmail(req.body.email)

        if (!emailFound.userFound) {
            res.send({ status:"failed" , msg: "Email not found" })
        } else {
            addUserDeposit(emailFound.user.id , parseInt(req.body.amount) )
            res.send({ status:"passed" , msg: "Amount deposited " })
        }

    }
})


app.post('/admin/block/user-trade' , (req,res) => {
    console.log(req.body)

    if (!req.body.email || req.body.email == "" ) {
        res.send({ status:"failed" , msg: "provide email" })

    } else {
        emailFound = findByEmail(req.body.email)

        if (!emailFound.userFound) {
            res.send({ status:"failed" , msg: "Email not found" })
        } else {
            blockUserTrade(emailFound.user.id )
            res.send({ status:"passed" , msg: "User Trade , is now Blocked : " + emailFound.user.email  })
        }

    }
})



app.post('/admin/unblock/user-trade' , (req,res) => {
    console.log(req.body)

    if (!req.body.email || req.body.email == "" ) {
        res.send({ status:"failed" , msg: "provide email" })

    } else {
        emailFound = findByEmail(req.body.email)

        if (!emailFound.userFound) {
            res.send({ status:"failed" , msg: "Email not found" })
        } else {
            unblockUserTrade(emailFound.user.id )
            res.send({ status:"passed" , msg: "User Trade , is now Unblocked : " + emailFound.user.email  })
        }

    }
})




// trade routes 

app.post("/user/new-trade" , dataCheckCookie , (req,res) => {

    // Check if side parameter is wrong 
    if ( req.body.side == "BUY" || req.body.side == "SELL" ) {
        
    } else {
        res.send( { status : "failed" , msg : "Side parameter is not correct" } )
        return 
    }

    // Check if amount parameter is wrong 
    if ( typeof req.body.amount == "number" && req.body.amount > 0 ) {
        
    } else {
        res.send( { status : "failed" , msg : "Amount parameter is not correct" } )
        return
    }

    // Check if amount is greater than 100
    if (  req.body.amount >= 100 ) {
        
    } else {
        res.send( { status : "failed" , msg : "Amount must be greater than 100" } )
        return
    }

    // Check if user is allowed to place trade 
    if ( res.locals.user.canPlaceTrade == true ) {
        
    } else {
        res.send( { status : "failed" , msg : "User is not allowed to place trade" } )
        return
    }

    // Check if user has any trade in progress  
    if ( res.locals.user.tradeInProgress == false ) {
        
    } else {
        res.send( { status : "failed" , msg : "You already have a trade in progress , cant place new trade" } )
        return
    }

    // Check if user has enough freebalance  

    if ( res.locals.user.wallet.freeBalance >= req.body.amount ) {
        
    } else {
        res.send( { status : "failed" , msg : "You dont have enough balance for this trade" } )
        return
    }


    placeTrade( res.locals.user.id , req.body.side , req.body.amount )

    res.send({ status : "passed" , msg  : "Trade submitted , refresh if trade doesnt update" })

})


// Server listener
app.listen(port,()=>{
    console.log(`server started on port ${port}`)
})












