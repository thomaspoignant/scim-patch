# SCIM-PATCH

![Build Status](https://travis-ci.com/thomaspoignant/scim-patch.svg?token=sVd5BLjwtrGWjxxeoYSx&branch=master)  [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fthomaspoignant%2Fscim-patch.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fthomaspoignant%2Fscim-patch?ref=badge_shield)

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


This implements filter syntax parser and json filter function.

This is a fork https://www.npmjs.com/package/scim2-filter version 0.2.0 with bug correction.