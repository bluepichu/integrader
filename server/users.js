var mjs = require("mongojs");
var db = mjs.connect("localhost:27017/integ",["users","courses","assignments","submissions"]);
var ObjectId = mjs.ObjectId;
var x = require("./XOR/XOR");
var cr = require("crypto");
var grader = require("./grader");

//Creates a user and grants him an authentication token
var createUser = function(firstName, lastName, email, username, pass, type, cb) {
    db.users.find({"username":username},function(err, dob) {
        if (dob.length != 0) {
            cb(101,"");
            return;
        }
        db.users.find({"email":email}, function(err, dob) {
            if (dob.length != 0) {
                cb(102, "");
                return;
            }
            var authToken = x.toB64(x.XOR(username+Math.floor(Math.random()*1000000)+x.toB64(username),"0.1.2.3"));
            var passHash = cr.createHash("sha256","ascii");
            passHash.update(pass);
            user = {
                "username": username,
                "password": passHash.digest("base64"),
                "email": email,
                "name": {
                    first: firstName,
                    last: lastName
                },
                "courses": [],
                "type": type.toUpperCase(),
                "settings": {
                    "theme": "",
                    "doubleEnterSubmit": false
                },
		"private": {
			"authToken":[authToken]
		}
            }
            console.log(user);
            db.users.save(user);
            cb(null,authToken);
            console.log("Specified authToken "+authToken);
        })
    })
}


var addTestData = function(){
    createUser("Student", "McLearnerson", "st@ud.ent", "student", "student", "student", function(){});
    createUser("Instructor", "McTeacherson", "in@struct.or", "instructor", "instructor", "instructor", function(){});
    
    db.courses.save({
        name: "Physics (Test)",
        instructor: 1, //this should be some other value I think
        assignments: [0], //this should be some other value I think
        announcements: []
    });
    
    db.assignments.save({
        name: "Test Assignment",
        due: "21-06-2014",
        questions: [
            {
                name: "A Question",
                parts: [
                    {
                        type: "CONTENT",
                        contet: "This is a test.  A what?  A test."
                    }
                ]
            }
        ]
    });
}


//Checks to see if a username/authToken pair is valid
var isValid = function(username, authToken, cb) {
    db.users.find({"username":username, "private.authToken": authToken}, function(err, dob) {
        if (err || dob.length == 0) {
            cb(false)
            return
        }
        cb(true)
    })
}

//gets all courses associated with a course UID
var getCourses = function(uids,cb) {
    console.log("getCourses recieved", uids);
    db.courses.find({"_id":{$in:uids}},function(err, dob) {
        iids = []
        for(i = 0; i < dob.length; i++){
            iids.push(dob[i].instructor);
        }
        db.users.find({"_id": {$in:iids}}, function(err, data){
            for(i = 0; i < data.length; i++){
                for(j = 0; j < dob.length; j++){
                    if(parseInt(dob[j].instructor, 16) == parseInt(data[i]._id, 16)){
                        console.log("INSTRUCTOR FOUND!");
                        dob[j].instructor = data[i].name;
                    }
                }
            }
            console.log(dob)
            cb(dob);
        });
    });
}

//gets all assignments associated with a course id
var getAssignments = function(courses,cb){
    ids = [];
    console.log("COURSES >>> ", courses);
    for(i = 0; i < courses.length; i++){
        for(j = 0; j < courses[i].assignments.length; j++){
            ids.push(courses[i].assignments[j]);
        }
    }
    db.assignments.find({"_id": {$in:ids}}, function(err, dob){
        console.log(dob);
        for(i = 0; i < dob.length; i++){
            for(j = 0; j < dob[i].questions.length; j++){
                for(k = 0; k < dob[i].questions[j].parts.length; k++){
                    delete dob[i].questions[j].parts[k].answer;
                }
            }
        }
        cb(dob);
    });
}

//Revokes an authentication token
var endSession = function(username, authToken) {
    db.users.update({"username":username}, {"$pull":{"private.authToken":authToken}})
}

