import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import LeaveManagement from '../LeaveManagement';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' } })
}));

const mockGet = jest.fn();
jest.mock('../../services/api', () => ({ get: (url) => mockGet(url), delete: jest.fn(), put: jest.fn() }));

beforeAll(() => {
  global.ResizeObserver = class { constructor(){}; observe(){}; unobserve(){}; disconnect(){} };
});

test('loads leave management list', async () => {
  mockGet.mockImplementationOnce(() => Promise.resolve({ data: { data: [ { id: 1, user_name: 'A', leave_type_name: 'Sick', start_date: '2025-10-01', end_date: '2025-10-02', status: 'pending' } ], meta: { page:1, per_page:20, total:1, total_pages:1 } } }));
  act(() => { render(<LeaveManagement />); });
  await waitFor(() => expect(screen.getByText('Sick')).toBeInTheDocument());
});
