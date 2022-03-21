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

// filterWithQueryOptions: options used while calling filterWithQuery
export interface FilterWithQueryOptions {
  // if true, excludes the elements that match the filter
  excludeIfMatchFilter?: boolean
}
