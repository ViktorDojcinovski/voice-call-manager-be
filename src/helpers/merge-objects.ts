const mergeObjects = (existing: any, updated: any) => {
  return {
    ...existing,
    ...(updated || {}),
  };
};

export { mergeObjects };
