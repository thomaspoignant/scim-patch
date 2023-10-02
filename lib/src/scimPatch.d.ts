import { ScimError, InvalidScimPatch, InvalidScimPatchOp, NoPathInScimPatchOp, InvalidScimPatchRequest, NoTarget, RemoveValueNestedArrayNotSupported, RemoveValueNotArray, InvalidScimRemoveValue } from './errors/scimErrors';
import { ScimPatchSchema, ScimId, ScimSchema, ScimPatchOperation, ScimPatchRemoveOperation, ScimPatchAddReplaceOperation, ScimPatch, ScimResource, ScimMeta, ScimPatchOptions } from './types/types';
export { ScimPatchSchema, ScimId, ScimSchema, ScimPatchOperation, ScimPatchRemoveOperation, ScimPatchAddReplaceOperation, ScimPatch, ScimResource, ScimMeta, ScimError, InvalidScimPatch, InvalidScimPatchOp, NoPathInScimPatchOp, InvalidScimPatchRequest, NoTarget, RemoveValueNestedArrayNotSupported, RemoveValueNotArray, InvalidScimRemoveValue };
export declare const PATCH_OPERATION_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
export declare function patchBodyValidation(body: ScimPatch): void;
export declare function scimPatch<T extends ScimResource>(scimResource: T, patchOperations: Array<ScimPatchOperation>, options?: ScimPatchOptions): T;
