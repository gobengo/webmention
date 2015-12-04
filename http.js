const getPort = require('portfinder').getPort
const express = require('express')
const discovery = require('./discovery')

if (require.main === module) {
  process.on('SIGINT', exit)
  process.on('SIGTERM', exit)
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException: ', err)
    console.error(err.stack)
    process.exit(1)
  })
  return Promise.resolve(process.env.PORT || findPort())
  .then(function (port) {
    createServer().listen(port)
    process.stderr.write('Listening on port '+port+'\n')
  })
  .catch(function (err) {
    console.error("Error: ", err)
    process.exit(1);
  })
}

function exit() {
  process.stderr.write('Exiting\n', process.exit.bind(process, 0));
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
      }).end()
    }
    discovery.discover(target)
    .then((endpoints) => {
      console.log('endpoints are', endpoints)
      res.status(200).json({
        webmention: endpoints
      }).end()
    })
    .catch((err) => {
      console.log('error!', err)
      const status = 500
      res.status(500).json({
        status: status,
        message: err.message
      }).end();
    })
  })
  return server
}
