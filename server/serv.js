#!/usr/local/bin/node

var http = require("http")
var fs = require("fs")
var querystring = require('querystring');
var users = require("./users");
//var utils = require("utils")
/**
var persist = require("./persist.js")

var siva = new persist.User({
	name: 'Siva Somayyajula',
	pwd: 'sivaspassword'
});

siva.save(function(error) {
	if (error) {
		console.log(error);
	}
})
persist.User.findOne({
	name: 'Siva Somayyajula'
}, function(error, user) {
	if (error) {
		throw error;
	}
	console.log(user);
	user.authorize('sivaspassword', function(error, success) {
		if (error) {
			throw error;
		}
		console.log('Siva was authorized');
	});
	user.authorize('faaaaaaake', function(error, success) {
		if (error) {
			throw error;
		}
		console.log('Siva was authorized, but shouldn\'t have been.');
	});
});
**/

var args = process.argv

if (args[2] && ( args[2] == "-h" || args[2] == "--help") ) {
	console.log("Usage servjs [index file] [port]")
	return
}

var pages = {
	login:"views/login.html",
	register:"views/register.html",
	problem:"views/problem.html",
	
}

http.createServer(function(req,res) {
	if (req.method == "GET") {
		var url = req.url.substr(1) || args[2] || "views/login.html"
		if (pages[url]) {
			url = pages[url]
		}
		var cT = getMime(url.split(".")[1])
		console.log("Request received for: "+url);
		res.writeHead(200, {'Content-Type': cT});
		getFile(url, function(data) {
			res.write(data);
			res.end();
		})
	} else if (req.method == "POST") {
		fullBody = "";
		req.on('data', function(chunk) {
			// append the current chunk of data to the fullBody variable
			fullBody += chunk.toString();
		});
		
		req.on('end', function() {
			
			res.writeHead(200, "OK", {'Content-Type': 'text/html'});
			
			var dec = querystring.parse(fullBody);
			console.log(dec);
			console.log(req);
			
			if (req.url === "/login") {
				users.authUser(dec.username,dec.password,"0.1.2.3",function(err, authToken) {
					if (err) {
						res.write("no go");
						res.end();
					} else {
						getFile("views/problem.html", function(data) {
							res.write(data);
							res.write("<br>Auth Token: "+authToken);
							res.end();
						})	
					}
				})
			} else if (req.url === "/register") {
				users.createUser(dec.name,dec.email,dec.username,dec.password,"0.1.2.3" ,function(err, authToken) {
					if (err) {
						res.write("nope<br>"+err);
						res.end();
					} else {
						getFile("views/problem.html", function(data) {
							res.write(data);
							res.write("<br>Auth Token: "+authToken);
							res.end();
						})
					}
				})
			} else {
				res.write("WTF?");
				res.end;
			}
		});
	}
}).listen(args[3] || 1337, '0.0.0.0');

console.log('Server running');

var getFile = function(url,cb) {
	url = url.split("..")
	url = "../public/"+url[url.length-1];
	fs.readFile(url, function(err, data) {
		if (err || !data) {
			cb("404")
			return
		}
		cb(data);
	})
}

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