//Updates user data
var updateUser = function(username, authToken, data, cb) {
    var obj = ["username","email","name"];
    for (i in data) {
        if (obj.indexOf(i) < 0) {
            cb(109);
            return;
        }
        var tmpobj = {};
        tmpobj[i] = data[i];
        db.users.update({"username":username, "private.authToken":authToken}, {$set:tmpobj})
    }
    if (cb) {
        cb(null, authToken);
    }
}

var updateSettings = function(username, authToken, data){
    console.log("UPDATING SETTINGS WITH", data);
    db.users.update({"username": username, "private.authToken": authToken}, {$set:{settings: data}});
}

//Returns user data
var getUserData = function(username,authToken,cb) {
    db.users.find({"username":username,"private.authToken":authToken},function(err, dob) {
        if (dob.length == 0 || err) {
            cb(202,"");
            return
        }
        console.log(dob);
        user = {
            data: {
                name: dob[0].name,
                username: dob[0].username,
                email: dob[0].email,
            },
            courses: dob[0].courses,
            settings: dob[0].settings
        }
        
        if (cb) {
            cb(null,user);
        }
        //console.log(user)
        
        //db.users.remove({"private.authToken":{$in:[authToken]}})
    })
}

//Checks a username with the password hash and if it is valid, grants an authentication token
var authUser = function(username,pass,cb) {
    console.log ("Looking for "+username);
    db.users.find({"username":username},function(err,dob) {
        if (dob.length == 0 || err) {
            cb(201); 
            return
        }
        var passHash = cr.createHash("sha256","ascii");
        passHash.update(pass);
        
        if (dob[0].password == passHash.digest("base64")) {
            var authToken = x.toB64(x.XOR(username+Math.floor(Math.random()*1000000)+x.toB64(username),"0.1.2.3"));
            db.users.update({"_id":dob[0]._id}, {"$push":{"private.authToken":authToken}},function() {
                if (cb) {
                    cb(null,authToken);
                }
            })
        } else {
            console.log("not found.");
            cb(202,"");
        }
        //})
    })
}

var getSubmissions = function(username, authToken, aid, cb){
    db.users.find({"username": username, "private.authToken": authToken}, function(err, dob){
        if(dob.length == 0 || err){
            cb(202, "");
            return;
        }
        console.log("QUERY: ", {"userId": dob[0]._id, "assignmentId": ObjectId(aid)});
        db.submissions.find({"userId": dob[0]._id, "assignmentId": ObjectId(aid)}, function(err, data){
            cb(null, data);
        });
    });
}

var pad = function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var submit = function(username, authToken, data, cb){
    db.users.find({"username": username, "private.authToken": authToken}, function(err, dob){
        if(dob.length == 0 || err){
            cb(202, "");
            return;
        } else {
            db.submissions.find({"userId": dob[0]._id, "assignmentId": ObjectId(data.assignment), "question": data.question, "part": data.part, type: "SUBMISSION"}, function(err, prev){
                if(prev.length >= 3){
                    cb(202, "");
                    return;
                }
                
                console.log("received submission:", data);
                db.assignments.find({"_id": ObjectId(data.assignment)}, function(err, assignmentData){
                    if(!assignmentData || err){
                        cb(err, "");
                    }
                    assignmentData = assignmentData[0];
                    console.log(assignmentData);
                    console.log(assignmentData.questions);
                    console.log("~~~~~~~~~~~~~~~~", dob);
                    data.response = grader.grade(data, assignmentData
                                                 .questions[data.question-1]
                                                 .parts[data.part-1]);
                    submissionData = {
                        "userId": dob[0]._id,
                        "assignmentId": assignmentData._id,
                        "question": data.question,
                        "part": data.part,
                        "response": data.response,
                        "content": data.content,
                        "type": "SUBMISSION"
                    };
                    db.submissions.save(submissionData);
                    cb(null, submissionData);
                });
            });
        }
    });
}

module.exports = {
    "addTestData": addTestData,
    "createUser": createUser,
    "isValid": isValid,
    "getCourses": getCourses,
    "endSession": endSession,
    "updateUser": updateUser,
    "getUserData": getUserData,
    "authUser": authUser,
    "getAssignments": getAssignments,
    "updateSettings": updateSettings,
    "getSubmissions": getSubmissions,
    "submit": submit
}
