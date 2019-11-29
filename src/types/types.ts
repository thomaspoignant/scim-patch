export interface ScimResource {
  // Please extends this Resource to use the scim patch.
}

// Object to represent PATCH inputs (RFC-7644)
export interface ScimPatchOperation {
  readonly op: string;
  readonly value?: string | number | JSON | boolean | object;
  readonly path?: string;
}

export interface ScimPatch {
  readonly schemas: Array<String>,
  readonly Operations: Array<ScimPatchOperation>
}
