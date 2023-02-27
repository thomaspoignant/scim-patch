export type ScimPatchSchema = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
export type ScimId = string;
export type ScimSchema = string;

export type ScimPatchOperation = ScimPatchRemoveOperation | ScimPatchAddReplaceOperation;

// Object to represent a ScimResource
export interface ScimResource {
  id?: ScimId; // Optional cause during POST we don't have the id.
  readonly meta: ScimMeta;
  schemas: Array<ScimSchema>;
}

// Object to represent PATCH inputs (RFC-7644)
export interface ScimPatchRemoveOperation {
  // We accept value with capital letter to be compliant with AzureAD
  readonly op: 'remove' | 'Remove';
  readonly path: string;
  readonly value?: any;
}

export interface ScimPatchAddReplaceOperation {
  // We accept value with capital letter to be compliant with AzureAD
  readonly op: 'add' | 'Add' | 'replace' | 'Replace';
  readonly path?: string;
  readonly value?: any;
}

export interface ScimPatch {
  readonly schemas: Array<ScimPatchSchema>,
  readonly Operations: Array<ScimPatchOperation>
}

export interface ScimMeta {
  readonly created: Date;
  readonly lastModified: Date;
  readonly location?: string;
}

// NavigateOptions used to pass configuration to `navigate`
export interface NavigateOptions {
  // true for 'remove' operations, false otherwise
  isRemoveOp?: boolean;
}

// ScimPatchOptions is a set of options to change the way to perform your ScimPatch
export interface ScimPatchOptions {
  // if true, patches are applied to the original passed document
  // if false, a copy of the original document is obtained and patches are applied to it
  mutateDocument?: boolean
  // if true, missing attributes to be replaced will be treated as an ADD.
  treatMissingAsAdd?: boolean
}

// filterWithQueryOptions: options used while calling filterWithQuery
export interface FilterWithQueryOptions {
  // if true, excludes the elements that match the filter
  excludeIfMatchFilter?: boolean
}