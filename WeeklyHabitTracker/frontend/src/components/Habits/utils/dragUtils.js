// dragUtils.js - Utility functions for drag and drop
export const calculateNewOrder = (prevItem, nextItem) => {
  const prevOrder = prevItem?.order || 0;
  const nextOrder = nextItem?.order || prevOrder + 20;
  return prevOrder + (nextOrder - prevOrder) / 2;
};

export const reorderItems = (items, startIndex, endIndex) => {
  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};