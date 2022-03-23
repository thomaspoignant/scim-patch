export abstract class ScimError extends Error {
  readonly scimCode?: string;

  protected constructor(scimCode?: string) {
    super();
    this.scimCode = scimCode;
  }
}

export abstract class InvalidScimPatch extends ScimError {
  protected constructor(message: string, scimCode = 'invalidSyntax') {
    super(scimCode);
    this.message = `Invalid SCIM Patch: ${message}`;
  }
}

export abstract class InvalidScimRemoveValue extends ScimError {
  protected constructor(message: string, scimCode = 'invalidSyntax') {
    super(scimCode);
    this.message = `Invalid SCIM Remove Operation: ${message}`;
  }
}

export class RemoveValueNestedArrayNotSupported extends InvalidScimRemoveValue {
  constructor() {
    super('Invalid patch value, remove does not support arrays inside arrays.');
  }
}

export class RemoveValueNotArray extends InvalidScimRemoveValue {
  constructor() {
    super('Remove with patch value is supported only for array properties.');
  }
}
export class InvalidScimPatchOp extends InvalidScimPatch {
  constructor(message: string) {
    super(`${message}`, 'invalidSyntax');
  }
}

export class FilterOnEmptyArray extends InvalidScimPatchOp {
  schema: any;
  attrName: string;
  valuePath: string;

  constructor(message: string, attrName: string, valuePath: string) {
    super(`${message}`);
    this.attrName = attrName;
    this.valuePath = valuePath;
  }
}

export class FilterArrayTargetNotFound extends InvalidScimPatchOp {
  schema: any;
  attrName: string;
  valuePath: string;

  constructor(message: string, attrName: string, valuePath: string, schema?: any) {
    super(`${message}`);
    this.attrName = attrName;
    this.valuePath = valuePath;
    this.schema = schema;
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

export class InvalidRemoveOpPath extends InvalidScimPatch {
  constructor() {
    super(`Path specified in 'remove' operation doesn't exist`);
  }
}