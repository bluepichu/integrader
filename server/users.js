var db = require("mongojs").connect("localhost:27017/integ",["users","courses","assignments","testdb"]);
var x = require("./XOR/XOR");
var cr = require("crypto");

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
				"courses":[1],
                "type": type.toUpperCase()
			}
			console.log(user);
			db.users.save(user);
			cb(null,authToken);
			console.log("Specified authToken "+authToken);
		})
	})
}

/*
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
*/

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
	db.courses.find({"_id":{$in:uids}},function(err, dob) {
		console.log(dob)
		cb(dob);
	})
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

//Returns user data
var getUserData = function(username,authToken,cb) {
	db.users.find({"username":username,"private.authToken":authToken},function(err, dob) {
		if (dob.length == 0) {
			cb(202,"");
			return
		}
		user = {
			data: {
				name: dob[0].name,
				username: dob[0].username,
				email: dob[0].email,
			},
			courses: dob[0].courses,
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
		if (dob.length == 0) {
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

module.exports = {
    "createUser": createUser,
    "isValid": isValid,
    "getCourses": getCourses,
    "endSession": endSession,
    "updateUser": updateUser,
    "getUserData": getUserData,
    "authUser": authUser
}