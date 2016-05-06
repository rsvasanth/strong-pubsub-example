// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-pubsub-example
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var Client = require('strong-pubsub');
var Adapter = require('strong-pubsub-mqtt');
var duplex = require('duplex');

Primus.Stream = require('stream');

module.exports = function(PORT) {
  var client = new Client({port: PORT, host: 'localhost'}, Adapter, {
    createConnection: function(port, host) {
      var connection = duplex();
      var primus = Primus.connect('http://' + host + ':' + port, {
        transformer: 'engine.io',
        parser: 'binary'
      });

      connection.on('_data', function(chunk) {
        // someone called `connection.write(buf)`
        primus.write(chunk);
      });

      primus.on('data', function(chunk) {
        // chunk is an arrayBuffer
        connection._data(toBuffer(chunk));
      });

      primus.on('open', function() {
        connection.emit('connect');
      });

      connection.on('_end', function() {
        primus.end();
        this._end();
      });

      return connection;
    }
  });

  client.subscribe('foo', function() {
    console.log('subscribed');
  });
  client.on('message', function(topic, msg) {
    console.log(topic, msg.toString());
  });
}


function toBuffer(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for(var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}
