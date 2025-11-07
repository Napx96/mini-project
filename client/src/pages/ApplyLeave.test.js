import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ApplyLeave from './ApplyLeave';

test('renders Apply Leave form', () => {
  act(() => render(<ApplyLeave />));
  const linkElement = screen.getByText(/Apply Leave/i);
  expect(linkElement).toBeInTheDocument();
});
