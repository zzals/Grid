'use strict'
//import data from './json_data.js'; // type='module'
// console.log(data)
let json_data;
fetch("./sample.json")
.then(response => {
   return response.json();
})
.then(data => jcreateDiv(data));

function createDiv(data){
    let div = document.getElementById("div1");
    let civ = document.createElement("div")
    let civStr = ""
    console.log(div)
    for(let d of data){
        // let cciv =  document.createElement("div") 
        let cciv = civ.cloneNode()
        cciv.append(d.P_NAME)
        div.append(cciv)
    }

}

function jcreateDiv(data){
    for(let d of data){
        // let cciv =  document.createElement("div") 
        let cciv = $("<div>")
        cciv.append(d.P_NAME)
        $("#div1").append(cciv)
    }
}


function consolog(str){
    console.log(str);
}


consolog("123")

