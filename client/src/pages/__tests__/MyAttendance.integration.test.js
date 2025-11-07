import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useAuth } from '../../context/AuthContext';
import MyAttendance from '../MyAttendance';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
jest.mock('../../components/Pagination', () => {
  return function MockPagination({ page, totalPages, onPageChange }) {
    return (
      <div data-testid="pagination">
        Page {page} of {totalPages}
        <button onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    );
  };
});

// Mock useAuth
jest.mock('../../context/AuthContext');

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'employee',
  shift: '1'
};

const mockAttendanceData = [
  {
    id: 1,
    work_date: '2025-10-22',
    clock_in: '2025-10-22 07:53:00',
    clock_out: '2025-10-22 15:22:00',
    notes: null
  },
  {
    id: 2,
    work_date: '2025-10-20',
    clock_in: null,
    clock_out: null,
    notes: null
  }
];

const mockApiResponse = {
  data: {
    data: mockAttendanceData,
    meta: { page: 1, per_page: 20, total: 2, total_pages: 1 }
  }
};

describe('MyAttendance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('action=state')) {
        return Promise.resolve({ data: { clocked_in: false, can_clock_in: true, can_clock_out: false } });
      }
      return Promise.resolve(mockApiResponse);
    });
  });

  const renderComponent = (user = mockUser) => {
    // Mock the useAuth hook
    useAuth.mockReturnValue({ user });
    return act(() => render(<MyAttendance />));
  };

  test('renders page title', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'My Attendance' })).toBeInTheDocument();
    });
  });

  test('renders date filters', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('From Date')).toBeInTheDocument();
      expect(screen.getByText('To Date')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });

  test('renders table headers', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /Date/ })).toBeInTheDocument();
      expect(screen.getByText('Planned Shift')).toBeInTheDocument();
      expect(screen.getByText('Actual Shift')).toBeInTheDocument();
      expect(screen.getByText('Punch')).toBeInTheDocument();
      expect(screen.getByText('Paycode')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  test('displays attendance records correctly', async () => {
    renderComponent();
    await waitFor(() => {
      // Check date formatting
      expect(screen.getByText('22/Oct/2025')).toBeInTheDocument();
      expect(screen.getByText('20/Oct/2025')).toBeInTheDocument();

      // Check planned shift for shift 1
      expect(screen.getAllByText('07:00 AM to 16:00 PM')).toHaveLength(2);

      // Check actual shift for first record
      expect(screen.getByText('7:53 AM to 3:22 PM')).toBeInTheDocument();

      // Check punch times
      expect(screen.getByText('IN: 7:53 AM - OUT: 3:22 PM')).toBeInTheDocument();
      expect(screen.getByText('No Attendance/Punch')).toBeInTheDocument();

      // Check paycodes
      expect(screen.getByText('P')).toBeInTheDocument();
      expect(screen.getByText('WO')).toBeInTheDocument();
    });
  });

  test('displays correct planned shift based on user shift', async () => {
    const userShift2 = { ...mockUser, shift: '2' };
    renderComponent(userShift2);
    await waitFor(() => {
      expect(screen.getAllByText('15:00 PM to 00:00 AM')).toHaveLength(2);
    });
  });

  test('handles search functionality', async () => {
    renderComponent();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?page=1&per_page=20&sort_by=id&sort_order=desc');
    });

    const fromDateInput = screen.getByLabelText('From Date');
    const toDateInput = screen.getByLabelText('To Date');
    const searchButton = screen.getByText('Search');

    fireEvent.change(fromDateInput, { target: { value: '2025-10-01' } });
    fireEvent.change(toDateInput, { target: { value: '2025-10-31' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?page=1&per_page=20&start_date=2025-10-01&end_date=2025-10-31&sort_by=id&sort_order=desc');
    });
  });

  test('renders pagination component', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });



  test('handles API error gracefully', async () => {
    api.get.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'My Attendance' })).toBeInTheDocument();
    });

    // Should still render the UI even with API error
    expect(screen.getByLabelText('From Date')).toBeInTheDocument();
  });

  test('renders clock in/out buttons', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeInTheDocument();
      expect(screen.getByText('Clock Out')).toBeInTheDocument();
    });
  });

  test('clock in button triggers API call', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('action=state')) {
        return Promise.resolve({ data: { clocked_in: false, can_clock_in: true, can_clock_out: false } });
      }
      return Promise.resolve(mockApiResponse);
    });
    renderComponent();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?page=1&per_page=20&sort_by=id&sort_order=desc');
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?action=state');
    });
    await waitFor(() => {
      const clockInButton = screen.getByText('Clock In');
      expect(clockInButton).not.toBeDisabled();
    });
    const clockInButton = screen.getByText('Clock In');
    fireEvent.click(clockInButton);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?action=clock_in');
    });
  });

  test('clock out button triggers API call', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('action=state')) {
        return Promise.resolve({ data: { clocked_in: true, can_clock_out: true } });
      }
      return Promise.resolve(mockApiResponse);
    });
    renderComponent();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?page=1&per_page=20&sort_by=id&sort_order=desc');
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?action=state');
    });
    await waitFor(() => {
      const clockOutButton = screen.getByText('Clock Out');
      expect(clockOutButton).not.toBeDisabled();
    });
    const clockOutButton = screen.getByText('Clock Out');
    fireEvent.click(clockOutButton);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/attendance.php?action=clock_out');
    });
  });
});
