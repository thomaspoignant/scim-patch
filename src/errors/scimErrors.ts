export abstract class ScimError extends Error {
  readonly scimCode?: string;

  protected constructor(scimCode?: string) {
    super();
    this.scimCode = scimCode;
  }
}

export abstract class InvalidScimPatch extends ScimError {
  protected constructor(message: string, scimCode: string = 'invalidSyntax') {
    super(scimCode);
    this.message = `Invalid SCIM Patch: ${message}`;
  }
}

export class InvalidScimPatchOp extends InvalidScimPatch {
  constructor(message: string) {
    super(`${message}`, 'invalidSyntax');
  }
}

export class NoPathInScimPatchOp extends InvalidScimPatch {
  constructor() {
    super('Missing path in "remove" patch operation', 'noTarget');
  }
}

export class InvalidScimPatchRequest extends InvalidScimPatch {
  constructor(message: string) {
    super(`The SCIM patch request is invalid: ${message}`);
  }
}
