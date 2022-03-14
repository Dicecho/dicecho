export function isInstanceArray<T>(
  value: unknown,
  checkClass: new (args: any[] | any) => T,
): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }
  const result = value.map((item) => item instanceof checkClass)

  return result.findIndex(r => !r) === -1
}