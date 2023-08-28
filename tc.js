

function precisionTo(number,precison) {

    let result 
    let csplit = number.toString().split(".")

    if (precison == 0) {
        result = Math.floor(number)

    } else if (csplit.length == 1 ) {
        result = number

    } else {
        csplit[1] = csplit[1].substring(0,precison) 
        result = Number( csplit.join(".") )
    }


    console.log(number , result , precison)
    return result
}



module.exports = { precisionTo }
console.log(module)