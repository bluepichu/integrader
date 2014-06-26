var rand = require("seedrandom");

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
	instructions1.push("round("+equation1+",3)");
	instructions2.push("round("+equation2+",3)");
    console.log(instructions1);
    console.log(instructions2);
	console.log("~~~~~", (math.eval(instructions1)[len]+", "+(math.eval(instructions2)[len])))
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

operators = ["+", "-", "*", "/", " ", "^", "_"];
functions = ["sin", "cos", "tan", "cot", "sec", "csc", "ln", "log"];

var parse = function(arr){ //Does the thing
   if(typeof(arr[0])=='object') {
       arr[0]="("+parse(arr[0])+")";
   } else if(arr.length==1){
       return arr[0];
   } else if(functions.indexOf(arr[0])!=-1) {
       str = arr.shift();
       if(arr[0]=="_"){
           arr.shift();
           funcParse(arr)
           ret=arr.shift()
           arr[0]=str+"("+funcParse(arr)+","+ret+")";
       } else {
           arr[0]=str+"("+funcParse(arr)+")";
       }
   } else {
       str = arr.shift();
       if(operators.indexOf(arr[0])!=-1){
           str+=arr.shift();
       } else {
           str+="*";
       }
       arr[0]=str+funcParse(arr)
   }
   return parse(arr);
}

var funcParse = function(arr){ //Finds the first values from the given array that can be a single value to be returned as a string\
   if(typeof(arr[0])=='object'){
       arr[0]="("+parse(arr[0])+")"
       return arr[0]
   } else if(functions.indexOf(arr[0])!=-1) {
       str = arr.shift();
       if(arr[0]=="_"){
           arr.shift();
           funcParse(arr)
           ret=arr.shift()
           arr[0]=str+"("+funcParse(arr)+","+ret+")";
           return arr[0]
       } else {
           arr[0]=str+"("+funcParse(arr)+")";
           return arr[0]
       }
   } else {
       return arr[0];
   }
}

var symbolicRec = function(eq1, eq2, variables, range, steps, array, index){
	if(array.length == variables.length){
        console.log(array);
		return compare(eq1, eq2, variables, array);
	}
    
	for(var i = range[index][0]; i <= range[index][1]; i += (range[index][1]-range[index][0])/(steps-1)){
        array.push(i);
		if(!symbolicRec(eq1, eq2, variables, range, steps, array, index+1))
			return false;
        array.pop(i);
	}
	return true;
}



var symbolic = function(eq1,eq2,variables,range,steps){
    eq1 = parse(eq1);
    console.log("PARSED --->", eq1);
    return symbolicRec(eq1, eq2, variables, range, steps, [], 0);
}

var numerical = function(equation,variables,values,answer,tolerance){
	instructions=[];
	var len=variables.length;
	for(var i = 0; i<len;i++)
	{
		instructions.push(variables[i]+"="+values[i]);
	}
	instructions.push(equation);
    console.log(instructions);
	var trueValue = math.eval(instructions)[len];
	var testValue = math.eval(answer);
    console.log("TRUE", trueValue, "TEST", testValue);
	return(testValue>=trueValue*(1-tolerance)&&testValue<=trueValue*(1+tolerance))
}


var grade = function(studentResponse, acceptedResponse, userid){
    console.log("GRADING QUESTION", studentResponse.question, "PART", studentResponse.part);
    console.log("DATA", studentResponse, "ACCEPTED", acceptedResponse);
    switch(acceptedResponse.type){
        case "NUMERICAL":
            console.log("COMPARING", acceptedResponse.answer, "AND", studentResponse.content);
            values = []
            for(i = 0; i < acceptedResponse.variables.length; i++){
                console.log("SEEDING", userid + acceptedResponse.ranges[i][3]);
                Math.seedrandom(userid + acceptedResponse.ranges[i][3]);
                values.push((acceptedResponse.ranges[i][0] + (acceptedResponse.ranges[i][1] - acceptedResponse.ranges[i][0]) * Math.random()).toPrecision(acceptedResponse.ranges[i][2]));
            }
            console.log("USING VARIABLES", acceptedResponse.variables, "AND VALUES", values);
            return numerical(acceptedResponse.answer, acceptedResponse.variables, values, studentResponse.content, .02);
            break;
        case "SYMBOLIC":
            return symbolic(studentResponse.parsedContent, acceptedResponse.answer, acceptedResponse.variables, acceptedResponse.ranges, acceptedResponse.steps);
            break;
        case "DROPDOWN":
        case "RADIO":
            console.log("COMPARING", studentResponse.content, "AND", acceptedResponse.answer);
            return parseInt(studentResponse.content) == parseInt(acceptedResponse.answer);
            break;
        case "CHECKBOX":
            console.log("COMPARING", studentResponse.content, "AND", acceptedResponse.answer);
            return studentResponse.content == acceptedResponse.answer;
            break;
    }
    return false;
}

module.exports = {
    "grade": grade,
    "parse": parse
}
