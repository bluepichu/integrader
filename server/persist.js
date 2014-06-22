var mongoose = require('mongoose'),
    Schema   = mongoose.Schema
    ObjectId = Schema.ObjectId
    crypto   = require('crypto')
    xor      = require('./XOR');

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', function callback () {
	console.log("Connected to mongo instance.");
});

var part = new Schema({
	type: {
		type: String,
		enum: ['RADIO', 'CHECKBOX', 'NUMERICAL', 'SYMBOLIC', 'DROPDOWN', 'CONTENT', 'VIDEO', 'IMAGE']
	},
	points: { type: Number, default: 0 },
	scoring: [Number]
});

var Part = mongoose.model('Part', part);
exports.Part = Part;

var question = new Schema({
	parts: [Part]
});

var Question = mongoose.model('Question', question);
exports.Question = Question;

var assignment = new Schema({
	name: {
		type: String,
		required: true
	},
	due: Date,
	questions: [Question]
});

var Assignment = mongoose.model('Assignment', assignment);
exports.Assignment = Assignment;

var course = new Schema({
	name: {
		type: String,
		required: true
	},
	instructor: {
		type: ObjectId,
		required: true
	},
	assignments: [Assignment],
	announcements: [String]
});

var Course = mongoose.model('Course', course);
exports.Course = Course;

var user = new Schema({
	name: {
		first: String,
		last: String
	},
	username: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	email: {
		type: String,
		required: true
	},
	pwd: {
		type: String,
		required: true
	},
	type: {
		type: String,
		enum: ['STUDENT', 'INSTRUCTOR'],
		required: true
	},
	courses: [Course],
	seed: String
});

user.pre('save', function(next) {
	if (!this.isModified('pwd'))
		return next();
	var hash = crypto.createHash('sha256', 'ascii');
	hash.update(this.pwd);
	this.pwd = hash.digest('base64');
	next();
});

user.methods.auth = function(pwd) {
	var hash = crypto.createHash('sha256', 'ascii');
	hash.update(pwd);
	if (hash.digest('base64') === this.pwd)
		return xor.toB64(xor.XOR(this.username + Math.floor(Math.random() * 1000000) + xor.toB64(this.username), '127.0.0.1'));
	throw 'Incorrect username/password';
};

exports.auth = function(usr, pwd, cb) {
	User.findOne({ username: usr }, function(err, user) {
		if (err)
			throw err;
		else if (user === null)
			throw "User does not exist";
		cb(user.auth(pwd));
	});
};

var User = mongoose.model('User', user);
exports.User = User;

var submission = new Schema({
	userId: ObjectId,
	assignmentId: ObjectId,
	questionId: ObjectId,
	partId: ObjectId,
	type: {
		type: String,
		enum: ['SUBMISSION', 'NOTE'],
	},
	info: String
});

var Submission = mongoose.model('Submission', submission);
exports.Submission = Submission;
