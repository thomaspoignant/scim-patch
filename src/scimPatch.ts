import {
    ScimError,
    InvalidScimPatch,
    InvalidScimPatchOp,
    NoPathInScimPatchOp,
    InvalidScimPatchRequest,
    NoTarget,
    RemoveValueNestedArrayNotSupported,
    RemoveValueNotArray,
    InvalidScimRemoveValue,
    FilterOnEmptyArray,
    FilterArrayTargetNotFound
} from './errors/scimErrors';
import {
    ScimPatchSchema,
    ScimId,
    ScimSchema,
    ScimPatchOperation,
    ScimPatchRemoveOperation,
    ScimPatchAddReplaceOperation,
    ScimPatch,
    ScimResource,
    ScimMeta
} from './types/types';
import {parse, filter} from 'scim2-parse-filter';
import deepEqual = require('fast-deep-equal');

/*
 * Export types
 */
export {
    ScimPatchSchema,
    ScimId,
    ScimSchema,
    ScimPatchOperation,
    ScimPatchRemoveOperation,
    ScimPatchAddReplaceOperation,
    ScimPatch,
    ScimResource,
    ScimMeta,
    ScimError,
    InvalidScimPatch,
    InvalidScimPatchOp,
    NoPathInScimPatchOp,
    InvalidScimPatchRequest,
    NoTarget,
    RemoveValueNestedArrayNotSupported,
    RemoveValueNotArray,
    InvalidScimRemoveValue
};
/*
 * This file implement the SCIM PATCH specification.
 * RFC : https://tools.ietf.org/html/rfc7644#section-3.5.2
 * It allow to apply some patch on an existing SCIM resource.
 */
// Regex to check if this is search into array request.
const IS_ARRAY_SEARCH = /(\[|\])/;
// Regex to extract key and search request (ex: emails[primary eq true).
const ARRAY_SEARCH = /^(.+)\[(.+)\]$/;
// Split path on periods
const SPLIT_PERIOD = /(?!\B"[^[]*)\.(?![^\]]*"\B)/g;
// Valid patch operation, value needs to be in lowercase here.
const AUTHORIZED_OPERATION = ['remove', 'add', 'replace'];

const CORE_SCHEMA_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const CORE_SCHEMA_GROUP = 'urn:ietf:params:scim:schemas:core:2.0:Group';

export const PATCH_OPERATION_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
/*
 * PatchBodyValidation validate if the request body of the SCIM Patch is valid.
 * If the body is not valid the function throw an error.
 * @param body data from the patch request.
 * @throws {InvalidScimPatchRequest} if one operation is not valid.
 * @throws {NoPathInScimPatchOp} if one operation is a remove with no path.
 */
export function patchBodyValidation(body: ScimPatch): void {
    if (!body.schemas || !body.schemas.includes(PATCH_OPERATION_SCHEMA))
        throw new InvalidScimPatchRequest('Missing schemas.');

    if (!body.Operations || body.Operations.length <= 0)
        throw new InvalidScimPatchRequest('Missing operations.');

    body.Operations.forEach(validatePatchOperation);
}

/*
 * This method apply patch operations on a SCIM Resource.
 * @param scimResource The initial resource
 * @param patchOperations An array of SCIM patch operations we want to apply on the scimResource object.
 * @return the scimResource patched.
 * @throws {InvalidScimPatchOp} if the patch could not happen.
 */
export function scimPatch<T extends ScimResource>(scimResource: T, patchOperations: Array<ScimPatchOperation>): T {
    return patchOperations.reduce((patchedResource, patch) => {
        switch (patch.op) {
            case 'remove':
            case 'Remove':
                return applyRemoveOperation(patchedResource, patch);
            case 'add':
            case 'Add':
            case 'replace':
            case 'Replace':
                return applyAddOrReplaceOperation(patchedResource, patch);
            default:
                throw new InvalidScimPatchRequest(`Operator is invalid for SCIM patch request. ${patch}`);
        }
    }, scimResource);
}

