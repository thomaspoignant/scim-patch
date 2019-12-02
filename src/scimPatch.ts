import {
    ScimError,
    InvalidScimFilterError,
    InvalidScimSortError,
    InvalidScimPatch,
    InvalidScimPatchOp,
    NoPathInScimPatchOp,
    InvalidScimPatchRequest,
    InvalidScimPatchRemoveMandatory,
    UnknownScimError
} from './errors/scimErrors';
import {ScimResource, ScimPatch, ScimPatchOperation} from './types/types';
import {parse, filter} from 'scim2-parse-filter';

/*
 * Export types
 */
export {
    ScimResource,
    ScimPatch,
    ScimPatchOperation,
    ScimError,
    InvalidScimFilterError,
    InvalidScimSortError,
    InvalidScimPatch,
    InvalidScimPatchOp,
    NoPathInScimPatchOp,
    InvalidScimPatchRequest,
    InvalidScimPatchRemoveMandatory,
    UnknownScimError};
/*
 * This file implement the SCIM PATCH specification.
 * RFC : https://tools.ietf.org/html/rfc7644#section-3.5.2
 * It allow to apply some patch on an existing SCIM resource.
 */

// Regex to check if this is search into array request.
const IS_ARRAY_SEARCH = /(\[|\])/;
// Regex to extract key and search request (ex: emails[primary eq true).
const ARRAY_SEARCH: RegExp = /^(.+)\[(.+)\]$/;

const AUTHORIZED_OPERATION: Array<String> = [
    'remove',
    'add',
    'replace'
];

/*
 * PatchBodyValidation validate if the request body of the SCIM Patch is valid.
 * If the body is not valid the function throw an error.
 * @Param body data from the patch request.
 * @throws {InvalidScimPatchRequest} if one operation is not valid.
 * @throws {NoPathInScimPatchOp} if one operation is a remove with no path.
 */
export function patchBodyValidation(body: ScimPatch): void {
    const patchOpSchema = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
    if (!body.schemas || !body.schemas.includes(patchOpSchema))
        throw new InvalidScimPatchRequest('Missing schemas.');

    if (!body.Operations || body.Operations.length <= 0)
        throw new InvalidScimPatchRequest('Missing operations.');

    body.Operations.forEach((operation: ScimPatchOperation) => validateOperation(operation));
}

/*
 * validateOperation is validating that the SCIM Patch Operation follow the RFC.
 * If not, the function throw an Error.
 * @Param operation The SCIM operation we want to check.
 * @throws {InvalidScimPatchRequest} if the operation is not valid.
 * @throws {NoPathInScimPatchOp} if the operation is a remove with no path.
 */
function validateOperation(operation: ScimPatchOperation): void {
    if (!operation.op || Array.isArray(operation.op) || !AUTHORIZED_OPERATION.includes(operation.op))
        throw new InvalidScimPatchRequest(`Invalid op "${operation.op}" in the request.`);

    if (operation.op === 'remove' && !operation.path)
        throw new NoPathInScimPatchOp();

    if (operation.op === 'add' && !operation.value)
        throw new InvalidScimPatchRequest(`The operation ${operation.op} MUST contain a "value" member whose content specifies the value to be added`);

    if (operation.path && typeof operation.path !== 'string')
        throw new InvalidScimPatchRequest('Path is supposed to be a string');
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
        validateOperation(patch);
        switch (patch.op) {
            case 'add':
                return applyAddOperation(patchedResource, patch);
            case 'remove':
                return applyRemoveOperation(patchedResource, patch);
            case 'replace':
                return applyReplaceOperation(patchedResource, patch);
            default:
                throw new InvalidScimPatchOp(`Operator "${patch.op}" is invalid for SCIM patch request.`);
        }
    }, scimResource);
}

function applyAddOperation<T extends ScimResource>(scimResource: T, patch: ScimPatchOperation): T {
    // We manipulate the object directly without knowing his property, that's why we use any.
    let schema: any = scimResource;

    validateOperation(patch);

    if (!patch.path)
        return applyPatchNoPath(scimResource, patch);

    // We navigate till the second to last of the path.
    const pList = patch.path.split('.');
    schema = navigate(schema, pList);

    // Dealing with the last element of the path.
    const lastSubPath = pList[pList.length - 1];

    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        // If the target location specifies a multi-valued attribute, a new value is added to the attribute.
        if (Array.isArray(schema[pList[pList.length - 1]])) {
            const a: Array<any> = schema[pList[pList.length - 1]];
            if (!a.includes(patch.value))
                a.push(patch.value);
            return scimResource;
        }

        // If the target location specifies a single-valued attribute, the existing value is replaced.
        schema[pList[pList.length - 1]] = patch.value;
        return scimResource;
    }

    // The last element is an Array request.
    const matchRequest = extractValuePath(lastSubPath);
    const arr = schema[matchRequest[1]];
    let matchFilter;
    try {
        const f = filter(parse(matchRequest[2]));
        matchFilter = arr.filter(f);
    } catch (error) {
        throw new InvalidScimPatchOp(error);
    }

    // We are going backward to don't have any problems when adding things in the array
    for (let i = arr.length - 1; matchFilter.length > 0 && i >= 0; i--)
        if (matchFilter.includes(arr[i])) {
            if (typeof patch.value !== 'object')
                throw new InvalidScimPatchOp(`Invalid value for patch query "${patch.value}".`);
            arr[i] = {...arr[i], ...patch.value};
        }

    // We remove all the empty item (<1 empty item>) from the array.
    schema[matchRequest[1]] = arr.filter((e: any) => e);
    return scimResource;
}

