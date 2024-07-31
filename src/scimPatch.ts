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
    FilterArrayTargetNotFound,
    InvalidRemoveOpPath
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
    ScimMeta,
    NavigateOptions,
    FilterWithQueryOptions,
    ScimPatchOptions,
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

    if (!Array.isArray(body.Operations))
        throw new InvalidScimPatchRequest('Operations should be an array.');

    if (!body.Operations || body.Operations.length <= 0)
        throw new InvalidScimPatchRequest('Missing operations.');

    body.Operations.forEach(validatePatchOperation);
}

/*
 * This method apply patch operations on a SCIM Resource.
 * @param scimResource The initial resource
 * @param patchOperations An array of SCIM patch operations we want to apply on the scimResource object.
 * @param options Options to customize some behaviour of scimPatch
 * @return the scimResource patched.
 * @throws {InvalidScimPatchOp} if the patch could not happen.
 */
export function scimPatch<T extends ScimResource>(scimResource: T, patchOperations: Array<ScimPatchOperation>,
                                                  options: ScimPatchOptions = {mutateDocument: true, treatMissingAsAdd: true}): T {
    if (!options.mutateDocument) {
        // Deeply clone the object.
        // https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
        scimResource = JSON.parse(JSON.stringify(scimResource));
    }

    return patchOperations.reduce((patchedResource, patch) => {
        switch (patch.op) {
            case 'remove':
            case 'Remove':
                return applyRemoveOperation(patchedResource, patch);
            case 'add':
            case 'Add':
            case 'replace':
            case 'Replace':
                return applyAddOrReplaceOperation(patchedResource, patch, !!options.treatMissingAsAdd);
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

    if (isAddOperation(operation.op) && !('value' in operation))
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
    let resources_scoped: Record<string, any>[];
    validatePatchOperation(patch);

    // Path is supposed to be set, there are a validation in the validateOperation function.
    const paths = resolvePaths(patch.path);

    try {
        resources_scoped = navigate(scimResource, paths, {isRemoveOp: true});
    } catch (error) {
        if (error instanceof InvalidRemoveOpPath) {
            return scimResource;
        }
        throw error;
    }

    // Dealing with the last element of the path.
    const lastSubPath = paths[paths.length - 1];

    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        // This is a mono valued property
        for (const resource of resources_scoped) {
            if (!patch.value) {
                // No value in the remove operation, we delete it.
                delete resource[lastSubPath];
            } else {
                // Value in the remove operation, we remove the children by value.
                resource[lastSubPath] = removeWithPatchValue(resource[lastSubPath], patch.value);
            }
        }
        return scimResource;
    }
    for (const resource of resources_scoped) {

        // The last element is an Array request.
        const {attrName, valuePath, array} = extractArray(lastSubPath, resource);

        // We keep only items who don't match the query if supplied.
        resource[attrName] = filterWithQuery<any>(array, valuePath, {excludeIfMatchFilter: true});

        // If the complex multi-valued attribute has no remaining records, the attribute SHALL be considered unassigned.
        if (resource[attrName].length === 0)
            delete resource[attrName];
    }

    return scimResource;
}


function applyAddOrReplaceOperation<T extends ScimResource>(scimResource: T, patch: ScimPatchAddReplaceOperation, treatMissingAsAdd: boolean): T {
    // We manipulate the object directly without knowing his property, that's why we use any.
    // let resource: Record<string, any> = scimResource;
    let resources_scoped: Record<string, any>[];
    validatePatchOperation(patch);

    if (!patch.path)
        return addOrReplaceAttribute(scimResource, patch);

    // We navigate till the second to last of the path.
    const paths = resolvePaths(patch.path);
    const lastSubPath = paths[paths.length - 1];

    try {
        resources_scoped = navigate(scimResource, paths);
    } catch(e) {
        if (e instanceof FilterOnEmptyArray || e instanceof FilterArrayTargetNotFound) {
            const resource: Record<string, any> = e.schema;
            // check issue https://github.com/thomaspoignant/scim-patch/issues/42 to see why we should add this
            const parsedPath = parse(e.valuePath);
            if (isAddOperation(patch.op) &&
              "compValue" in parsedPath &&
              parsedPath.compValue !== undefined &&
              parsedPath.op === "eq"
            ) {
                const result: any = {};
                result[parsedPath.attrPath] = parsedPath.compValue;
                result[lastSubPath] = addOrReplaceAttribute(undefined, patch, true);
                resource[e.attrName] = [...(resource[e.attrName] ?? []), result];
                return scimResource;
            } else if (
              treatMissingAsAdd &&
              isReplaceOperation(patch.op) &&
              "compValue" in parsedPath &&
              parsedPath.compValue !== undefined &&
              parsedPath.op === "eq"
            ) {
              // If the target location path specifies an attribute that does not
              // exist, the service provider SHALL treat the operation as an "add".
              return applyAddOrReplaceOperation(
                scimResource,
                { ...patch, op: "add" },
                false
              );
            }
            throw new NoTarget(patch.path);
        }
        throw e;
    }
    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        for (const resource of resources_scoped) {
            resource[lastSubPath] = addOrReplaceAttribute(resource[lastSubPath], patch);
        }
        return scimResource;   
    }

    

    // The last element is an Array request.
    for (const resource of resources_scoped) {
        
        const {valuePath, array} = extractArray(lastSubPath, resource);

        // Get the list of items who are successful for the search query.
        const matchFilter = filterWithQuery<any>(array, valuePath);

        // If the target location is a multi-valued attribute for which a value selection filter ("valuePath") has been
        // supplied and no record match was made, the service provider SHALL indicate failure by returning HTTP status
        // code 400 and a "scimType" error code of "noTarget".
        if (isReplaceOperation(patch.op) && matchFilter.length === 0) {
            throw new NoTarget(patch.path);
        }
        for (let i = 0; i < array.length; i++) {
            // We are sure to find at least one index because matchFilter comes from array.
            if(matchFilter.includes(array[i])){
                array[i] = addOrReplaceAttribute(array[i], patch);
            }
        }
    }

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
 * @param options options used while calling navigate
 * @return the parent object of the element we want to edit
 */
function navigate(inputSchema: any, paths: string[], options: NavigateOptions = {}): Record<string, unknown>[] {
    let schemas: any[] = [inputSchema];
    for (let i = 0; i < paths.length - 1; i++) {
        const subPath = paths[i];

        // We check if the element is an array with query (ex: emails[primary eq true).
        if (IS_ARRAY_SEARCH.test(subPath)) {           
            schemas = schemas.flatMap((schema)=>{ 
                try {
                    const {attrName, valuePath, array} = extractArray(subPath, schema);
                    // Get the item who is successful for the search query.
                    const matchFilter = filterWithQuery<any>(array, valuePath);
                    if (matchFilter.length === 0) {
                        throw new FilterArrayTargetNotFound('A matching array entry was not found using the supplied filter.', attrName, valuePath, schema);
                    }
                    return matchFilter;
                } catch (error) {
                    /*
                        FIXME In some edge cases, not fully compliant with SCIM, this can prematurely throw en error
                        For example if we have a structure with multiValued complex
                        attribute inside of a multiValued complex attribute, in
                        this case this throw even if only a "branch" of the search fail.
                    */
                    if(error instanceof FilterOnEmptyArray){
                        error.schema = schema;
                    }
                    throw error;
                }
            });
        } else {
            schemas = schemas.flatMap((schema)=>{
                if (!schema[subPath] && options.isRemoveOp)
                    throw new InvalidRemoveOpPath();

                return schema[subPath] || (schema[subPath] = {});
            });
        }
    }
    return schemas;
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
            if (isAddOperation(patch.op)) {
                const valuesToAdd = patch.value.filter(item => !deepIncludes(property, item));
                return property.concat(valuesToAdd);
            }
            // else this is a replace operation
            return patch.value;
        }

        if(isReplaceOperation(patch.op)){
            return property.map( 
                (it) => addOrReplaceAttribute(it,patch,multiValuedPathFilter)
            );
        }
        const a = property;
        if (!deepIncludes(a, patch.value))
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
        if (isAddOperation(patch.op) && !multiValuedPathFilter)
            throw new InvalidScimPatchOp('Invalid patch query.');

        return patch.value;
    }

    // We add all the patch values to the property object.
    for (const [key, value] of Object.entries(patch.value)) {
        assign(property, resolvePaths(key), value, patch.op);
    }
    return property;
}

