/**
 * Utility function to safely log objects with circular references
 * @param {string} label - Label for the log
 * @param {object} obj - Object to log
 */
export const safeLog = (label, obj) => {
  try {
    // Create a safe copy without circular references
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      };
    };
    
    console.log(`${label}:`, JSON.stringify(obj, getCircularReplacer(), 2));
  } catch (error) {
    console.log(`${label} (stringification failed):`, obj);
  }
};

/**
 * Utility function to log authentication state
 * @param {string} source - Source component name
 * @param {object} authState - Authentication state object
 */
export const logAuthState = (source, authState) => {
  const safeAuthState = {
    isAuthenticated: authState.isAuthenticated,
    userType: authState.userType,
    user: authState.user ? {
      id: authState.user.id,
      email: authState.user.email,
      userType: authState.user.userType,
      name: authState.user.name
    } : null,
    tokenExists: !!authState.token
  };
  
  console.log(`[${source}] Auth State:`, safeAuthState);
};