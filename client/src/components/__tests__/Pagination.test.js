import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Pagination from '../Pagination';

test('renders pagination and navigates pages', () => {
  const onPageChange = jest.fn();
  act(() => {
    render(<Pagination page={3} totalPages={10} onPageChange={onPageChange} />);
  });

  // should render Prev, Next and some page numbers
  expect(screen.getByText('Previous')).toBeInTheDocument();
  expect(screen.getByText('Next')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();

  // click previous
  act(() => {
    fireEvent.click(screen.getByText('Previous'));
  });
  expect(onPageChange).toHaveBeenCalledWith(2);

  // click next
  act(() => {
    fireEvent.click(screen.getByText('Next'));
  });
  expect(onPageChange).toHaveBeenCalledWith(4);

  // click first page button (if present)
  const pageOneButton = screen.queryByText('1');
  if (pageOneButton) {
    act(() => {
      fireEvent.click(pageOneButton);
    });
    expect(onPageChange).toHaveBeenCalledWith(1);
  }
});
