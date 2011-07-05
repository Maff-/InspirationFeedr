/*!
 * Inspiration Node
 * Copyright(c) 2011 Ruud Bijnen
 * MIT Licensed
 */

var sys = require('sys'),
	fs = require('fs'),
	utils = require('./lib/utils'),
	express = require('express'),
	mongoose = require('mongoose'),
	md = require('markdown').markdown;

var config = require('./config');

var FeedManager = require('./lib/feedmanager').create({pubsubhubbub: config.pubsubhubbub});

var inspect = require('eyes').inspector();

mongoose.connect(config.mongodb.address);
mongoose.connection.on('open', function () {
	sys.log('Conencted to MongoDB server');
});

var app = express.createServer(
	express.logger(),
	express.bodyParser(),
	express.static(__dirname + '/static', {cache: false}) // TODO: Change to cache: true
);

app.register('.md', {
	compile: function(str, options){
		var html = md.toHTML(str);
		return function(locals){
			return html.replace(/\{\{([^}]+)\}\}/g, function(_, name){
				return locals[name];
			});
		};
	}
})
app.set('view engine', 'ejs');
app.set('view options', {
	title: 'Inspiration Feedr*',
	author: 'Ruud Bijnen',
	description: ''
});


/*******************************************
 * PUBSUBHUBHBUB CALLBACK REQUEST HANDLERS
 *******************************************/

app.get(config.pubsubhubbub.callback_url_path + ':feed_id', function (req, res, next) {
	
	console.log(req.headers);
	console.log(req.query);

	if (
		req.query['hub.verify_token'] &&
		( 'subscribe' == req.query['hub.mode'] || 'unsubscribe' == req.query['hub.mode'] ) &&
		req.query['hub.topic'] &&
		req.query['hub.challenge']
	) {
		//Hub Verifies Intent of the Subscriber
		//req.query['hub.mode']
		//req.query['hub.topic']
		//req.query['hub.challenge']
		//req.query['hub.lease_seconds']
		//req.query['hub.verify_token']
	
		FeedManager.Feed.findOne({url: req.query['hub.topic'], status: req.query['hub.mode']}, function(err, feed) {
			if (!err && feed) {
				
				// check if verify_token is correct
				if (utils.sha1Signature(feed.url, feed.hub.secret) != req.query['hub.verify_token']) {
					// supplied verify_token is incorrect
					res.send(403);
				} else {
					// Intent of the Subscriber (us) Verified
					
					// reply with 2xx status with hub.challenge in body
					res.send(req.query['hub.challenge'], 202);
					
					if('subscribe' == req.query['hub.mode']) {
						feed.status = 'subscribed';
					} else {
						feed.status = 'unsubscribed';
					}
					
					feed.save(function (err){
						if (!err)
							sys.log("Succesfully " + feed.status + " to " + req.query['hub.topic']);
					});
				}
				
			} else {
				res.send(403);
				sys.log("Hub tried to "+req.query['hub.mode']+" "+req.query['hub.topic']+", but no such feed was found.");
			}
		});
		
	} else {
		next(new Error('Hub suplied not all required params'));
	}
});

app.post(config.pubsubhubbub.callback_url_path + ':feed_id', function (req, res, next) {

	inspect(req.headers);
	var body = '';
	req.setEncoding('utf8');
	req.on('data', function(data) {
		body += data;
	});
	req.on('end', function() {
		// even if we can't use the data, we should reply with a 2xx code
		// better to it now, no need to keep the connection open
		res.send(204);
		
		if (req.header('X-Hub-Signature') && req.header('X-Hub-Signature').indexOf('sha1=') === 0) {
			var sig = req.header('X-Hub-Signature').substr(5);
			//how do we know if we supplied a secret to the hub???
			//and how can we tell which hub is sending the data?
			//we could create a specific callback path for every hub or feed
			//if (is_valid_signature (sig, secret, body)) .......
		}
		
		FeedManager.parse(body, 'xml', function (err, data) {
			if (!err && data)
				sys.log("Received "  + data.links.size() + " links from the hub");
		});
		
		/*
		require('fs').writeFile('lastreceivedbody.dat', body, function (err) {
			if (err) throw err;
			console.log('It\'s saved!');
		});
		*/
	});
	
});

/*******************************************
 * API REQUEST HANDLERS
 *******************************************/

app.post('/api/feed', function(req, res, next) {
	if (req.body.url) {
		FeedManager.add(req.body.url, function (err, result) {
			if (err)
				next(err);
			else
				res.send(result);
		});
	} else {
		res.send("Error: Parameter 'url' missing.", 409);
	}
});

app.get('/api/feeds', function(req, res, next) {

	FeedManager.Feed.find({}, function (err, doc){
		if (err)
			next(err);
		else
			res.send(doc);
	});
});

// return latest image sets
app.get('/api/imagesets', function(req, res, next) {
	var result = [];
	
	req.body = req.body || {};
	
	// let the requester decide how many items to return, but return 20 at max (default is 5).
	var limit = parseInt(req.body.limit) || 5;
	if (limit > 20) limit = 20;
	
	FeedManager.ImageSet.findOne({}, function (err, doc){
		if (err) next(err);
		else inspect(doc);
	});
	
	FeedManager.ImageSet.find({},[],{limit:limit, sort:{created: -1}}, function (err, docs) {
		if (err)
			next(err);
		else {
			docs.forEach(function (doc) {
				result.push(doc.toObject());
			});
			res.send(result);
		}
	});
});

/*******************************************
 * 'WEBSITE' REQUEST HANDLERS
 *******************************************/
 
app.get('/docs/:doc', function(req, res, next){
	res.partial('../docs/'+req.params.doc+'.md', function (err, str) {
		if (err)
			next(err)
		else
			res.render('doc', {doc: str});
	});
});
 
app.get('/', function(req, res, next){
	res.partial('../readme.md', function (err, str) {
		if (err)
			next(err)
		else
			res.render('doc', {doc: str});
	});
});

app.get('/', function(req, res){
	res.render('index');
});

app.error(function(err, req, res, next){
	if (req.is('json'))
		res.send({error: err.message}, 500);
	else
		res.send(err.message, 500);
		
	sys.log("ERROR: " + err.message);
});


/*******************************************
 * CLIENT REQUEST HANDLERS
 *******************************************/
app.all('/ipad', function(req, res){
	res.redirect('/client/ipad/', 301);
});
 
app.listen(config.server.port, config.server.address);

sys.log('Starting server... listening on ' + app.address().address + ':' + app.address().port);