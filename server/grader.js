var mathjs = require("./math.js");
var math = mathjs();
var steps =4;
var variables = ["a","b","beta"];
var range = [[2,5],[5,8],[8,11]];
var eq1 = "(a+b)/beta";
var eq2="(a+b)/beta";
function compare(equation1,equation2,variables,values)
{
    var instructions1 =[];
    var instructions2 =[];
    var len=variables.length;
    for(var i = 0; i<len;i++)
    {
        instructions1.push(variables[i]+"="+values[i]);
        instructions2.push(variables[i]+"="+values[i]);
    }
    instructions1.push(equation1);
    instructions2.push(equation2);
    return ((math.eval(instructions1)[len])==(math.eval(instructions2)[len]))
}
function test(eq1,eq2,variables,range,steps,array,index)
{
    
    if(array.length==variables.length)
    {
        return compare(eq1,eq2,variables,array);
    }
    for(var i=range[index][0];i<range[index][1];i+=(range[index][1]-range[index][0])/(steps-1))
    {
        if(!test(eq1,eq2,variables,range,steps,array.slice(0).concat([i]),index+1))
            return false;
    }
    return true;
}
console.log(test(eq1,eq2,variables,range,4,[],0));
function singleVal(equation,variables,values,answer,tolerance)
{
    instructions=[];
    var len=variables.length;
    for(var i = 0; i<len;i++)
    {
        instructions.push(variables[i]+"="+values[i]);
    }
    instructions.push(equation);
    var trueValue = math.eval(instructions)[len];
    var testValue = math.eval(answer);
    return(testValue>=trueValue*(1-tolerance)&&testValue<=trueValue*(1+tolerance))
}
console.log(singleVal("a/b",["a","b"],[100,1],"100*log(e)",.02))
/*function sigfig(equation,variables,values,answer,degree)
{
    instructions=[];
    var len=variables.length;
    for(var i = 0; i<len;i++)
    {
        instructions.push(variables[i]+"="+values[i]);
    }
    instructions.push(equation);
    var trueValue = new Number(math.eval(instructions)[len]);
    var str = trueValue.toPrecision(degree);
    if(str.indexOf(".")==-1)
    {
        if(str.substr(str.length-1)==0)
        {
            
        }
    }
}*/
