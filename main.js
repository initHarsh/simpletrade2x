
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


// App setting variables
let cookieExpireTime = 30 * 60 * 10000


//server modules uses
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(__dirname))



// Database 
let users = []
let usersTrading = []


// Load databases from files
fs.readFile('users.json','utf-8',(err,data)=>{
    if (err) {
        
    } else {
        users = JSON.parse(data)
        console.log('*** Loaded users from databases')
        console.log(" Total Users : "+ users.length)

    }
})

fs.readFile('usersTrading.json','utf-8',(err,data)=>{
    if (err) {
        
    } else {
        usersTrading = JSON.parse(data)
        console.log('*** Loaded users Trading from databases')
        console.log(" Users Trading : "+ usersTrading.length)

    }
})


// Database Functions 


function updateUsersTradingList(){
    fs.writeFileSync('usersTrading.json',JSON.stringify(usersTrading),(err)=>{
        if (err) throw err
        console.log('Updated Users Trading File, Total Users trading now : '+usersTrading.length)
    })
}

function addUser(user){
    users.push(user)

    fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
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
            let timeNow = new Date()
            users[i].depositHisory.push( { amount : depositAmount ,timeFormat : timeNow.toLocaleString() , time : Date.now()  } )

            result.depositDone = true

            // end loop
             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
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
             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
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
             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User trade unblocked ')
            })
        
        }
    }

}

// 

function addUsersTradingList(userId) {
    usersTrading.push(userId)
    console.log("Added a user to user trading list :" + userId)
    console.log("Users trading now : " + usersTrading.length)

    updateUsersTradingList()
}

function removeUsersTradingList(userId) {
    
    for(let i = 0; i < usersTrading.length ; i++) {
        if (usersTrading[i] == userId ) {
            //remove the user id
            usersTrading.splice(i,1)
        }
    }
    console.log("Removed a user to user trading list :" + userId)
    console.log("Users trading now : " + usersTrading.length)

    updateUsersTradingList()  
}




function addUserCookie(cookieHash,userId){
    let result = {
        cookieAdded: false
    }

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].cookie = {
                cookieHash: cookieHash,
                expireTime : Date.now() + cookieExpireTime ,
                
            }
            result.cookieAdded = true

             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
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
             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User trade Initiated')
            })
        
        }
    }
    

    //calculate quantity 
    let symbolName = "MATICUSDT"
    let symbolQuantityPrecision = 0
    let symbolPricePrecision = 4
    let leverage = 50
    let stopLossPercentage = 0.0120
    let takeProfitPercentage = 0.023 

    // let symbolName = "BTCUSDT"
    // let symbolQuantityPrecision = 3
    // let symbolPricePrecision = 2
    // let leverage = 50
    // let stopLossPercentage = 0.0125
    // let takeProfitPercentage = 0.023


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
        
  
        addUsersTradingList(userId)
        

        tradeStatus.status ="FILLED"
        tradeStatus.progress = "PENDING"
        tradeStatus.amountInr = amount
        tradeStatus.symbolName = symbolName
        tradeStatus.symbolQuantityCost = symbolQuantityCost
        tradeStatus.symbolQuantityCostInr = symbolQuantityCostInr

        tradeStatus.symbolQuantity = symbolQuantity
        tradeStatus.side = side
        tradeStatus.cumQuote = queryMainOrder.cumQuote
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
            users[i].latestTrade = tradeStatus

            // end loop
             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
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

//


