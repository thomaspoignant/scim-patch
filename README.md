# SCIM-PATCH
[![npm version](http://img.shields.io/npm/v/scim-patch.svg?style=flat&color=blue)](https://npmjs.org/package/scim-patch "View this project on npm")
[![Downloads](https://img.shields.io/npm/dt/scim-patch.svg?style=flat&color=blue)](https://npmjs.com/package/scim-patch)
![Build Status](https://github.com/thomaspoignant/scim-patch/actions/workflows/ci.yml/badge.svg)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fthomaspoignant%2Fscim-patch.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fthomaspoignant%2Fscim-patch?ref=badge_shield)
[![Coverage Status](https://coveralls.io/repos/github/thomaspoignant/scim-patch/badge.svg?branch=master&service=github)](https://coveralls.io/github/thomaspoignant/scim-patch?branch=master&service=github)
[![Sonarcloud Status](https://sonarcloud.io/api/project_badges/measure?project=thomaspoignant_scim-patch&metric=alert_status)](https://sonarcloud.io/dashboard?id=thomaspoignant_scim-patch)

[RFC7644 SCIM(System for Cross-domain Identity Management) 2.0](https://tools.ietf.org/html/rfc7644#section-3.5.2) implementation of the "Modifying with PATCH" section 3.5.2.

## TL;DR
Important things to know, this library can :
 - Validate a SCIM Patch query.
 - Patch a SCIM resource from a SCIM Patch Query.

Want to have an example on how it works, [check this example](./example/example.ts).


## More Details
This library is implementing the `3.5.2.  Modifying with PATCH` chapter of the SCIM RFC https://tools.ietf.org/html/rfc7644#section-3.5.2.  
It will allow you to create a SCIM resources and to patch them using the SCIM Query language.

### Validation of a SCIM Query.

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

### Patch a SCIM resource from a SCIM Patch Query.

This implements the PATCH of a SCIM object from a SCIM Query.
You should create a valid SCIM resource by extending the [ScimResource interface](src/types.ts).

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
  name: { familyName: 'user1', givenName: 'user2' },
  active: true,
  emails: [{value: 'user1@test.com', primary: true}],
  meta: { resourceType: 'User', created: new Date(), lastModified: new Date() }
};

const patch: ScimPatchOperation = { op: 'replace', value: { active: false } };
const patchedUser = scimPatch(scimUser, patch);
// scimUser === patchedUser, see Options section if you want to avoid updating the original object
```

This particular operation will return : 
```json
{ 
  "schemas": [ "urn:ietf:params:scim:schemas:core:2.0:User" ],
  "userName": "user1@test.com",
  "name": { "familyName": "user1", "givenName": "user2" },
  "active": false,
  "emails": [{"value": "user1@test.com", "primary": true }],
  "meta": { "resourceType": "User", "created": "2019-12-19T14:36:08.838Z", "lastModified": "2019-12-19T14:36:08.838Z" }
}
```

#### Options

##### Mutate Document
By default `scimPatch()` is updating the scim resource you pass in the function.  
If you want to avoid this, you can add an option while calling `scimPatch()`, it will do a copy of the object and work
on this copy.

Your call will look like this now:
```typescript
const patchedUser = scimPatch(scimUser, patch, {mutateDocument: false});
// scimUser !== patchedUser
```

##### Treat Missing as Add

By default `scimPatch()` will treat as Add a replace operation that targets an attribute that does not exist.
If you prefer to throw an error instead, then set `treatMissingAsAdd: false`

```typescript 
// scimUser has no addresses
 const patch = {
    op: 'replace',
    path: 'addresses[type eq "work"].country',
    value: 'Australia',
};
const patchedUser = scimPatch(scimUser, patch, {treatMissingAsAdd: false});
// patchedUser.addresses[0].country === "Australia"
```

# How can I contribute?
See the [contributor's guide](CONTRIBUTING.md) for some helpful tips.

## Contributors

Thanks so much to our contributors.

<a href="https://github.com/thomaspoignant/scim-patch/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=thomaspoignant/scim-patch" />
</a>
