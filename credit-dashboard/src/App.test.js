import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test.skip('renders navigation buttons', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const navButton = screen.getByRole('button', { name: /customers/i });
  expect(navButton).toBeInTheDocument();
});
