/*!
 * Copyright(c) 2011 Ruud Bijnen
 * MIT Licensed
 */

var Schema = require('mongoose').Schema,
	ObjectId = Schema.ObjectId,
	randomString = require('./lib/utils').randomString;

var Feed = new Schema({
	url: { type: String, unique: true },
	contenttype: String,
	hub: {
		url: String,
		secret: { type: String, default: randomString }
	},
	status: { type: String, default: 'unknown' },
	created: { type: Date, default: Date.now },
	lastreceived: Date,
	itemcount: Number
});

var Image = new Schema({
	url: String,
	tempfile: String,
	title: String,
	link: String,
	type: String,
	width: Number,
	height: Number,
	ratio: Number,
	colors: {}
});

var ImageSet = new Schema({
	sourceurl: String,
	created: { type: Date, default: Date.now },
	images: [Image]
});

exports.Feed = Feed;
exports.Image = Image;
exports.ImageSet = ImageSet;