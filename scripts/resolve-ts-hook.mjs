/**
 * Resolve hook so the contract checks can import the app's TypeScript sources
 * directly. Application code imports `./fixtures`, which bundlers resolve but
 * Node's ESM resolver does not; this appends the extension.
 */
export async function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");
  if (relative && !/\.[cm]?[jt]s$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // Fall through to the default resolution below.
    }
  }
  return nextResolve(specifier, context);
}