function userProfit(userId , takeProfitOrder , operator) {

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            if (users[i].tradeInProgress == false) {
                return 
            }

            if (operator == "admin") {
                users[i].latestTrade.progress = "APROFIT"
                
            } else{
                 users[i].latestTrade.progress = "PROFIT"
            }
            let quantity = Number(users[i].latestTrade.symbolQuantity)
            let costOfTrade = quantity *  Number(users[i].latestTrade.avgPrice) 
            let profitOfTrade = quantity * Number(takeProfitOrder.avgPrice) 
            let profitAmount = profitOfTrade - costOfTrade
            let profitAmountInr = profitAmount * 90  

            if (users[i].latestTrade.side =="SELL") {
                profitAmountInr = profitAmountInr * -1
            }

            console.log(users[i].latestTrade.amountInr + " for Trade profit is "+ profitAmountInr )
            
            if (profitAmountInr < users[i].latestTrade.amountInr) {
                return
            }

            let returnAmount = Math.floor( users[i].latestTrade.amountInr * 0.95 )

            
            users[i].latestTrade.returnAmount = returnAmount
            users[i].tradeResultList.push(users[i].latestTrade)

            // double profit
            users[i].wallet.freeBalance += users[i].latestTrade.amountInr + returnAmount 
            users[i].wallet.totalProfits += returnAmount
            users[i].wallet.inOrder -= users[i].latestTrade.amountInr

            // referral income
            let referralAmount = Math.floor( users[i].latestTrade.amountInr *  0.05 )

            sendToReferrer(users[i].referrerId , users[i].codeUsed , referralAmount  )

            users[i].latestTrade = {}
            users[i].tradeInProgress = false

             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User profit')
            })
        
        }
    }
}

function userLoss(userId , stopLossOrder , operator)  {

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            if (users[i].tradeInProgress == false) {
                return 
            }

            if (operator == "admin") {
                users[i].latestTrade.progress = "ALOSS"
                
            } else{
                 users[i].latestTrade.progress = "LOSS"
            }

            let quantity = Number(users[i].latestTrade.symbolQuantity)
            let costOfTrade = quantity *  Number(users[i].latestTrade.avgPrice) 
            let lossOfTrade = quantity * Number(stopLossOrder.avgPrice) 
            let lossAmount = lossOfTrade - costOfTrade
            let lossAmountInr = lossAmount * 90  

            if (users[i].latestTrade.side == "SELL") {
                lossAmountInr = lossAmountInr * -1
            }

            let returnAmount = Math.floor(lossAmountInr - ( users[i].latestTrade.amountInr *  0.20))



            users[i].latestTrade.returnAmount = returnAmount
            
            // what is left 
            users[i].wallet.totalLosses += returnAmount 
            users[i].wallet.inOrder -= users[i].latestTrade.amountInr
            users[i].wallet.freeBalance += users[i].latestTrade.amountInr + returnAmount

            users[i].tradeResultList.push(users[i].latestTrade)   

            // referral income
            let referralAmount = Math.floor( users[i].latestTrade.amountInr *  0.05 )

            sendToReferrer(users[i].referrerId , users[i].codeUsed , referralAmount  )


            users[i].latestTrade = {}
            users[i].tradeInProgress = false

             


            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User Loss')
            })
        
        }
    }
}



// referral functions


function makeReferralCode(userId) {

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            if (users[i].referralCodes.length >= 4) {
                return 
            }

            if ( (users[i].tradeResultList.length % 2) == 0 ) {

                let referralCode = users[i].name.substring(0,3) + Math.floor(Math.random()*10000)
                users[i].referralCodes.push(referralCode)    

            } 



             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User new Refer code made')
            })
        
        }
    }
}

function findByReferralCode(code){

    let result = {
        userFound : false
     }

    for(let i = 0; i < users.length; i++ ){
        console.log()
        for (let j = 0; j <  users[i].referralCodes.length; j++) {
                          
            if ( users[i].referralCodes[j] == code ) {
                
                result.userFound = true
                result.user = users[i]
                // stop loop 
                
                 
            }

            
        }
    }

    return result
}

function removeReferralCode(userId , code, name , id ){
    for(let i = 0; i < users.length; i++ ){
        
        if (users[i].id == userId) {
            // stop loop
             

            for (let j = 0; j < users[i].referralCodes.length; j++) {
            
                if ( users[i].referralCodes[j] == code ) {
                    
                    users[i].referralCodes.splice(j,1)
                    
                    users[i].referralTeam.push({
                        time : Date.now() ,
                        code : code ,
                        name : name ,
                        id : id  ,
                        totalEarn : 0 ,
                        earnList : [] 
                    })
                    
                }
                
            }

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User refer code removed ' + code)
            })

        }

    }



}


