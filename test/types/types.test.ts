import {ScimResource} from "../../src/types/types";

export interface ScimUser extends ScimResource {
    readonly schemas: Array<string>;
    id?: string;
    userName: string;
    surName?: Array<object>;
    name: ScimName;
    active: boolean;
    emails: Array<ScimEmail>;
    roles: Array<ScimRole>;
    readonly meta: ScimMeta;
    newProperty: string;
    newProperty3: string;
}

export interface ScimName {
    familyName: string;
    givenName: string;
    surName2?: Array<string>;
    surName3?: string;
    nestedArray: Array<MultiValue>;
    newProperty: string;
    newProperty1: string;
    newProperty2: string;
}

export interface MultiValue {
    value: string;
    primary: boolean;
    newProperty1?: string;
    newProperty2?: string;
}

export interface ScimEmail extends MultiValue {
    newProperty: string;
}

export interface ScimRole {
    value: string;
}

export interface ScimMeta {
    readonly resourceType: string;
    readonly created: Date;
    readonly lastModified: Date;
    readonly location: string;
}