/*
 * validateOperation is validating that the SCIM Patch Operation follow the RFC.
 * If not, the function throw an Error.
 * @param operation The SCIM operation we want to check.
 * @throws {InvalidScimPatchRequest} if the operation is not valid.
 * @throws {NoPathInScimPatchOp} if the operation is a remove with no path.
 */
function validatePatchOperation(operation: ScimPatchOperation): void {
    if (typeof operation.op !== 'string' || !isValidOperation(operation.op))
        throw new InvalidScimPatchRequest(`Invalid op "${operation.op}" in the request.`);

    if (operation.op === 'remove' && !operation.path)
        throw new NoPathInScimPatchOp();

    if (operation.op.toLowerCase() === 'add' && !('value' in operation))
        throw new InvalidScimPatchRequest(`The operation ${operation.op} MUST contain a "value" member whose content specifies the value to be added`);

    if (operation.path && typeof operation.path !== 'string')
        throw new InvalidScimPatchRequest('Path is supposed to be a string');
}

function resolvePaths(path: string): string[] {
    const uriIndex = path.lastIndexOf(':');

    if (uriIndex < 0) {
        // No schema prefix - this is a core schema path
        return path.split(SPLIT_PERIOD);
    }

    const schemaUri = path.substring(0, uriIndex);
    const paths = path.substring(uriIndex +1).split(SPLIT_PERIOD);
    switch(schemaUri) {
        case CORE_SCHEMA_GROUP:
        case CORE_SCHEMA_USER:
            // Ignore core schema URIs in paths.  These are allowed but not part of object keys
            break;
        default:
            // Assume any other provided schema URI is an extension
            paths.unshift(schemaUri);
            break;
    }
    return paths;
}

function applyRemoveOperation<T extends ScimResource>(scimResource: T, patch: ScimPatchRemoveOperation): T {
    // We manipulate the object directly without knowing his property, that's why we use any.
    let resource: Record<string, any> = scimResource;
    validatePatchOperation(patch);

    // Path is supposed to be set, there are a validation in the validateOperation function.
    const paths = resolvePaths(patch.path);
    resource = navigate(resource, paths, true);

    // The path didn't exist, hence can return back the original resource untouched
    if (!resource) {
        return scimResource;
    }

    // Dealing with the last element of the path.
    const lastSubPath = paths[paths.length - 1];

    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        // This is a mono valued property
        if (!patch.value) {
            // No value in the remove operation, we delete it.
            delete resource[lastSubPath];
            return scimResource;
        }

        // Value in the remove operation, we remove the children by value.
        resource[lastSubPath] = removeWithPatchValue(resource[lastSubPath], patch.value);
        return scimResource;
    }

    // The last element is an Array request.
    const {attrName, valuePath, array} = extractArray(lastSubPath, resource);

    // We keep only items who don't match the query if supplied.
    resource[attrName] = array.filter((e: any) => !filterWithQuery<any>(array, valuePath).includes(e));

    // If the complex multi-valued attribute has no remaining records, the attribute SHALL be considered unassigned.
    if (resource[attrName].length === 0)
        delete resource[attrName];

    return scimResource;
}


