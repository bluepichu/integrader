#!/usr/bin/env node

//The code is build ontop of node's generic HTTP stack. No express or similar libraries

var http = require("http")
var fs = require("fs")
var querystring = require('querystring');

var persist = require("./persist");

//grader is our grader module
var grader = require("./grader");

//Users represents the interface with a Mongo no-sql database
var users = require("./users");
var args = process.argv;

//Command-Line Options
if (args[2] && ( args[2] == "-h" || args[2] == "--help") ) {
    console.log("Usage servjs [port] [index file]")
    return
}

if(args[2] && (args[2] == "-t" || args[2] == "--test")){
    users.addTestData();
    return
}

//Aliases for webpages. I.E. instead of http://localhost/views/login.html, you can do http://localhost/login
var pages = {
    login:"views/login.html",
    register:"views/register.html",
    assignment:"views/assignment.html",
    index:"views/index.html",
    edit:"views/edit.html"
}

//URL's that require a login to access. This is just for user-experience, the actual security is done when the user goes to access something
var rest = [
    "views/assignment.html",
    "views/edit.html",
    "new",
    "courselist",
    "userinfo",
    "assignmentlist",
    "getucainfo",
    "assignmentinfo",
    "submissions"
]

//URLs that the client accesses for data.
var dataPages = [
    "courselist",
    "userinfo",
    "assignmentlist",
    "getucainfo",
    "assignmentinfo",
    "submissions"
]

