Handlebars.registerHelper("user", function() {
	if (!Meteor.user()) {
		return false;
	}
	return Meteor.user().username;
})
