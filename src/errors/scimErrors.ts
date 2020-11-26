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

export abstract class InvalidScimValueRemoval extends ScimError {
  protected constructor(message: string, scimCode: string = 'invalidSyntax') {
    super(scimCode);
    this.message = `Invalid SCIM Remove Operation: ${message}`;
  }
}

export class DeepArrayRemovalNotSupported extends InvalidScimValueRemoval {
  constructor() {
    super('Array inside array values to remove not supported for now');
  }
}

export class UnsupportedBlueprintEntities extends InvalidScimValueRemoval {
  constructor() {
    super('Can`t remove item from non array like property');
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

export class NoTarget extends InvalidScimPatch {
 constructor(valuePath: string) {
   super(
     `Target location is a multi-valued attribute for which a value selection filter (${valuePath}) has been supplied and no record match was made.`,
     'noTarget'
   );
 }
}
