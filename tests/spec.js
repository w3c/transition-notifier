const loadSpec = require("../spec.js");

promise_test(() => {
  const s = loadSpec({href: "https://www.w3.org/TR/2018/CR-hr-time-2-20180301/"});
  return s.then(s => {
    assert_equals(s.title, "High Resolution Time Level 2")
    assert_equals(s.abstract, "This specification defines an API that provides the time origin, and current time in sub-millisecond resolution, such that it is not subject to system clock skew or adjustments.")
    assert_true(s.sotd.indexOf("This section describes the status of this document at the time of its publication.") === 0);
  });
}, "Check CR-hr-time-2-20180301");

promise_test(() => {
  const s = loadSpec({href: "https://www.w3.org/TR/2018/CR-payment-request-20180718/"});
  return s.then(s => {
    assert_equals(s.title, "Payment Request API");
    assert_true(s.sotd.indexOf("This section describes the status of this document at the time of its publication.") === 0);
  });
}, "Check CR-payment-request-20180718");

promise_test(() => {
  const s = loadSpec({href: "https://www.w3.org/TR/2018/WD-css-display-3-20180420/"});
  return s.then(s => {
    assert_equals(s.title, "CSS Display Module Level 3")
    assert_equals(s.abstract, "This module describes how the CSS formatting box tree is generated from the document element tree and defines the display property that controls it.  CSS is a language for describing the rendering of structured documents (such as HTML and XML) on screen, on paper, in speech, etc.")
    assert_true(s.sotd.indexOf("This section describes the status of this document at the time of its publication.") === 0)
  });
}, "Check WD-css-display-3-20180420");

promise_test(() => {
  const s = loadSpec({href: "https://www.w3.org/TR/2018/CR-webrtc-stats-20180703/"});
  return s.then(s => {
    assert_equals(s.title, "Identifiers for WebRTC's Statistics API")
    assert_equals(s.abstract, "This document defines a set of WebIDL objects that allow access to the statistical information about a RTCPeerConnection. \n\nThese objects are returned from the getStats API that is specified in [WEBRTC].")
    assert_true(s.sotd.indexOf("This section describes the status of this document at the time of its publication.") === 0)
  });
}, "Check CR-webrtc-stats-20180703");

promise_test(() => {
  const s = loadSpec({href: "https://www.w3.org/TR/2018/WD-wai-aria-practices-1.2-20180719/"});
  return s.then(s => {
    assert_equals(s.title, "WAI-ARIA Authoring Practices 1.2")
    assert_equals(s.abstract, "This document provides readers with an understanding of how to use WAI-ARIA 1.2 [WAI-ARIA-1.2] to create accessible rich internet applications. It describes considerations that might not be evident to most authors from the WAI-ARIA specification alone and recommends approaches to make widgets, navigation, and behaviors accessible using WAI-ARIA roles, states, and properties. This document is directed primarily to Web application developers, but the guidance is also useful for user agent and assistive technology developers. \n\nThis document is part of the WAI-ARIA suite described in the WAI-ARIA Overview.")
    assert_true(s.sotd.indexOf("This section describes the status of this document at the time of its publication.") === 0)
  });
}, "Check WD-wai-aria-practices-1.2-20180719");