function sendToReferrer(userId , code ,  amount ){

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            for (let j = 0; j < users[i].referralTeam.length ; j++ ) {
                if (users[i].referralTeam[j].code == code ) {
                    
                    users[i].referralTeam[j].totalEarn += amount
                    users[i].referralTeam[j].earnList.push({
                        amount : amount ,
                        time : Date.now() 
                    })

                    users[i].wallet.totalReferral += amount 
                    users[i].wallet.freeBalance += amount

                }

            }


             

            fs.writeFileSync('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User refer income deposited')
            })
        
        }
    }
}










// Routes 

app.get('/',(req,res)=>{
    res.sendFile(dir+'/home.html')
})


app.get('/signup',(req,res)=>{
    res.sendFile(dir+'/signup2.html')
})


// app.get('/signup2',(req,res)=>{
//     res.sendFile(dir+'/signup2.html')
// })

// app.get('/login2',(req,res)=>{
//     res.sendFile(dir+'/login2.html')
// })


app.get('/login',(req,res)=>{
    res.sendFile(dir+'/login2.html')
})

app.get('/user',checkCookie,(req,res)=>{
    res.sendFile(dir+'/user2.html')
})

app.get('/user2',(req,res)=>{
    res.sendFile(dir+'/user2.html')
})


app.get('/trade',checkCookie,(req,res) => {
    res.sendFile(dir + '/trade.html')
})


app.get('/deposit',checkCookie,(req,res) => {
    
    res.sendFile(dir + '/deposit.html')
})





