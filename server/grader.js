var mathjs = require("mathjs");
var math = mathjs();
var steps =4;
var variables = ["a_0","b","beta"];
var range = [[2,5],[5,8],[8,11]];
var eq1 = "a_0(b)/beta";
var eq2="a_0*(b)/beta";


var compare = function(equation1,equation2,variables,values){
	var instructions1 =[];
	var instructions2 =[];
	var len=variables.length;
	for(var i = 0; i<len;i++)
	{
		instructions1.push(variables[i]+"="+values[i]);
		instructions2.push(variables[i]+"="+values[i]);
	}
	instructions1.push("round("+implicitMultiplication(equation1)+",3)");
	instructions2.push("round("+implicitMultiplication(equation2)+",3)");
    console.log(instructions1);
    console.log(instructions2);
	console.log((math.eval(instructions1)[len]+", "+(math.eval(instructions2)[len])))
	return ((math.eval(instructions1)[len])==(math.eval(instructions2)[len]))
}

var getAllIndexes = function(str){
	var openParens=[];
	var check = str.indexOf('(')
	while(check!=-1){
		openParens.push(check);
		check = str.indexOf('(',check+1)
	}
	var closeParens=[];
	check = str.indexOf(')')
	while(check!=-1){
		closeParens.push(check);
		check = str.indexOf(')',check+1)
	}
	return [openParens,closeParens];
}

var implicitMultiplication = function(str){
	var indexes=getAllIndexes(str)
	var offset = 0;
	var i;
	for(var x in indexes[0]){
		i=indexes[0][x];
		if((i-1+offset)>-1 && 
"0123456789)abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVQXYZ".indexOf(str.charAt(i-1+offset))>-1){
			str=str.substring(0,(i+offset))+"*"+str.substring((i+offset),str.length)
			offset+=1;
		}	
	}
	for(var x in indexes[1]){
		i=indexes[1][x];
		if((i+1+offset)<str.length && "0123456789)abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVQXYZ".indexOf(str.charAt(i+1+offset))>-1){
			str=str.substring(0,(i+offset+1))+"*"+str.substring((i+offset+1),str.length)
			offset+=1;
		}
	}
	return str;
}



var symbolic = function(eq1,eq2,variables,range,steps,array,index){
    
    if(!array){
        array = [];
        index = 0;
    }
	
	if(array.length==variables.length){
		return compare(eq1,eq2,variables,array);
	}
    
	for(var i=range[index][0];i<range[index][1];i+=(range[index][1]-range[index][0])/(steps-1)){
		if(!symbolic(eq1,eq2,variables,range,steps,array.slice(0).concat([i]),index+1))
			return false;
	}
	return true;
}

var numerical = function(equation,variables,values,answer,tolerance){
	instructions=[];
	var len=variables.length;
	for(var i = 0; i<len;i++)
	{
		instructions.push(variables[i]+"="+values[i]);
	}
	instructions.push(implicitMultiplication(equation));
	var trueValue = math.eval(instructions)[len];
	var testValue = math.eval(implicitMultiplication(answer));
	return(testValue>=trueValue*(1-tolerance)&&testValue<=trueValue*(1+tolerance))
}


var grade = function(studentResponse, acceptedResponse){
    switch(acceptedResponse.type){
        case "NUMERICAL":
            console.log("COMPARING", acceptedResponse.answer, "AND", studentResponse.content);
            return numerical(acceptedResponse.answer, [], [], studentResponse.content, .02);
            break;
        case "SYMBOLIC":
            return symbolic(studentResponse.content, acceptedResponse.answer, acceptedResponse.variables, acceptedResponse.ranges, acceptedResponse.steps);
            break;
        case "DROPDOWN":
            console.log("COMPARING", studentResponse.content, "AND", acceptedResponse.answer);
            return parseInt(studentResponse.content) == parseInt(acceptedResponse.answer);
            break;
    }
}

module.exports = {
    "grade": grade
}