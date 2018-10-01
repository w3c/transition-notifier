const wpt = require("./wpt-testharness.js");


// Report results on the console
wpt.add_result_callback(test => {
  let msg = "\t";
  switch (test.status) {
    case 0:
      msg += "PASS"; break;
    case 1:
      msg += "FAIL"; break;
    case 2:
      msg += "TIMEOUT"; break;
    case 3:
      msg += "NOTRUN"; break;
    default:
      msg += "UNKNOWN VALUE " + test.status;
  }
  msg += " [" + test.name + "] ";
  if (test.message) {
    msg += test.message;
  }
  console.log(msg);
  if (test.status) {
    console.error(test.stack);
  }
});


// Expose all testharness.js methods to the global scope

function expose(object, name) {
  global[name] = object;
}

// from testharness.js
expose(wpt.EventWatcher, 'EventWatcher');
expose(wpt.test, 'test');
expose(wpt.async_test, 'async_test');
expose(wpt.promise_test, 'promise_test');
expose(wpt.promise_rejects, 'promise_rejects');
expose(wpt.generate_tests, 'generate_tests');
expose(wpt.setup, 'setup');
expose(wpt.done, 'done');
expose(wpt.on_event, 'on_event');
expose(wpt.step_timeout, 'step_timeout');
expose(wpt.format_value, "format_value");
expose(wpt.assert_true, "assert_true");
expose(wpt.assert_false, "assert_false");
expose(wpt.assert_equals, "assert_equals");
expose(wpt.assert_not_equals, "assert_not_equals");
expose(wpt.assert_in_array, "assert_in_array");
expose(wpt.assert_object_equals, "assert_object_equals");
expose(wpt.assert_array_equals, "assert_array_equals");
expose(wpt.assert_array_approx_equals, "assert_array_approx_equals");
expose(wpt.assert_approx_equals, "assert_approx_equals");
expose(wpt.assert_less_than, "assert_less_than");
expose(wpt.assert_greater_than, "assert_greater_than");
expose(wpt.assert_between_exclusive, "assert_between_exclusive");
expose(wpt.assert_less_than_equal, "assert_less_than_equal");
expose(wpt.assert_greater_than_equal, "assert_greater_than_equal");
expose(wpt.assert_between_inclusive, "assert_between_inclusive");
expose(wpt.assert_regexp_match, "assert_regexp_match");
expose(wpt.assert_class_string, "assert_class_string");
expose(wpt.assert_exists, "assert_exists");
expose(wpt.assert_own_property, "assert_own_property");
expose(wpt.assert_not_exists, "assert_not_exists");
expose(wpt.assert_inherits, "assert_inherits");
expose(wpt.assert_idl_attribute, "assert_idl_attribute");
expose(wpt.assert_readonly, "assert_readonly");
// expose(wpt.assert_throws, "assert_throws");
expose(wpt.assert_unreached, "assert_unreached");
expose(wpt.assert_any, "assert_any");
expose(wpt.fetch_tests_from_worker, 'fetch_tests_from_worker');
expose(wpt.fetch_tests_from_window, 'fetch_tests_from_window');
expose(wpt.timeout, 'timeout');
expose(wpt.add_start_callback, 'add_start_callback');
expose(wpt.add_test_state_callback, 'add_test_state_callback');
expose(wpt.add_result_callback, 'add_result_callback');
expose(wpt.add_completion_callback, 'add_completion_callback');
expose(wpt.AssertionError, "AssertionError");

// testharness.js relies on code.name, which isn't supported in Node.js
global.assert_throws = function (code, func, description) {
  if (code !== Error) {
    wpt.assert_throws(code, func, description);
  } else {
    try {
      func.call(this);
      assert_unreached("function did not throw");
    } catch (e) {
      assert_equals(e.name, "Error", "function throws an Error object");
      assert_own_property(e, "stack", "function throws an Error object");
      assert_own_property(e, "message", "function throws an Error object");
    }
  }
}

// display running script
module.exports = function (object) {
  const filename = module.parent.filename.split('\\');
  console.log("Running tests in " + filename[filename.length-1] + "\n");
}