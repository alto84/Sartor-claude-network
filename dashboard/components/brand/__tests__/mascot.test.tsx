import React from 'react';
import { render, screen } from '@testing-library/react';
import { Mascot, MascotInline, MascotWithMessage } from '../mascot';

// Mock the useDarkMode hook
jest.mock('@/hooks/use-dark-mode', () => ({
  useDarkMode: jest.fn().mockReturnValue(false),
}));

describe('Mascot Component', () => {
  describe('Expression rendering', () => {
    it('renders with happy expression by default', () => {
      const { container } = render(<Mascot />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      // Happy expression has eye sparkles (small white circles)
      const circles = svg?.querySelectorAll('circle');
      expect(circles?.length).toBeGreaterThan(0);
    });

    it('renders with thinking expression', () => {
      const { container } = render(<Mascot expression="thinking" />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      // Thinking expression has thinking dots (circles at top right)
      const circles = svg?.querySelectorAll('circle');
      expect(circles?.length).toBeGreaterThan(0);
    });

    it('renders with celebrating expression', () => {
      const { container } = render(<Mascot expression="celebrating" />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      // Celebrating has closed happy eyes (paths instead of ellipses for eyes)
      const paths = svg?.querySelectorAll('path');
      expect(paths?.length).toBeGreaterThan(0);
    });

    it('renders with sleepy expression', () => {
      const { container } = render(<Mascot expression="sleepy" />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      // Sleepy expression has Z's (text elements)
      const texts = svg?.querySelectorAll('text');
      expect(texts?.length).toBeGreaterThan(0);
    });

    it('renders with surprised expression', () => {
      const { container } = render(<Mascot expression="surprised" />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      // Surprised has exclamation mark (text element)
      const texts = svg?.querySelectorAll('text');
      expect(texts?.length).toBeGreaterThan(0);
    });
  });

  describe('Size rendering', () => {
    it('renders small size correctly', () => {
      const { container } = render(<Mascot size="sm" />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('renders medium size correctly (default)', () => {
      const { container } = render(<Mascot size="md" />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveStyle({ width: '80px', height: '80px' });
    });

    it('renders large size correctly', () => {
      const { container } = render(<Mascot size="lg" />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveStyle({ width: '120px', height: '120px' });
    });

    it('renders extra large size correctly', () => {
      const { container } = render(<Mascot size="xl" />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveStyle({ width: '180px', height: '180px' });
    });
  });

  describe('Dark mode', () => {
    it('uses light mode colors by default', () => {
      const { container } = render(<Mascot />);
      const svg = container.querySelector('svg');
      const bodyEllipse = svg?.querySelector('ellipse');

      // Light mode body color is #fb923c
      expect(bodyEllipse).toHaveAttribute('fill', '#fb923c');
    });

    it('uses dark mode colors when darkMode prop is true', () => {
      const { container } = render(<Mascot darkMode={true} />);
      const svg = container.querySelector('svg');
      const bodyEllipse = svg?.querySelector('ellipse');

      // Dark mode body color is #c2410c
      expect(bodyEllipse).toHaveAttribute('fill', '#c2410c');
    });

    it('respects darkMode prop override', () => {
      const { container } = render(<Mascot darkMode={false} />);
      const svg = container.querySelector('svg');
      const bodyEllipse = svg?.querySelector('ellipse');

      // Light mode body color should be used
      expect(bodyEllipse).toHaveAttribute('fill', '#fb923c');
    });
  });

  describe('Animation', () => {
    it('applies transition class when animated is true (default)', () => {
      const { container } = render(<Mascot />);
      const wrapper = container.firstChild;

      expect(wrapper).toHaveClass('transition-all');
    });

    it('does not apply transition class when animated is false', () => {
      const { container } = render(<Mascot animated={false} />);
      const wrapper = container.firstChild;

      expect(wrapper).not.toHaveClass('transition-all');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<Mascot className="my-mascot" />);
      const wrapper = container.firstChild;

      expect(wrapper).toHaveClass('my-mascot');
    });
  });
});

describe('MascotInline Component', () => {
  it('renders with small size', () => {
    const { container } = render(<MascotInline />);
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveStyle({ width: '48px', height: '48px' });
  });

  it('uses happy expression by default', () => {
    const { container } = render(<MascotInline />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('accepts custom expression', () => {
    const { container } = render(<MascotInline expression="thinking" />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(<MascotInline className="inline-mascot" />);
    const wrapper = container.firstChild;

    expect(wrapper).toHaveClass('inline-mascot');
  });
});

describe('MascotWithMessage Component', () => {
  it('renders mascot with message', () => {
    render(<MascotWithMessage message="Hello there!" />);

    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('renders with specified expression', () => {
    const { container } = render(
      <MascotWithMessage expression="celebrating" message="Great job!" />
    );

    expect(screen.getByText('Great job!')).toBeInTheDocument();
    // Mascot SVG should be present
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with specified size', () => {
    const { container } = render(
      <MascotWithMessage size="lg" message="Big message!" />
    );

    expect(screen.getByText('Big message!')).toBeInTheDocument();
    // Verify SVG is present with correct viewBox (same for all sizes)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <MascotWithMessage message="Test" className="message-container" />
    );

    expect(container.firstChild).toHaveClass('message-container');
  });
});
