import {ScimResource, ScimMeta, scimPatch, ScimPatchOperation, patchBodyValidation} from 'scim-patch';

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

const patchs: Array<ScimPatchOperation> = [{
  op: 'replace',
  value: {
    active: true
  }
}, {
  op: 'remove',
  path: 'name.givenName'
}, {
  op: 'add',
  path: 'newKey',
  value: 'newValue'
}];

// VALIDATION
try {
  patchBodyValidation(patchs[0]);
} catch (error) {
  // Here if there is an error in your SCIM patch request.
}

// PATCH
try{
  const patchedScimUser = scimPatch(scimUser, patchs);
} catch (error) {
  // Here if there is an error during the patch.
}

/*
___________________________
patchedScimUser value is :

{
  schemas: [ 'urn:ietf:params:scim:schemas:core:2.0:User' ],
  userName: 'user1@test.com',
  name: { familyName: 'user1' },
  active: true,
  emails: [ { value: 'user1@test.com', primary: true } ],
  meta: {
    resourceType: 'User',
    created: 2020-02-27T09:19:31.479Z,
    lastModified: 2020-02-27T09:19:31.479Z
  },
  newKey: 'newValue'
}
}*/
