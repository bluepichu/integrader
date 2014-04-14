operators = ["+", "-", "*", "/", " "];
leftParens = ["(", "[", "{"]
rightParens = [")", "]", "}"]

separators = [].concat(operators).concat(leftParens).concat(rightParens);

var inputToLatex = function(input){
    if(input.indexOf("\\") >= 0){
        return "Contains unsopported characters.";
    }
    var arr = [input];
    var parenStack = [];
    
    //separate operators and parens
    
    for(var i = 0; i < separators.length; i++){
        var arr2 = [];
        for(var j = 0; j < arr.length; j++){
            arr3 = arr[j].split(separators[i]);
            for(var k = 0; k < arr3.length; k++){
                arr2.push(arr3[k]);
                if(k < arr3.length-1){
                    arr2.push(separators[i]);
                }
            }
        }
        arr = arr2;
    }
    
    //cleanup empty spots
    
    arr2 = []
    
    for(var i = 0; i < arr.length; i++){
        if(arr[i] != ""){
            arr2.push(arr[i]);
        }
    }
    
    arr = arr2;
    
    //group parens
    
    for(var i = 0; i < arr.length; i++){
        index = leftParens.indexOf(arr[i]);
        if(index >= 0){
            parenStack.push([index, i]);
        } else {
            index = rightParens.indexOf(arr[i]);
            if(index >= 0){
                if(parenStack[parenStack.length-1][0] == index){
                    arr.splice(parenStack[parenStack.length-1][1], 2, arr.splice(parenStack[parenStack.length-1][1]+1, i-1-parenStack[parenStack.length-1][1]));
                    info = parenStack.pop();
                    i = info[1];
                    arr[i] = ["\\left" + leftParens[index]].concat(arr[i]).concat(["\\right" + rightParens[index]]);
                } else {
                    return "Mismatched paren error.";
                }
            }
        }
    }
    
    if(parenStack.length > 0){
        return "Mismatched paren error.";
    }
    
    //parse
    
    parse(arr);
    
    return "$$" + arr.join("") + "$$";
}

var parse = function(arr){
    if(typeof(arr) == "string"){
        arr = [arr];
    }
    
    for(var i = 0; i < arr.length; i++){
        if(typeof(arr[i]) == "object"){
            arr[i] = parse(arr[i]);
        }
        if(arr[i] == "*"){
            arr[i] = "\\times";
        }
        if(arr[i] == "/"){
            arr2 = arr.splice(i-1, 3);
            arr.splice(i-1, 0, "\\frac{", arr2[0], "}{", arr2[2], "}");
        }
    }
    
    console.log(arr);
    
    return arr.join("");
}