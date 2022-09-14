import {NoPathInScimPatchOp, patchBodyValidation} from '../src/scimPatch';
import {expect} from 'chai';
import {InvalidScimPatchRequest} from '../src/errors/scimErrors';


describe('PATCH Validation', () => {
    it('Missing Schemas', done => {
        const patch: any = {
            Operations: [{
                op: 'replace', value: false, path: 'active'
            }]
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });

    it('Missing Operations', done => {
        const patch: any = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp']
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });

    it('Invalid operation', done => {
        const patch: any = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                op: 'toto', value: false, path: 'active'
            }]
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });

    it('Non-string operation', done => {
        const patch: any = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                op: 123, value: false, path: 'active'
            }]
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });

    it('Operation remove without path', done => {
        const patch: any = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                op: 'remove'
            }]
        };
        expect(() => patchBodyValidation(patch)).to.throw(NoPathInScimPatchOp);
        return done();
    });

    it('Operation add without value', done => {
        const patch: any = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                op: 'add', path: 'active'
            }]
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });

    it('Path is not a string', done => {
        const patch: any = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                op: 'add', path: true, value: 'toto'
            }]
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });

    it('Add with no path', done => {
        const patch: any = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                op: 'add', value: {
                    "name.givenName": "John",
                    "name.familyName": "Doe",
                    "name.formatted": "John Doe"
                }
            }]
        };
        expect(() => patchBodyValidation(patch)).to.not.throw();
        return done();
    });

    it('empty operation array', done => {
        const patch: any = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            Operations: []
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });

    it('patchBodyValidation should be resistent if body.Operations is not an array', done => {
        // https://github.com/thomaspoignant/scim-patch/issues/289
        const patch: any = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            Operations: {
                op: "add",
                path: "members",
                value: {}
            }
        };
        expect(() => patchBodyValidation(patch)).to.throw(InvalidScimPatchRequest);
        return done();
    });
});
