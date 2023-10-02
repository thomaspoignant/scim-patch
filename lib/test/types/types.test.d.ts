import { ScimResource, ScimMeta } from '../../src/types/types';
export interface ScimUser extends ScimResource {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'];
    userName: string;
    surName?: Array<{
        value: string;
        primary: boolean;
        additional?: string;
    }>;
    name: {
        familyName: string;
        givenName: string;
        nestedArray?: Array<{
            value: string;
            primary: boolean;
            newProperty1?: string;
            newProperty2?: string;
        }>;
        newProperty?: string;
        newProperty1?: string;
        newProperty2?: string;
        surName2?: Array<string>;
        surName3?: string;
        notMandatory?: boolean;
        formatted?: string;
    };
    active: boolean;
    emails: Array<{
        value: string;
        primary: boolean;
        newProperty?: string;
        newProperty1?: string;
        newProperty2?: string;
    }>;
    addresses?: Array<{
        type: string;
        formatted: string;
        country?: string;
    }>;
    roles?: Array<{
        value: string;
        type?: string;
    }>;
    meta: ScimMeta & {
        resourceType: 'User';
    };
    newProperty?: string | null;
    newProperty3?: string;
    favorites?: {
        food?: string;
    };
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'?: {
        organization?: string;
        division?: string;
        department?: string;
    };
}
