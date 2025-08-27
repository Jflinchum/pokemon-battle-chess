/**
 * Remove an element from an unsorted array significantly faster
 * than .splice
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fastPop = (list: any[], index: number) => {
  const length = list.length;
  if (index < 0 || index >= list.length) {
    throw new Error(`Index ${index} out of bounds for given array`);
  }

  const element = list[index];
  list[index] = list[length - 1];
  list.pop();
  return element;
};
