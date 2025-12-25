const isObjectHasData = (
  obj: Record<string, unknown> | null | undefined
): boolean =>
  obj !== null &&
  obj !== undefined &&
  typeof obj === "object" &&
  Object.keys(obj).length > 0;

export default isObjectHasData;