//This function creates the server and handles data from req[uests] and pipes them into the res[ponse].
http.createServer(function(req,res) {
    var cookies = parseCookie(req.headers.cookie);

    //Handles all GET requests
    if (req.method == "GET") {

        //Chooses the URL. First priority is the url they request, second priority is the url passed as a command line argument, and the third priority is the login page
        var url = req.url.substr(1) || args[3] || "views/index.html";

        url = url.split("?");

        if(url.length > 1){
            getVarsArr = url[1].split("&");
            getVars = {};

            for(i = 0; i < getVarsArr.length; i++){
                getVarsArr[i] = getVarsArr[i].split("=");
                getVars[getVarsArr[i][0]] = getVarsArr[i][1];
            }
        }

        url = url[0];

        if (pages[url]) {
            url = pages[url];
        }

        //Finds the mime type of the page being sought
        var cT = getMime(url.split(".")[1]);

        //Case for a restricted URL
        if (rest.indexOf(url) >= 0) {

            //Checks the validity of the authentication, based on a username and an authentication token issued on login or register
            users.isValid(cookies.username, cookies.auth, function(valid) {
                console.log("Request received for restricted page: "+url+" with a "+valid+" validity");
                if (valid) {

                    //This is a special case of a GET request, because it is being accessed from an XMLHttpRequest, and needs to send data, not a file.
                    res.writeHead(200, {'Content-Type': cT});
                    if(url == "courselist") {

                        //Gets the data, again checks the authentication of the user
                        users.getUserData(cookies.username, cookies.auth, function(err,data) {
                            if (data) {
                                console.log(">>>>>>>>> "+data.courses);
                                users.getCourses(data.courses, function(dob) {
                                    res.write(JSON.stringify(dob));
                                    res.end();

                                })
                            } else {
                                res.end();
                            }
                        })
                    } else if(url == "userinfo"){
                        users.getUserData(cookies.username, cookies.auth, function(err,data) {
                            if (data) {
                                console.log(">>>>>>>>> "+data.courses);
                                res.write(JSON.stringify(data));
                                res.end();
                            } else {
                                res.end();
                            }
                        })
                    } else if(url == "assignmentlist"){
                        users.getUserData(cookies.username, cookies.auth, function(err, data){
                            if(data){
                                users.getCourses(data.courses, function(dob){
                                    console.log(dob);
                                    users.getAssignments(cookies.username, cookies.auth, dob, function(dob){
                                        res.write(JSON.stringify(dob));
                                        res.end();
                                    });
                                });
                            } else {
                                res.end();
                            }
                        });
                    } else if(url == "getucainfo") {
                        users.getUserData(cookies.username, cookies.auth, function(err, userData){
                            if(userData){
                                data = {};
                                data.user = userData;
                                console.log("USERDATA", userData);
                                users.getCourses(userData.courses, function(courseData){
                                    console.log("COURSEDATA", courseData);
                                    if(courseData){
                                        data.courses = courseData;
                                        users.getAssignments(cookies.username, cookies.auth, courseData, function(assignmentData){
                                            if(assignmentData){
                                                console.log("ASSIGNMENTDATA", assignmentData);
                                                data.assignments = assignmentData;
                                            } else {
                                                data.assignments = {};
                                            }
                                            res.write(JSON.stringify(data));
                                            res.end();
                                        });
                                    } else {
                                        data.courses = {};
                                        data.assignments = {};
                                        res.write(JSON.stringify(data));
                                        res.end();
                                    }
                                });
                            } else {
                                res.write("{user:{}, courses:{}, assignments:{}}");
                                res.end();
                            }
                        });
                    } else if (url == "assignmentinfo"){
                        console.log("ASSIGNMENT INFO.  VARS:", getVars);
                        if(getVars["id"]){
                            users.getUserData(cookies.username, cookies.auth, function(err, userData){
                                console.log("GOT TO USER LEVEL.");
                                if(userData){
                                    users.getCourses(userData.courses, function(courseData){
                                        console.log("GOT TO COURSE LEVEL.");
                                        if(courseData){
                                            users.getAssignments(cookies.username, cookies.auth, courseData, function(assignmentData){
                                                console.log("GOT TO ASSIGNMENT LEVEL.");
                                                if(assignmentData){
                                                    found = false;
                                                    for(i = 0; i < assignmentData.length; i++){
                                                        if(parseInt(assignmentData[i]._id, 16) == parseInt(getVars["id"], 16)){
                                                            res.write(JSON.stringify(assignmentData[i]));
                                                            res.end();
                                                            found = true;
                                                            console.log("ASSIGNMENT FOUND.");
                                                            break;
                                                        }
                                                    }
                                                    if(!found){
                                                        res.write("{}");
                                                        res.end();
                                                    }
                                                } else {
                                                    res.write("{}");
                                                    res.end();
                                                }
                                            });
                                        } else {
                                            res.write("{}");
                                            res.end();
                                        }
                                    });
                                } else {
                                    res.write("{}");
                                    res.end();
                                }
                            });
                        } else {
                            res.write("{}");
                            res.end();
                        }
                    } else if(url == "submissions"){
                        console.log("RETRIEVING SUBMISSIONS FOR", getVars["id"]);
                        if(getVars["id"]){
                            users.getSubmissions(cookies.username, cookies.auth, getVars["id"].split(","), function(err, data){
                                if(data){
                                    res.write(JSON.stringify(data));
                                    res.end();
                                } else {
                                    res.write("{}");
                                    res.end();
                                }
                            });
                        } else {
                            res.write("{}");
                            res.end();
                        }
                    } else if(url == "new"){
                        console.log("---------------");
                        users.newAssignment(cookies.username, cookies.auth, getVars["courseid"], function(err, data){
                            if(data){
                                res.writeHead(302, "Redirect", {"Location":"/edit?id=" + data});
                                res.end();
                            } else {
                                res.writeHead(302, "Redirect", {"Location":"/"});
                                res.end();
                            }
                        });
                    } else {

                        //In most cases, it can just get the file
                        getFile(url, {}, function(data) {
                            res.write(data);
                            res.end();
                        })
                    }
                } else {
                    if(dataPages.indexOf(url) >= 0){
                        res.write("{}");
                        res.end();
                    }
                    //If the user is not validly logged in, redirect them to the login page
                    res.writeHead(302, "Redirect", {"Location":"/"});
                    res.end();
                }

            })
        } else {

            //If there are no restrictions on the page, show it to the user
            console.log("Request received for unrestricted page: "+url);
            res.writeHead(200, {'Content-Type': cT});
            getFile(url, {}, function(data) {
                res.write(data);
                res.end();
            })
        }

        //Handles all the POST requests, coming from both XHR's and form POST's
    } else if (req.method == "POST") {
        fullBody = "";
        req.on('data', function(chunk) {
            //Append the current chunk of data to the fullBody variable
            fullBody += chunk.toString();
        });

        req.on('end', function() {
            console.log("Post data received "+fullBody + " for page " + req.url);


            //If the data is an HTTP query string, decode it
            var dec = querystring.parse(fullBody);

            //Handles login posts
            if (req.url == "/login") {

                //Authenticates the user using our database module
                users.authUser(dec.username,dec.password,function(err, authToken) {

                    //If they are not authenticated, send them back to login, alerting them of the error
                    if (err) {
                        res.writeHead(200, "OK", {'Content-Type': 'text/html'});
                        getFile("views/login.html", {error: err}, function(data) {
                            res.write(data);
                            res.end();
                        })

                        //Otherwise redirect them to the problem page, and issue them an authentication token
                    } else {
                        var opt = [["Location","/"], ["Set-Cookie","auth="+authToken], ["Set-Cookie","username="+dec.username]]
                        console.log(opt);
                        res.writeHead(302, "Redirect", opt );
                        res.end();
                    }
                })
            } else if (req.url == "/logout"){
                users.endSession(cookies.username, cookies.auth);
                res.end();
                //Handles all registration requests
            } else if (req.url == "/register") {

                //Creates a user using our database module. Behaves similarly to login
                users.createUser(dec.firstName, dec.lastName, dec.email, dec.username, dec.password, dec.type, function(err, authToken) {
                    console.log("Given authToken: "+authToken);
                    if (err) {
                        console.log(err);
                        res.writeHead(200, "OK", {"Content-Type": "text/html"});
                        getFile("views/register.html", {error: err}, function(data) {
                            res.write(data);
                            res.end();
                        })
                    } else {
                        var opt = [["Location","/"], ["Set-Cookie","auth="+authToken], ["Set-Cookie","username="+dec.username]]
                        res.writeHead(302, "Redirect",opt)
                        res.end();
                    }
                })
            } else if(req.url == "/updatesettings"){
                console.log("updating user settings");
                console.log(JSON.parse(fullBody));
                users.updateSettings(cookies.username, cookies.auth, JSON.parse(fullBody));
                res.end();
            } else if(req.url == "/answers" ) {
                console.log("Received this junk");
                console.log(fullBody);
                users.submit(cookies.username, cookies.auth, JSON.parse(fullBody), function(err, data){
                    console.log("ready to roll");
                    if(data){
                        res.write(JSON.stringify(data));
                        res.end();
                    } else {
                        res.write("{}");
                        res.end();
                    }
                });
                //Sending useless data. Ignore it
            } else if(req.url == "/addcourse"){
                users.addCourse(cookies.username, cookies.auth, JSON.parse(fullBody).courseId, function(err, data){
                    if(data){
                        res.write(JSON.stringify({response: true}));
                        res.end();
                    } else {
                        res.write(JSON.stringify({response: false}));
                        res.end();
                    }
                });
            } else if(req.url == "/addannouncement"){
                users.addAnnouncement(cookies.username, cookies.auth, JSON.parse(fullBody), function(err, data){
                    if(data){
                        res.write(JSON.stringify({response: true}));
                        res.end();
                    } else {
                        res.write(JSON.stringify({response: false}));
                        res.end();
                    }
                });
            } else if(req.url == "/editassignment"){
                users.editAssignment(cookies.username, cookies.auth, JSON.parse(fullBody), function(err, data){
                    if(data){
                        res.write(JSON.stringify({response: true}));
                        res.end();
                    } else {
                        res.write(JSON.stringify({response: false}));
                        res.end();
                    }
                });
            } else {
                res.write("Invalid Post Data");
                res.end();
            }
        });
    }

}).listen(process.env.PORT || args[2] || 1337, '0.0.0.0');

