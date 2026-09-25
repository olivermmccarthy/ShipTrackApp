import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackingPage from '../TrackingPage';

describe('TrackingPage', () => {
  it('shows a validation message when submitting an empty tracking number', async () => {
    render(<TrackingPage />);

    expect(
      screen.getByRole('textbox', { name: 'Tracking number' }),
    ).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /track/i });
    fireEvent.click(button);

    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent(/enter a tracking number/i);
  });
});
