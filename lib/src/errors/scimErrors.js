"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRemoveOpPath = exports.NoTarget = exports.InvalidScimPatchRequest = exports.NoPathInScimPatchOp = exports.FilterArrayTargetNotFound = exports.FilterOnEmptyArray = exports.InvalidScimPatchOp = exports.RemoveValueNotArray = exports.RemoveValueNestedArrayNotSupported = exports.InvalidScimRemoveValue = exports.InvalidScimPatch = exports.ScimError = void 0;
class ScimError extends Error {
    constructor(scimCode) {
        super();
        this.scimCode = scimCode;
    }
}
exports.ScimError = ScimError;
class InvalidScimPatch extends ScimError {
    constructor(message, scimCode = 'invalidSyntax') {
        super(scimCode);
        this.message = `Invalid SCIM Patch: ${message}`;
    }
}
exports.InvalidScimPatch = InvalidScimPatch;
class InvalidScimRemoveValue extends ScimError {
    constructor(message, scimCode = 'invalidSyntax') {
        super(scimCode);
        this.message = `Invalid SCIM Remove Operation: ${message}`;
    }
}
exports.InvalidScimRemoveValue = InvalidScimRemoveValue;
class RemoveValueNestedArrayNotSupported extends InvalidScimRemoveValue {
    constructor() {
        super('Invalid patch value, remove does not support arrays inside arrays.');
    }
}
exports.RemoveValueNestedArrayNotSupported = RemoveValueNestedArrayNotSupported;
class RemoveValueNotArray extends InvalidScimRemoveValue {
    constructor() {
        super('Remove with patch value is supported only for array properties.');
    }
}
exports.RemoveValueNotArray = RemoveValueNotArray;
class InvalidScimPatchOp extends InvalidScimPatch {
    constructor(message) {
        super(`${message}`, 'invalidSyntax');
    }
}
exports.InvalidScimPatchOp = InvalidScimPatchOp;
class FilterOnEmptyArray extends InvalidScimPatchOp {
    constructor(message, attrName, valuePath) {
        super(`${message}`);
        this.attrName = attrName;
        this.valuePath = valuePath;
    }
}
exports.FilterOnEmptyArray = FilterOnEmptyArray;
class FilterArrayTargetNotFound extends InvalidScimPatchOp {
    constructor(message, attrName, valuePath, schema) {
        super(`${message}`);
        this.attrName = attrName;
        this.valuePath = valuePath;
        this.schema = schema;
    }
}
exports.FilterArrayTargetNotFound = FilterArrayTargetNotFound;
class NoPathInScimPatchOp extends InvalidScimPatch {
    constructor() {
        super('Missing path in "remove" patch operation', 'noTarget');
    }
}
exports.NoPathInScimPatchOp = NoPathInScimPatchOp;
class InvalidScimPatchRequest extends InvalidScimPatch {
    constructor(message) {
        super(`The SCIM patch request is invalid: ${message}`);
    }
}
exports.InvalidScimPatchRequest = InvalidScimPatchRequest;
class NoTarget extends InvalidScimPatch {
    constructor(valuePath) {
        super(`Target location is a multi-valued attribute for which a value selection filter (${valuePath}) has been supplied and no record match was made.`, 'noTarget');
    }
}
exports.NoTarget = NoTarget;
class InvalidRemoveOpPath extends InvalidScimPatch {
    constructor() {
        super(`Path specified in 'remove' operation doesn't exist`);
    }
}
exports.InvalidRemoveOpPath = InvalidRemoveOpPath;
//# sourceMappingURL=scimErrors.js.map