console.log('Server running on port: '+(process.env.PORT || args[2] || 1337));


//Helper method to read files
var getFile = function(url,rep, cb) {
    url = url.split("..")
    url = __dirname+"/../public/"+url[url.length-1];
    fs.readFile(url, function(err, data) {
        if (err || !data) {
            cb("404")
            console.log("Error on "+url);
            return
        }
        cb(data);
    })
}

//Helper method to parse cookie strings
var parseCookie = function(cookieString) {
    if (!cookieString) {
        return {}
    }
    var spl = cookieString.split(";");
    var ret = {}
    for (var i in spl) {
        var sple = spl[i].split("=");
        var key = sple[0];
        var value = spl[i].split(key+"=")[1];
        if (key[0] == " ") {
            key = key.substr(1)
        }
        ret[key] = value;
    }
    return ret;
}

//Helper method to detirmine mime types
var getMime = function(str) {
    if (!str) {
        return "text/plain";
    }
    str = str.toLowerCase();
    switch (str) {
        case "html":
            return "text/html"
            case "txt":
            return "text/plain"
            case "js":
        case "min":
        case "json":
            return "application/javascript"
            case "gif":
            return "image/gif"
            case "jpeg":
        case "jpg":
            return "image/jpeg"
            case "png":
        case "bmp":
        case "ico":
            return "image/png"
            case "css":
            return "text/css"
            case "xml":
            return "text/xml"
            default:
            return "text/html"

    }
}

//Helper method to pass the read files with any useful data
var fillIn = function(file,rep) {
    file = file.toString();
    for (var i in rep) {
        file = file.split("{{"+i+"}}").join(rep[i]);
    }
    return file;

}