function applyAddOrReplaceOperation<T extends ScimResource>(scimResource: T, patch: ScimPatchAddReplaceOperation): T {
    // We manipulate the object directly without knowing his property, that's why we use any.
    let resource: Record<string, any> = scimResource;
    validatePatchOperation(patch);

    if (!patch.path)
        return addOrReplaceAttribute(scimResource, patch);

    // We navigate till the second to last of the path.
    const paths = resolvePaths(patch.path);
    const lastSubPath = paths[paths.length - 1];

    try {
        resource = navigate(resource, paths, false);
    } catch(e) {
        if (e instanceof FilterOnEmptyArray || e instanceof FilterArrayTargetNotFound) {
            resource = e.schema;
            // check issue https://github.com/thomaspoignant/scim-patch/issues/42 to see why we should add this
            const parsedPath = parse(e.valuePath);
            if (patch.op.toLowerCase() === "add" &&
              "compValue" in parsedPath &&
              parsedPath.compValue !== undefined &&
              parsedPath.op === "eq"
            ) {
                const result: any = {};
                result[parsedPath.attrPath] = parsedPath.compValue;
                result[lastSubPath] = addOrReplaceAttribute(resource, patch, true);
                resource[e.attrName] = [...(resource[e.attrName] ?? []), result];
                return scimResource;
            }
            throw new NoTarget(patch.path);
        }
        throw e;
    }

    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        resource[lastSubPath] = addOrReplaceAttribute(resource[lastSubPath], patch);
        return scimResource;
    }

    // The last element is an Array request.
    const {valuePath, array} = extractArray(lastSubPath, resource);

    // Get the list of items who are successful for the search query.
    const matchFilter = filterWithQuery<any>(array, valuePath);

    // If the target location is a multi-valued attribute for which a value selection filter ("valuePath") has been
    // supplied and no record match was made, the service provider SHALL indicate failure by returning HTTP status
    // code 400 and a "scimType" error code of "noTarget".
    const isReplace = patch.op.toLowerCase() === 'replace';
    if (isReplace && matchFilter.length === 0) {
        throw new NoTarget(patch.path);
    }

    // We are sure to find an index because matchFilter comes from array.
    const index = array.findIndex(item => matchFilter.includes(item));
    array[index] = addOrReplaceAttribute(array[index], patch);

    return scimResource;
}

/**
 * extractArray extract the valuePath (ex: email[primary eq true]) of a subPath
 * @param subPath The key we want to extract.
 * @param schema The object which is supposed to contains the array.
 * @return an array with the array name and the filter path.
 */
function extractArray(subPath: string, schema: any): ScimSearchQuery {
    // We extract the key of the table and what is inside [].
    const matchRequest = subPath.match(ARRAY_SEARCH);
    if (!matchRequest)
        throw new InvalidScimPatchOp(`This part of the path ${subPath} is invalid for SCIM patch request.`);

    const [, attrName, valuePath] = matchRequest;
    const element = schema[attrName];

    if (!Array.isArray(element))
        throw new FilterOnEmptyArray('Impossible to search on a mono valued attribute.', attrName, valuePath);

    return new ScimSearchQuery(attrName, valuePath, element);
}

/**
 * navigate allow to get the sub object who want to edit with the patch operation.
 * @param inputSchema the initial ScimResource
 * @param paths an Array who contains the path of the sub object
 * @param isRemoveOp a flag that tells whether the operation that invoked is remove or not
 * @return the parent object of the element we want to edit
 */
function navigate(inputSchema: any, paths: string[], isRemoveOp: boolean): any {
    let schema = inputSchema;
    for (let i = 0; i < paths.length - 1; i++) {
        const subPath = paths[i];

        // We check if the element is an array with query (ex: emails[primary eq true).
        if (IS_ARRAY_SEARCH.test(subPath)) {
            try {
                const {attrName, valuePath, array} = extractArray(subPath, schema);
                // Get the item who is successful for the search query.
                const matchFilter = filterWithQuery<any>(array, valuePath);
                // We are sure to find an index because matchFilter comes from array.
                const index = array.findIndex(item => matchFilter.includes(item));
                if (index < 0) {
                    throw new FilterArrayTargetNotFound('A matching array entry was not found using the supplied filter.', attrName, valuePath, schema);
                }
                schema = array[index];
            } catch (error) {
                if(error instanceof FilterOnEmptyArray){
                    error.schema = schema;
                }
                throw error;
            }
        } else {
            // The element is not an array.
            switch (true) {
                // If its a remove operation & the path doesn't exist,
                // then there's no need to navigate further, can exit early
                case !schema[subPath] && isRemoveOp:
                    return false;
                case !schema[subPath] && !isRemoveOp:
                    schema[subPath] = {};
            }
            schema = schema[subPath];
        }
    }
    return schema;
}

