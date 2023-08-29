





async function checkUsersTradeStatus() {

    for(let i = 0; i < usersTrading.length; i++) {
        let idFound = findById(usersTrading[i])

        if (idFound.userFound == false) {
            removeUsersTradingList(usersTrading[i])

        } else if (idFound.user.latestTrade.progress == "PENDING") {
            await checkOrderStatus(idFound.user.latestTrade.symbolName, idFound.user.latestTrade.stopLossOrderId , idFound.user.latestTrade.takeProfitOrderId )

        } else {
            removeUsersTradingList(usersTrading[i])
        }
    }
}


async function checkOrderStatus(symbolName , stopLossOrderId , takeProfitOrderId , userId ){
    let stopLossOrderDetail = {
        symbol : symbolName ,
        orderId : stopLossOrderId
    }

    let takeProfitOrderDetail = {
        symbol : symbolName ,
        orderId : takeProfitOrderId
    }

    let stopLossOrder = await binance.queryOrder(stopLossOrderDetail)
    
    if (stopLossOrder.status == "FILLED") {
        await binance.cancelOrder(takeProfitOrderDetail)
    } 


    let takeProfitOrder = await binance.queryOrder(takeProfitOrderDetail)
    
    if (takeProfitOrder.status == "FILLED") {
        await binance.cancelOrder(stopLossOrderDetail)

        removeUsersTradingList(userId)
        userProfit(userId)
    } 

}

function userProfit(userId) {

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].latestTrade.progress = "PROFIT"
            users[i].tradeResultList.push(users[i].latestTrade)

            users[i].wallet.freeBalance += users[i].latestTrade.amountInr
            users[i].wallet.inOrder -= users[i].latestTrade.amountInr


            users[i].latestTrade = {}
            users[i].tradeInProgress = false

            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User profit')
            })
        
        }
    }
}

function userLoss(userId) {

    for(let i = 0; i < users.length; i++ ){
        if(users[i].id == userId) {

            users[i].latestTrade.progress = "LOSS"
            users[i].tradeResultList.push(users[i].latestTrade)

            
            users[i].wallet.inOrder -= users[i].latestTrade.amountInr


            users[i].latestTrade = {}
            users[i].tradeInProgress = false

            i = users.length

            fs.writeFile('users.json',JSON.stringify(users),(err)=>{
                if (err) throw err
                console.log('User Loss')
            })
        
        }
    }
}


// cjehck fnjck hjkhjj







