import Benchmark = require('benchmark');
import { ScimPatchAddReplaceOperation, ScimPatchRemoveOperation } from '../../src/types/types';
import { scimPatch } from '../../src/scimPatch';

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
  .add("Replace query", ()=> {
    const patch: ScimPatchAddReplaceOperation = {
      op: 'replace',
      value: {value: "expected@toto.fr", primary: true},
      path: 'emails[primary eq true]'
    };
    scimPatch(scimUser, [patch]);
  })
  .add("Add query", ()=> {
    const patch1: ScimPatchAddReplaceOperation = {
      op: 'add', value: {
        newProperty1: "newProperty1",
        newProperty2: "newProperty2"
      }, path: 'name'
    };
    const patch2: ScimPatchAddReplaceOperation = {op: 'add', value: {newProperty3: "newProperty3"}};
    scimPatch(scimUser, [patch1, patch2]);
  })
  .add("Remove query", ()=> {
    const patch: ScimPatchRemoveOperation = {
      op: 'remove', path: 'name.givenName'
    };
    scimPatch(scimUser, [patch]);
  })
  .on('cycle', (event: { target: any; }) => {
    console.log(String(event.target));
  })
  .run();

