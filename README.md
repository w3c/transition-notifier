# transition-notifier

A quick 'n dirty publication notifier.

This tool is used to help the community, including horizontal groups, to
be alerted when a significant transition happens for an horizontal group or if
a group is interested in the wide review of one of their documents.

The tool sends a message to the W3C's [public-review-announce](https://lists.w3.org/Archives/Public/public-review-announce/) mail list when one of the following conditions for a [Technical Reports](https://www.w3.org/TR/) is true:

* The Status of This Document section contains the words "wide review"
* No previous version (first public drafts)
* Candidate Recommendation Snapshots (CRS) or Candidate Registry Snapshots (CRY)
* Recommendations with proposed corrections

* [notify.js](https://github.com/w3c/transition-notifier/blob/main/notify.js) for the full notification filtering.
