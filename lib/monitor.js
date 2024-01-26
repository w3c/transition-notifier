/* eslint no-console: "off", quotes: ["error", "double"] */
"use strict";

// Library to monitor a service remotely
//
// Usage:
//
// const monitor  = require('./monitor.js');
// let app = express();
// monitor.setName("MyService");
// monitor.install(app, [options]);
//
// options.path - HTTP root path for the monitor, default is /monitor
// options.entries - max number of entries to return in the log
//
// This will expose the following resources
// /monitor/logs
// /monitor/ping
// /monitor/usage

// Server Timings:
//
// if you want cloud tracing ('traceparent' header), add the following
//  after all express router/middleware
// monitor.stats(app);
// Don't forget to use next() for each router/middleware!
// The server timing info added to the log

const v8 = require("v8");
const os = require("os");

let request_current = 0;
let request_total = 0;
let request_error = 0;
let request_warning = 0;
let name = "Generic Express Monitor";

let all_logs = [];

let logs = [];
let MAX_ENTRIES = 200;

function add(msg) {
  if (logs.length === (MAX_ENTRIES * 2)) {
    // reset the logs to only contain the max number of entries
    logs = logs.slice(MAX_ENTRIES);
  }
  logs.push(msg);
  all_logs.push(msg);
}

let error_logs = [];

function error_add(msg) {
  if (error_logs.length === (MAX_ENTRIES * 2)) {
    // reset the logs to only contain the max number of entries
    error_logs = error_logs.slice(MAX_ENTRIES);
  }
  error_logs.push(msg);
  all_logs.push(msg);
}

function getDate(msg) {
  return  "[" + (new Date()).toISOString() + "] " + msg;
}

let logStat = function(msg) {
  let args = "[stat] " + msg;
  add(args);
  process.nextTick(() => console.log(args));
};

exports.setName = function(newName) {
  name = newName;
}

exports.log = function(msg) {
  let args = "[log] " + getDate(msg);
  add(args);
  process.nextTick(() => console.log(args));
};

exports.warn = function(msg) {
  let args = "[warn] " + getDate(msg);
  request_warning++;
  add(args);
  process.nextTick(() => console.log(args));
};

exports.error = function(msg) {
  request_error++;
  let args = "[err] " + getDate(msg);
  error_add(args);
  process.nextTick(() => console.error(args));
};

// get all of the logs and flush the queue
exports.get_logs = function (msg) {
  let saved = all_logs;
  all_logs = [];
  return [...saved];
}

exports.install = function(app, options) {
  let path = "/monitor";
  if (options !== undefined) {
    if (options.path !== undefined) {
      path = options.path;
    }
    if (options.entries !== undefined) {
      MAX_ENTRIES = options.entries;
    }
  }

  // monitor all methods
  app.use(function (req, res, next) {
    request_total++;
    if (TRACK_REQUESTS) {
      request_current++;
    }
    req.startTime = Date.now();
    next();
  });

  // grabs the logs easily
  app.get(path + "/logs", function (req, res, next) {
    process.nextTick(function() {
      console.warn("[monitor] " + getDate("/logs " + req.ip));
    });
    let output = "";
    let begin = logs.length - MAX_ENTRIES;
    let end = logs.length;
    if (begin < 0) {
      begin = 0;
    }
    output = logs[begin++];
    for (let index = begin; index < end; index++) {
      output += "\n" + logs[index];
    }
    res.set("Content-Type", "text/plain");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(output);
    next();
  });

  // grabs the error logs easily
  app.get(path + "/error_logs", function (req, res, next) {
    process.nextTick(function() {
      console.warn("[monitor] " + getDate("/error_logs " + req.ip));
    });
    let output = "";
    let begin = error_logs.length - MAX_ENTRIES;
    let end = error_logs.length;
    if (begin < 0) {
      begin = 0;
    }
    output = error_logs[begin++];
    for (let index = begin; index < end; index++) {
      output += "\n" + error_logs[index];
    }
    res.set("Content-Type", "text/plain");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(output);
    next();
  });

  // simple way to check if the server is alive
  app.get(path + "/ping", function (req, res, next) {
    res.set("Content-Type", "text/plain");
    res.set("Access-Control-Allow-Origin", "*");
    res.send("pong");
    next();
  });

  // simple way to check if the server is alive
  app.get(path + "/usage", function (req, res, next) {
    res.set("Content-Type", "application/json");
    res.set("Access-Control-Allow-Origin", "*");
    let obj = process.memoryUsage();
    obj.status = "ok";
    obj.name = name;
    obj.uptime = process.uptime();
    obj.cpuUsage = process.cpuUsage();
    obj.os = {
      uptime: os.uptime(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
    };
    obj.requests = { total: request_total, errors: request_error, warnings: request_warning };
    if (TRACK_REQUESTS) {
      obj.requests.current = request_current;
    }
    obj.v8 = {};
    obj.v8.getHeapSpaceStatistics = v8.getHeapSpaceStatistics();
    obj.v8.getHeapStatistics = v8.getHeapStatistics();
    obj.v8.getHeapCodeStatistics = v8.getHeapCodeStatistics();
    res.send(JSON.stringify(obj));
  });
};

// If the server track the number of requests
let TRACK_REQUESTS = false;

exports.stats = function(app) {
  TRACK_REQUESTS = true;
  app.use(function (req, res, next) {
    let log = req.method + " " + req.originalUrl;
    if (req.get("traceparent") !== undefined) {
      log = "[" + req.get("traceparent") + "] " + log;
    }
    logStat("[" + (Date.now() - req.startTime) + "ms] " + log);
    request_current--;
    next();
  });
};
