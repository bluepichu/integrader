var db = require("mongojs").connect("localhost:27017/integ",["users","courses","testdb"])
var x = require("./XOR/XOR")
var bc = require("bcrypt")

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
			var passHash = bc.hash(pass,4,function(err,hash) {
				user = {
					"data": {
						"username": username,
						"password": hash,
						"email": email,
						"name":name
					},
					"courses":[1],
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
	})
}
/**
var genTestCourse = function() {
	var ret = {}
	ret.name = "Test Course";
	ret.UID = 1
	ret.questions = []
	ret.questions.push({name:"What is the <b>Name</b> of your person",type:"{{input-text}}"})
	ret.questions.push({name:"When did you see this picture <img src='https://www.google.com/images/srpr/logo11w.png'></img>",type:"{{input-numeric}}"})
	db.courses.save(ret);
	return ret;
}

db.courses.find({"UID":1},function(err, dob) {
	if (dob.length == 0) {
		genTestCourse();
	}
})
**/


var isValid = function(username, authToken, cb) {
	db.users.find({"data.username":username, "private.authToken": authToken}, function(err, dob) {
		if (err || dob.length == 0) {
			cb(false)
			return
		}
		cb(true)
	})
}

var getCourses = function(uids,cb) {
	db.courses.find({"UID":{$in:uids}},function(err, dob) {
		console.log(dob)
		cb(dob);
	})
}

var endSession = function(username, authToken) {
	db.users.update({"data.username":username}, {"$pull":{"private.authToken":authToken}})
}
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

var authUser = function(username,pass,ipaddress, cb) {
	console.log ("Looking for "+username);
	db.users.find({"data.username":username},function(err,dob) {
		if (dob.length == 0) {
			cb(201); 
			return
		}
		bc.compare(pass, dob[0].data.password ,function(err, res) {
			if (err) {
				console.error(err);
			}
			if (res) {
				var authToken = x.toB64(x.XOR(username+Math.floor(Math.random()*1000000)+x.toB64(username),ipaddress));
				db.users.update({"_id":dob[0]._id}, {"$push":{"private.authToken":authToken}},function() {
					if (cb) {
						cb(null,authToken);
					}
				})
			} else {
				cb(202,"");
			}
		})
	})
}
/**
var tmp = "zwad3"+Math.floor(Math.random()*1000)
createUser("zach","zach"+Math.floor(Math.random()*1000)+"@zach.zach",tmp,"woohash","10.10.10.10",function(err,tok) {
	if (err) {
		console.error(err);	
	}
	console.log(tok);
	updateUser(tmp,tok,{"email":"me.woo@yo.ninja"},function(err) {
		if (err) {
			console.error(err);
		}
		getUserData(tmp,tok,console.log);
	})
})
**/


module.exports = {
	"getUserData": getUserData,
	"authUser": authUser,
	"updateUser": updateUser,
	"endSession": endSession,
	"createUser": createUser,
	"isValid": isValid,
	"getCourses": getCourses,

}

