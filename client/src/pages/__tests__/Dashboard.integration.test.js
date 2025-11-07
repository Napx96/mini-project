import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin User', role: 'admin' } })
}));

// Mock api service
const mockGet = jest.fn();
jest.mock('../../services/api', () => ({
  get: (url) => mockGet(url)
}));

// jsdom doesn't implement ResizeObserver which Recharts uses; provide a lightweight mock
beforeAll(() => {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  mockGet.mockReset();
});

test('loads users and responds to pagination', async () => {
  // First page response
  mockGet.mockImplementationOnce((url) => Promise.resolve({ data: { data: [ { id: 1, name: 'Alice', email: 'a@x.com', role: 'employee', is_active: 1, department: 'HR' } ], meta: { page: 1, per_page: 20, total: 40, total_pages: 2 } } }));
  // Second page response
  mockGet.mockImplementationOnce((url) => Promise.resolve({ data: { data: [ { id: 21, name: 'Bob', email: 'b@x.com', role: 'employee', is_active: 1, department: 'IT' } ], meta: { page: 2, per_page: 20, total: 40, total_pages: 2 } } }));

  act(() => { render(<Dashboard />); });

  // Wait for first user row to appear
  await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

  // Click next page via Pagination (find the Next button)
  const next = screen.getByText('Next');
  act(() => { userEvent.click(next); });

  // Wait for second page data
  await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument());

  // Ensure api.get called at least twice
  expect(mockGet).toHaveBeenCalled();
  expect(mockGet.mock.calls.length).toBeGreaterThanOrEqual(2);
});
