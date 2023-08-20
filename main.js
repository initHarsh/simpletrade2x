
// Modules 
const express=require('express')
const app=express()



//Server variables
const port = 3000
const dir = __dirname



//server modules uses
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(__dirname))


// Routes 

app.get('/',(req,res)=>{
    res.sendFile(dir+'/user.html')
})



// app.get('/stats',(req,res)=>{
//     res.sendFile(dir+'/stats.html')
// })




// Server listener
app.listen(port,()=>{
    console.log(`server started on port ${port}`)
})












