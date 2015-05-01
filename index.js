var io = require("./io-promise");
var SpecLoader = require("./spec").Spec;
var notifySpec = require("./notify").notifySpec;
var W3C_TR = require("./w3c_tr").specs;

var SpecManager = function (bibrefs) {
  function filterSpecref(entries) {
    var specs = [];
    var key, entry;
    // we filter out lots of useless references
    for (key in entries) {
      entry = entries[key];
      if (entry.versionOf !== undefined &&
        entry.status !== "NOTE" &&
        entry.deliveredBy !== undefined &&
        entry.status !== undefined) {
        specs.push(entry);
      }
    }
    return specs;
  }

  function filterLatest(entries) {
    var specs = {};
    var key, entry;
    // we filter out lots of useless references
    for (key in entries) {
      entry = entries[key];
      if (entry.publisher !== undefined &&
        entry.status !== "NOTE" &&
        entry.deliveredBy !== undefined &&
        entry.status !== undefined) {
        specs[key] = entry;
      }
    }
    return specs;
  }

  this.entries = filterSpecref(bibrefs);
  this.latestVersions = filterLatest(bibrefs);
};

SpecManager.prototype.hasSpec = function (href) {
  for (var i = this.entries.length - 1; i >= 0; i--) {
    if (this.entries[i].href === href) {
      return true;
    }
  }
  return false;
};

SpecManager.prototype.getLatest = function (versionOf) {
  return this.latestVersions[versionOf];
};

var w3c_specs = null;

function fetchBibrefs() {
  return W3C_TR().then(function (entries) {
    return io.saveJSON("/tmp/specref.json", entries);
  });
}


function notifier(spec) {
  var s = new SpecLoader(spec);
  s.getSotd().then(function (text) {
    var obj = {
      href: spec.href,
      status: spec.status,
      date: spec.date,
      title: spec.title,
      obsoletes: spec.obsoletes,
      feedback: spec.feedbackDate,
      sotd: text
    };
    if (obj.status === "WD") {
      if (obj.obsoletes === undefined
          || obj.sotd.indexOf("wide review") !== -1) {
        notifySpec(obj);
      } // else ignore
    } else if (obj.status === "PR"
               || obj.status === "REC") {
      //ignore
    } else {
      notifySpec(obj);
    }
  }).catch(function (err) {
    console.log(err);
  });

  return;
}

function init() {
  // we're booting the notifier by reusing the previous entries or fetching new
  // ones if needed
  return io.readJSON("/tmp/specref.json")
    .catch(function (err) {
    return fetchBibrefs();
  }).then(function (bibrefs) {
    w3c_specs = new SpecManager(bibrefs); // if undefined, this will throw
    return w3c_specs;
  });
}

function loop() {
  var saved;

  //  io.readJSON("specref-v2.json").then(function (bibrefs) {
  fetchBibrefs().then(function (bibrefs) {
    return new SpecManager(bibrefs);
  }).then(function (specs) {
    // those are new entries
    console.log("Fetched %d entries", specs.entries.length);
    saved = specs;
    return specs;
  }).then(function (specs) {
    // let's find out how many are new entries
    var new_specs = [];
    specs.entries.forEach(function (spec) {
      if (!w3c_specs.hasSpec(spec.href)) {
        new_specs.push(spec);
      }
    });
    return new_specs;
  }).then(function (specs) {
    var notifications = [];
    specs.forEach(function (spec) {
      var latest = w3c_specs.getLatest(spec.versionOf);
      spec.previousVersion = latest;
      notifications.push(spec);
    });
    return notifications;
  }).then(function (specs) {
    if (specs.length > 20) {
      // this is suspicious...
      console.log("WARNING: TOO MANY NOTIFICATIONS. IGNORING.");
    } else {
      specs.forEach(function (spec) {
        notifier(spec);
      });
    }
    return specs;
  }).then(function (specs) {
    return io.saveJSON("entries.json", specs);
  }).catch(function (err) {
    console.log(err.stack);
  });

  setTimeout(loop, 900000); //every 15 minutes
}

init().then(function () {
  loop();
}).catch(function (err) {
  console.log("Error during initialization");
  console.log(err);
  console.log(err.stack);
}).then(function () {
  console.log("Initialized %d entries", w3c_specs.entries.length);
});
