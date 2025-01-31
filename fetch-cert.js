'use strict'

var https           = require('https');
var HttpsProxyAgent = require('https-proxy-agent');

var globalCache = {} // default in-memory cache for downloaded certificates

module.exports = function fetchCert (options, callback) {
  var url = options.url
  var cache = options.cache || globalCache
  var cachedResponse = cache[url.href]
  var servedFromCache = false
  if (cachedResponse) {
    servedFromCache = true
    process.nextTick(callback, undefined, cachedResponse, servedFromCache)
    return
  }

  var body = '', request = url.href;
  if(options.proxy_url) {
    request = {
      protocol: 'https:', // Make sure, we check this based on the actual URL
      slashes: true,
      auth: null,
      host: options.url.host,
      port: null,
      hostname: options.url.host,
      hash: null,
      search: null,
      query: null,
      pathname: options.url.path,
      path: options.url.path,
      agent: new HttpsProxyAgent(options.proxy_url)
    };
  }

  https.get(request, function (response) {
    var statusCode

    if (!response || 200 !== response.statusCode) {
      statusCode = response ? response.statusCode : 0
      return callback('Failed to download certificate at: ' + url.href + '. Response code: ' + statusCode)
    }

    response.setEncoding('utf8')
    response.on('data', function (chunk) {
      body += chunk
    })
    response.on('end', function () {
      cache[url.href] = body
      callback(undefined, body, servedFromCache)
    })
  })
  .on('error', function(er) {
    callback('Failed to download certificate at: ' + url.href +'. Error: ' + er)
  })
}
