const io = require('io-promise'),
    xml2js = require('xml2js');

const RDF_FILE = "https://www.w3.org/2002/01/tr-automation/tr.rdf";

const STATUSES = {
    'NOTE': 'NOTE',
    'REC': 'REC',
    'CR': 'CR',
    'WD': 'WD',
    'LastCall': 'LCWD',
    'PER': 'PER',
    'PR': 'PR'
};

const parser = new xml2js.Parser();

function getEditor(ed) {
    return ed["contact:fullName"][0];
}

function getSpec(ref, status) {
    let obj = {};

    obj.status = status;

    obj.href = ref.$['rdf:about'];

    if (status === "CR") {
        if (obj.href.match(/https:\/\/www.w3.org\/TR\/[0-9]+\/CRD/)) {
            obj.status = status = "CRD";
        } else if (obj.href.match(/https:\/\/www.w3.org\/TR\/[0-9]+\/CRS/)) {
            obj.status = status = "CRS";
        }
    }

    obj.date = ref['dc:date'][0];

    obj.versionOf = ref['doc:versionOf'][0].$["rdf:resource"];

    if (ref['ED'] !== undefined) {
        obj.editorDraft = ref['ED'][0].$["rdf:resource"];
    }

    let deliveredBy = ref['org:deliveredBy'];
    if (deliveredBy !== undefined) {
        obj.deliveredBy = deliveredBy[0]["contact:homePage"][0].$["rdf:resource"];
    }

    obj.title = ref['dc:title'][0];
    let obsolete = ref['doc:obsoletes'];
    if (obsolete !== undefined) {
        obj.obsoletes = obsolete[0].$["rdf:resource"];
    }
    let editor = ref['editor'];
    if (editor !== undefined) {
        obj.editors = editor.map(getEditor);
    }

    if (status === "LCWD") {
        obj.feedbackDate = ref.lastCallFeedBackDue[0];
    }
    if (status === "CRD" || status === "CRS") {
        const f = ref.implementationFeedbackDue[0];
        if (f) {
          const i = new Date(f);
          const today = new Date();
          if (f > today) {
            obj.feedbackDate = ref.implementationFeedbackDue[0];
          }
        }

    }

    // obj.ref = ref;

    return obj;
}

let W3C_RDF_HEADERS = "/tmp/tr.headers.json";

function fetchRDF() {
    return io.readJSON(W3C_RDF_HEADERS)
      .then(function (data) {
        let previous_headers = data;
        let previous_etag = previous_headers.etag;
        return io.head(RDF_FILE).then(function (res) {
            let new_headers = res.headers;
            let new_etag = new_headers.etag;
            if (previous_etag !== new_etag) {
              return true;
            } else {
              return false;
            }
        });
    }).catch(function (err) {
      return true;
    }).then(function (needfetch) {
      if (needfetch) {
        // return io.read("tr.rdf");
        return io.fetch(RDF_FILE).then(function (res) {
          io.save(W3C_RDF_HEADERS, res.headers);
          return res.text();
        });
      } else {
        throw { message: "tr.rdf did not change", "status": "same"};
      }
    });
}

function getSpecs() {
            return fetchRDF().then(function (data) {
                return new Promise(function (resolve, reject) {
                    parser.parseString(data, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            let specs = [];
                            let refs = result['rdf:RDF'];
                            Object.keys(STATUSES).forEach(function (k) {
                                if (refs[k] !== undefined) {
                                  refs[k].forEach(function (s) {
                                      specs.push(getSpec(s, STATUSES[k]));
                                  });
                                }
                            });
                            resolve(specs);
                        }
                    });
                });
            });
        }

module.exports = getSpecs;

