import Benchmark = require('benchmark');
import { ScimPatchAddReplaceOperation } from '../../src/types/types';
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
suite.add("Replace query", ()=> {
  const patch: ScimPatchAddReplaceOperation = {
    op: 'replace',
    value: {value: "expected@toto.fr", primary: true},
    path: 'emails[primary eq true]'
  };
  scimPatch(scimUser, [patch]);
  })
  .add("Add query", async ()=> {
    const patch1: ScimPatchAddReplaceOperation = {
      op: 'add', value: {
        newProperty1: "newProperty1",
        newProperty2: "newProperty2"
      }, path: 'name'
    };
    const patch2: ScimPatchAddReplaceOperation = {op: 'add', value: {newProperty3: "newProperty3"}};
    await setTimeout(()=>scimPatch(scimUser, [patch1, patch2]), 30000);
  })
  .on('cycle', (event: { target: any; }) => {
    console.log(String(event.target));
  })
  .run();

