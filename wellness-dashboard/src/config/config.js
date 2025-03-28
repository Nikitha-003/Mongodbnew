const config = {
  API_URL: 'http://localhost:3001', // Change from 3000 to 3001
  
  // Add some debugging info to help troubleshoot
  DEBUG: true,
  
  // Add a function to help with logging API requests
  logApiRequest: function(endpoint, method = 'GET') {
    if (this.DEBUG) {
      console.log(`API Request: ${method} ${this.API_URL}${endpoint}`);
    }
  }
};

// Log the config on load to verify it's being imported correctly
console.log('Config loaded with API_URL:', config.API_URL);

export default config;