// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Only mock Next.js router in browser environment
if (typeof window !== 'undefined') {
  // Mock Next.js router
  jest.mock('next/router', () => require('next-router-mock'))
}

// Mock environment variables if needed
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000' 
