var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	bcrypt = require('bcrypt');

// Please start mongod and mongo so that
// your friendly neighborhood module can
// connect to a mongo instance

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log("Connected to mongo instance.");
});

// User schema with name and password. Courses to come.
// Schemas? In my non-relational database?!?!?!
var User = new Schema({
	name: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	pwd: {
		type: String,
		required: true
	}
});

// Salt and hash the passwords on save
// What do you do with your hashbrowns? Discuss.
// If any of you want to up (or lower) the ante,
// change the number 10 (the salt work factor)
User.pre('save', function(next) {
	bcrypt.genSalt(10, function(error, salt) {
		if (error)
			return next(error);
		bcrypt.hash(this.pwd, salt, function(error, hash) {
			if (error)
				return next(error);
			this.pwd = hash;
			next();
		});
	});
});

// Note to backend: authorize only returns success/failure
// It is your job to maintain user state
User.methods.authorize = function(pwd, callback) {
	bcrypt.compare(pwd, this.pwd, function(error, success) {
		if (error)
			return callback(error);
		callback(null, success);
	})
};

// Export User compiled from schema
exports.User = mongoose.model('User', User);