/**
 * assign is taking an array of key and add the associated nested object.
 * @param obj the object where we should the key
 * @param keyPath an array which represent the path of the nested object
 * @param value value to assign
 * @param op patch operation
 */
function assign(obj:any, keyPath:Array<string>, value:any, op: string) {
    const lastKeyIndex = keyPath.length-1;
    for (let i = 0; i < lastKeyIndex; ++ i) {
        const key = keyPath[i];
        if (!(key in obj)){
            obj[key] = {};
        }
        obj = obj[key];
    }

    // If the attribute is an array and the operation is "add",
    // then the value should be added to the array
    const attribute = obj[keyPath[lastKeyIndex]];
    if (isAddOperation(op) && Array.isArray(attribute)) {
        // If the value is also an array, append all values of the array to the attribute
        if (Array.isArray(value)) {
            obj[keyPath[lastKeyIndex]] = [...attribute, ...value];
            return;
        }

        // If value is not an array, simply append it as a whole to end of attribute
        obj[keyPath[lastKeyIndex]] = [...attribute, value];
        return;
    }
    obj[keyPath[lastKeyIndex]] = value;
}

/**
 * Return the items in the array who match the filter.
 * @param arr the collection where we are searching.
 * @param querySearch the search request.
 * @param options options used while calling filterWithQuery
 * @return an array who contains the search results.
 */
function filterWithQuery<T>(arr: Array<T>, querySearch: string,
                            options: FilterWithQueryOptions = ({} as FilterWithQueryOptions)): Array<T> {
    try {
        const f = filter(parse(querySearch));
        return arr.filter(e => options.excludeIfMatchFilter ? !f(e) : f(e));
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

/**
 * deepIncludes has similar behaviour as Array.prototype.includes,
 * just that instead of === for equality check, it uses deepEqual library
 * @param array the array on which inclusion check has to be performed
 * @param item the item whose inclusion has to be checked
 * @returns true if the item is present, else false
 */
function deepIncludes(array: any[], item: any): boolean {
    return array.some(el => deepEqual(item, el));
}

function isValidOperation(operation: string): boolean {
    return AUTHORIZED_OPERATION.includes(operation.toLowerCase());
}

/**
 * isAddOperation check if the operation is an ADD
 * @param operation the name of the SCIM Patch operation
 * @return true if this is an add operation
 */
function isAddOperation(operation: string): boolean {
    return operation !== undefined && operation.toLowerCase() === 'add';
}

/**
 * isReplaceOperation check if the operation is an REPACE
 * @param operation the name of the SCIM Patch operation
 * @return true if this is a replace operation
 */
function isReplaceOperation(operation: string): boolean {
    return operation !== undefined && operation.toLowerCase() === 'replace';
}

class ScimSearchQuery {
    constructor(
      readonly attrName: string,
      readonly valuePath: string,
      readonly array: Array<any>
    ) {
    }
}
