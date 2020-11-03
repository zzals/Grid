'use strict'
//import data from './json_data.js'; // type='module'
// console.log(data)
let json_data;
fetch("./sample.json")
.then(response => {
   return response.json();
})
.then(data => setGrid(data));

function createDiv(data){
    let div = document.querySelector("#div1");
    let civ = document.createElement("div")
    let civStr = ""
    let list = data.slice(0,20)
    console.log(list)
    for(let d of list){
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


function setGrid(data){
    let list = data.slice(0,100)
    let gdata = {
        json : list,	
        option : { use : false
            ,search : false
            ,favorite : false
            ,unit : {use:false}
        },
        paging : {use : true},
        column : [
          {caption:"No", size:30, clas:'No', unit : ''},
          {field:"P_NAME", caption:"NAME", name:"", unit : ''},
          {field:"GENDER", caption:"GENDER", name:"", unit : ''},
          {field:"BIRTH_DT", caption:"BIRTHDAY", name:"", unit : ''},
          {field:"HEIGHT", caption:"HEIGHT", name:"", unit : ''}
            ]
    };
    let grid = $("#div1").seGrid(gdata);	
    console.log(grid)

}


consolog("123")