function applyRemoveOperation<T extends ScimResource>(scimResource: T, patch: ScimPatchOperation): T {
    // We manipulate the object directly without knowing his property, that's why we use any.
    let schema: any = scimResource;

    validateOperation(patch);

    // Path is supposed to be set, there are a validation in the validateOperation function.
    const pList = patch.path?.split('.') || [];

    // We navigate till the second to last of the path.
    schema = navigate(schema, pList);

    // Dealing with the last element of the path.
    const lastSubPath = pList[pList.length - 1];

    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        delete schema[pList[pList.length - 1]];
        return scimResource;
    }

    // The last element is an Array request.
    const matchRequest = extractValuePath(lastSubPath);
    const arr = schema[matchRequest[1]];
    let matchFilter;
    try {
        const f = filter(parse(matchRequest[2]));
        matchFilter = arr.filter(f);
    } catch (error) {
        throw new InvalidScimPatchOp(error);
    }

    // We are going backward to don't have any problems when adding things in the array
    for (let i = arr.length - 1; matchFilter.length > 0 && i >= 0; i--)
        if (matchFilter.includes(arr[i]))
            delete arr[i];

    // We remove all the empty item (<1 empty item>) from the array.
    schema[matchRequest[1]] = arr.filter((e: any) => e);

    // If the complex multi-valued attribute has no remaining records, the attribute SHALL be considered unassigned.
    if (schema[matchRequest[1]].length === 0)
        delete schema[matchRequest[1]];

    return scimResource;
}

function applyReplaceOperation<T extends ScimResource>(scimResource: T, patch: ScimPatchOperation): T {
    // We manipulate the object directly without knowing his property, that's why we use any.
    let schema: any = scimResource;

    validateOperation(patch);

    if (!patch.path)
        return applyPatchNoPath(scimResource, patch);

    // We navigate till the second to last of the path.
    const pList = patch.path.split('.');
    schema = navigate(schema, pList);

    // Dealing with the last element of the path.
    const lastSubPath = pList[pList.length - 1];

    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        delete schema[pList[pList.length - 1]];
        schema[pList[pList.length - 1]] = patch.value;
        return scimResource;
    }

    // The last element is an Array request.
    const matchRequest = extractValuePath(lastSubPath);
    const arr = schema[matchRequest[1]];
    let matchFilter;
    try {
        const f = filter(parse(matchRequest[2]));
        matchFilter = arr.filter(f);
    } catch (error) {
        throw new InvalidScimPatchOp(error);
    }

    // We are going backward to don't have any problems when adding things in the array
    let hasMatch: boolean = false;
    for (let i = arr.length - 1; matchFilter.length > 0 && i >= 0; i--)
        if (matchFilter.includes(arr[i])) {
            hasMatch = true;
            delete arr[i];
            arr.push(patch.value);
        }

    // If the target location specifies a complex attribute, a set of sub-attributes SHALL be specified in the "value"
    // parameter, which replaces any existing values or adds where an attribute did not previously exist.
    if (!hasMatch)
        arr.push(patch.value);

    // We remove all the empty item (<1 empty item>) from the array.
    schema[matchRequest[1]] = arr.filter((e: any) => e);

    return scimResource;
}

/*
 * extractValuePath extract the valuePath (ex: email[primary eq true]) of a subPath
 * @param subPath The key we want to extract.
 * @return an array with the array name and the filter path.
 */
function extractValuePath(subPath: string): Array<string> {
    // We extract the key of the table and what is inside [].
    const matchRequest = subPath.match(ARRAY_SEARCH);
    if (!matchRequest)
        throw new InvalidScimPatchOp(`This part of the path ${subPath} is invalid for SCIM patch request.`);
    return matchRequest;
}

function applyPatchNoPath<T extends ScimResource>(scimResource: T, patch: ScimPatchOperation): T {
    if (typeof patch.value !== 'object')
        throw new InvalidScimPatchOp('Invalid patch query.');

    return {
        ...scimResource,
        ...patch.value
    };
}

function navigate(inputSchema: any, pList: string[]): any {
    let schema = inputSchema;
    for (let i = 0; i < pList.length - 1; i++) {
        const subPath = pList[i];

        // We check if the element is an array with query (ex: emails[primary eq true).
        if (IS_ARRAY_SEARCH.test(subPath)) {
            const matchRequest = extractValuePath(subPath);
            const arr = schema[matchRequest[1]];
            const scimRequest = matchRequest[2];
            try {
                const f = filter(parse(scimRequest));
                const matchFilter = arr.filter(f);

                // We iterate over the array to find the matching element.
                for (let j = 0; j < arr.length && matchFilter.length > 0; j++)
                    if (matchFilter.includes(arr[j]))
                        schema = arr[j];

            } catch (error) {
                throw new InvalidScimPatchOp(error);
            }
        } else {
            // The element is not an array.
            if (!schema[subPath])
                schema[subPath] = {};
            schema = schema[subPath];
        }
    }
    return schema;
}
