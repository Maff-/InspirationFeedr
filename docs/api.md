InspirationFeedr API Docs

## How to access the api methods

All requests to the API backend must be done with JSON over HTTP. You should send your request with
the `Accept: application/json` header.

Parameters in GET request must be added as a `query string`. When making a POST request parameters
must be packed in a json object and sent as `request body`.

When an error occurs the server should reply with an JSON formatted error object
(`{ 'error': 'error msg string...' }`), and an appropriate HTTP Response code, e.g. 304/409/500.

## Methodes

Please note in the examples below some request/response headers are omitted in order to simplify
them as much as posible.

### /api/imagesets [GET] - Retrieve image sets

Retrieve a given number of sets of images. The optional parameter `limit` can limit the number of
returned objects, when no limit is set the request will return a maximum of 5 sets. The maximum
value for limit is 20.

#### Arguments

* `limit` (optional)

#### Responses - Succes

* `200 OK`
  * Returns array of Imageset objects

#### Example
    > GET /api/imagesets?limit=2
    > Accept: application/json
    
    < HTTP/1.1 200 OK
    < Content-Type: application/json; charset=utf-8
    <
    < [
    < TODO: add example data
    < ]
    
### /api/feed [POST] - Adding a source feed

Adds a new rss-feed to InpsirationFeedr by sending the url of the rss-feed as the url parameter of
this command. When the system successfully retrieved the data from the feed it will be added to the
system and its properties will be returned as a JSON object.

#### Arguments

* `url` (required)

#### Responses - Succes

* `200 OK`
  * Returns resulting Feed object data

#### Responses - Failure

* `409 Conflict`
  * Missing required argument

#### Example
    > POST /api/feed
    > Accept: application/json
    >
    > { 'url': 'http://urltofeed' }
    
    < HTTP/1.1 200 OK
    < Content-Type: application/json; charset=utf-8
    <
    < {
    <   hub: { secret: '***', url: 'http://pubsubhubbub.appspot.com/' },
    <   status: 'subscribe',
    <   created: '2011-07-02T20:03:49.697Z',
    <   _id: '4e0f79a5803f9d474f000001',
    <   url: 'http://urltofeed'
    < }