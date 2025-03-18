require('dotenv').config();
const express = require('express');
const app = express();

// Import your route files
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const patientRoutes = require('../routes/patientRoutes');

// Register routes without middleware for testing
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/patients', patientRoutes);

// Function to list all registered routes
function listRoutes() {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ').toUpperCase()
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const path = handler.route.path;
          const baseUrl = middleware.regexp.toString()
            .replace('\\/?(?=\\/|$)', '')
            .replace(/^\/\^\\\//, '/')
            .replace(/\\\/\$\/$/, '')
            .replace(/\\\//g, '/')
            .replace(/\/\^/g, '')  // Remove /^ from the path
            .replace(/\/i$/, '');  // Remove /i from the end
          
          const fullPath = baseUrl === '/' ? path : `${baseUrl}${path}`;
          
          routes.push({
            path: fullPath,
            methods: Object.keys(handler.route.methods).join(', ').toUpperCase()
          });
        }
      });
    }
  });
  
  return routes;
}

// Print all routes
console.log('=== REGISTERED API ROUTES ===');
const routes = listRoutes();
routes.forEach(route => {
  console.log(`${route.methods} ${route.path}`);
});
console.log('============================');

// Check for specific routes
const checkRoute = (method, path) => {
  const found = routes.find(r => 
    (r.path === path || r.path === path + '/') && 
    r.methods.includes(method)
  );
  console.log(`Route ${method} ${path}: ${found ? 'EXISTS' : 'NOT FOUND'}`);
};

// Check the problematic routes
checkRoute('GET', '/patients');
checkRoute('GET', '/admin/stats');
checkRoute('GET', '/admin/users');