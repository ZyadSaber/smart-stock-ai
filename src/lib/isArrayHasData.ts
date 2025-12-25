const isArrayHasData = (arr: Record<string, unknown>[]) =>
  Array.isArray(arr) && arr.length > 0;

export default isArrayHasData;
