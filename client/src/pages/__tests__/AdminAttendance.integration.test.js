import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminAttendance from '../AdminAttendance';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' } })
}));

const mockGet = jest.fn();
jest.mock('../../services/api', () => ({ get: (url) => mockGet(url), delete: jest.fn(), put: jest.fn() }));

beforeAll(() => {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

test('loads admin attendance and paginates', async () => {
  mockGet.mockImplementationOnce(() => Promise.resolve({ data: { data: [ { id: 1, user_name: 'A', work_date: '2025-10-01', clock_in: null, clock_out: null, notes: '' } ], meta: { page:1, per_page:20, total: 1, total_pages: 1 } } }));
  act(() => { render(<AdminAttendance />); });
  await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());
});
