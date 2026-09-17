/**
 * Stamp a startable `{ kind, name }` definition.
 *
 * `defineAgent` and `defineWorkflow` are specialized helpers for those kinds.
 * Custom thread types should use `createKind` / `defineKind` instead of
 * assembling the object by hand.
 */
export function defineKind<TKind extends string, TDef extends { readonly name: string }>(
  kind: TKind,
  def: TDef,
): TDef & { readonly kind: TKind } {
  return { ...def, kind }
}

export interface KindBuilder<TKind extends string> {
  readonly kind: TKind
  define<TDef extends { readonly name: string }>(def: TDef): TDef & { readonly kind: TKind }
}

/** Bind `define` to one kind so each custom type has a builder, like `defineAgent`. */
export function createKind<TKind extends string>(kind: TKind): KindBuilder<TKind> {
  return {
    kind,
    define: (def) => defineKind(kind, def),
  }
}
