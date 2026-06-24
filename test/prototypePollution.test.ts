import { scimPatch } from "../src/scimPatch";
import { ScimUser } from "./types/types.test";
import { InvalidScimPatchOp } from "../src/errors/scimErrors";
import { expect } from "chai";

describe("Prototype pollution via scim-patch", () => {
  let scimUser: ScimUser;

  beforeEach(() => {
    scimUser = JSON.parse(`{
          "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
          "id": "tea_4",
          "userName": "spiderman",
          "name": { "familyName": "Parker", "givenName": "Peter" },
          "active": true,
          "emails": [{ "value": "spiderman@superheroes.com", "primary": true }],
          "roles": [],
          "meta": { "resourceType": "User", "created": "x", "lastModified": "x", "location": "x" }
        }`);
  });

  afterEach(() => {
    // Safety net: ensure nothing leaked onto the prototype even if a test fails.
    delete (Object.prototype as any).polluted;
    delete (Object.prototype as any).isAdmin;
  });

  it("rejects a value-key containing __proto__ instead of polluting Object.prototype", () => {
    expect(() =>
      scimPatch(scimUser, [
        {
          op: "add",
          path: "name",
          value: { "__proto__.polluted": "yes" },
        },
      ])
    ).to.throw(InvalidScimPatchOp);

    expect((Object.prototype as any).polluted).to.equal(undefined);
    expect(({} as any).polluted).to.equal(undefined);
  });

  it("rejects the __proto__.isAdmin escalation shape", () => {
    expect(() =>
      scimPatch(scimUser, [
        {
          op: "add",
          path: "name",
          value: { "__proto__.isAdmin": true },
        },
      ])
    ).to.throw(InvalidScimPatchOp);

    expect((Object.prototype as any).isAdmin).to.equal(undefined);
    expect(({} as any).isAdmin).to.equal(undefined);
  });

  it("rejects a __proto__ segment supplied through the patch path", () => {
    expect(() =>
      scimPatch(scimUser, [
        {
          op: "add",
          path: "__proto__.polluted",
          value: "yes",
        },
      ])
    ).to.throw(InvalidScimPatchOp);

    expect((Object.prototype as any).polluted).to.equal(undefined);
    expect(({} as any).polluted).to.equal(undefined);
  });

  it("rejects constructor / prototype keys as well", () => {
    expect(() =>
      scimPatch(scimUser, [
        {
          op: "add",
          path: "name",
          value: { "constructor.prototype.polluted": "yes" },
        },
      ])
    ).to.throw(InvalidScimPatchOp);

    expect(() =>
      scimPatch(scimUser, [
        {
          op: "add",
          path: "prototype.polluted",
          value: "yes",
        },
      ])
    ).to.throw(InvalidScimPatchOp);

    expect((Object.prototype as any).polluted).to.equal(undefined);
    expect(({} as any).polluted).to.equal(undefined);
  });

  it("still applies a legitimate nested patch", () => {
    const patched = scimPatch(scimUser, [
      {
        op: "add",
        path: "name",
        value: { givenName: "Miles" },
      },
    ]);

    expect(patched.name.givenName).to.equal("Miles");
    expect(patched.name.familyName).to.equal("Parker");
  });
});
