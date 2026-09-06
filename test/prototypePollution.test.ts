import { scimPatch } from "../src/scimPatch";
import { ScimUser } from "./types/types.test";
import { InvalidScimPatchOp } from "../src/errors/scimErrors";
import { ScimPatchOperation } from "../src/types/types";
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

  describe("array-search path segments (GHSA-33jh-378v-h6r8)", () => {
    // A segment such as "__proto__[primary eq true]" carries the dangerous key in front of the
    // value filter. It must be rejected like a bare "__proto__" segment, and the resource must come
    // out untouched: same prototype, not re-parented onto an Array, nothing on Object.prototype.
    function expectForbiddenKey(resource: any, patch: ScimPatchOperation) {
      expect(() => scimPatch(resource, [patch])).to.throw(
        InvalidScimPatchOp,
        "Forbidden key in patch path"
      );
      expect(Object.getPrototypeOf(resource)).to.equal(Object.prototype);
      expect(resource instanceof Array).to.be.false;
      expect((Object.prototype as any).polluted).to.be.undefined;
      expect(({} as any).polluted).to.be.undefined;
    }

    it("rejects the advisory PoC on an empty resource", () => {
      const resource: any = {};
      expectForbiddenKey(resource, {
        op: "add",
        path: "__proto__[primary eq true].polluted",
        value: "yes",
      });
    });

    it("rejects a __proto__ array-search segment via add", () => {
      expectForbiddenKey(scimUser, {
        op: "add",
        path: "__proto__[primary eq true].polluted",
        value: "yes",
      });
    });

    it("rejects a __proto__ array-search segment via replace", () => {
      expectForbiddenKey(scimUser, {
        op: "replace",
        path: "__proto__[primary eq true].polluted",
        value: "yes",
      });
    });

    it("rejects a __proto__ array-search segment via remove", () => {
      expectForbiddenKey(scimUser, {
        op: "remove",
        path: "__proto__[primary eq true].polluted",
      });
    });

    it("rejects constructor and prototype array-search segments", () => {
      expectForbiddenKey(scimUser, {
        op: "add",
        path: "constructor[primary eq true].polluted",
        value: "yes",
      });
      expectForbiddenKey(scimUser, {
        op: "add",
        path: "prototype[primary eq true].polluted",
        value: "yes",
      });
    });

    it("rejects a __proto__ array-search segment behind a schema URN", () => {
      expectForbiddenKey(scimUser, {
        op: "add",
        path: "urn:ietf:params:scim:schemas:core:2.0:User:__proto__[primary eq true].polluted",
        value: "yes",
      });
    });

    it("rejects a nested __proto__ array-search segment after a valid array filter", () => {
      // The comparison value is deliberately unquoted: the period splitter does not split a
      // segment that precedes a quoted literal, which would turn the path into a literal key.
      expectForbiddenKey(scimUser, {
        op: "add",
        path: "emails[primary eq true].__proto__[primary eq true].polluted",
        value: "yes",
      });
    });

    it("rejects a value filter on an inherited built-in instead of crashing", () => {
      expect(() =>
        scimPatch(scimUser, [
          { op: "add", path: "toString[primary eq true].newProperty", value: "yes" },
        ])
      ).to.throw(InvalidScimPatchOp, "Impossible to search on a mono valued attribute");
      expect((scimUser as any).toString).to.equal(Object.prototype.toString);
    });

    it("rejects a __proto__ array-search segment with no sub-attribute", () => {
      expectForbiddenKey(scimUser, {
        op: "add",
        path: "__proto__[primary eq true]",
        value: "yes",
      });
    });

    it("rejects a __proto__ array-search segment on a null-prototype resource", () => {
      const resource = Object.create(null);
      expect(() =>
        scimPatch(resource, [
          { op: "add", path: "__proto__[primary eq true].polluted", value: "yes" },
        ])
      ).to.throw(InvalidScimPatchOp, "Forbidden key in patch path");
      expect(Object.getPrototypeOf(resource)).to.equal(null);
      expect((Object.prototype as any).polluted).to.be.undefined;
    });

    it("rejects __proto__ when it is the value-filter attribute on a missing array", () => {
      const resource: any = {};
      expectForbiddenKey(resource, {
        op: "add",
        path: "emails[__proto__ eq true].polluted",
        value: "yes",
      });
      expect(resource.emails).to.be.undefined;
    });

    it("rejects constructor when it is the value-filter attribute on a missing array", () => {
      const resource: any = {};
      expectForbiddenKey(resource, {
        op: "add",
        path: "emails[constructor eq true].value",
        value: "x",
      });
      expect(resource.emails).to.be.undefined;
      expect((Function.prototype as any).polluted).to.be.undefined;
    });
  });
});
