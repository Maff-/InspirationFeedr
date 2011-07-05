/*!
 * Inspiration Node
 * Copyright(c) 2011 Ruud Bijnen
 * MIT Licensed
 */
	// core
var fs = require('fs'),
	sys = require('sys'),
	url = require('url'),
	util = require('util'),
	querystring = require('querystring'),
	// vendor npm
	request = require('request'),
    htmlparser = require("htmlparser"),
	jsdom  = require("jsdom"),
	mongoose = require('mongoose'),
	im = require('imagemagick'),
	// app
	utils = require('./utils'),
	schema = require('../schema'),
	atom = require('./atom'),
	rss = require('./rss');

var inspect = require('eyes').inspector();

mongoose.model('Feed', schema.Feed)
var Feed = mongoose.model('Feed');

mongoose.model('ImageSet', schema.ImageSet)
var ImageSet = mongoose.model('ImageSet');

mongoose.model('Image', schema.Image)
var Image = mongoose.model('Image');
/*
request.defaults ({
	headers: {'User-agent': 'Inspiration Node'}
});
*/

var FeedManager = function (options) {
	this.options = options || {};
}

FeedManager.prototype.Feed = Feed;
FeedManager.prototype.ImageSet = ImageSet;

FeedManager.prototype.add = function (url, callback) {
	
	var me = this;
	
	// check if feed is already in database
	Feed.findOne({'hub.url': url}, function(err, doc) {
		if (!err && doc) {
			// already in database
			callback(null, doc);
		} else {
			// not yet in database
			// try to retrieve the feed, to check type and posible hub
			
			try {
				request({uri:url, headers:{'Accept':'text/html; q=0.2, text/xml; q=0.5, application/rss+xml; q=0.8, application/atom+xml'}}, function (err, res, body) {
				
				// set error to callback if we couldn't retrieve the feed.
				if (err || res.statusCode != 200) {
					callback(err || new Error('Could not retrieve requested feed'), null);
					return;
				}
				
				// check if the server responded with a proper content type
				var contenttype = res.headers['content-type'] || '';
				var type = 'unknown';
				if (match = contenttype.match(/application\/(\w+)\+xml/)) {
					type = match[0];
				} else if (match = contenttype.match(/text\/xml/)) {
					type = 'xml';
				} else {
					//debug
					console.log(res.headers);
				}
				
				// try to parse the returned data
				me.parse(body, type, function (err, feed) {
					
					if (err)
						callback(err, null);
					else {
						
						// create model instance for database
						var feedInDb = new Feed({
							url:url
						});
						
						// check if a hub is available
						var hubs = feed.getLinksByRel('hub')
						if (hubs.length > 0 && hubs[0].href) {
							
							feedInDb.hub.url = hubs[0].href;
							me.subscribe(feedInDb);
							
						} else {
							// no hub, we should poll the feed
						}
						
						// save the feed to database
						feedInDb.save();
						
						// TODO: return proper info
						callback(null, feedInDb);
						
						// TODO: parse feed entries
					}
					
					if (feed)
					console.log(require('sys').inspect(feed.getLinksByRel('hub'), true, 10));
				});
			});
			} catch (err) {
				callback(err, null);
			}
		}
	});
};

FeedManager.prototype.subscribe = function (feed) {
	
	if (!feed.hub.url)
		return;
	if (!this.options.pubsubhubbub)
		throw new Error("Can't subscribe to hub if no pubsubhubbub settings are in config file");
	
	var hubbub = this.options.pubsubhubbub;
	
	feed.status = 'subscribe';
	feed.save();

	try {
		request.post({
			uri: feed.hub.url,
			body: querystring.stringify({
				'hub.callback': hubbub.callback_url_root + hubbub.callback_url_path + feed._id,
				'hub.mode': 'subscribe',
				'hub.topic': feed.url,
				'hub.verify': 'sync',
				//'hub.secret': feed.hub.secret, // maybe broken
				'hub.verify_token': utils.sha1Signature(feed.url, feed.hub.secret)
			}),
			headers: {
				'Content-type': 'application/x-www-form-urlencoded'
			}
		}, function (err, res, body) {
			console.log(body);
		});
	} catch (err) {
		// todo
		console.log(err);
	}
	
	
}

FeedManager.prototype.parse = function (data, type, callback) {
	
	var me = this;

	// trye to get type from data
	if (type == 'xml') {
		if (data.match(/<rss/))
			type = 'rss';
		else if (data.match(/<feed/))
			type = 'atom';
	}
	
	//inspect(data);
	
	console.log('Parsing feed data with ['+type+'] type');
	
	var cb_err = function (err) { cb(err, null); };
	var cb_result = function (result) { cb(null, result); };
	var cb = function (err, result) {
		if (callback) callback(err, result);
		if (result) me.parseEntries (result)
	};
	
	switch (type) {
		case 'atom':
			atom.parse(data, cb_result, cb_err);
			break;
			
		case 'rss':
			rss.parse(data, cb_result, cb_err);
			break;
			
		default:
			cb(new Error ("Unknown feed type"), null);
	}
};


