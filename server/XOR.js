var XOR = function(a,b) {
	if (typeof a == typeof b && typeof a == 'number') {
		return a ^ b;
	} else if ( typeof a == typeof b && typeof a == 'string') {
		var output = ""
		for (var i = 0; i < a.length; i++) {
			output += String.fromCharCode(a.charCodeAt(i)^b.charCodeAt(i%b.length));
		}
		return output;
	}
}

var toB64 = function (a) {
	return new Buffer(a).toString('base64');
}

var toAscii = function (a) {
	return new Buffer(a,'base64').toString('ascii');
}

module.exports.toB64 = toB64;
module.exports.toAscii = toAscii;
module.exports.XOR = XOR;


