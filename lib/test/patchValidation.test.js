"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scimPatch_1 = require("../src/scimPatch");
const chai_1 = require("chai");
const scimErrors_1 = require("../src/errors/scimErrors");
describe('PATCH Validation', () => {
    it('Missing Schemas', done => {
        const patch = {
            Operations: [{
                    op: 'replace', value: false, path: 'active'
                }]
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Missing Operations', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp']
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Invalid operation', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'toto', value: false, path: 'active'
                }]
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Non-string operation', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 123, value: false, path: 'active'
                }]
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Operation remove without path', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'remove'
                }]
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimPatch_1.NoPathInScimPatchOp);
        return done();
    });
    it('Operation add without value', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'add', path: 'active'
                }]
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Path is not a string', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'add', path: true, value: 'toto'
                }]
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Add with no path', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'add', value: {
                        "name.givenName": "John",
                        "name.familyName": "Doe",
                        "name.formatted": "John Doe"
                    }
                }]
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.not.throw();
        return done();
    });
    it('empty operation array', done => {
        const patch = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            Operations: []
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('patchBodyValidation should be resistent if body.Operations is not an array', done => {
        // https://github.com/thomaspoignant/scim-patch/issues/289
        const patch = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            Operations: {
                op: "add",
                path: "members",
                value: {}
            }
        };
        (0, chai_1.expect)(() => (0, scimPatch_1.patchBodyValidation)(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
});
//# sourceMappingURL=patchValidation.test.js.map