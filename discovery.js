#!/usr/bin/env node
'use strict'
var fetch = require('node-fetch')
var parseLinkHeader = require('parse-links')

exports.discover = discover

if (require.main === module) {
  discover(process.argv[2])
  .then((endpoints) => {
    endpoints.forEach((endpoint) => {
      process.stdout.write(endpoint);
    })
  })
  .catch((err) => {
    console.error("Error discovering endpoint", err);
    console.error(err.stack)
    process.exit(1);
  });
}

function discover(targetURI) {
  // head first
  return discoverFromHEAD(targetURI)
  .then(function (endpoints) {
    if (endpoints.length) {
      return endpoints
    }
    return discoverFromGET(targetURI)
  })
}

function discoverFromHEAD(url) {
  return fetch(url, { method: 'HEAD '})
  .then(endpointsFromLinkHeaders)
}

function discoverFromGET(url) {
  return fetch(url, { method: 'GET' })
  .then((res) => {
    return res.body
  })
  .then(endpointsFromBodyStream)
}

function endpointsFromLinkHeaders(res) {
  const linkHeaders = res.headers
  .getAll('link')
  .filter(Boolean)
  .map(function(header) {
    try {
      return parseLinkHeader(header)
    } catch (e) {
      console.error("Failed to parse link header: ", header);
      throw e
    }
  })

  if ( ! (linkHeaders && linkHeaders.length)) {
    return []
  }

  let endpoint = null;
  while ( linkHeaders.length && ! endpoint) {
    let link = linkHeaders.shift()
    if ( ! link) continue;
    endpoint = link.webmention
  }

  return endpoint ? [endpoint] : []
}

const WEBMENTION_LINK_QUERYSELECTOR =
  'head link[rel="webmention"], a[rel="webmention"]'
function endpointsFromBodyStream(htmlStream) {
  var trumpet = require('trumpet');
  var tr = trumpet()
  var endpoint;
  return new Promise(function (resolve, reject) {
    tr.select(WEBMENTION_LINK_QUERYSELECTOR)
      .getAttribute('href', function (href) {
        endpoint = href;
        resolve([endpoint]);
      });
    htmlStream.pipe(tr)
      .on('error', reject)
      .on('end', function () {
        if ( ! endpoint) {
          // there were none
          resolve([])
        }
      })
  })
}
