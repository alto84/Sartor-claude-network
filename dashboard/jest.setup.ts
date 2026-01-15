import '@testing-library/jest-dom';

// Mock the canvas-confetti library since it requires DOM canvas
jest.mock('canvas-confetti', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});

// Mock window.matchMedia for components that use dark mode detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window dimensions for celebration functions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: 768,
});

// Mock fetch for API tests
global.fetch = jest.fn();
