var mongoose = require('mongoose');

var uristring = 'mongodb://localhost/oauth';

console.log('Configuring DB');

// Makes connection asynchronously. Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function(err, res) {
	if (err) {
		console.log('ERROR connecting to: ' + uristring + '. ' + err);
	} else {
		console.log('Connected to: ' + uristring);
	}
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
	console.log('Yay');
});

var model = require('./model')

OAuthUser = mongoose.model('OAuthUsers');
var user = new OAuthUser({ username: 'testuser', password: 'test', firstname: 'Test', lastname: 'User' , email: 'test@testme.gg' });
user.save(function(err, user) {
	if (err) return console.error("Failed to save: " + err);	
});

OAuthClient = mongoose.model('OAuthClients');
var client = new OAuthClient({ clientId: 'testuser', clientSecret: 'test', redirectUri: '/login' });
client.save(function(err, client) {
	if (err) return console.error("Failed to save: " + err);	
});