/**
 * Add or Replace a property in the ScimResource
 * @param property The property we want to replace
 * @param patch The patch operation
 * @param multiValuedPathFilter True if thi is a multivalued path filter query
 * @return the patched property
 */
function addOrReplaceAttribute(property: any, patch: ScimPatchAddReplaceOperation, multiValuedPathFilter?: boolean): any {
    if (Array.isArray(property)) {
        if (Array.isArray(patch.value)) {
            // if we're adding an array, we need to remove duplicated values from existing array
            if (patch.op.toLowerCase() === "add") {
                const valuesToAdd = patch.value.filter(item => !property.includes(item));
                return property.concat(valuesToAdd);
            }
            // else this is a replace operation
            return patch.value;
        }

        const a = property;
        if (!a.includes(patch.value))
            a.push(patch.value);
        return a;
    }

    if (property !== null && typeof property === 'object') {
        return addOrReplaceObjectAttribute(property, patch, multiValuedPathFilter);
    }

    // If the target location specifies a single-valued attribute, the existing value is replaced.
    return patch.value;
}

/**
 * addOrReplaceObjectAttribute will add an attribute if it is an object
 * @param property The property we want to replace
 * @param patch The patch operation
 * @param multiValuedPathFilter True if thi is a multivalued path filter query
 */
function addOrReplaceObjectAttribute(property: any, patch: ScimPatchAddReplaceOperation, multiValuedPathFilter?: boolean): any {
    if (typeof patch.value !== 'object') {
        if (patch.op.toLowerCase() === 'add' && !multiValuedPathFilter)
            throw new InvalidScimPatchOp('Invalid patch query.');

        return patch.value;
    }

    // We add all the patch values to the property object.
    for (const [key, value] of Object.entries(patch.value)) {
        assign(property, resolvePaths(key), value);
    }
    return property;
}

/**
 * assign is taking an array of key and add the associated nested object.
 * @param obj the object where we should the key
 * @param keyPath an array which represent the path of the nested object
 * @param value value to assign
 */
function assign(obj:any, keyPath:Array<string>, value:any) {
    const lastKeyIndex = keyPath.length-1;
    for (let i = 0; i < lastKeyIndex; ++ i) {
        const key = keyPath[i];
        if (!(key in obj)){
            obj[key] = {};
        }
        obj = obj[key];
    }
    obj[keyPath[lastKeyIndex]] = value;
}

/**
 * Return the items in the array who match the filter.
 * @param arr the collection where we are searching.
 * @param querySearch the search request.
 * @return an array who contains the search results.
 */
function filterWithQuery<T>(arr: Array<T>, querySearch: string): Array<T> {
    try {
        return arr.filter(filter(parse(querySearch)));
    } catch (error) {
        throw new InvalidScimPatchOp(`${error}`);
    }
}

/**
 * Return the array without items supplied in .
 * @param arr the collection where we are searching.
 * @param itemsToRemove array with items to remove from original.
 * @return an array which contains the search results.
 */
function removeWithPatchValue<T>(arr: Array<T>, itemsToRemove: Array<T> | Record<string, any> | string | number): T[] {
    if (!Array.isArray(arr))
        throw new RemoveValueNotArray();

    // patch value is a single item, we remove from the array all the similar items.
    if (!Array.isArray(itemsToRemove))
        return arr.filter(item => !deepEqual(itemsToRemove, item));

    // Sometimes the patch value is an array (this is how it works with one-login, ex: [{"test":true}])
    // We iterate on all the values in the array to delete them all.
    itemsToRemove.forEach(toRemove => {
       if (Array.isArray(toRemove))
           throw new RemoveValueNestedArrayNotSupported();

       arr = arr.filter(item => !deepEqual(toRemove, item));
    });

    return arr;
}

function isValidOperation(operation: string): boolean {
    return AUTHORIZED_OPERATION.includes(operation.toLowerCase());
}

class ScimSearchQuery {
    constructor(
      readonly attrName: string,
      readonly valuePath: string,
      readonly array: Array<any>
    ) {
    }
}
