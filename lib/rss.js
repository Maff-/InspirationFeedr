var sys = require('sys'),
	sax = require('sax');

/**
 * Crude sax-based RSS feed parser.
 * Copyright(c) 2011 Ruud Bijnen
 * MIT Licensed
 *
 * Based on work of:
 * Sean McCullough banksean@gmail.com
 * https://github.com/banksean/node-pshb/blob/master/lib/atom.js
 *
 * http://www.rssboard.org/rss-profile
 * http://www.rssboard.org/rss-specification
 *
 */

var RssFeed = function () {
	this.links = [];
	this.entries = [];
	this.title = "";
	this.updated = "";
	this.id = "";
};

var Entry = function () {
	this.links = [];
	this.title = "";
	this.updated = "";
	this.published = "";
	this.summary = "";
	this.content = "";
	this.id = "";
}

RssFeed.prototype.getLinksByRel = function (rel) {
	var ret = [];
	for (var i = 0; i < this.links.length; i++) {
		var link = this.links[i];
		if (link.rel == rel) {
			ret.push(link);
		}
	}
	return ret;
}

var RssParser = function (strict) {
	this.strict = false;
};

exports.RssParser = RssParser;
exports.parse = parse;

function parse(data, callback, errback) {
	var parser = new RssParser(false);
	return parser.parse(data, callback, errback);
}

RssParser.prototype.parse = function (data, callback, errback) {
	var parser = sax.parser(this.strict, {
		trim: true
	});
	var feed = new RssFeed();
	var currentEntry = null;
	var currentNodeName = "";

	parser.onerror = function (e) {
		if (errback) {
			errback(e);
		}
	};

	parser.ontext = function (t) {
		var el;
		if (currentEntry != null) {
			el = currentEntry;
		} else {
			el = feed;
		}
		if (currentNodeName == "TITLE") {
			el.title += t;
		} else if (currentNodeName == "DESCRIPTION") {
			el.summary += t;
		} else if (currentNodeName == "PUBDATE") {
			el.published += t;
		} else if (currentNodeName == "UPDATED") {
			el.updated += t;
		} else if (currentNodeName == "GUID") {
			el.id += t;
		} else if (currentNodeName == "CONTENT:ENCODED") {
			el.content += t;
		} else if (currentNodeName == "LINK") {
			el.links.push({href:t, rel:'link'});
		} else if (currentNodeName == "FEEDBURNER:ORIGLINK") {
			el.links.push({href:t, rel:'origlink'});
		}
	};
	
	parser.oncdata = function (c) {
		var el;
		if (currentEntry != null) {
			el = currentEntry;
		} else {
			el = feed;
		}
		if (currentNodeName == "CONTENT:ENCODED") {
			el.content += c;
		}
	};

	parser.onopentag = function (node) {
		if (node.name == "ITEM") {
			currentEntry = new Entry();
			feed.entries.push(currentEntry);
		} else if (node.name == "ATOM:LINK" || node.name == "ATOM10:LINK") {
			var l = {};
			for (var attrName in node.attributes) {
				l[attrName] = node.attributes[attrName];
			}
			if (currentEntry == null) {
				// LINKs for the feed itself
				feed.links.push(l);
			} else {
				currentEntry.links.push(l);
			}
		}
		currentNodeName = node.name;
	};

	parser.onclosetag = function (name) {
		if (name == "ITEM") {
			currentEntry = null;
		}
	};

	parser.onattribute = function (attr) {
		/*
		*/
	};

	parser.onend = function () {
		callback(feed);
	};

	parser.write(data).close();
};