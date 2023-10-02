export type ScimPatchSchema = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
export type ScimId = string;
export type ScimSchema = string;
export type ScimPatchOperation = ScimPatchRemoveOperation | ScimPatchAddReplaceOperation;
export interface ScimResource {
    id?: ScimId;
    readonly meta: ScimMeta;
    schemas: Array<ScimSchema>;
}
export interface ScimPatchRemoveOperation {
    readonly op: 'remove' | 'Remove';
    readonly path: string;
    readonly value?: any;
}
export interface ScimPatchAddReplaceOperation {
    readonly op: 'add' | 'Add' | 'replace' | 'Replace';
    readonly path?: string;
    readonly value?: any;
}
export interface ScimPatch {
    readonly schemas: Array<ScimPatchSchema>;
    readonly Operations: Array<ScimPatchOperation>;
}
export interface ScimMeta {
    readonly created: Date;
    readonly lastModified: Date;
    readonly location?: string;
}
export interface NavigateOptions {
    isRemoveOp?: boolean;
}
export interface ScimPatchOptions {
    mutateDocument?: boolean;
    treatMissingAsAdd?: boolean;
}
export interface FilterWithQueryOptions {
    excludeIfMatchFilter?: boolean;
}
