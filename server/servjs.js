#!/usr/local/bin/node

var http = require("http")
var fs = require("fs")

var args = process.argv

if (args[2] && ( args[2] == "-h" || args[2] == "--help") ) {
	console.log("Usage servjs [index file] [port]")
	return
}

http.createServer(function(req,res) {
	var url = req.url.substr(1) || args[2] || "views/login.html"
	var cT = getMime(url.split(".")[1])
	console.log("Request received for: "+url);
	res.writeHead(200, {'Content-Type': cT});
	getFile(url, function(data) {
		res.write(data);
		res.end();
	})
}).listen(args[3] || 1337, '0.0.0.0');
console.log('Server running');

var getFile = function(url,cb) {
	url = url.split("..")
	url = url[url.length-1];
	console.log(url);
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