// Post routesv  jhuibbbugn jkkjhjjljhvhjygm c jck 


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

    }else if (req.body.referralCode == "" || req.body.referralCode.length < 4) {
        errors += "Referral code can't be empty and must be 4 character long"

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



    // check if referral code is valid
    let referralFound = findByReferralCode(req.body.referralCode)

    if(req.body.referralCode == "admin" ){
        referralFound = { 
            user : {
                id : "admin" 
            } 
        }

    } else if (referralFound.userFound == false) {
        errors += "Invalid referral code"
    }
    

    
    // response
    if (!errors == "" ) {
        res.send( { status: "failed" , msg: errors} )
        console.log(errors)
    } else {
        let id = Math.random()
        
        let user = {
            id : id ,

            name : req.body.name,
            email : req.body.email,
            mobile : req.body.mobile,
            password : req.body.password,

            canPlaceTrade : true ,
            tradeInProgress : false,
            tradeList : [] ,
            tradeResultList : [],
            latestTrade : {} ,

            referrerId : referralFound.user.id ,
            codeUsed : req.body.referralCode , 
            referralCodes : [] ,
            referralTeam : [] ,

            wallet : {
                freeBalance : 0,
                inOrder : 0,
                totalDeposits : 0,
                totalWithdraws : 0,
                totalProfits : 0,
                totalLosses : 0 ,
                totalReferral : 0
            },

            depositHisory : [] ,
            withdrawHistory : [] ,

            cookie: {
                cookieHash: 0,
                expireTime: 1
            },

            registerTime : Date.now() ,
            regiterHeaders : req.headers,
            registerIp : req.ip
        }

        addUser(user)
        removeReferralCode( referralFound.user.id , req.body.referralCode , req.body.name , id)

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
        res.cookie("user",{ id: userId , hash : cookieHash} ,{maxAge:cookieExpireTime , httpOnly: true})

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

app.get('/data/user/info', dataCheckCookie ,(req,res)=>{
    let result = {
        name : res.locals.user.name ,
        wallet : res.locals.user.wallet
    }
    res.send({status : "passed" , msg : result })
})


app.get('/data/user/wallet', dataCheckCookie ,(req,res)=>{
    res.send({status : "passed" , msg : res.locals.user.wallet })
})

app.get('/data/user/trade', dataCheckCookie ,(req,res)=>{
    res.send({status : "passed" , msg : res.locals.user.latestTrade })
})

app.get('/data/user/trade-result', dataCheckCookie ,(req,res)=>{
    res.send({status : "passed" , msg : res.locals.user.tradeResultList })
})

app.get('/data/user/referral-codes', dataCheckCookie ,(req,res)=>{
    res.send({status : "passed" , msg : res.locals.user.referralCodes })
})

app.get('/data/user/referral-team', dataCheckCookie ,(req,res)=>{
    res.send({status : "passed" , msg : res.locals.user.referralTeam })
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

            referralCodes:emailFound.user.referralCodes,

            wallet : emailFound.user.wallet ,

            tradeInProgress : emailFound.user.tradeInProgress ,
            latestTrade : emailFound.user.latestTrade ,
            tradeList : emailFound.user.tradeList ,
            tradeResultList : emailFound.user.tradeResultList ,

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


app.post('/admin/user/resolve-trade/profit' , (req,res) => {
    console.log(req.body)

    if (!req.body.email || req.body.email == "" || !req.body.price) {
        res.send({ status:"failed" , msg: "provide email" })

    } else {
        emailFound = findByEmail(req.body.email)

        if (!emailFound.userFound) {
            res.send({ status:"failed" , msg: "Email not found" })
        } else {

            if(emailFound.user.tradeInProgress == false ){
                res.send({ status:"failed" , msg: "User Dont have a trade in progress" })
                
                return
            }

            userProfit(emailFound.user.id , {avgPrice:req.body.price} , "admin" )
            removeUsersTradingList(emailFound.user.id)
            makeReferralCode(emailFound.user.id)


            res.send({ status:"passed" , msg: "User Trade , resulted in profit  : " + emailFound.user.email  })
        
        }

    }
})


app.post('/admin/user/resolve-trade/loss' , (req,res) => {
    console.log(req.body)

    if (!req.body.email || req.body.email == "" || !req.body.price) {
        res.send({ status:"failed" , msg: "provide email" })

    } else {
        emailFound = findByEmail(req.body.email)

        if (!emailFound.userFound) {
            res.send({ status:"failed" , msg: "Email not found" })
        
        } else {

            if(emailFound.user.tradeInProgress == false ){
                res.send({ status:"failed" , msg: "User Dont have a trade in progress" })
                
                return
            }

            userLoss(emailFound.user.id , {avgPrice:req.body.price} , "admin" )
            removeUsersTradingList(emailFound.user.id)
            makeReferralCode(emailFound.user.id)


            res.send({ status:"passed" , msg: "User Trade , resulted in loss  : " + emailFound.user.email  })
        
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
    if (  req.body.amount >= 40 ) {
        
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







async function checkUsersTradeStatus() {
    console.log("checking user trades status")
    for(let i = 0; i < usersTrading.length; i++) {
        let idFound = findById(usersTrading[i])

        if (idFound.userFound == false) {
            removeUsersTradingList(usersTrading[i])

        } else if (idFound.user.latestTrade.progress == "PENDING") {
            await checkOrderStatus(
                idFound.user.latestTrade.symbolName,
                idFound.user.latestTrade.stopLossOrderId,
                idFound.user.latestTrade.takeProfitOrderId,
                usersTrading[i] 
            )

        } else {
            removeUsersTradingList(usersTrading[i])
        }
    }
}


async function checkOrderStatus(symbolName , stopLossOrderId , takeProfitOrderId , userId ){
    console.log(userId + " checking")
    let stopLossOrderDetail = {
        symbol : symbolName ,
        orderId : stopLossOrderId
    }

    let takeProfitOrderDetail = {
        symbol : symbolName ,
        orderId : takeProfitOrderId
    }

    let stopLossOrder = await binance.queryOrder(stopLossOrderDetail)
    console.log(stopLossOrder)
    if (stopLossOrder.status == "FILLED") {
        await binance.cancelOrder(takeProfitOrderDetail)

        
        userLoss(userId , stopLossOrder)
        removeUsersTradingList(userId)
        makeReferralCode(userId)

    } 


    let takeProfitOrder = await binance.queryOrder(takeProfitOrderDetail)
    console.log(takeProfitOrder)
    if (takeProfitOrder.status == "FILLED") {
        await binance.cancelOrder(stopLossOrderDetail)

        userProfit(userId, takeProfitOrder )
        removeUsersTradingList(userId)
        makeReferralCode(userId)
    } 

}



setInterval(checkUsersTradeStatus , 30000)




////  jjhb ghgh jjmn
