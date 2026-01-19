import React from 'react';
import { render, screen } from '@testing-library/react';
import { Logo, NestlyIcon } from '../logo';

describe('Logo Component', () => {
  describe('Variant rendering', () => {
    it('renders full variant by default with icon and text', () => {
      render(<Logo />);

      // Should have the Nestly text
      expect(screen.getByText('Sartor')).toBeInTheDocument();

      // Should have an SVG (the icon)
      const container = screen.getByText('Sartor').closest('div');
      expect(container?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders icon variant without text', () => {
      render(<Logo variant="icon" />);

      // Should not have the Nestly text visible
      expect(screen.queryByText('Sartor')).not.toBeInTheDocument();
    });

    it('renders text variant without icon', () => {
      const { container } = render(<Logo variant="text" />);

      // Should have the Nestly text
      expect(screen.getByText('Sartor')).toBeInTheDocument();

      // Should not have SVG in text-only variant (text is a span)
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Size rendering', () => {
    it('renders small size correctly', () => {
      const { container } = render(<Logo size="sm" variant="icon" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('renders medium size correctly (default)', () => {
      const { container } = render(<Logo size="md" variant="icon" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    it('renders large size correctly', () => {
      const { container } = render(<Logo size="lg" variant="icon" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('renders extra large size correctly', () => {
      const { container } = render(<Logo size="xl" variant="icon" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });
  });

  describe('Color rendering', () => {
    it('applies primary color scheme by default', () => {
      render(<Logo variant="text" color="primary" />);
      const text = screen.getByText('Sartor');

      // Primary text color should be green
      expect(text).toHaveStyle({ color: '#16a34a' });
    });

    it('applies white color scheme', () => {
      render(<Logo variant="text" color="white" />);
      const text = screen.getByText('Sartor');

      expect(text).toHaveStyle({ color: '#ffffff' });
    });

    it('applies dark color scheme', () => {
      render(<Logo variant="text" color="dark" />);
      const text = screen.getByText('Sartor');

      expect(text).toHaveStyle({ color: '#14532d' });
    });
  });

  describe('Animation', () => {
    it('applies animation classes when animated prop is true', () => {
      const { container } = render(<Logo variant="icon" animated />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('transition-transform');
    });

    it('does not apply animation classes when animated is false', () => {
      const { container } = render(<Logo variant="icon" animated={false} />);
      const svg = container.querySelector('svg');

      expect(svg).not.toHaveClass('transition-transform');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to the container', () => {
      const { container } = render(<Logo className="custom-class" />);
      const wrapper = container.firstChild;

      expect(wrapper).toHaveClass('custom-class');
    });
  });
});

describe('NestlyIcon Component', () => {
  it('renders with default size', () => {
    const { container } = render(<NestlyIcon />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom size', () => {
    const { container } = render(<NestlyIcon size={64} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('applies custom className', () => {
    const { container } = render(<NestlyIcon className="icon-class" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('icon-class');
  });
});