FeedManager.prototype.parseEntries = function (result) {

	// TODO: refactor with async.waterfall?
	
	// loop through all feed entries
	result.entries.forEach( function (entry) {
	
		sys.log ("Received feed entry titled \""+entry.title+"\"");
		
		var orginalurl = entry.getLinksByRel('origlink');
		var sourceurl = '';
		if (orginalurl.length > 0) sourceurl[0]['href'];
		var imageSet = new ImageSet({
			'sourceurl': sourceurl,
			images: []
		});
		var handledimgs = [];
		
		if (!(entry.content) && entry.summary) entry.content = entry.summary;
		
		require('eyes').inspect(entry.content);
		
		try {
		
		// wrap feed entry conent, and parse to dom
		var window = jsdom.jsdom('<html><head></head><body>'+entry.content+'</body></html>', null, {parser: htmlparser, FetchExternalResources: [], ProcessExternalResources: []}).createWindow();
		// insert jQuery
		jsdom.jQueryify(window, __dirname + '/../static/js/jquery-1.6.2.min.js' , function(/* window, jquery */) {
			var $ = window.$;
			// look for images and iterate through all
			var imgs = $('img').not('[src*="feedburner.com/~"], [src*="feed-statistics.php"]');
			
			require('eyes').inspect(imgs);
			
			imgs.each(function() {
				
				// jQuery enhanced dom object
				var img = $(this);
				// Image db schema
				var image = {};
				
				var srcstr = img.attr('src');
				var src = url.parse(srcstr);
				
				// check if img src has protocol (so it's not a relative path),
				// otherwise try to resolve with 'orginalurl'
				if(!src.protocol && !orginalurl.length)
					return;
				
				if(!src.protocol) {
					var base = url.parse(orginalurl[0]['href']);
					srcstr = url.resolve(base,src);
				}
				
				image.url = srcstr;
				
				// check if we didn't handle this image already
				if (utils.in_array(srcstr, handledimgs))
					return;
				handledimgs.push(srcstr);
				
				image.title = img.attr('title') || img.attr('alt') || null;
				
				var link = null;
				var closesta = $(this).closest('a[href]');
				if (closesta.length > 0) {
					var href = closesta.attr('href');
					if (href.indexOf('feed-statistics.php') === -1)
						image.link = closesta.attr('href');
				}
				
				// try to download the image (should we do a HEAD request instead??)
				try {
					request({
						uri: image.url,
						encoding: 'binary',
						headers: {
							'Accept': 'image/*'
						}
					}, function (err, res, body) {
						var content_type = res.headers['content-type'] || '';
						if (!err && res.statusCode == 200 && content_type.indexOf('image') === 0) {
							
							image.type = content_type;
						
							// image received from server, store it as temp file to disk
							var tmpfilename = '/tmp/inspr-' + utils.randomString(32);
							image.tempfile = tmpfilename;
						
							fs.writeFile(tmpfilename, body, 'binary', function (err) {
								if (!err) {
								im.identify(tmpfilename, function (err, features) {
									if (!err) {
										image.width = features.width;
										image.height = features.height;
										image.ratio = Math.round(100 * features.width / features.height) / 100;
										// require the size to be at least 200x200 pixels
										if (image.width >= 200 && image.height >= 200) {
											imageSet.images.push(image);
											imageSet.save();
											// TODO: save file to database and scale others.
											
											// remove temp file
											fs.unlink(tmpfilename);
										}
									} else {
										// error while reading image, we should just remove it from cache
										fs.unlink(tmpfilename);
									}
								
								});
								// TODO: delete temp file
								}
							});
							//im.identify();
						}
					});
				} catch (err) {
					sys.log("Error fetching feed entry image \"", image.url, "\": ", err.message);
				}
				
				//console.log(image);
				
				//console.log($(this).parent().prevAll('h1, h2, h3, h4, h5, h6').first().html());
			});
			
		});
		
		} catch (err) {
			sys.log("Error parsing entry content: "+err.message);
		}
		
	});
};

/*
FeedManager.prototype.checkImageSet = function (imageSet) {
	
	imageSet.images.forEach(function(image) {
		console.log("Should download and parse: ",image.url);
	});
}


FeedManager.prototype.parseHandler = function (err, dom) {

	var me = this;
	
	// This is where the magic happens....
	if (err) {
		sys.warn ("Error while parsing entry content: "+err);
	} else {
	
		var imageSet = new ImageSet();
	
		var imgs = select(dom, 'img[src]');
		imgs.forEach(function(img) {
			if (img.attribs.height != 1 && img.attribs.width != 1 && img.attribs.src.indexOf('http://feeds.feedburner.com/~ff/') == -1) {
				//sys.debug(sys.inspect(img, true, null));
				var title = img.attribs.title || img.attribs.alt || '';
				//count++;
				if (img.attribs.src.match(/^http:\/\//))
				imageSet.images.push({
					url: img.attribs.src,
					title: title
				});
			}
		});
		
		if (imageSet.images.length > 0) {
			FeedManager.checkImageSet(imageSet);
		} else {
			sys.debug("No suitable images found in feed entry");
		}
	}
};
*/

module.exports.create = function (options) {
	return new FeedManager(options);
};