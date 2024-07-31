import {
    InvalidScimPatchOp,
    InvalidScimPatchRequest,
    NoPathInScimPatchOp,
    scimPatch,
    InvalidScimPatch,
} from '../src/scimPatch';
import {ScimUser} from './types/types.test';
import {expect} from 'chai';
import {ScimPatchAddReplaceOperation, ScimPatchRemoveOperation} from '../src/types/types';
import {RemoveValueNestedArrayNotSupported, NoTarget, RemoveValueNotArray} from "../src/errors/scimErrors";

describe('SCIM PATCH', () => {
    let scimUser: ScimUser;
    beforeEach(done => {
        scimUser = JSON.parse(`{
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
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User" : {
          "organization": "value",
          "department": "value"
      }
    }`);
        return done();
    });

    describe('replace', () => {
        it('REPLACE: first level property with path', done => {
            const expected = false;
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: expected, path: 'active'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.active).to.be.eq(expected);
            return done();
        });

        it('REPLACE: first level property with fully qualified path', done => {
            const expected = false;
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: expected, path: 'urn:ietf:params:scim:schemas:core:2.0:User:active'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.active).to.be.eq(expected);
            return done();
        });

        it('REPLACE: first level property without path', done => {
            const expected = false;
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: {active: expected}};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.active).to.be.eq(expected);
            return done();
        });

        it('REPLACE: 2 level property with path', done => {
            const expected = 'toto';
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: expected, path: 'name.familyName'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.familyName).to.be.eq(expected);
            return done();
        });

        it('REPLACE: 2 level property without complete path', done => {
            const expected = 'toto';
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: {familyName: expected}, path: 'name'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.familyName).to.be.eq(expected);
            return done();
        });

        it('REPLACE: 2 level extension schema property without path', done => {
            const expectedOrganization = 'newOrganization';
            const expectedDepartment = 'newDepartment';
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';

            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace', value: {
                    [`${schemaExtension}:organization`]: expectedOrganization,
                    [`${schemaExtension}:department`]: expectedDepartment
                }
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch[schemaExtension]?.organization).to.be.eq(expectedOrganization);
            expect(afterPatch[schemaExtension]?.department).to.be.eq(expectedDepartment);
            return done();
        });

        it('REPLACE: multiple at once with path', done => {
            const expectedFamilyName = 'toto';
            const expectedGivenName = 'titi';
            const expectedActive = false;
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'replace', value: {
                    givenName: expectedGivenName,
                    familyName: expectedFamilyName
                }, path: 'name'
            };
            const patch2: ScimPatchAddReplaceOperation = {op: 'replace', value: {active: expectedActive}};
            const afterPatch = scimPatch(scimUser, [patch1, patch2]);
            expect(afterPatch.name.familyName).to.be.eq(expectedFamilyName);
            expect(afterPatch.name.givenName).to.be.eq(expectedGivenName);
            expect(afterPatch.active).to.be.eq(expectedActive);
            return done();
        });

        it('REPLACE: multiple at once with exact path', done => {
            const expectedFamilyName = 'toto';
            const expectedGivenName = 'titi';
            const expectedActive = false;
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: expectedGivenName,
                path: 'name.givenName'
            };
            const patch2: ScimPatchAddReplaceOperation = {op: 'replace', value: {active: expectedActive}};
            const patch3: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: expectedFamilyName,
                path: 'name.familyName'
            };
            const afterPatch = scimPatch(scimUser, [patch1, patch2, patch3]);
            expect(afterPatch.name.familyName).to.be.eq(expectedFamilyName);
            expect(afterPatch.name.givenName).to.be.eq(expectedGivenName);
            expect(afterPatch.active).to.be.eq(expectedActive);
            return done();
        });

        it('REPLACE: primary email object', done => {
            const expected = 'toto@toto.com';
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: {value: expected, primary: true},
                path: 'emails[primary eq true]'
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.emails[0].value).to.be.eq(expected);
            expect(afterPatch.emails[0].primary).to.be.eq(true);
            return done();
        });

        it('REPLACE: nested object do not exists', done => {
            // empty the surName fields.
            scimUser.surName = [];
            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace',
                path: 'surName[value eq "bogus"]',
                value: 'this value should not be added',
            };
            expect(() => scimPatch(scimUser, [patch])).to.throw(NoTarget, 'a value selection filter (surName[value eq "bogus"]) has been supplied and no record match was made');
            return done();
        });

        it('REPLACE: nested object do not exists can be treated as ADD', done => {
            // empty the surName fields.
            scimUser.emails = [];
            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace',
                path: 'addresses[type eq "work"].country',
                value: 'Denmark',
            };
            const afterPatch = scimPatch(scimUser, [patch], { treatMissingAsAdd: true });
            expect(afterPatch.addresses?.[0].country).to.be.eq("Denmark");
            expect(afterPatch.addresses?.[0].type).to.be.eq("work");
            return done();
        });

        it('REPLACE: primary email value', done => {
            const expected = 'toto@toto.com';
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: expected,
                path: 'emails[primary eq true].value'
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.emails[0].value).to.be.eq(expected);
            expect(afterPatch.emails[0].primary).to.be.eq(true);
            return done();
        });

        it('REPLACE: nested array element', done => {
            scimUser.name.nestedArray = [{primary: true, value: 'value1'}];
            const expected = 'value2';
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'replace', value: {
                    value: expected,
                    primary: true
                }, path: 'name.nestedArray[primary eq true]'
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].value).to.be.eq(expected);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].primary).to.be.eq(true);
            return done();
        });

        it('REPLACE: replace a non existent element', done => {
            const expected = true;
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: expected, path: 'unknown.toto'};
            const afterPatch: any = scimPatch(scimUser, [patch]);
            expect(afterPatch.unknown.toto).to.be.eq(expected);
            return done();
        });

        it('REPLACE: add a non object value to an object key', done => {
            const expected = 'BATMAN';
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', path: 'name', value: expected};
            const afterPatch: any = scimPatch(scimUser, [patch]);
            expect(afterPatch.name).to.be.eq(expected);
            return done();
        });

        it('REPLACE: with capital first letter for operation', done => {
            const expected = false;
            const patch: ScimPatchAddReplaceOperation = {op: 'Replace', value: {active: expected}};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.active).to.be.eq(expected);
            return done();
        });

        it('REPLACE: with extensions schema path', done => {
            const expected = 'newValue';
            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: expected,
                path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department'
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']?.department).to.be.eq(expected);
            return done();
        });

        it('REPLACE: array by another array', done => {
            const expected = [ { value: 'test2' } ];
            const path = 'emails';
            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: expected,
                path: path
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch[path]).to.be.eq(expected);
            return done();
        });

        it("REPLACE: no record match was made, treatMissingAsAdd false", (done) => {
            // empty the surName fields.
            scimUser.surName = [];
            const patch: ScimPatchAddReplaceOperation = {
                op: "replace",
                path: "surName[primary eq true].value",
                value: "surname"
            };
            expect(() => scimPatch(scimUser, [patch],{treatMissingAsAdd: false}))
                .to.throw(NoTarget, 'a value selection filter (surName[primary eq true].value) has been supplied and no record match was made');
            return done();
        });

        it("REPLACE: no record match was made", (done) => {
            // empty the surName fields.
            scimUser.surName = [];
            const patch: ScimPatchAddReplaceOperation = {
                op: "replace",
                path: "surName[primary eq true].value",
                value: "surname"
            };

            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.surName).to.be.deep.eq([{"primary": true,"value": "surname"}]);
            return done();
        });

        it("REPLACE: replace add fields in complex object", (done) => {
            const expected = [ {primary: true, value: "bogus", additional:"additional"} ];
            // empty the surName fields.
            scimUser.surName = [{primary: true, value: "bogus"}];
            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace',
                path: 'surName[value eq "bogus"]',
                value: {additional:"additional"},
            };

            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.surName).to.be.deep.eq(expected);
            return done();
        });

        it("REPLACE: replace add and update fields in complex object", (done) => {
            const expected = [ {primary: true, value: "bogus2", additional:"additional"} ];
            // empty the surName fields.
            scimUser.surName = [{primary: true, value: "bogus"}];
            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace',
                path: 'surName[value eq "bogus"]',
                value: {additional:"additional", value: "bogus2"},
            };

            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.surName).to.be.deep.eq(expected);
            return done();
        });

        it("REPLACE: empty array add filter type + field (Azure AD)", (done) => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "Replace",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work\"].formatted"
            };
            expect(() => scimPatch(scimUser, [patch], {treatMissingAsAdd: false})).to.throw(NoTarget, 'a value selection filter (addresses[type eq "work"].formatted) has been supplied and no record match was made');
            return done();
        });

        it("REPLACE: filter with an email containing dots", (done) => {
            const expected = [ {"value": "batman@superheroes.com","primary": true} ];
            const patch: ScimPatchAddReplaceOperation = {
                op: "Replace",
                value: "batman@superheroes.com",
                path: "emails[value eq \"spiderman@superheroes.com\"].value"
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails).to.be.deep.eq(expected);
            return done();
        });

        // see https://github.com/thomaspoignant/scim-patch/issues/215
        it('REPLACE: don\'t mutate the original object', done => {
            const expected = false;
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: expected, path: 'active'};
            const afterPatch = scimPatch(scimUser, [patch], {mutateDocument:false});
            expect(scimUser).not.to.be.eq(afterPatch);
            return done();
        });

        it('REPLACE: replace on multiValued objects', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre"},
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const expected = "post";
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: expected, path: 'emails.newProperty'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.eq(expected);
            expect(afterPatch.emails[1].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[2].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[3].newProperty).to.be.eq(expected);         
            return done();
        });
        it('REPLACE: replace on multiValued objects without complete path', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre"},
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const expected = "post";
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: {newProperty: expected}, path: 'emails'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.eq(expected);
            expect(afterPatch.emails[1].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[2].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[3].newProperty).to.be.eq(expected);      
            expect(afterPatch.emails.length).to.be.eq(4);
            return done();
        });

        it('REPLACE: filter that match multiple elements of complex multiValued attribute', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre"},
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const expected = "post";
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: expected, path: 'emails[primary eq false].newProperty'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.eq("pre");
            expect(afterPatch.emails[1].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[2].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[3].newProperty).to.be.eq(expected);         
            return done();
        });

        it('REPLACE: filter that match multiple elements of complex multiValued attribute without complete path', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre"},
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const expected = "post";
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: {newProperty: expected}, path: 'emails[primary eq false]'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.eq("pre");
            expect(afterPatch.emails[1].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[2].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[3].newProperty).to.be.eq(expected);  
            return done();
        });

        // see https://github.com/thomaspoignant/scim-patch/issues/489
        it('REPLACE: Replace op with value of empty object results in circular reference', done => {
            const expected = [
                {
                    "value": "spiderman@superheroes.com",
                    "primary": true
                },
                {
                    "type": "work",
                    value: {}
                }
            ];
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: {}, path: 'emails[type eq "work"].value'};
            const afterPatch = scimPatch(scimUser, [patch], { mutateDocument: false, treatMissingAsAdd: true });
            expect(afterPatch.emails).to.be.deep.eq(expected);
            return done();
        });

        // see https://github.com/thomaspoignant/scim-patch/issues/693
        it('REPLACE: Replace op with value of empty object should merge if the target property is an object', done => {
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: {}, path: 'name'};
            const afterPatch = scimPatch(scimUser, [patch], { mutateDocument: false, treatMissingAsAdd: true });
            expect(afterPatch.name).to.be.deep.eq(scimUser.name);
            return done();
        });
    });

    describe('add', () => {
        it('ADD: first level property without path', done => {
            const expected = 'newValue';
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: {newProperty: expected}};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.newProperty).to.be.eq(expected);
            return done();
        });

        it('ADD: first level property with path', done => {
            const expected = 'newValue';
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: expected, path: 'newProperty'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.newProperty).to.be.eq(expected);
            return done();
        });

        it('ADD: 2 level property with path', done => {
            const expected = 'toto';
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: expected, path: 'name.newProperty'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.newProperty).to.be.eq(expected);
            return done();
        });

        it('ADD: 2 level property without complete path', done => {
            const expected = 'toto';
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: {newProperty: expected}, path: 'name'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.newProperty).to.be.eq(expected);
            return done();
        });

        it('ADD: 2 level extension schema property without path', done => {
            const expectedDivision = 'newDepartment';
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';

            const patch: ScimPatchAddReplaceOperation = {
                op: 'add', value: {
                    [`${schemaExtension}:division`]: expectedDivision
                }
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch[schemaExtension]?.division).to.be.eq(expectedDivision);
            return done();
        });

        it('ADD: multiple at once with path', done => {
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const expectedNewProperty3 = 'tata';
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'add', value: {
                    newProperty1: expectedNewProperty1,
                    newProperty2: expectedNewProperty2
                }, path: 'name'
            };
            const patch2: ScimPatchAddReplaceOperation = {op: 'add', value: {newProperty3: expectedNewProperty3}};
            const afterPatch = scimPatch(scimUser, [patch1, patch2]);
            expect(afterPatch.name.newProperty1).to.be.eq(expectedNewProperty1);
            expect(afterPatch.name.newProperty2).to.be.eq(expectedNewProperty2);
            expect(afterPatch.newProperty3).to.be.eq(expectedNewProperty3);
            return done();
        });

        it('ADD: multiple at once with exact path', done => {
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const expectedNewProperty3 = 'tata';
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: expectedNewProperty1,
                path: 'name.newProperty1'
            };
            const patch2: ScimPatchAddReplaceOperation = {op: 'replace', value: {newProperty3: expectedNewProperty3}};
            const patch3: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: expectedNewProperty2,
                path: 'name.newProperty2'
            };
            const afterPatch = scimPatch(scimUser, [patch1, patch2, patch3]);
            expect(afterPatch.name.newProperty1).to.be.eq(expectedNewProperty1);
            expect(afterPatch.name.newProperty2).to.be.eq(expectedNewProperty2);
            expect(afterPatch.newProperty3).to.be.eq(expectedNewProperty3);
            return done();
        });

        it('ADD: primary email object', done => {
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'add', value: {
                    newProperty1: expectedNewProperty1,
                    newProperty2: expectedNewProperty2
                }, path: 'emails[primary eq true]'
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.emails[0].newProperty1).to.be.eq(expectedNewProperty1);
            expect(afterPatch.emails[0].newProperty2).to.be.eq(expectedNewProperty2);
            expect(afterPatch.emails[0].value).to.be.eq(scimUser.emails[0].value);
            return done();
        });

        it('ADD: primary email newProperty', done => {
            const expected = 'toto@toto.com';
            const patch: ScimPatchAddReplaceOperation = {
                op: 'add',
                value: expected,
                path: 'emails[primary eq true].newProperty'
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.eq(expected);
            expect(afterPatch.emails[0].primary).to.be.eq(true);
            return done();
        });

        it('ADD: nested array element', done => {
            scimUser.name.nestedArray = [{primary: true, value: 'value1'}];
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'add', value: {
                    newProperty1: expectedNewProperty1,
                    newProperty2: expectedNewProperty2
                }, path: 'name.nestedArray[primary eq true]'
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].newProperty1).to.be.eq(expectedNewProperty1);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].newProperty2).to.be.eq(expectedNewProperty2);
            return done();
        });
        it('ADD: If the target location specifies a multi-valued attribute, a new value is added to the attribute.', done => {
            scimUser.name.surName2 = ['toto', 'titi'];
            const newSurname = 'tata';
            const patch: ScimPatchAddReplaceOperation = {
                op: 'add', value: newSurname, path: 'name.surName2'
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.surName2).to.contains('toto');
            expect(afterPatch.name.surName2).to.contains(newSurname);
            return done();
        });

        it('ADD: If the target location specifies a single-valued attribute, the existing value is replaced', done => {
            scimUser.name.surName3 = 'surName';
            const newSurname = 'tata';
            const patch: ScimPatchAddReplaceOperation = {
                op: 'add', value: newSurname, path: 'name.surName3'
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.surName3).to.be.eq(newSurname);
            return done();
        });

        it('ADD: If the target location specifies a multi-valued attribute, a new value is added to the attribute.', done => {
            scimUser.name.surName2 = ['toto', 'titi'];
            const newSurname = 'tata';
            const patch: ScimPatchAddReplaceOperation = {
                op: 'add', value: newSurname, path: 'name.surName2'
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.surName2).to.contains('toto');
            expect(afterPatch.name.surName2).to.contains('titi');
            expect(afterPatch.name.surName2).to.contains(newSurname);
            return done();
        });

        it('ADD: If the target location specifies a multi-valued attribute, a new value is added to the attribute only if doesn\'t exist already.', done => {
            scimUser.name.surName2 = ['toto', 'titi'];
            const newSurname = 'titi';
            const patch: ScimPatchAddReplaceOperation = {
                op: 'add', value: newSurname, path: 'name.surName2'
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.surName2).to.contains('toto');
            expect(afterPatch.name.surName2?.filter(s => s === 'titi').length).to.eq(1);
            return done();
        });

        it('ADD: impossible to add a non object value to an object key', done => {
            const patch: ScimPatchAddReplaceOperation = {op: 'add', path: 'name', value: 'titi'};
            expect(() => scimPatch(scimUser, [patch])).to.throw(InvalidScimPatchOp);
            return done();
        });

        it('ADD: should not modify anything if element not found', done => {
            scimUser.name.nestedArray = [{primary: true, value: 'value1'}];
            const patch1: ScimPatchAddReplaceOperation = {
                op: 'add', value: {
                    newProperty1: 'toto'
                }, path: 'name.nestedArray[toto eq true]'
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray).to.be.eq(scimUser.name.nestedArray);
            return done();
        });

        it('ADD: with capital first letter for operation', done => {
            const expected = 'newValue';
            const patch: ScimPatchAddReplaceOperation = {op: 'Add', value: {newProperty: expected}};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.newProperty).to.be.eq(expected);
            return done();
        });

        it('ADD: with extension schema path', done => {
            const expected = 'newValue';
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
            delete scimUser[schemaExtension];
            const patch: ScimPatchAddReplaceOperation = {
                op: 'add',
                value: 'newValue',
                path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department'
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch[schemaExtension]?.department).to.be.eq(expected);
            return done();
        });

        it("ADD: array", (done) => {
            const newValue = { value: "test2" };
            const newArray = [newValue];
            const path = "emails";
            const initialArrayLength = scimUser[path].length;
            const patch: ScimPatchAddReplaceOperation = {
              op: "Add",
              value: newArray,
              path,
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch[path].length).to.be.eq(
                initialArrayLength + newArray.length
            );
            expect(
                afterPatch[path].find((val) => val.value === newValue.value)
            ).to.eq(newValue);

            return done();
        });

        it("ADD: array ignores existing values", (done) => {
            const path = "emails";
            const initialArrayLength = scimUser[path].length;
            const patch: ScimPatchAddReplaceOperation = {
              op: "Add",
              value: scimUser[path],
              path,
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch[path].length).to.be.eq(initialArrayLength);

            return done();
        });

        // Check issue https://github.com/thomaspoignant/scim-patch/issues/42 to understand this usecase
        it("ADD: empty array add filter type + field (Azure AD)", (done) => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "Add",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work\"].formatted"
            };
            expect(scimUser.addresses).to.be.undefined;
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.addresses).to.not.be.undefined;
            expect(afterPatch.addresses?.length).to.be.eq(1);
            if (afterPatch.addresses !== undefined){
                const address = afterPatch.addresses[0];
                expect(address.type).to.be.eq("work");
                expect(address.formatted).to.be.eq("1111 Street Rd");
            }
            return done();
        });

        it("ADD: existing array add filter type + field (Azure AD)", (done) => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "Add",
                value: "1122 Street Rd",
                path: "addresses[type eq \"work\"].formatted"
            };
            scimUser.addresses = [{
                type: 'home',
                formatted: '2222 Avenue Blvd'
            }];
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.addresses).to.not.be.undefined;
            expect(afterPatch.addresses?.length).to.be.eq(2);
            if (afterPatch.addresses !== undefined){
                const existingAddress = afterPatch.addresses[0];
                expect(existingAddress.type).to.be.eq("home");
                expect(existingAddress.formatted).to.be.eq("2222 Avenue Blvd");
                const newAddress = afterPatch.addresses[1];
                expect(newAddress.type).to.be.eq("work");
                expect(newAddress.formatted).to.be.eq("1122 Street Rd");
            }
            return done();
        });

        it("ADD: existing array add filter type + field (Azure AD) with lower case add", (done) => {
            const patch: ScimPatchAddReplaceOperation = { op: "add",value: "1122 Street Rd", path: "addresses[type eq \"work\"].formatted" };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.addresses?.length).to.be.eq(1);
            if (afterPatch.addresses !== undefined){
                const newAddress = afterPatch.addresses[0];
                expect(newAddress.type).to.be.eq("work");
                expect(newAddress.formatted).to.be.eq("1122 Street Rd");
            }
            return done();
        });

        it("ADD: empty array multiple filter should throw an error", (done) => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "Add",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work\" or type eq \"home\"].formatted"
            };
            expect(() => scimPatch(scimUser, [patch])).to.throw(NoTarget, 'a value selection filter (addresses[type eq "work" or type eq "home"].formatted) has been supplied and no record match was made');
            return done();
        });

        it("ADD: Invalid filter operation", (done) => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "Add",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work.formatted"
            };
            expect(() => scimPatch(scimUser, [patch])).to.throw(InvalidScimPatchOp);
            return done();
        });

        // Check issue https://github.com/thomaspoignant/scim-patch/issues/42 to understand this use-case
        it("ADD: empty array add filter type + field 2nd level", (done) => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "Add",
                value: "1111 Street Rd",
                path: "name.nestedArray[primary eq true].newProperty1"
            };
            expect(scimUser.name.nestedArray).to.be.undefined;
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.nestedArray).to.not.be.undefined;
            expect(afterPatch.name.nestedArray?.length).to.be.eq(1);
            if (afterPatch.name.nestedArray !== undefined){
                const address = afterPatch.name.nestedArray[0];
                expect(address.primary).to.be.eq(true);
                expect(address.newProperty1).to.be.eq("1111 Street Rd");
            }
            return done();
        });

        // Check issue https://github.com/thomaspoignant/scim-patch/issues/132 to understand this use-case
        it("ADD: dot notation with no path", done => {
            const patch: ScimPatchAddReplaceOperation = {
                op: 'add',
                value: {
                    "name.givenName": "John",
                    "name.familyName": "Doe",
                    "name.formatted": "John Doe",
                    "favorites.food": "lemon"
                }
            };
            expect(scimUser.name.nestedArray).to.be.undefined;
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.givenName).to.be.eq("John");
            expect(afterPatch.name.familyName).to.be.eq("Doe");
            expect(afterPatch.name.formatted).to.be.eq("John Doe");
            expect(afterPatch?.favorites?.food).to.be.eq("lemon");
            return done();
        });

        // Check issue https://github.com/thomaspoignant/scim-patch/issues/186 to understand this use-case
        it("ADD: on null property", done => {
            const user: ScimUser = {
                schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
                meta: {resourceType: "User", created: new Date(), lastModified: new Date(), location: "users/4"},
                active: true, emails: [{ value:"batman@superheroes.com", primary: true }],
                name: {familyName: "bat", givenName: "man"}, userName: "batman",
                newProperty: null
            };
            const patch: ScimPatchAddReplaceOperation = { op: "add", path: "newProperty", value: "1" };
            expect(user.newProperty).to.be.null;

            const afterPatch = scimPatch(user, [patch]);
            expect(afterPatch.newProperty).to.be.eq("1");
            return done();
        });

        // see https://github.com/thomaspoignant/scim-patch/issues/215
        it('ADD: don\'t mutate the original object', done => {
            const expected = 'newValue';
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: {newProperty: expected}};
            const afterPatch = scimPatch(scimUser, [patch], {mutateDocument: false});
            expect(scimUser).not.to.be.eq(afterPatch);
            return done();
        });

        it("ADD: on adding duplicate objects to an array, value is object", done => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "add",
                path: "emails",
                value: {
                    value: "spiderman@superheroes.com",
                    primary: true
                }
            };

            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails.length).to.be.eq(1);
            return done();
        });

        it("ADD: on adding duplicate objects to an array, value is array of objects ", done => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "add",
                path: "emails",
                value: [
                    {
                        value: "spiderman@superheroes.com",
                        primary: true
                    },
                    {
                        value: "batman@superheroes.com",
                        primary: false
                    }
            ]
            };

            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails.length).to.be.eq(2);
            return done();
        });

        // see https://github.com/thomaspoignant/scim-patch/issues/220
        it("ADD: on array attribute when 'path' is absent & value is array should append all values", done => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "add",
                value: {
                    emails: [
                        {
                        value: "batman@superheroes.com",
                        primary: true
                      },{
                        value: "superman@superheroes.com",
                        primary: true
                      }]
                }
            };

            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails.length).to.be.eq(3);
            return done();
        });

        it("ADD: on array attribute when 'path' is absent & value is non-array should append the value", done => {
            const patch: ScimPatchAddReplaceOperation = {
                op: "add",
                value: {
                    emails: {
                        value: "batman@superheroes.com",
                        primary: true
                      }
                }
            };

            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails.length).to.be.eq(2);
            return done();
        });

        
        it('ADD: filter that match multiple elements of complex multiValued attribute', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true },
                { value: "addr2@email.com", primary: false },
                { value: "addr3@email.com", primary: false },
                { value: "addr4@email.com", primary: false },
            ];
            const expected = "post";
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: expected, path: 'emails[primary eq false].newProperty'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.an('undefined');
            expect(afterPatch.emails[1].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[2].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[3].newProperty).to.be.eq(expected);         
            return done();
        });

        it('ADD: filter that match multiple elements of complex multiValued attribute without complete path', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true },
                { value: "addr2@email.com", primary: false },
                { value: "addr3@email.com", primary: false },
                { value: "addr4@email.com", primary: false },
            ];
            const expected = "post";
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: {newProperty: expected}, path: 'emails[primary eq false]'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.an('undefined');
            expect(afterPatch.emails[1].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[2].newProperty).to.be.eq(expected);       
            expect(afterPatch.emails[3].newProperty).to.be.eq(expected);  
            return done();
        });

        
        // see https://github.com/thomaspoignant/scim-patch/issues/693
        it('ADD: value of empty object should merge if the target property is an object', done => {
            const patch: ScimPatchAddReplaceOperation = {op: 'add', value: {}, path: 'name'};
            const afterPatch = scimPatch(scimUser, [patch], { mutateDocument: false, treatMissingAsAdd: true });
            expect(afterPatch.name).to.be.deep.eq(scimUser.name);
            return done();
        });
    });
    describe('remove', () => {
        it('REMOVE: with no path', done => {
            const patch = <ScimPatchRemoveOperation>{op: 'remove'};
            expect(() => scimPatch(scimUser, [patch])).to.throw(NoPathInScimPatchOp);
            return done();
        });

        it('REMOVE: first level property with path', done => {
            const patch: ScimPatchRemoveOperation = {op: 'remove', path: 'active'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.active).not.to.exist;
            return done();
        });

        it('REMOVE: 2 level property with path', done => {
            const patch: ScimPatchRemoveOperation = {op: 'remove', path: 'name.familyName'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.familyName).not.to.exist;
            return done();
        });

        it('REMOVE: full object', done => {
            const patch: ScimPatchRemoveOperation = {op: 'remove', path: 'name'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name).not.to.exist;
            return done();
        });

        it('REMOVE: multiple property at once with path', done => {
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'name'};
            const patch2: ScimPatchRemoveOperation = {op: 'remove', path: 'active'};
            const afterPatch = scimPatch(scimUser, [patch1, patch2]);
            expect(afterPatch.name).not.to.exist;
            expect(afterPatch.active).not.to.exist;
            return done();
        });

        it('REMOVE: primary email value', done => {
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'emails[primary eq true].value'};
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.emails[0].value).not.to.exist;
            expect(afterPatch.emails[0].primary).to.eq(true);
            return done();
        });

        it('REMOVE: nested array element', done => {
            scimUser.name.nestedArray = [{primary: true, value: 'value1'}, {primary: false, value: 'value2'}];
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'name.nestedArray[primary eq true]'};
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });

        it('REMOVE: with path and value but no array-field like exists', done => {
            const patch = <ScimPatchRemoveOperation>{op: 'remove', 'path': 'name.randomField', value: []};
            expect(() => scimPatch(scimUser, [patch])).to.throw(RemoveValueNotArray);
            return done();
        });

        it('REMOVE: with path and value but value is array of arrays', done => {
            scimUser.name.nestedArray = [
                {primary: true, value: 'value1'},
                {primary: false, value: 'value2'}
            ];
            const patch = <ScimPatchRemoveOperation>{op: 'remove', 'path': 'name.nestedArray', value: [[]]};
            expect(() => scimPatch(scimUser, [patch])).to.throw(RemoveValueNestedArrayNotSupported);
            return done();
        });

        it('REMOVE: nested array element with patch value as array with single value', done => {
            scimUser.name.nestedArray = [
                {primary: true, value: 'value1'},
                {primary: false, value: 'value2'}
            ];
            const patch1: ScimPatchRemoveOperation = {
                op: 'remove',
                path: 'name.nestedArray',
                value: [{value: 'value2', primary: false}]
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });

        it('REMOVE: nested array element with patch value as array with multiple values', done => {
            scimUser.name.nestedArray = [
                {primary: true, value: 'value1'},
                {primary: false, value: 'value2'},
                {primary: false, value: 'value2'},
                {primary: false, value: 'value2'},
                {primary: false, value: 'value3'},
                {primary: false, value: 'value3'}
            ];
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'name.nestedArray', value: [{value: 'value2', primary: false}, {value: 'value3', primary: false}]};
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });

        it('REMOVE: nested array element with patch value as array with unknown value', done => {
            scimUser.name.nestedArray = [
                {primary: true, value: 'value1'},
                {primary: false, value: 'value2'},
                {primary: false, value: 'value3'}
            ];
            const patch1: ScimPatchRemoveOperation = {
                op: 'remove',
                path: 'name.nestedArray',
                value: [{value: 'value4', primary: false}]
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(3);
            return done();
        });


        it('REMOVE: nested array element with value supplied', done => {
            scimUser.name.nestedArray = [{primary: true, value: 'value1'}, {primary: false, value: 'value2'}];
            const patch: ScimPatchRemoveOperation = {
                op: 'remove',
                path: 'name.nestedArray',
                value: [{value: 'value2', primary: false}]
            };
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });

        it('REMOVE: nested array element with value as object supplied with multiple entries', done => {
            scimUser.name.nestedArray = [
                {primary: true, value: 'value1'},
                {primary: false, value: 'value2'},
                {primary: false, value: 'value2'},
                {primary: false, value: 'value2'}
            ];
            const patch1: ScimPatchRemoveOperation = {
                op: 'remove',
                path: 'name.nestedArray',
                value: {value: 'value2', primary: false}
            };
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });

        it('REMOVE: simple nested array elements with value supplied', done => {
            scimUser.name.surName2  = ['value1', 'value2'];
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'name.surName2', value: ['value2']};
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.surName2 && afterPatch.name.surName2.length).to.eq(1);
            return done();
        });

        it('REMOVE: simple nested array elements with value supplied', done => {
            scimUser.name.surName2  = ['value1', 'value2'];
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'name.surName2', value: 'value2'};
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.surName2 && afterPatch.name.surName2.length).to.eq(1);
            return done();
        });

        it('REMOVE: simple nested array elements with non-existing in scope value supplied', done => {
            scimUser.name.surName2  = ['value1', 'value2'];
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'name.surName2', value: ['value3']};
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.surName2 && afterPatch.name.surName2.length).to.eq(2);
            return done();
        });

        it('REMOVE: empty array should be unassigned', done => {
            scimUser.name.nestedArray = [{primary: true, value: 'value1'}];
            const patch1: ScimPatchRemoveOperation = {op: 'remove', path: 'name.nestedArray[primary eq true]'};
            const afterPatch = scimPatch(scimUser, [patch1]);
            expect(afterPatch.name.nestedArray).not.to.exist;
            return done();
        });

        it('REMOVE: with capital first letter for operation', done => {
            const patch: ScimPatchRemoveOperation = {op: 'Remove', path: 'active'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.active).not.to.exist;
            return done();
        });

        it('REMOVE: with extensions schema path', done => {
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
            const patch: ScimPatchRemoveOperation = {
                op: 'remove',
                path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch[schemaExtension]?.department).not.to.exist;
            return done();
        });

        it('REMOVE: with unavailable nested fields', done => {
            const patch: ScimPatchRemoveOperation = {op: 'remove', path: 'someField.level_1_depth.level_2_depth.final_depth'};
            const afterPatch: any = scimPatch(scimUser, [patch]);
            expect(afterPatch.someField).not.to.exist;
            return done();
        });
          
        // see https://github.com/thomaspoignant/scim-patch/issues/215
        it('REPLACE: don\'t mutate the original object', done => {
            const patch: ScimPatchRemoveOperation = {op: 'remove', path: 'active'};
            const afterPatch = scimPatch(scimUser, [patch], {mutateDocument:false});
            expect(scimUser).not.to.eq(afterPatch);
            return done();
        });

        
        
        it('REMOVE: remove all sub-attributes in a complex multi-valued attribute', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre" },
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const patch: ScimPatchRemoveOperation = {op: 'remove', path: 'emails.newProperty'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.an('undefined');  
            expect(afterPatch.emails[1].newProperty).to.be.an('undefined');       
            expect(afterPatch.emails[2].newProperty).to.be.an('undefined');       
            expect(afterPatch.emails[3].newProperty).to.be.an('undefined');         
            return done();
        });
        
        it('REMOVE: filter that match multiple elements of complex multiValued attribute', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre" },
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const patch: ScimPatchRemoveOperation = {op: 'remove', path: 'emails[primary eq false].newProperty'};
            const afterPatch = scimPatch(scimUser, [patch]);
            expect(afterPatch.emails[0].newProperty).to.be.eq("pre");
            expect(afterPatch.emails[1].newProperty).to.be.an('undefined');       
            expect(afterPatch.emails[2].newProperty).to.be.an('undefined');       
            expect(afterPatch.emails[3].newProperty).to.be.an('undefined');         
            return done();
        });
    });

    describe('invalid requests', () => {
        it('INVALID: wrong operation name', done => {
            const patch: any = {op: 'delete', value: true, path: 'active'};
            expect(() => scimPatch(scimUser, [patch])).to.throw(InvalidScimPatchRequest);
            return done();
        });

        it('INVALID: path filter invalid', done => {
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: true, path: 'emails[name eq]'};
            expect(() => scimPatch(scimUser, [patch])).to.throw(InvalidScimPatch);
            return done();
        });

        it('INVALID: path request missing', done => {
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: true, path: 'emails[name eq "toto"'};
            expect(() => scimPatch(scimUser, [patch])).to.throw(InvalidScimPatchOp);
            return done();
        });

        it('INVALID: search on a mono valued attribute', done => {
            const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: true, path: 'username[name eq "toto"]'};
            expect(() => scimPatch(scimUser, [patch])).to.throw(InvalidScimPatchOp);
            return done();
        });

        it('INVALID: invalid parameter in scim filter', done => {
            const patch: ScimPatchAddReplaceOperation = {
                op: 'replace',
                value: true,
                path: 'emails[\' eq true].value'
            };
            expect(() => scimPatch(scimUser, [patch])).to.throw(InvalidScimPatchOp);
            return done();
        });
    });
});
