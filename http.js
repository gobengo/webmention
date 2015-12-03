const getPort = require('portfinder').getPort
const express = require('express')
const discovery = require('./discovery')

if (require.main === module) {
  Promise.resolve(process.env.PORT || findPort())
  .then(function (port) {
    createServer().listen(port)
    process.stderr.write('Listening on port '+port+'\n')
  })
  .catch(function (err) {
    console.error("Error: ", err)
    process.exit(1);
  })
}

function findPort() {
  return new Promise(function (resolve, reject) {
    getPort(function (err, port) {
      err ? reject(err) : resolve(port)
    })
  })
}

/**
 * Create an HTTP server that does webmention things
 */
function createServer() {
  var server = express();
  // discovery
  server.get('/discover', function (req, res) {
    var target = req.query.target;
    if ( ! target) {
      console.log('need target')
      return res.status(400).json({
        message: "Provide a target URL, e.g. ?target=http://bengo.is/"
      })
    }
    discovery.discover(target)
    .then((endpoints) => {
      console.log('endpoints are', endpoints)
      res.json({
        webmention: endpoints
      })
    })
    .catch((err) => {
      console.log('error!', err)
      const status = 500
      res.status(500).json({
        status: status,
        message: err.message
      });
    })
  })
  return server
}
