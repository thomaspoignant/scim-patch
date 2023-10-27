"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scimPatch_1 = require("../src/scimPatch");
const chai_1 = require("chai");
const scimErrors_1 = require("../src/errors/scimErrors");
describe('SCIM PATCH', () => {
    let scimUser;
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
            const patch = { op: 'replace', value: expected, path: 'active' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.active).to.be.eq(expected);
            return done();
        });
        it('REPLACE: first level property with fully qualified path', done => {
            const expected = false;
            const patch = { op: 'replace', value: expected, path: 'urn:ietf:params:scim:schemas:core:2.0:User:active' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.active).to.be.eq(expected);
            return done();
        });
        it('REPLACE: first level property without path', done => {
            const expected = false;
            const patch = { op: 'replace', value: { active: expected } };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.active).to.be.eq(expected);
            return done();
        });
        it('REPLACE: 2 level property with path', done => {
            const expected = 'toto';
            const patch = { op: 'replace', value: expected, path: 'name.familyName' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.familyName).to.be.eq(expected);
            return done();
        });
        it('REPLACE: 2 level property without complete path', done => {
            const expected = 'toto';
            const patch = { op: 'replace', value: { familyName: expected }, path: 'name' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.familyName).to.be.eq(expected);
            return done();
        });
        it('REPLACE: 2 level extension schema property without path', done => {
            var _a, _b;
            const expectedOrganization = 'newOrganization';
            const expectedDepartment = 'newDepartment';
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
            const patch = {
                op: 'replace', value: {
                    [`${schemaExtension}:organization`]: expectedOrganization,
                    [`${schemaExtension}:department`]: expectedDepartment
                }
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)((_a = afterPatch[schemaExtension]) === null || _a === void 0 ? void 0 : _a.organization).to.be.eq(expectedOrganization);
            (0, chai_1.expect)((_b = afterPatch[schemaExtension]) === null || _b === void 0 ? void 0 : _b.department).to.be.eq(expectedDepartment);
            return done();
        });
        it('REPLACE: multiple at once with path', done => {
            const expectedFamilyName = 'toto';
            const expectedGivenName = 'titi';
            const expectedActive = false;
            const patch1 = {
                op: 'replace', value: {
                    givenName: expectedGivenName,
                    familyName: expectedFamilyName
                }, path: 'name'
            };
            const patch2 = { op: 'replace', value: { active: expectedActive } };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1, patch2]);
            (0, chai_1.expect)(afterPatch.name.familyName).to.be.eq(expectedFamilyName);
            (0, chai_1.expect)(afterPatch.name.givenName).to.be.eq(expectedGivenName);
            (0, chai_1.expect)(afterPatch.active).to.be.eq(expectedActive);
            return done();
        });
        it('REPLACE: multiple at once with exact path', done => {
            const expectedFamilyName = 'toto';
            const expectedGivenName = 'titi';
            const expectedActive = false;
            const patch1 = {
                op: 'replace',
                value: expectedGivenName,
                path: 'name.givenName'
            };
            const patch2 = { op: 'replace', value: { active: expectedActive } };
            const patch3 = {
                op: 'replace',
                value: expectedFamilyName,
                path: 'name.familyName'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1, patch2, patch3]);
            (0, chai_1.expect)(afterPatch.name.familyName).to.be.eq(expectedFamilyName);
            (0, chai_1.expect)(afterPatch.name.givenName).to.be.eq(expectedGivenName);
            (0, chai_1.expect)(afterPatch.active).to.be.eq(expectedActive);
            return done();
        });
        it('REPLACE: primary email object', done => {
            const expected = 'toto@toto.com';
            const patch1 = {
                op: 'replace',
                value: { value: expected, primary: true },
                path: 'emails[primary eq true]'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.emails[0].value).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[0].primary).to.be.eq(true);
            return done();
        });
        it('REPLACE: nested object do not exists', done => {
            // empty the surName fields.
            scimUser.surName = [];
            const patch = {
                op: 'replace',
                path: 'surName[value eq "bogus"]',
                value: 'this value should not be added',
            };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimErrors_1.NoTarget, 'a value selection filter (surName[value eq "bogus"]) has been supplied and no record match was made');
            return done();
        });
        it('REPLACE: nested object do not exists can be treated as ADD', done => {
            var _a, _b;
            // empty the surName fields.
            scimUser.emails = [];
            const patch = {
                op: 'replace',
                path: 'addresses[type eq "work"].country',
                value: 'Denmark',
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch], { treatMissingAsAdd: true });
            (0, chai_1.expect)((_a = afterPatch.addresses) === null || _a === void 0 ? void 0 : _a[0].country).to.be.eq("Denmark");
            (0, chai_1.expect)((_b = afterPatch.addresses) === null || _b === void 0 ? void 0 : _b[0].type).to.be.eq("work");
            return done();
        });
        it('REPLACE: primary email value', done => {
            const expected = 'toto@toto.com';
            const patch1 = {
                op: 'replace',
                value: expected,
                path: 'emails[primary eq true].value'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.emails[0].value).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[0].primary).to.be.eq(true);
            return done();
        });
        it('REPLACE: nested array element', done => {
            scimUser.name.nestedArray = [{ primary: true, value: 'value1' }];
            const expected = 'value2';
            const patch1 = {
                op: 'replace', value: {
                    value: expected,
                    primary: true
                }, path: 'name.nestedArray[primary eq true]'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].value).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].primary).to.be.eq(true);
            return done();
        });
        it('REPLACE: replace a non existent element', done => {
            const expected = true;
            const patch = { op: 'replace', value: expected, path: 'unknown.toto' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.unknown.toto).to.be.eq(expected);
            return done();
        });
        it('REPLACE: add a non object value to an object key', done => {
            const expected = 'BATMAN';
            const patch = { op: 'replace', path: 'name', value: expected };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name).to.be.eq(expected);
            return done();
        });
        it('REPLACE: with capital first letter for operation', done => {
            const expected = false;
            const patch = { op: 'Replace', value: { active: expected } };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.active).to.be.eq(expected);
            return done();
        });
        it('REPLACE: with extensions schema path', done => {
            var _a;
            const expected = 'newValue';
            const patch = {
                op: 'replace',
                value: expected,
                path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)((_a = afterPatch['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']) === null || _a === void 0 ? void 0 : _a.department).to.be.eq(expected);
            return done();
        });
        it('REPLACE: array by another array', done => {
            const expected = [{ value: 'test2' }];
            const path = 'emails';
            const patch = {
                op: 'replace',
                value: expected,
                path: path
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch[path]).to.be.eq(expected);
            return done();
        });
        it("REPLACE: no record match was made, treatMissingAsAdd false", (done) => {
            // empty the surName fields.
            scimUser.surName = [];
            const patch = {
                op: "replace",
                path: "surName[primary eq true].value",
                value: "surname"
            };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch], { treatMissingAsAdd: false }))
                .to.throw(scimErrors_1.NoTarget, 'a value selection filter (surName[primary eq true].value) has been supplied and no record match was made');
            return done();
        });
        it("REPLACE: no record match was made", (done) => {
            // empty the surName fields.
            scimUser.surName = [];
            const patch = {
                op: "replace",
                path: "surName[primary eq true].value",
                value: "surname"
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.surName).to.be.deep.eq([{ "primary": true, "value": "surname" }]);
            return done();
        });
        it("REPLACE: replace add fields in complex object", (done) => {
            const expected = [{ primary: true, value: "bogus", additional: "additional" }];
            // empty the surName fields.
            scimUser.surName = [{ primary: true, value: "bogus" }];
            const patch = {
                op: 'replace',
                path: 'surName[value eq "bogus"]',
                value: { additional: "additional" },
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.surName).to.be.deep.eq(expected);
            return done();
        });
        it("REPLACE: replace add and update fields in complex object", (done) => {
            const expected = [{ primary: true, value: "bogus2", additional: "additional" }];
            // empty the surName fields.
            scimUser.surName = [{ primary: true, value: "bogus" }];
            const patch = {
                op: 'replace',
                path: 'surName[value eq "bogus"]',
                value: { additional: "additional", value: "bogus2" },
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.surName).to.be.deep.eq(expected);
            return done();
        });
        it("REPLACE: empty array add filter type + field (Azure AD)", (done) => {
            const patch = {
                op: "Replace",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work\"].formatted"
            };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch], { treatMissingAsAdd: false })).to.throw(scimErrors_1.NoTarget, 'a value selection filter (addresses[type eq "work"].formatted) has been supplied and no record match was made');
            return done();
        });
        it("REPLACE: filter with an email containing dots", (done) => {
            const expected = [{ "value": "batman@superheroes.com", "primary": true }];
            const patch = {
                op: "Replace",
                value: "batman@superheroes.com",
                path: "emails[value eq \"spiderman@superheroes.com\"].value"
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails).to.be.deep.eq(expected);
            return done();
        });
        // see https://github.com/thomaspoignant/scim-patch/issues/215
        it('REPLACE: don\'t mutate the original object', done => {
            const expected = false;
            const patch = { op: 'replace', value: expected, path: 'active' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch], { mutateDocument: false });
            (0, chai_1.expect)(scimUser).not.to.be.eq(afterPatch);
            return done();
        });
        it('REPLACE: replace on multiValued objects', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre" },
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const expected = "post";
            const patch = { op: 'replace', value: expected, path: 'emails.newProperty' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[1].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[2].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[3].newProperty).to.be.eq(expected);
            return done();
        });
        // it('REPLACE: replace on multiValued objects without complete path', done => {
        //     scimUser.emails = [
        //         { value: "addr1@email.com", primary: true, newProperty: "pre"},
        //         { value: "addr2@email.com", primary: false, newProperty: "pre" },
        //         { value: "addr3@email.com", primary: false, newProperty: "pre" },
        //         { value: "addr4@email.com", primary: false, newProperty: "pre" },
        //     ];
        //     const expected = "post";
        //     const patch: ScimPatchAddReplaceOperation = {op: 'replace', value: {newProperty: expected}, path: 'emails'};
        //     const afterPatch = scimPatch(scimUser, [patch]);
        //     console.log(afterPatch.emails);
        //     expect(afterPatch.emails[0].newProperty).to.be.eq(expected);
        //     expect(afterPatch.emails[1].newProperty).to.be.eq(expected);       
        //     expect(afterPatch.emails[2].newProperty).to.be.eq(expected);       
        //     expect(afterPatch.emails[3].newProperty).to.be.eq(expected);         
        //     return done();
        // });
        it('REPLACE: filter that match multiple elements of complex multiValued attribute', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre" },
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const expected = "post";
            const patch = { op: 'replace', value: expected, path: 'emails[primary eq false].newProperty' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.eq("pre");
            (0, chai_1.expect)(afterPatch.emails[1].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[2].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[3].newProperty).to.be.eq(expected);
            return done();
        });
        it('REPLACE: filter that match multiple elements of complex multiValued attribute without complete path', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre" },
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const expected = "post";
            const patch = { op: 'replace', value: { newProperty: expected }, path: 'emails[primary eq false]' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.eq("pre");
            (0, chai_1.expect)(afterPatch.emails[1].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[2].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[3].newProperty).to.be.eq(expected);
            return done();
        });
    });
    describe('add', () => {
        it('ADD: first level property without path', done => {
            const expected = 'newValue';
            const patch = { op: 'add', value: { newProperty: expected } };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.newProperty).to.be.eq(expected);
            return done();
        });
        it('ADD: first level property with path', done => {
            const expected = 'newValue';
            const patch = { op: 'add', value: expected, path: 'newProperty' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.newProperty).to.be.eq(expected);
            return done();
        });
        it('ADD: 2 level property with path', done => {
            const expected = 'toto';
            const patch = { op: 'add', value: expected, path: 'name.newProperty' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.newProperty).to.be.eq(expected);
            return done();
        });
        it('ADD: 2 level property without complete path', done => {
            const expected = 'toto';
            const patch = { op: 'add', value: { newProperty: expected }, path: 'name' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.newProperty).to.be.eq(expected);
            return done();
        });
        it('ADD: 2 level extension schema property without path', done => {
            var _a;
            const expectedDivision = 'newDepartment';
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
            const patch = {
                op: 'add', value: {
                    [`${schemaExtension}:division`]: expectedDivision
                }
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)((_a = afterPatch[schemaExtension]) === null || _a === void 0 ? void 0 : _a.division).to.be.eq(expectedDivision);
            return done();
        });
        it('ADD: multiple at once with path', done => {
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const expectedNewProperty3 = 'tata';
            const patch1 = {
                op: 'add', value: {
                    newProperty1: expectedNewProperty1,
                    newProperty2: expectedNewProperty2
                }, path: 'name'
            };
            const patch2 = { op: 'add', value: { newProperty3: expectedNewProperty3 } };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1, patch2]);
            (0, chai_1.expect)(afterPatch.name.newProperty1).to.be.eq(expectedNewProperty1);
            (0, chai_1.expect)(afterPatch.name.newProperty2).to.be.eq(expectedNewProperty2);
            (0, chai_1.expect)(afterPatch.newProperty3).to.be.eq(expectedNewProperty3);
            return done();
        });
        it('ADD: multiple at once with exact path', done => {
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const expectedNewProperty3 = 'tata';
            const patch1 = {
                op: 'replace',
                value: expectedNewProperty1,
                path: 'name.newProperty1'
            };
            const patch2 = { op: 'replace', value: { newProperty3: expectedNewProperty3 } };
            const patch3 = {
                op: 'replace',
                value: expectedNewProperty2,
                path: 'name.newProperty2'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1, patch2, patch3]);
            (0, chai_1.expect)(afterPatch.name.newProperty1).to.be.eq(expectedNewProperty1);
            (0, chai_1.expect)(afterPatch.name.newProperty2).to.be.eq(expectedNewProperty2);
            (0, chai_1.expect)(afterPatch.newProperty3).to.be.eq(expectedNewProperty3);
            return done();
        });
        it('ADD: primary email object', done => {
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const patch1 = {
                op: 'add', value: {
                    newProperty1: expectedNewProperty1,
                    newProperty2: expectedNewProperty2
                }, path: 'emails[primary eq true]'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty1).to.be.eq(expectedNewProperty1);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty2).to.be.eq(expectedNewProperty2);
            (0, chai_1.expect)(afterPatch.emails[0].value).to.be.eq(scimUser.emails[0].value);
            return done();
        });
        it('ADD: primary email newProperty', done => {
            const expected = 'toto@toto.com';
            const patch = {
                op: 'add',
                value: expected,
                path: 'emails[primary eq true].newProperty'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[0].primary).to.be.eq(true);
            return done();
        });
        it('ADD: nested array element', done => {
            scimUser.name.nestedArray = [{ primary: true, value: 'value1' }];
            const expectedNewProperty1 = 'toto';
            const expectedNewProperty2 = 'titi';
            const patch1 = {
                op: 'add', value: {
                    newProperty1: expectedNewProperty1,
                    newProperty2: expectedNewProperty2
                }, path: 'name.nestedArray[primary eq true]'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].newProperty1).to.be.eq(expectedNewProperty1);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray[0].newProperty2).to.be.eq(expectedNewProperty2);
            return done();
        });
        it('ADD: If the target location specifies a multi-valued attribute, a new value is added to the attribute.', done => {
            scimUser.name.surName2 = ['toto', 'titi'];
            const newSurname = 'tata';
            const patch = {
                op: 'add', value: newSurname, path: 'name.surName2'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.surName2).to.contains('toto');
            (0, chai_1.expect)(afterPatch.name.surName2).to.contains(newSurname);
            return done();
        });
        it('ADD: If the target location specifies a single-valued attribute, the existing value is replaced', done => {
            scimUser.name.surName3 = 'surName';
            const newSurname = 'tata';
            const patch = {
                op: 'add', value: newSurname, path: 'name.surName3'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.surName3).to.be.eq(newSurname);
            return done();
        });
        it('ADD: If the target location specifies a multi-valued attribute, a new value is added to the attribute.', done => {
            scimUser.name.surName2 = ['toto', 'titi'];
            const newSurname = 'tata';
            const patch = {
                op: 'add', value: newSurname, path: 'name.surName2'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.surName2).to.contains('toto');
            (0, chai_1.expect)(afterPatch.name.surName2).to.contains('titi');
            (0, chai_1.expect)(afterPatch.name.surName2).to.contains(newSurname);
            return done();
        });
        it('ADD: If the target location specifies a multi-valued attribute, a new value is added to the attribute only if doesn\'t exist already.', done => {
            var _a;
            scimUser.name.surName2 = ['toto', 'titi'];
            const newSurname = 'titi';
            const patch = {
                op: 'add', value: newSurname, path: 'name.surName2'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.surName2).to.contains('toto');
            (0, chai_1.expect)((_a = afterPatch.name.surName2) === null || _a === void 0 ? void 0 : _a.filter(s => s === 'titi').length).to.eq(1);
            return done();
        });
        it('ADD: impossible to add a non object value to an object key', done => {
            const patch = { op: 'add', path: 'name', value: 'titi' };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.InvalidScimPatchOp);
            return done();
        });
        it('ADD: should not modify anything if element not found', done => {
            scimUser.name.nestedArray = [{ primary: true, value: 'value1' }];
            const patch1 = {
                op: 'add', value: {
                    newProperty1: 'toto'
                }, path: 'name.nestedArray[toto eq true]'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray).to.be.eq(scimUser.name.nestedArray);
            return done();
        });
        it('ADD: with capital first letter for operation', done => {
            const expected = 'newValue';
            const patch = { op: 'Add', value: { newProperty: expected } };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.newProperty).to.be.eq(expected);
            return done();
        });
        it('ADD: with extension schema path', done => {
            var _a;
            const expected = 'newValue';
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
            delete scimUser[schemaExtension];
            const patch = {
                op: 'add',
                value: 'newValue',
                path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)((_a = afterPatch[schemaExtension]) === null || _a === void 0 ? void 0 : _a.department).to.be.eq(expected);
            return done();
        });
        it("ADD: array", (done) => {
            const newValue = { value: "test2" };
            const newArray = [newValue];
            const path = "emails";
            const initialArrayLength = scimUser[path].length;
            const patch = {
                op: "Add",
                value: newArray,
                path,
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch[path].length).to.be.eq(initialArrayLength + newArray.length);
            (0, chai_1.expect)(afterPatch[path].find((val) => val.value === newValue.value)).to.eq(newValue);
            return done();
        });
        it("ADD: array ignores existing values", (done) => {
            const path = "emails";
            const initialArrayLength = scimUser[path].length;
            const patch = {
                op: "Add",
                value: scimUser[path],
                path,
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch[path].length).to.be.eq(initialArrayLength);
            return done();
        });
        // Check issue https://github.com/thomaspoignant/scim-patch/issues/42 to understand this usecase
        it("ADD: empty array add filter type + field (Azure AD)", (done) => {
            var _a;
            const patch = {
                op: "Add",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work\"].formatted"
            };
            (0, chai_1.expect)(scimUser.addresses).to.be.undefined;
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.addresses).to.not.be.undefined;
            (0, chai_1.expect)((_a = afterPatch.addresses) === null || _a === void 0 ? void 0 : _a.length).to.be.eq(1);
            if (afterPatch.addresses !== undefined) {
                const address = afterPatch.addresses[0];
                (0, chai_1.expect)(address.type).to.be.eq("work");
                (0, chai_1.expect)(address.formatted).to.be.eq("1111 Street Rd");
            }
            return done();
        });
        it("ADD: existing array add filter type + field (Azure AD)", (done) => {
            var _a;
            const patch = {
                op: "Add",
                value: "1122 Street Rd",
                path: "addresses[type eq \"work\"].formatted"
            };
            scimUser.addresses = [{
                    type: 'home',
                    formatted: '2222 Avenue Blvd'
                }];
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.addresses).to.not.be.undefined;
            (0, chai_1.expect)((_a = afterPatch.addresses) === null || _a === void 0 ? void 0 : _a.length).to.be.eq(2);
            if (afterPatch.addresses !== undefined) {
                const existingAddress = afterPatch.addresses[0];
                (0, chai_1.expect)(existingAddress.type).to.be.eq("home");
                (0, chai_1.expect)(existingAddress.formatted).to.be.eq("2222 Avenue Blvd");
                const newAddress = afterPatch.addresses[1];
                (0, chai_1.expect)(newAddress.type).to.be.eq("work");
                (0, chai_1.expect)(newAddress.formatted).to.be.eq("1122 Street Rd");
            }
            return done();
        });
        it("ADD: existing array add filter type + field (Azure AD) with lower case add", (done) => {
            var _a;
            const patch = { op: "add", value: "1122 Street Rd", path: "addresses[type eq \"work\"].formatted" };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)((_a = afterPatch.addresses) === null || _a === void 0 ? void 0 : _a.length).to.be.eq(1);
            if (afterPatch.addresses !== undefined) {
                const newAddress = afterPatch.addresses[0];
                (0, chai_1.expect)(newAddress.type).to.be.eq("work");
                (0, chai_1.expect)(newAddress.formatted).to.be.eq("1122 Street Rd");
            }
            return done();
        });
        it("ADD: empty array multiple filter should throw an error", (done) => {
            const patch = {
                op: "Add",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work\" or type eq \"home\"].formatted"
            };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimErrors_1.NoTarget, 'a value selection filter (addresses[type eq "work" or type eq "home"].formatted) has been supplied and no record match was made');
            return done();
        });
        it("ADD: Invalid filter operation", (done) => {
            const patch = {
                op: "Add",
                value: "1111 Street Rd",
                path: "addresses[type eq \"work.formatted"
            };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.InvalidScimPatchOp);
            return done();
        });
        // Check issue https://github.com/thomaspoignant/scim-patch/issues/42 to understand this use-case
        it("ADD: empty array add filter type + field 2nd level", (done) => {
            var _a;
            const patch = {
                op: "Add",
                value: "1111 Street Rd",
                path: "name.nestedArray[primary eq true].newProperty1"
            };
            (0, chai_1.expect)(scimUser.name.nestedArray).to.be.undefined;
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.nestedArray).to.not.be.undefined;
            (0, chai_1.expect)((_a = afterPatch.name.nestedArray) === null || _a === void 0 ? void 0 : _a.length).to.be.eq(1);
            if (afterPatch.name.nestedArray !== undefined) {
                const address = afterPatch.name.nestedArray[0];
                (0, chai_1.expect)(address.primary).to.be.eq(true);
                (0, chai_1.expect)(address.newProperty1).to.be.eq("1111 Street Rd");
            }
            return done();
        });
        // Check issue https://github.com/thomaspoignant/scim-patch/issues/132 to understand this use-case
        it("ADD: dot notation with no path", done => {
            var _a;
            const patch = {
                op: 'add',
                value: {
                    "name.givenName": "John",
                    "name.familyName": "Doe",
                    "name.formatted": "John Doe",
                    "favorites.food": "lemon"
                }
            };
            (0, chai_1.expect)(scimUser.name.nestedArray).to.be.undefined;
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.givenName).to.be.eq("John");
            (0, chai_1.expect)(afterPatch.name.familyName).to.be.eq("Doe");
            (0, chai_1.expect)(afterPatch.name.formatted).to.be.eq("John Doe");
            (0, chai_1.expect)((_a = afterPatch === null || afterPatch === void 0 ? void 0 : afterPatch.favorites) === null || _a === void 0 ? void 0 : _a.food).to.be.eq("lemon");
            return done();
        });
        // Check issue https://github.com/thomaspoignant/scim-patch/issues/186 to understand this use-case
        it("ADD: on null property", done => {
            const user = {
                schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
                meta: { resourceType: "User", created: new Date(), lastModified: new Date(), location: "users/4" },
                active: true, emails: [{ value: "batman@superheroes.com", primary: true }],
                name: { familyName: "bat", givenName: "man" }, userName: "batman",
                newProperty: null
            };
            const patch = { op: "add", path: "newProperty", value: "1" };
            (0, chai_1.expect)(user.newProperty).to.be.null;
            const afterPatch = (0, scimPatch_1.scimPatch)(user, [patch]);
            (0, chai_1.expect)(afterPatch.newProperty).to.be.eq("1");
            return done();
        });
        // see https://github.com/thomaspoignant/scim-patch/issues/215
        it('ADD: don\'t mutate the original object', done => {
            const expected = 'newValue';
            const patch = { op: 'add', value: { newProperty: expected } };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch], { mutateDocument: false });
            (0, chai_1.expect)(scimUser).not.to.be.eq(afterPatch);
            return done();
        });
        it("ADD: on adding duplicate objects to an array, value is object", done => {
            const patch = {
                op: "add",
                path: "emails",
                value: {
                    value: "spiderman@superheroes.com",
                    primary: true
                }
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails.length).to.be.eq(1);
            return done();
        });
        it("ADD: on adding duplicate objects to an array, value is array of objects ", done => {
            const patch = {
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
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails.length).to.be.eq(2);
            return done();
        });
        // see https://github.com/thomaspoignant/scim-patch/issues/220
        it("ADD: on array attribute when 'path' is absent & value is array should append all values", done => {
            const patch = {
                op: "add",
                value: {
                    emails: [
                        {
                            value: "batman@superheroes.com",
                            primary: true
                        }, {
                            value: "superman@superheroes.com",
                            primary: true
                        }
                    ]
                }
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails.length).to.be.eq(3);
            return done();
        });
        it("ADD: on array attribute when 'path' is absent & value is non-array should append the value", done => {
            const patch = {
                op: "add",
                value: {
                    emails: {
                        value: "batman@superheroes.com",
                        primary: true
                    }
                }
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails.length).to.be.eq(2);
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
            const patch = { op: 'add', value: expected, path: 'emails[primary eq false].newProperty' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.an('undefined');
            (0, chai_1.expect)(afterPatch.emails[1].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[2].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[3].newProperty).to.be.eq(expected);
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
            const patch = { op: 'add', value: { newProperty: expected }, path: 'emails[primary eq false]' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.an('undefined');
            (0, chai_1.expect)(afterPatch.emails[1].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[2].newProperty).to.be.eq(expected);
            (0, chai_1.expect)(afterPatch.emails[3].newProperty).to.be.eq(expected);
            return done();
        });
    });
    describe('remove', () => {
        it('REMOVE: with no path', done => {
            const patch = { op: 'remove' };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.NoPathInScimPatchOp);
            return done();
        });
        it('REMOVE: first level property with path', done => {
            const patch = { op: 'remove', path: 'active' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.active).not.to.exist;
            return done();
        });
        it('REMOVE: 2 level property with path', done => {
            const patch = { op: 'remove', path: 'name.familyName' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.familyName).not.to.exist;
            return done();
        });
        it('REMOVE: full object', done => {
            const patch = { op: 'remove', path: 'name' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name).not.to.exist;
            return done();
        });
        it('REMOVE: multiple property at once with path', done => {
            const patch1 = { op: 'remove', path: 'name' };
            const patch2 = { op: 'remove', path: 'active' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1, patch2]);
            (0, chai_1.expect)(afterPatch.name).not.to.exist;
            (0, chai_1.expect)(afterPatch.active).not.to.exist;
            return done();
        });
        it('REMOVE: primary email value', done => {
            const patch1 = { op: 'remove', path: 'emails[primary eq true].value' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.emails[0].value).not.to.exist;
            (0, chai_1.expect)(afterPatch.emails[0].primary).to.eq(true);
            return done();
        });
        it('REMOVE: nested array element', done => {
            scimUser.name.nestedArray = [{ primary: true, value: 'value1' }, { primary: false, value: 'value2' }];
            const patch1 = { op: 'remove', path: 'name.nestedArray[primary eq true]' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });
        it('REMOVE: with path and value but no array-field like exists', done => {
            const patch = { op: 'remove', 'path': 'name.randomField', value: [] };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimErrors_1.RemoveValueNotArray);
            return done();
        });
        it('REMOVE: with path and value but value is array of arrays', done => {
            scimUser.name.nestedArray = [
                { primary: true, value: 'value1' },
                { primary: false, value: 'value2' }
            ];
            const patch = { op: 'remove', 'path': 'name.nestedArray', value: [[]] };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimErrors_1.RemoveValueNestedArrayNotSupported);
            return done();
        });
        it('REMOVE: nested array element with patch value as array with single value', done => {
            scimUser.name.nestedArray = [
                { primary: true, value: 'value1' },
                { primary: false, value: 'value2' }
            ];
            const patch1 = {
                op: 'remove',
                path: 'name.nestedArray',
                value: [{ value: 'value2', primary: false }]
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });
        it('REMOVE: nested array element with patch value as array with multiple values', done => {
            scimUser.name.nestedArray = [
                { primary: true, value: 'value1' },
                { primary: false, value: 'value2' },
                { primary: false, value: 'value2' },
                { primary: false, value: 'value2' },
                { primary: false, value: 'value3' },
                { primary: false, value: 'value3' }
            ];
            const patch1 = { op: 'remove', path: 'name.nestedArray', value: [{ value: 'value2', primary: false }, { value: 'value3', primary: false }] };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });
        it('REMOVE: nested array element with patch value as array with unknown value', done => {
            scimUser.name.nestedArray = [
                { primary: true, value: 'value1' },
                { primary: false, value: 'value2' },
                { primary: false, value: 'value3' }
            ];
            const patch1 = {
                op: 'remove',
                path: 'name.nestedArray',
                value: [{ value: 'value4', primary: false }]
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(3);
            return done();
        });
        it('REMOVE: nested array element with value supplied', done => {
            scimUser.name.nestedArray = [{ primary: true, value: 'value1' }, { primary: false, value: 'value2' }];
            const patch = {
                op: 'remove',
                path: 'name.nestedArray',
                value: [{ value: 'value2', primary: false }]
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });
        it('REMOVE: nested array element with value as object supplied with multiple entries', done => {
            scimUser.name.nestedArray = [
                { primary: true, value: 'value1' },
                { primary: false, value: 'value2' },
                { primary: false, value: 'value2' },
                { primary: false, value: 'value2' }
            ];
            const patch1 = {
                op: 'remove',
                path: 'name.nestedArray',
                value: { value: 'value2', primary: false }
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray && afterPatch.name.nestedArray.length).to.eq(1);
            return done();
        });
        it('REMOVE: simple nested array elements with value supplied', done => {
            scimUser.name.surName2 = ['value1', 'value2'];
            const patch1 = { op: 'remove', path: 'name.surName2', value: ['value2'] };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.surName2 && afterPatch.name.surName2.length).to.eq(1);
            return done();
        });
        it('REMOVE: simple nested array elements with value supplied', done => {
            scimUser.name.surName2 = ['value1', 'value2'];
            const patch1 = { op: 'remove', path: 'name.surName2', value: 'value2' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.surName2 && afterPatch.name.surName2.length).to.eq(1);
            return done();
        });
        it('REMOVE: simple nested array elements with non-existing in scope value supplied', done => {
            scimUser.name.surName2 = ['value1', 'value2'];
            const patch1 = { op: 'remove', path: 'name.surName2', value: ['value3'] };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.surName2 && afterPatch.name.surName2.length).to.eq(2);
            return done();
        });
        it('REMOVE: empty array should be unassigned', done => {
            scimUser.name.nestedArray = [{ primary: true, value: 'value1' }];
            const patch1 = { op: 'remove', path: 'name.nestedArray[primary eq true]' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch1]);
            (0, chai_1.expect)(afterPatch.name.nestedArray).not.to.exist;
            return done();
        });
        it('REMOVE: with capital first letter for operation', done => {
            const patch = { op: 'Remove', path: 'active' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.active).not.to.exist;
            return done();
        });
        it('REMOVE: with extensions schema path', done => {
            var _a;
            const schemaExtension = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
            const patch = {
                op: 'remove',
                path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department'
            };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)((_a = afterPatch[schemaExtension]) === null || _a === void 0 ? void 0 : _a.department).not.to.exist;
            return done();
        });
        it('REMOVE: with unavailable nested fields', done => {
            const patch = { op: 'remove', path: 'someField.level_1_depth.level_2_depth.final_depth' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.someField).not.to.exist;
            return done();
        });
        // see https://github.com/thomaspoignant/scim-patch/issues/215
        it('REPLACE: don\'t mutate the original object', done => {
            const patch = { op: 'remove', path: 'active' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch], { mutateDocument: false });
            (0, chai_1.expect)(scimUser).not.to.eq(afterPatch);
            return done();
        });
        it('REMOVE: remove all sub-attributes in a complex multi-valued attribute', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre" },
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const patch = { op: 'remove', path: 'emails.newProperty' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.an('undefined');
            (0, chai_1.expect)(afterPatch.emails[1].newProperty).to.be.an('undefined');
            (0, chai_1.expect)(afterPatch.emails[2].newProperty).to.be.an('undefined');
            (0, chai_1.expect)(afterPatch.emails[3].newProperty).to.be.an('undefined');
            return done();
        });
        it('REMOVE: filter that match multiple elements of complex multiValued attribute', done => {
            scimUser.emails = [
                { value: "addr1@email.com", primary: true, newProperty: "pre" },
                { value: "addr2@email.com", primary: false, newProperty: "pre" },
                { value: "addr3@email.com", primary: false, newProperty: "pre" },
                { value: "addr4@email.com", primary: false, newProperty: "pre" },
            ];
            const patch = { op: 'remove', path: 'emails[primary eq false].newProperty' };
            const afterPatch = (0, scimPatch_1.scimPatch)(scimUser, [patch]);
            (0, chai_1.expect)(afterPatch.emails[0].newProperty).to.be.eq("pre");
            (0, chai_1.expect)(afterPatch.emails[1].newProperty).to.be.an('undefined');
            (0, chai_1.expect)(afterPatch.emails[2].newProperty).to.be.an('undefined');
            (0, chai_1.expect)(afterPatch.emails[3].newProperty).to.be.an('undefined');
            return done();
        });
    });
    describe('invalid requests', () => {
        it('INVALID: wrong operation name', done => {
            const patch = { op: 'delete', value: true, path: 'active' };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.InvalidScimPatchRequest);
            return done();
        });
        it('INVALID: path filter invalid', done => {
            const patch = { op: 'replace', value: true, path: 'emails[name eq]' };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.InvalidScimPatch);
            return done();
        });
        it('INVALID: path request missing', done => {
            const patch = { op: 'replace', value: true, path: 'emails[name eq "toto"' };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.InvalidScimPatchOp);
            return done();
        });
        it('INVALID: search on a mono valued attribute', done => {
            const patch = { op: 'replace', value: true, path: 'username[name eq "toto"]' };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.InvalidScimPatchOp);
            return done();
        });
        it('INVALID: invalid parameter in scim filter', done => {
            const patch = {
                op: 'replace',
                value: true,
                path: 'emails[\' eq true].value'
            };
            (0, chai_1.expect)(() => (0, scimPatch_1.scimPatch)(scimUser, [patch])).to.throw(scimPatch_1.InvalidScimPatchOp);
            return done();
        });
    });
});
//# sourceMappingURL=scimPatch.test.js.map