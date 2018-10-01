const io = require("io-promise");
const loadSpecification = require("./spec");
const notify = require("./notify");
const W3C_TR = require("./w3c_tr");

let SpecManager = function (bibrefs) {
  function filterSpecref(entries) {
    let specs = [];
    let key, entry;
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
    let specs = {};
    let key;
    // we filter out lots of useless references
    for (key in entries) {
      specs[key] = entries[key];
    }
    return specs;
  }

  this.entries = filterSpecref(bibrefs);
  this.latestVersions = filterLatest(this.entries);
};

SpecManager.prototype.hasSpec = function (href) {
  for (let i = this.entries.length - 1; i >= 0; i--) {
    if (this.entries[i].href === href) {
      return true;
    }
  }
  return false;
};

SpecManager.prototype.getLatest = function (versionOf) {
  return this.latestVersions[versionOf];
};


const SPEC_LIST_FILE = "/home/node/specref.json";
let w3c_specs = null;

function fetchBibrefs() {
  return W3C_TR().then(function (entries) {
    return io.save(SPEC_LIST_FILE, entries);
  });
}

function notifier(spec) {
  loadSpecification(spec).then(function (specData) {
    let obj = {
      href: spec.href,
      status: spec.status,
      date: spec.date,
      title: spec.title,
      editors: spec.editors,
      obsoletes: spec.obsoletes,
      feedbackDate: spec.feedbackDate,
      sotd: specData.sotd,
      abstract: specData.abstract,
      deliveredBy: spec.deliveredBy,
      editorDraft: spec.editorDraft,
      versionOf: spec.versionOf
    };
    notify(obj);
  }).catch(function (err) {
    console.error("Failure to notify");
    console.error(err);
    console.error(err.stack);
  });

  return;
}

function init() {
  // we're booting the notifier by reusing the previous entries or fetching new
  // ones if needed
  return io.readJSON(SPEC_LIST_FILE)
    .catch(function (err) {
    return fetchBibrefs();
  }).then(function (bibrefs) {
    w3c_specs = new SpecManager(bibrefs); // if undefined, this will throw
    return w3c_specs;
  });
}

function loop() {
  let saved;

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
    let new_specs = [];
    specs.entries.forEach(function (spec) {
      if (!w3c_specs.hasSpec(spec.href)) {
        new_specs.push(spec);
      }
    });
    return new_specs;
  }).then(function (specs) {
    // establishes the list of new entries
    let notifications = [];
    // @@ is this really or can it be combined with the previous then?!?
    specs.forEach(function (spec) {
      let latest = w3c_specs.getLatest(spec.versionOf);
      spec.previousVersion = latest;
      notifications.push(spec);
    });
    // replace the previous list of specs with the new one
    w3c_specs = saved;
    return notifications;
  }).then(function (specs) {
    // ok, we notify now
    if (specs.length > 50) {
      // this is suspicious...
      console.error("WARNING: TOO MANY NOTIFICATIONS. IGNORING.");
    } else {
      specs.forEach(function (spec) {
        notifier(spec);
      });
    }
    return specs;
  }).then(function (specs) {
    // not really needed
    return io.save("entries.json", specs);
  }).catch(function (err) {
    if (err.status !== "same") {
      console.error(err);
      console.error(err.stack);
    }
  });

  setTimeout(loop, 900000); //every 15 minutes
}

init().then(function () {
  loop();
}).catch(function (err) {
  console.error("Error during initialization");
  console.error(err);
  console.error(err.stack);
}).then(function () {
  if (w3c_specs && w3c_specs.entries) {
    console.log("Initialized %d entries", w3c_specs.entries.length);
  } else {
    console.error("Something went wrong...");
  }
});
