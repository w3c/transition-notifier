const config = require("./config.js"),
      fetch = require("node-fetch"),
      monitor = require("./monitor.js");

const W3C_APIURL = "https://api.w3.org/";

// to get information out of the W3C API
function fetchW3C(queryPath) {
  if (!config.w3capikey) throw new ReferenceError("Missing W3C key")
  const apiURL = new URL(queryPath, W3C_APIURL);
  apiURL.searchParams.set("apikey", config.w3capikey);
  apiURL.searchParams.set("embed", "1"); // grab everything
  return fetch(apiURL).then(r => r.json()).then(data => {
    if (data.error) throw new Error(data.error);
    if (data.message) throw new Error(data.message);
    if (data.pages && data.pages > 1 && data.page < data.pages) {
      return fetchW3C(data._links.next.href).then(nextData => {
        let key = Object.keys(data._embedded)[0];
        let value = data._embedded[key];
        return value.concat(nextData);
      });
    }
    let value;
    if (data._embedded) {
      let key = Object.keys(data._embedded)[0];
      value = data._embedded[key];
    } else {
      value = data;
    }
    return value;
  });
}

exports.fetchW3C = fetchW3C;