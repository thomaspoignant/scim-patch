# SCIM-PATCH
![version](https://img.shields.io/badge/Version-0.1.0-informational.svg)
![Build Status](https://travis-ci.com/thomaspoignant/scim-patch.svg?token=sVd5BLjwtrGWjxxeoYSx&branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fthomaspoignant%2Fscim-patch.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fthomaspoignant%2Fscim-patch?ref=badge_shield)

[RFC7644 SCIM(System for Cross-domain Identity Management) 2.0](https://tools.ietf.org/html/rfc7644#page-32) implementation of the "Modifying with PATCH" section 3.5.2.

This library can :
 - Validate a SCIM Patch query.
 - Patch a SCIM resource from a SCIM Patch Query.


## Validation of a SCIM Query.

```typescript
import {patchBodyValidation} from 'scim-patch';

const scimBody: ScimPatchOperation = 
{
  'schemas': ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
  'Operations': [
    {op: 'replace', path: 'name.familyName', value: 'newFamilyName'}
  ]
};

try {
  patchBodyValidation(scimBody);
} catch (error) {
  // Here if there are an error in you SCIM request.
}
```

## Patch a SCIM resource from a SCIM Patch Query.

This implements the PATCH of a SCIM object from a SCIM Query.

You should create a valid SCIM resource by extending the [ScimResource type](src/types.ts).

```typescript
export interface ScimUser extends ScimResource {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'];
    userName: string;
    name: {
        familyName: string;
        givenName: string;
    };
    active: boolean;
    emails: Array<{
        value: string;
        primary: boolean;
    }>;
    roles?: Array<{
        value: string;
        type?: string;
    }>;
    meta: ScimMeta & { resourceType: 'User' };
};
```

After you have created your object you can patch it by calling the `scimPatch` operation.
```typescript
const scimUser: ScimUser = {
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
  userName: 'user1@test.com',
  name: {
    familyName: 'user1',
    givenName: 'user2'
  },
  active: true,
  emails: [
    {value: 'user1@test.com', primary: true}
  ],
  meta: {
    resourceType: 'User',
    created: new Date(),
    lastModified: new Date()
  }
};

const patch: ScimPatchOperation = {
  op: 'replace',
  value: {
    active: false
  }
};

const patchedUser = scimPatch(scimUser, patch);
```

This particular operation will return : 

```json
{ 
  "schemas": [ "urn:ietf:params:scim:schemas:core:2.0:User" ],
  "userName": "user1@test.com",
  "name": { 
    "familyName": "user1", 
    "givenName": "user2"
  },
  "active": false,
  "emails": [
    {"value": "user1@test.com", "primary": true } 
  ],
  "meta": { 
    "resourceType": "User",
    "created": "2019-12-19T14:36:08.838Z",
    "lastModified": "2019-12-19T14:36:08.838Z" 
  }
}
```
