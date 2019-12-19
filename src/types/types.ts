export type ScimPatchSchema = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
export type ScimId = string;
export type ScimSchema = string;

export type ScimPatchOperation = ScimPatchRemoveOperation | ScimPatchAddReplaceOperation;

// Object to represent PATCH inputs (RFC-7644)
export interface ScimPatchRemoveOperation {
  readonly op: 'remove';
  readonly path: string;
}

export interface ScimPatchAddReplaceOperation {
  readonly op: 'add' | 'replace';
  readonly path?: string;
  readonly value?: any;
}

export interface ScimPatch {
  readonly schemas: Array<ScimPatchSchema>,
  readonly Operations: Array<ScimPatchOperation>
}

export interface ScimResource {
  id?: ScimId; // Optional cause during POST we don't have the id.
  readonly meta: ScimMeta;
  schemas: Array<ScimSchema>;
}

export interface ScimMeta {
  readonly created: Date;
  readonly lastModified: Date;
  readonly location?: string;
}
