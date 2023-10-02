export declare abstract class ScimError extends Error {
    readonly scimCode?: string;
    protected constructor(scimCode?: string);
}
export declare abstract class InvalidScimPatch extends ScimError {
    protected constructor(message: string, scimCode?: string);
}
export declare abstract class InvalidScimRemoveValue extends ScimError {
    protected constructor(message: string, scimCode?: string);
}
export declare class RemoveValueNestedArrayNotSupported extends InvalidScimRemoveValue {
    constructor();
}
export declare class RemoveValueNotArray extends InvalidScimRemoveValue {
    constructor();
}
export declare class InvalidScimPatchOp extends InvalidScimPatch {
    constructor(message: string);
}
export declare class FilterOnEmptyArray extends InvalidScimPatchOp {
    schema: any;
    attrName: string;
    valuePath: string;
    constructor(message: string, attrName: string, valuePath: string);
}
export declare class FilterArrayTargetNotFound extends InvalidScimPatchOp {
    schema: any;
    attrName: string;
    valuePath: string;
    constructor(message: string, attrName: string, valuePath: string, schema?: any);
}
export declare class NoPathInScimPatchOp extends InvalidScimPatch {
    constructor();
}
export declare class InvalidScimPatchRequest extends InvalidScimPatch {
    constructor(message: string);
}
export declare class NoTarget extends InvalidScimPatch {
    constructor(valuePath: string);
}
export declare class InvalidRemoveOpPath extends InvalidScimPatch {
    constructor();
}
