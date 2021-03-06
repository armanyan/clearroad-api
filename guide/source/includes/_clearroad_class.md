# API reference

The `ClearRoad` class contains a subset of functions from the underlying [jIO.js](https://jio.nexedi.com/) library, which uses [RSVP.js](https://lab.nexedi.com/nexedi/rsvp.js) to chain functions like `Promises`. Please refer to their documentation for more information.

## constructor

```javascript
new ClearRoad('apiUrl', 'accessToken');
```

`new ClearRoad(url, accessToken, options)`

Initialise a new ClearRoad object to interact with the ERP5 storage.

Property | Description
--------- | -----------
url | Url of the storage
accessToken | Optional. Access token to authenticate on the ClearRoad API (if necessary)
options.localStorage.type | View [types](#local-storage-types) below
options.localStorage.accessToken | Access token (if required)

### Local Storage Types

Type | Description | Options | Support | Need access token
--------- | --------- | ----------- | ----------- | -----------
indexeddb | Native Browser IndexedDB storage | type: string | Browser only | No
dropbox | Storage data in a dropbox account | type: string, accessToken: string | Browser and Node | Yes
gdrive | Storage data in a google drive account | type: string, accessToken: string | Browser and Node | Yes

## post

```javascript--browser
cr.post({
  key1: "value",
  key2: JSON.stringify({
    "subkey": "subvalue"
  })
}).then(function(id) {
  // 'id' is the posted document 'source_reference'
})
```

```javascript--browser-es6
// 'id' is the posted document 'source_reference'
const id = await cr.post({
  key1: "value",
  key2: JSON.stringify({
    "subkey": "subvalue"
  })
});
```

```javascript--node
// 'id' is the posted document 'source_reference'
const id = await cr.post({
  key1: "value",
  key2: JSON.stringify({
    "subkey": "subvalue"
  })
});
```

`post(data)`

Posts data in your local storage and return the `reference` of the new document. Then use the [sync method](#sync) to synchronize the data with the ClearRoad API.

Property | Description
--------- | -----------
data | Data to post. Each `value` paired with a `key` must be a `string`.

## sync

```javascript
cr.sync();
```

`sync()`

Synchronizes the local storage with the ClearRoad Platform (will make sure both storage contain the same data).

## allDocs

> Query the documents from ClearRoad Platform:

```javascript--browser
cr.allDocs({
  query: query_object,
  limit: [3, 42],
  sort_on: [['key1', 'ascending'], ['key2', 'descending']],
  select_list: ['key1', 'key2', 'key3'],
  include_docs: false
}).then(function(result) {
  // read rows in result.rows
})
```

```javascript--browser-es6
const result = await cr.allDocs({
  query: query_object,
  limit: [3, 42],
  sort_on: [['key1', 'ascending'], ['key2', 'descending']],
  select_list: ['key1', 'key2', 'key3'],
  include_docs: false
});
// read rows in result.rows
```

```javascript--node
const result = await cr.allDocs({
  query: query_object,
  limit: [3, 42],
  sort_on: [['key1', 'ascending'], ['key2', 'descending']],
  select_list: ['key1', 'key2', 'key3'],
  include_docs: false
});
// read rows in result.rows
```

> Which returns object in the following format:

```javascript
// with select_list: ['select_list_key']
{
  "total_rows": 39,
  "rows": [{
    "id": "text_id",
    "value": {
      "select_list_key": "select_list_value"
    }
  }, ...]
}

// with include_docs = true
{
  "total_rows": 39,
  "rows": [{
    "id": "text_id",
    "doc": {
      "key": "value"
    }
  }, ...]
}
```

`allDocs({query, limit, sort_on, select_list, include_docs})`

Retrieve a list of documents.

Property | Description
--------- | -----------
query | Refer to the [jIO documentation](https://jio.nexedi.com/) in the **jIO Query Engine** section for details
limit (optional) | Limit the results. Leave empty for no limit, or `[min, max]` for paging
sort_on (optional) | List of fields to sort on, each specifying the order with `ascending`/`descending`
select_list | When provided, the response has a `value` containing the values of these keys for each document
include_docs | When `true`, the response has a `doc` containing the full metadata for each document

## getReport

```javascript--browser
cr.getReport('reference').then(function(report) {
  // read report
})
```

```javascript--browser-es6
const report = await cr.getReport('reference');
```

```javascript--node
const report = await cr.getReport('reference');
```

`getReport(reference)`

Retrieve [the report](https://api.clearroadlab.io/docs/#requesting-a-report) with the given report `reference`. If you only have the `reference` of the report request, please use [getReportFromRequest](#getReportFromRequest) instead.

Property | Description
--------- | -----------
reference | Reference of the report

## getReportFromRequest

```javascript--browser
cr.getReportFromRequest('reference').then(function(report) {
  // read report
})
```

```javascript--browser-es6
const report = await cr.getReportFromRequest('reference');
```

```javascript--node
const report = await cr.getReportFromRequest('reference');
```

`getReportFromRequest(reference)`

Property | Description
--------- | -----------
reference | Reference of the report request
