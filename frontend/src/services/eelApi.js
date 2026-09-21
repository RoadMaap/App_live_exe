const hasEelBridge = () =>
  typeof window !== 'undefined' &&
  !!window.eel &&
  typeof window.eel === 'object';

export const isEelAvailable = () => hasEelBridge();

export const callEel = async (functionName, ...args) => {
  if (!hasEelBridge()) {
    return null;
  }

  const eelFunction = window.eel?.[functionName];

  if (typeof eelFunction !== 'function') {
    throw new Error(`Eel function not available: ${functionName}`);
  }

  try {
    return await eelFunction(...args)();
  } catch (error) {
    console.error(`Eel call failed for ${functionName}:`, error);
    throw error;
  }
};

export const callOptionalEel = async (functionName, ...args) => {
  if (!hasEelBridge()) {
    return null;
  }

  try {
    return await callEel(functionName, ...args);
  } catch (error) {
    console.warn(`Skipping unavailable Eel call for ${functionName}:`, error);
    return null;
  }
};
