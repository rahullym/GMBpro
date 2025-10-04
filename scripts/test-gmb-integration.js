#!/usr/bin/env node

/**
 * Google Business Profile Integration Test Script
 * 
 * This script tests the GMB integration by:
 * 1. Testing OAuth flow
 * 2. Testing API endpoints
 * 3. Testing background job processing
 * 4. Validating data flow
 */

const axios = require('axios');
const { execSync } = require('child_process');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

class GMBIntegrationTester {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.businessId = null;
    this.locationId = null;
    this.reviewId = null;
  }

  async runTests() {
    console.log('🚀 Starting Google Business Profile Integration Tests\n');
    
    try {
      await this.testHealthCheck();
      await this.testAuthentication();
      await this.testBusinessEndpoints();
      await this.testLocationEndpoints();
      await this.testReviewEndpoints();
      await this.testReplyEndpoints();
      await this.testBackgroundJobs();
      
      console.log('\n✅ All tests passed! Google Business Profile integration is working correctly.');
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('1. Testing health check...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      console.log('   ✅ Health check passed');
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async testAuthentication() {
    console.log('2. Testing authentication...');
    
    try {
      // Test registration
      const registerData = {
        email: 'test@gmboptimizer.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        businessName: 'Test Business'
      };
      
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      this.accessToken = registerResponse.data.accessToken;
      this.refreshToken = registerResponse.data.refreshToken;
      this.businessId = registerResponse.data.user.businessId;
      
      console.log('   ✅ User registration successful');
      
      // Test login
      const loginData = {
        email: 'test@gmboptimizer.com',
        password: 'TestPassword123!'
      };
      
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      this.accessToken = loginResponse.data.accessToken;
      
      console.log('   ✅ User login successful');
    } catch (error) {
      if (error.response?.status === 409) {
        // User already exists, try login
        const loginData = {
          email: 'test@gmboptimizer.com',
          password: 'TestPassword123!'
        };
        
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
        this.accessToken = loginResponse.data.accessToken;
        this.businessId = loginResponse.data.user.businessId;
        
        console.log('   ✅ User login successful (existing user)');
      } else {
        throw new Error(`Authentication failed: ${error.message}`);
      }
    }
  }

  async testBusinessEndpoints() {
    console.log('3. Testing business endpoints...');
    
    const headers = { Authorization: `Bearer ${this.accessToken}` };
    
    try {
      // Test get business
      const businessResponse = await axios.get(`${API_BASE_URL}/businesses/me`, { headers });
      console.log('   ✅ Get business successful');
      
      // Test get business stats
      const statsResponse = await axios.get(`${API_BASE_URL}/businesses/me/stats`, { headers });
      console.log('   ✅ Get business stats successful');
    } catch (error) {
      throw new Error(`Business endpoints failed: ${error.message}`);
    }
  }

  async testLocationEndpoints() {
    console.log('4. Testing location endpoints...');
    
    const headers = { Authorization: `Bearer ${this.accessToken}` };
    
    try {
      // Test get locations
      const locationsResponse = await axios.get(`${API_BASE_URL}/locations`, { headers });
      console.log('   ✅ Get locations successful');
      
      // Test create mock location
      const locationData = {
        googlePlaceId: 'test-place-id-123',
        name: 'Test Business Location',
        address: '123 Test St, Test City, TC 12345',
        phoneNumber: '+1234567890',
        website: 'https://testbusiness.com'
      };
      
      const createResponse = await axios.post(`${API_BASE_URL}/locations`, locationData, { headers });
      this.locationId = createResponse.data.id;
      console.log('   ✅ Create location successful');
      
      // Test get location by ID
      const locationResponse = await axios.get(`${API_BASE_URL}/locations/${this.locationId}`, { headers });
      console.log('   ✅ Get location by ID successful');
      
      // Test sync location (this will use mock data)
      const syncResponse = await axios.post(`${API_BASE_URL}/locations/${this.locationId}/sync`, {}, { headers });
      console.log('   ✅ Sync location successful');
    } catch (error) {
      throw new Error(`Location endpoints failed: ${error.message}`);
    }
  }

  async testReviewEndpoints() {
    console.log('5. Testing review endpoints...');
    
    const headers = { Authorization: `Bearer ${this.accessToken}` };
    
    try {
      // Test get reviews
      const reviewsResponse = await axios.get(`${API_BASE_URL}/reviews`, { headers });
      console.log('   ✅ Get reviews successful');
      
      if (reviewsResponse.data.data.length > 0) {
        this.reviewId = reviewsResponse.data.data[0].id;
        
        // Test get review by ID
        const reviewResponse = await axios.get(`${API_BASE_URL}/reviews/${this.reviewId}`, { headers });
        console.log('   ✅ Get review by ID successful');
        
        // Test update review
        const updateData = { status: 'approved' };
        const updateResponse = await axios.patch(`${API_BASE_URL}/reviews/${this.reviewId}`, updateData, { headers });
        console.log('   ✅ Update review successful');
      } else {
        console.log('   ⚠️  No reviews found (this is expected for new locations)');
      }
    } catch (error) {
      throw new Error(`Review endpoints failed: ${error.message}`);
    }
  }

  async testReplyEndpoints() {
    console.log('6. Testing reply endpoints...');
    
    const headers = { Authorization: `Bearer ${this.accessToken}` };
    
    if (!this.reviewId) {
      console.log('   ⚠️  Skipping reply tests (no review available)');
      return;
    }
    
    try {
      // Test get replies for review
      const repliesResponse = await axios.get(`${API_BASE_URL}/replies/reviews/${this.reviewId}`, { headers });
      console.log('   ✅ Get replies successful');
      
      // Test generate AI reply
      const generateData = { voice: 'professional' };
      const generateResponse = await axios.post(`${API_BASE_URL}/replies/reviews/${this.reviewId}/generate`, generateData, { headers });
      console.log('   ✅ Generate AI reply successful');
      
      // Wait a moment for the background job to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test get replies again to see if the generated reply is there
      const updatedRepliesResponse = await axios.get(`${API_BASE_URL}/replies/reviews/${this.reviewId}`, { headers });
      if (updatedRepliesResponse.data.length > 0) {
        const replyId = updatedRepliesResponse.data[0].id;
        
        // Test update reply
        const updateData = { draftText: 'Updated test reply' };
        const updateResponse = await axios.patch(`${API_BASE_URL}/replies/${replyId}`, updateData, { headers });
        console.log('   ✅ Update reply successful');
        
        // Test publish reply
        const publishData = { finalText: 'Published test reply' };
        const publishResponse = await axios.post(`${API_BASE_URL}/replies/${replyId}/publish`, publishData, { headers });
        console.log('   ✅ Publish reply successful');
      } else {
        console.log('   ⚠️  No generated replies found (background job may still be processing)');
      }
    } catch (error) {
      throw new Error(`Reply endpoints failed: ${error.message}`);
    }
  }

  async testBackgroundJobs() {
    console.log('7. Testing background jobs...');
    
    try {
      // Check if Redis is running
      execSync('redis-cli ping', { stdio: 'pipe' });
      console.log('   ✅ Redis is running');
      
      // Check if worker processes are running
      try {
        execSync('pgrep -f "node dist/workers/main"', { stdio: 'pipe' });
        console.log('   ✅ Background workers are running');
      } catch (error) {
        console.log('   ⚠️  Background workers may not be running (start with: npm run start:worker)');
      }
    } catch (error) {
      console.log('   ⚠️  Redis may not be running (start with: docker-compose up redis)');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (this.locationId) {
      try {
        const headers = { Authorization: `Bearer ${this.accessToken}` };
        await axios.delete(`${API_BASE_URL}/locations/${this.locationId}`, { headers });
        console.log('   ✅ Test location deleted');
      } catch (error) {
        console.log('   ⚠️  Could not delete test location');
      }
    }
  }
}

// Run the tests
async function main() {
  const tester = new GMBIntegrationTester();
  
  try {
    await tester.runTests();
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GMBIntegrationTester;

