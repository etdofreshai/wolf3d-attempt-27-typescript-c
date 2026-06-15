export class UnimplementedWolfSourceFunctionError extends Error {
  constructor(
    readonly sourceFile: string,
    readonly functionName: string,
    readonly argumentCount: number,
  ) {
    super(`${sourceFile}:${functionName} is structurally mirrored but not ported yet.`);
    this.name = "UnimplementedWolfSourceFunctionError";
  }
}

export function unimplemented(
  sourceFile: string,
  functionName: string,
  args: readonly unknown[] = [],
): never {
  throw new UnimplementedWolfSourceFunctionError(sourceFile, functionName, args.length);
}
