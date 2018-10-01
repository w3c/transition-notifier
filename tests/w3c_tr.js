const specs = require("../w3c_tr.js");

promise_test(() => {
  return specs().then(entries => {
    assert_true(entries.length > 0);
  }).catch(err => {
    assert_equals(err.status, "same");
  });
}, "Check tr.rdf");
