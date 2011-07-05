InspirationFeedr Introduction

## What is InspirationFeedr?

For a designer, artist or 'just' creative guy it is always very inspiring to see other peoples
work. Fortunately for those there are a lot of blogs on the web to get your daily fix, but wouldn't
it be great if you could have access to those inspiring images in other ways as well?

This is where InspirationFeedr jumps in. InspirationFeedr is a platform that redistributes these
inspiring images trough a RESTful web API. This allows developers to create their own clients.
One should think of applications like iPad Apps, Screensavers, Video Walls, Narrowcasting Systems.

Although a iPad (web) App is in the makes to show off the capabilities of this service, it isn't the
goal of the project to supply all kinds of ready made clients. This is left up to other developers.

## How InspirationFeedr Works

InspirationFeedr gets its sets of inspiring images from RSS and Atom feeds, these are usually
available as an alternative source of the blog page. But instead of polling these feeds at a given
interval, InspirationFeedr relies on the [PubSubHubBub](http://code.google.com/p/pubsubhubbub/)
protocol/service. This means the PubSubHubBub server sends the feed entry as soon as it's available.

The InspirationFeedr server parses these received feed entries and tries to extract the images. This
information, along with additional meta information is stored in a [MongoDB](http://www.mongodb.org/)
database.

A client can then retrieve these image sets from the InspirationFeedr server trough the API interface.

## Getting Started

If you would like to write a client for this service that would be great! There is no need to run
own server, but if you like have a look below. Otherwise you should have a look at the
[API Documentation](/docs/api).

## Running your own server

### Requirements

* [nodeJS](http://github.com/joynet/node)
* [npm](http://github.com/isaacs/npm)
* [MongoDB](http://www.mongodb.org)

### Install

Clone from GitHub, or download and extract.

Load dependencies:

    cd InspirationFeedr
    npm install -d

Also have a look at the `config.js` file.

## Roadmap

* Stabilize API design
* Stabilize server code
* iPad demo app
* Improve image detection
* Poll Feeds when there's no PubSubHubbub available
* Introduce user defined channels

## Used Libraries

NodeJS Modules

* express
* mongoose
* jsdom
* sax
* request
* htmlparser
* imagemagick
* querystring
* markdown
* ejs
* eyes

## License 

(The MIT License)

Copyright (c) 2011 Ruud Bijnen

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.