"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Benchmark = require("benchmark");
const scimPatch_1 = require("../../src/scimPatch");
const scimUser = JSON.parse(`{
  "schemas": [
    "urn:ietf:params:scim:schemas:core:2.0:User"
  ],
  "id": "tea_4",
  "userName": "spiderman",
  "name": {
    "familyName": "Parker",
    "givenName": "Peter" 
  },
  "active": true,
  "emails": [
    {
      "value": "spiderman@superheroes.com",
      "primary": true
    }
  ],
  "roles": [],
  "meta": {
    "resourceType": "User",
    "created": "2019-11-20T09:25:30.208Z",
    "lastModified": "2019-11-20T09:25:30.208Z",
    "location": "**REQUIRED**/Users/tea_4"
  },
  "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department": "value"
  }`);
const suite = new Benchmark.Suite;
suite
    .add("Replace query", () => {
    const patch = {
        op: 'replace',
        value: { value: "expected@toto.fr", primary: true },
        path: 'emails[primary eq true]'
    };
    (0, scimPatch_1.scimPatch)(scimUser, [patch]);
})
    .add("Add query", () => {
    const patch1 = {
        op: 'add', value: {
            newProperty1: "newProperty1",
            newProperty2: "newProperty2"
        }, path: 'name'
    };
    const patch2 = { op: 'add', value: { newProperty3: "newProperty3" } };
    (0, scimPatch_1.scimPatch)(scimUser, [patch1, patch2]);
})
    .add("Remove query", () => {
    const patch = {
        op: 'remove', path: 'name.givenName'
    };
    (0, scimPatch_1.scimPatch)(scimUser, [patch]);
})
    .on('cycle', (event) => {
    console.log(String(event.target));
})
    .run();
//# sourceMappingURL=benchmark.js.map