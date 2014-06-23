var mongoose   = require('mongoose'),
      Schema   = mongoose.Schema
      ObjectId = Schema.ObjectId;

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
    content: String,
    url: String,
    choices: [String],
    variables: [String],
    ranges: [Object],
    steps: Number,
    answer: String,
	points: { type: Number, default: 0 }
});

var Part = mongoose.model('Part', part);
exports.Part = Part;

var question = new Schema({
    name: String,
	parts: [Part]
});

var Question = mongoose.model('Question', question);
exports.Question = Question;

var assignment = new Schema({
	name: {
		type: String,
		required: true
	},
	due: {
        type: Date,
        required: true
    },
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
	settings: {
        theme: String,
        doubleEnterSubmit: Boolean
    }
});

var User = mongoose.model('User', user);
exports.User = User;

var submission = new Schema({
	userId: ObjectId,
	assignmentId: ObjectId,
	question: Number,
	part: Number,
	type: {
		type: String,
		enum: ['SUBMISSION', 'NOTE'],
	},
	content: String,
    response: Boolean
});

var Submission = mongoose.model('Submission', submission);
exports.Submission = Submission;
