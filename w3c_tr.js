require('es6-promise').polyfill();

var io = require('./io-promise'),
    xml2js = require('xml2js');

var RDF_FILE = "http://www.w3.org/2002/01/tr-automation/tr.rdf";

var STATUSES = {
    'NOTE': 'NOTE',
    'REC': 'REC',
    'CR': 'CR',
    'WD': 'WD',
    'LastCall': 'LCWD',
    'PER': 'PER',
    'PR': 'PR'
};

var parser = new xml2js.Parser();

function getEditor(ed) {
    return ed["contact:fullName"][0];
}

function getSpec(ref, status) {
    var obj = {};

    obj.status = status;

    obj.href = ref.$['rdf:about'];

    obj.date = ref['dc:date'][0];

    obj.versionOf = ref['doc:versionOf'][0].$["rdf:resource"];

    if (ref['ED'] !== undefined) {
        obj.editorDraft = ref['ED'][0].$["rdf:resource"];
    }

    var deliveredBy = ref['org:deliveredBy'];
    if (deliveredBy !== undefined) {
        obj.deliveredBy = deliveredBy[0]["contact:homePage"][0].$["rdf:resource"];
    }

    obj.title = ref['dc:title'][0];
    var obsolete = ref['doc:obsoletes'];
    if (obsolete !== undefined) {
        obj.obsoletes = obsolete[0].$["rdf:resource"];
    }
    var editor = ref['editor'];
    if (editor !== undefined) {
        obj.editors = editor.map(getEditor);
    }

    if (status === "LCWD") {
        obj.feedbackDate = ref.lastCallFeedBackDue[0];
    }
    if (status === "CR") {
        obj.feedbackDate = ref.implementationFeedbackDue[0];
    }

    // obj.ref = ref;

    return obj;
}

function fetchRDF() {
    // return io.read("tr.rdf");
    return io.fetch(RDF_FILE).then(function (res) {
        return res.text();
    });
}

function getSpecs() {
            return fetchRDF().then(function (data) {
                return new Promise(function (resolve, reject) {
                    parser.parseString(data, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            var specs = [];
                            var refs = result['rdf:RDF'];
                            Object.keys(STATUSES).forEach(function (k) {
                                refs[k].forEach(function (s) {
                                    specs.push(getSpec(s, STATUSES[k]));
                                });
                            });
                            resolve(specs);
                        }
                    });
                });
            });
        }

exports.specs = getSpecs;

