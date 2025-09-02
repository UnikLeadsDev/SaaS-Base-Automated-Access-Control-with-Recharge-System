// Safe array manipulation utilities
export const safeArrayRemove = (array, index) => {
  if (index < 0 || index >= array.length) return array;
  return array.filter((_, i) => i !== index);
};

export const safeArrayRemoveById = (array, id, idField = 'id') => {
  return array.filter(item => item[idField] !== id);
};

export const safeArrayUpdate = (array, index, newItem) => {
  if (index < 0 || index >= array.length) return array;
  return array.map((item, i) => i === index ? newItem : item);
};

export const safeArrayUpdateById = (array, id, updates, idField = 'id') => {
  return array.map(item => 
    item[idField] === id ? { ...item, ...updates } : item
  );
};