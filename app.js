var restify = require('restify');
var builder = require('botbuilder');


console.log('Starting...');
console.log(builder)
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'cbb3405c-70d4-4e7d-b4b6-83940686b651',
    appPassword: 'on2XB5NQNOqfi10fOgGZaVR'
//	appId: null,
//	appPassword: null
});

//var connector = new builder.ConsoleConnector().listen()
var bot = new builder.UniversalBot(connector);
server.post('/', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=330b7db2-7cd4-466c-9bbe-28521bfa957a&subscription-key=fe19cd20c4a84c829a1c8d572e198788')
//var intents = new builder.IntentDialog();
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents);

intents.matches('DevOps Action', [

	function (session, args, next) {
        // Resolve and store any entities passed from LUIS.
        var application = builder.EntityRecognizer.findEntity(args.entities, 'AppEntity');
        var action = builder.EntityRecognizer.findEntity(args.entities, 'ActionEntity');
        var env = builder.EntityRecognizer.findEntity(args.entities, 'EnvEntity');
		
		console.log('In w1 about to inspect.');

		if ( action != null ) { 
			session.userData.action = action.entity
		} 

		if ( application != null ) {
			session.userData.application = application.entity
		} 
		if ( env != null )  {
			session.userData.env = env.entity
		}

		console.log('In w1 about to inspect complete.');
     	
     	next();
	},

	function (session, results, next) {
    	if (session.userData.action == null) {
			session.beginDialog('/action');
		} else {
			next();
		}
	},

	function (session, results, next) {
    	if (session.userData.application == null) {
			session.beginDialog('/application');
		} else {
			next();
		}
    },

	function (session, results, next) {
    	if (session.userData.env == null) {
			session.beginDialog('/env');
		} else {
			next();
		}
    },

    function (session, results, next) {
    	session.send('ok here is what I am going to do !');
    	var promptStr = session.userData.action + " app " + session.userData.application + " on " + session.userData.env;
    	builder.Prompts.choice(session, promptStr, ["Yes","No"]);
    },

    function(session, results) {
    	if (results.response.entity == "No") {
    		session.send(":( I was so looking forward to it, will not go ahead... do try again!");
    	} else {
    		session.send("Super, I will get to it right away and keep you posted here!");
	    	session.userData.action = null
			session.userData.application = null
			session.userData.env = null;		
    	}

    	session.endDialog();
    }
]);

intents.matches('GeneralChitChat', [

	function (session, args, next) {
		session.send('Hi, am doing great today thank you, what can I do for you today?');
		session.send('I can build, deploy and test for you :-)');
	}
]);

intents.matches(/^reset/i,[
	function(session) {
		session.userData.action = null
		session.userData.application = null
		session.userData.env = null;
		session.send('As you wish, have forgotten all that you commanded earlier! Lets try again, shall we?');
		session.endDialog();
	}
]);

intents.matches(/^change name/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    }
]);

bot.dialog('/action',[
	function(session) {
		var promptStr = "Hi, what would you like me to do today? ";
		builder.Prompts.choice(session, promptStr, ["Build","Deploy","Sanity","Regression"]);
	},

	function(session,results) {
		session.userData.action = results.response.entity;
		session.endDialog();
	}
]);


bot.dialog('/application',[
	function(session) {
		var promptStr = "Which application would you like " + session.userData.action + " on?";
		builder.Prompts.choice(session, promptStr, ["CS","PS","Presentation"]);
	},

	function(session,results) {
		session.userData.application = results.response.entity;
		session.endDialog();
	}
]);

bot.dialog('/env',[
	function(session) {
		var promptStr = "Which environment would you like " + session.userData.action + " on?";
		builder.Prompts.choice(session, promptStr, ["dev11","dev31","dev91"]);
	},

	function(session,results) {
		console.log(results.response);
		session.userData.env = results.response.entity;
		session.endDialog();
	}
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);