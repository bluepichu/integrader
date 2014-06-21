var db = require("mongojs").connect("localhost:27017/integ",["users","courses","testdb"])
var x = require("./XOR/XOR")
//var bc = require("bcrypt")
var cr = require("crypto");

//Creates a user and grants him an authentication token
var createUser = function(name,email,username,pass,ipaddress,cb) {
	db.users.find({"data.username":username},function(err, dob) {
		if (dob.length != 0) {
			cb(101,"");
			return;
		}
		db.users.find({"data.email":email}, function(err, dob) {
			if (dob.length != 0) {
				cb(102, "");
				return;
			}
			var authToken = x.toB64(x.XOR(username+Math.floor(Math.random()*1000000)+x.toB64(username),ipaddress));
			//var passHash = bc.hash(pass,4,function(err,hash) {
			var passHash = cr.createHash("sha256","ascii");
			passHash.update(pass);
			user = {
				"data": {
					"username": username,
					"password": passHash.digest("base64"),
					"email": email,
					"name":name
				},
				"courses":[1,2],
				"private": {
					"authToken":[authToken]
				}
			}
			console.log(user);
			db.users.save(user);
			cb(null,authToken);
			console.log("Specified authToken "+authToken);
			//})
		})
	})
}

//Bogus method for creating an example course. Used for debugging
var genTestCourse = function() {
	var a = {
		title: "Feesiks",
        instructor: "Sholla, Stephen R",
		UID : 1,	
		assignments: [{
			title: "Various Practice Problems",
			UID : 1,
			questions: [
			{
				title: "Railgun (Tipler6 28.P.041)",
                progress: "00",
				parts: [
                    {
                        type: "content",
                        content: "In the figure below, the rod has a mass \\(m\\) and a resistance \\(R\\).  The rails are horizontal, frictionless, and have negligible resistances.  The distance between the rails is \\(l\\).  An ideal battery that has an emf \\(E\\) is connected between points \\(a\\) and \\(b\\) so that the current in the rod is downward.  The rod is released at \\(t = 0\\)."
                    },
                    {
                        type: "image",
                        url: "https://dl.dropboxusercontent.com/u/3889893/sample1.gif",
                        width: 300
                    },
                    {
                        type: "content",
                        content: "Derive an expression for the force on the rod as a function of the speed.  (Use the following as necessary: \\(B, R, v, l, E\\).)",
                    },
					{
						type: "symbolic",
						variables: ["B", "R", "v", "l", "E"],
						range: [[1,2],[1,2],[1,2],[1,2],[1,2]],
						steps: 3,
						answer: "l*B/R*(E-B*l*v)"
					},
                    {
                        type: "content",
                        content: "Find an expression for the terminal speed of the rod.  (Use the following as necessary: \\(B, l, E\\).)"
                    },
					{
						type: "symbolic",
						variables: ["B", "l", "E"],
						range: [[1,2],[1,2],[1,2]],
						steps: 3,
						answer: "E/(b*l)"
					}
				]
			},
			{
				title: "Eddy Currents (Tipler6 26.P.038)",
                progress: "00",
				content: [
                    {
                        type: "content",
                        content: "In the figure below, let \\(B = .8 \\mathrm{T}\\), \\(v = 11.0 \\mathrm{m/s}\\), \\(l = 22 \\mathrm{cm}\\), and \\(R = 2 \\mathrm{\\Omega}\\)."
                    },
                    {
                        type: "image",
				        url: "https://dl.dropboxusercontent.com/u/3889893/sample2.gif"
                    },
					{
                        type: "content",
						content: "Find the induced EMF in the circuit.",
					},
                    {
                        type: "numerical",
                        units: "V",
                        answer: "2"
                    },
					{
                        type: "content",
						content: "Find the current in the circuit."
                    },
                    {
						type: "numerical",
                        units: "A",
						answer: "1",
					},
					{
                        type: "content",
						text: "In what direction is the current flowing?"
                    },
                    {
						type: "radio",
						options: [
							"clockwise",
							"counterclockwise"
						],
						answer: "1"
					}
				]
			}
			]
		}]
	}
	db.courses.save(a);
}

//Makes sure it doesn't add the test course multiple times
db.courses.find({"UID":1},function(err, dob) {
	if (dob.length == 0) {
		genTestCourse();
	}
})

//Checks to see if a username/authToken pair is valid
var isValid = function(username, authToken, cb) {
	db.users.find({"data.username":username, "private.authToken": authToken}, function(err, dob) {
		if (err || dob.length == 0) {
			cb(false)
			return
		}
		cb(true)
	})
}

//gets all courses associated with a course UID
var getCourses = function(uids,cb) {
	db.courses.find({"UID":{$in:uids}},function(err, dob) {
		console.log(dob)
		cb(dob);
	})
}

//Revokes an authentication token
var endSession = function(username, authToken) {
	db.users.update({"data.username":username}, {"$pull":{"private.authToken":authToken}})
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
		tmpobj["data."+i] = data[i];
		db.users.update({"data.username":username, "private.authToken":authToken}, {$set:tmpobj})
	}
	if (cb) {
		cb(null, authToken);
	}
}

//Returns user data
var getUserData = function(username,authToken,cb) {
	db.users.find({"data.username":username,"private.authToken":authToken},function(err, dob) {
		if (dob.length == 0) {
			cb(202,"");
			return
		}
		user = {
			data: {
				name: dob[0].data.name,
				username: dob[0].data.username,
				email: dob[0].data.email,
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
var authUser = function(username,pass,ipaddress, cb) {
	console.log ("Looking for "+username);
	db.users.find({"data.username":username},function(err,dob) {
		if (dob.length == 0) {
			cb(201); 
			return
		}
		//bc.compare(pass, dob[0].data.password ,function(err, res) {
		var passHash = cr.createHash("sha256","ascii");
		passHash.update(pass);

		if (dob[0].data.password == passHash.digest("base64")) {
			var authToken = x.toB64(x.XOR(username+Math.floor(Math.random()*1000000)+x.toB64(username),ipaddress));
			db.users.update({"_id":dob[0]._id}, {"$push":{"private.authToken":authToken}},function() {
				if (cb) {
					cb(null,authToken);
				}
			})
		} else {
			cb(202,"");
		}
		//})
	})
}

//Specifies the functions to be exported as a node module
module.exports = {
	"getUserData": getUserData,
	"authUser": authUser,
	"updateUser": updateUser,
	"endSession": endSession,
	"createUser": createUser,
	"isValid": isValid,
	"getCourses": getCourses,

}

