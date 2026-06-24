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
    // GHSA-2mhw-wcx5-v3xj: clean up any pollution of inherited built-in methods so a
    // failing test cannot leak global state into the rest of the run.
    for (const method of [
      Object.prototype.toString,
      Object.prototype.valueOf,
      Object.prototype.hasOwnProperty,
    ]) {
      delete (method as any).scimPatchPolluted;
      delete (method as any).noPathPolluted;
      delete (method as any).deep;
    }
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

    expect((Object.prototype as any).polluted).to.be.undefined;
    expect(({} as any).polluted).to.be.undefined;
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

    expect((Object.prototype as any).isAdmin).to.be.undefined;
    expect(({} as any).isAdmin).to.be.undefined;
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

    expect((Object.prototype as any).polluted).to.be.undefined;
    expect(({} as any).polluted).to.be.undefined;
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

    expect((Object.prototype as any).polluted).to.be.undefined;
    expect(({} as any).polluted).to.be.undefined;
  });

  it("does not pollute an inherited built-in method via a dotted path (GHSA-2mhw-wcx5-v3xj)", () => {
    scimPatch(scimUser, [
      {
        op: "add",
        path: "toString.scimPatchPolluted",
        value: "polluted",
      },
    ]);

    expect((Object.prototype.toString as any).scimPatchPolluted).to.be.undefined;
    expect(({} as any).toString.scimPatchPolluted).to.be.undefined;
    // The write must land on the resource's own property, not be silently dropped.
    expect((scimUser as any).toString.scimPatchPolluted).to.equal("polluted");
  });

  it("does not pollute an inherited built-in method via a no-path dotted value key (GHSA-2mhw-wcx5-v3xj)", () => {
    scimPatch(scimUser, [
      {
        op: "add",
        value: { "toString.noPathPolluted": "polluted" },
      },
    ]);

    expect((Object.prototype.toString as any).noPathPolluted).to.be.undefined;
    expect(({} as any).toString.noPathPolluted).to.be.undefined;
    expect((scimUser as any).toString.noPathPolluted).to.equal("polluted");
  });

  it("does not pollute other inherited members (valueOf, hasOwnProperty)", () => {
    scimPatch(scimUser, [
      { op: "add", path: "valueOf.scimPatchPolluted", value: "polluted" },
    ]);
    scimPatch(scimUser, [
      { op: "add", path: "hasOwnProperty.scimPatchPolluted", value: "polluted" },
    ]);

    expect((Object.prototype.valueOf as any).scimPatchPolluted).to.be.undefined;
    expect((Object.prototype.hasOwnProperty as any).scimPatchPolluted).to.be.undefined;
    expect(({} as any).valueOf.scimPatchPolluted).to.be.undefined;
    expect(({} as any).hasOwnProperty.scimPatchPolluted).to.be.undefined;
    expect((scimUser as any).valueOf.scimPatchPolluted).to.equal("polluted");
    expect((scimUser as any).hasOwnProperty.scimPatchPolluted).to.equal("polluted");
  });

  it("does not pollute via a replace op on an inherited method", () => {
    scimPatch(scimUser, [
      { op: "replace", path: "toString.scimPatchPolluted", value: "polluted" },
    ]);

    expect((Object.prototype.toString as any).scimPatchPolluted).to.be.undefined;
    expect(({} as any).toString.scimPatchPolluted).to.be.undefined;
    expect((scimUser as any).toString.scimPatchPolluted).to.equal("polluted");
  });

  it("does not pollute via deep nesting through an inherited method", () => {
    scimPatch(scimUser, [
      { op: "add", path: "toString.deep.scimPatchPolluted", value: "polluted" },
    ]);

    expect((Object.prototype.toString as any).deep).to.be.undefined;
    expect(({} as any).toString.deep).to.be.undefined;
    expect((scimUser as any).toString.deep.scimPatchPolluted).to.equal("polluted");
  });

  it("does not pollute via an inherited method after an array-search segment", () => {
    scimPatch(scimUser, [
      {
        op: "add",
        path: "emails[primary eq true].toString.scimPatchPolluted",
        value: "polluted",
      },
    ]);

    expect((Object.prototype.toString as any).scimPatchPolluted).to.be.undefined;
    expect(({} as any).toString.scimPatchPolluted).to.be.undefined;
    expect((scimUser.emails[0] as any).toString.scimPatchPolluted).to.equal("polluted");
  });

  it("still creates nested structure under a null intermediate attribute (issue #186 regression)", () => {
    (scimUser as any).name = null;

    const patched = scimPatch(scimUser, [
      { op: "add", path: "name.givenName", value: "Miles" },
    ]);

    expect(patched.name.givenName).to.equal("Miles");
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
