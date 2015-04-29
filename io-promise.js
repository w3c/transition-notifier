/*
 Copyright © 2015 World Wide Web Consortium, (Massachusetts Institute of Technology,
 European Research Consortium for Informatics and Mathematics, Keio University, Beihang).
 All Rights Reserved.

 This work is distributed under the W3C® Software License [1] in the hope that it will
 be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

 [1] http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231
*/

// library wrapping a few Node.js io operations around Promise

require('es6-promise').polyfill();

var io_promise = {};

var fetches;

function Response(options) {
  this.status = options.status;
  this.url    = options.url;
  this.data   = options.data;
  this.headers = options.headers;
  this.text = function () {
    return Promise.resolve(this.data);
  };
  this.json = function () {
    return this.text().then(JSON.parse);
  };
}

io_promise.fetch = function (url, options) {
  var settings = {};
  var opts = (options === undefined)? {} : options;
  settings.headers = opts.headers;
  settings.auth = opts.auth;
  settings.method = "GET";
  var library = require((url.indexOf("https://") === 0)? "https" : "http");
  if (fetches !== undefined) fetches.push(url);
  return new Promise(function (resolve, reject) {
    var location = require("url").parse(url);
    settings.hostname = location.hostname;
    settings.path = location.path;
    var req = library.request(settings, function(res) {
      var buffer = "";
      res.on('data', function (chunk) {
        buffer += chunk;
      });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(new Response({ status: res.statusCode,
                                 url: res.url,
                                 data: buffer,
                                 headers: res.headers }));
        } else {
          reject(new Response({ status: res.statusCode,
                                url: res.url,
                                data: buffer,
                                headers: res.headers }));
        }
      });
    });
    req.end();
    req.on('error', function(err) {
      reject(err);
    });
  });
};

io_promise.fetches = function() {
  // makes a copy
  if (fetches !== undefined) {
    return fetches.map(function (u) {
      return u;
    });
  }
};

io_promise.fetchesCount = function() {
  return (fetches === undefined)? 0 : fetches.length;
};

io_promise.read = function (filename, options) {
  var opts = options;
  if (options === undefined) {
    opts = {  encoding: "utf-8" };
  }
  return new Promise(function (resolve, reject) {
    require('fs').readFile(filename, opts, function(err, data) {
      if (err) {
        reject (err);
      } else {
        resolve(data);
      }
    });
  });
};

io_promise.save = function (filename, data, options) {
  var opts = options;
  if (options === undefined) {
    opts = { encoding: "utf-8" };
  }
  return new Promise(function (resolve, reject) {
    require('fs').writeFile(filename, data, opts, function(err) {
      if (err) {
        reject (err);
      } else {
        resolve(data);
      }
    });
  });
};

io_promise.readJSON = function (filename) {
  return io_promise.read(filename).then(JSON.parse);
};

io_promise.saveJSON = function (filename, obj) {
  return io_promise.save(filename, JSON.stringify(obj))
    .then( function(json) { return obj; } );
};

io_promise.monitor = function () {
  fetches = [];
};

module.exports = io_promise;
