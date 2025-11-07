// Simple test script to verify login functionality
import api from './services/api';

async function testLogin() {
  try {
    console.log('Testing login with admin@ems.com / admin123');
    console.log('API Base URL:', api.defaults.baseURL);
    
    const response = await api.post('/auth.php?action=login', {
      email: 'admin@ems.com',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Run the test
testLogin().then(data => {
  console.log('Test completed successfully');
}).catch(error => {
  console.error('Test failed:', error);
});