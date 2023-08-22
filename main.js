
// Modules 
const express = require('express')
const app = express()
const fs = require('fs')
var cookieParser = require('cookie-parser')



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
    }

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


// Server listener
app.listen(port,()=>{
    console.log(`server started on port ${port}`)
})












