import {
  celebrateTaskComplete,
  celebrateStar,
  celebrateMessage,
  celebrateAchievement,
  celebrateBig,
  fireworks,
  sparkle,
  heartRain,
  snowfall,
  getOriginFromEvent,
  getOriginFromElement,
  createCelebrationHandler,
  getOccasionCelebration,
} from '../celebrations';

// Mock canvas-confetti
import confetti from 'canvas-confetti';

jest.mock('canvas-confetti');

describe('Celebrations Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('celebrateTaskComplete', () => {
    it('calls confetti with default origin', () => {
      celebrateTaskComplete();

      expect(confetti).toHaveBeenCalled();
      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { x: 0.5, y: 0.6 },
          particleCount: 50,
        })
      );
    });

    it('calls confetti with custom origin', () => {
      celebrateTaskComplete({ x: 0.3, y: 0.4 });

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { x: 0.3, y: 0.4 },
        })
      );
    });

    it('does not throw an error', () => {
      expect(() => celebrateTaskComplete()).not.toThrow();
    });
  });

  describe('celebrateStar', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls confetti at least once', () => {
      celebrateStar();

      expect(confetti).toHaveBeenCalled();
    });

    it('calls confetti again after timeout for second burst', () => {
      celebrateStar();

      expect(confetti).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      expect(confetti).toHaveBeenCalledTimes(2);
    });

    it('does not throw an error', () => {
      expect(() => celebrateStar()).not.toThrow();
    });
  });

  describe('celebrateMessage', () => {
    it('calls confetti with sparkle effects', () => {
      celebrateMessage();

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          shapes: ['star'],
        })
      );
    });

    it('does not throw an error', () => {
      expect(() => celebrateMessage()).not.toThrow();
    });
  });

  describe('celebrateAchievement', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls confetti multiple times over duration', () => {
      celebrateAchievement();

      // Should start calling confetti after first interval
      jest.advanceTimersByTime(200);
      expect(confetti).toHaveBeenCalled();

      const callCount1 = (confetti as jest.Mock).mock.calls.length;

      jest.advanceTimersByTime(400);
      expect((confetti as jest.Mock).mock.calls.length).toBeGreaterThan(callCount1);
    });

    it('stops after duration', () => {
      celebrateAchievement();

      jest.advanceTimersByTime(3000);

      const finalCallCount = (confetti as jest.Mock).mock.calls.length;

      jest.advanceTimersByTime(1000);

      // No more calls after duration
      expect((confetti as jest.Mock).mock.calls.length).toBe(finalCallCount);
    });

    it('does not throw an error', () => {
      expect(() => celebrateAchievement()).not.toThrow();
    });
  });

  describe('celebrateBig', () => {
    it('calls confetti multiple times for big celebration', () => {
      celebrateBig();

      // Should fire multiple bursts synchronously
      expect((confetti as jest.Mock).mock.calls.length).toBeGreaterThan(1);
    });

    it('does not throw an error', () => {
      expect(() => celebrateBig()).not.toThrow();
    });
  });

  describe('fireworks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls confetti repeatedly over duration', () => {
      fireworks();

      jest.advanceTimersByTime(500);
      expect(confetti).toHaveBeenCalled();
    });

    it('fires from both sides of the screen', () => {
      fireworks();

      jest.advanceTimersByTime(250);

      // Should have calls with different x origins
      const calls = (confetti as jest.Mock).mock.calls;
      const origins = calls.map((call: unknown[]) => (call[0] as { origin: { x: number } }).origin.x);

      // Should have origins from left side (< 0.5) and right side (> 0.5)
      expect(origins.some((x: number) => x < 0.5)).toBe(true);
      expect(origins.some((x: number) => x > 0.5)).toBe(true);
    });

    it('does not throw an error', () => {
      expect(() => fireworks()).not.toThrow();
    });
  });

  describe('sparkle', () => {
    it('calls confetti with correct origin calculation', () => {
      sparkle(512, 384);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { x: 0.5, y: 0.5 },
          shapes: ['star'],
        })
      );
    });

    it('does not throw an error', () => {
      expect(() => sparkle(100, 100)).not.toThrow();
    });
  });

  describe('heartRain', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls confetti repeatedly for heart rain effect', () => {
      heartRain();

      jest.advanceTimersByTime(500);
      expect(confetti).toHaveBeenCalled();
    });

    it('does not throw an error', () => {
      expect(() => heartRain()).not.toThrow();
    });
  });

  describe('snowfall', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls confetti repeatedly for snow effect', () => {
      snowfall();

      jest.advanceTimersByTime(500);
      expect(confetti).toHaveBeenCalled();
    });

    it('uses white/blue colors for snow', () => {
      snowfall();

      jest.advanceTimersByTime(100);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: ['#ffffff', '#e0f2fe', '#bae6fd'],
        })
      );
    });

    it('does not throw an error', () => {
      expect(() => snowfall()).not.toThrow();
    });
  });

  describe('getOriginFromEvent', () => {
    it('calculates origin from mouse event', () => {
      const mockEvent = {
        clientX: 512,
        clientY: 384,
      } as MouseEvent;

      const origin = getOriginFromEvent(mockEvent);

      expect(origin.x).toBe(0.5);
      expect(origin.y).toBe(0.5);
    });

    it('handles edge positions', () => {
      const mockEvent = {
        clientX: 0,
        clientY: 0,
      } as MouseEvent;

      const origin = getOriginFromEvent(mockEvent);

      expect(origin.x).toBe(0);
      expect(origin.y).toBe(0);
    });
  });

  describe('getOriginFromElement', () => {
    it('calculates origin from element center', () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          left: 462,
          top: 334,
          width: 100,
          height: 100,
        }),
      } as HTMLElement;

      const origin = getOriginFromElement(mockElement);

      expect(origin.x).toBe(0.5);
      expect(origin.y).toBe(0.5);
    });
  });

  describe('createCelebrationHandler', () => {
    it('creates handler for task celebration', () => {
      const handler = createCelebrationHandler('task');

      expect(typeof handler).toBe('function');
      handler();
      expect(confetti).toHaveBeenCalled();
    });

    it('creates handler for star celebration', () => {
      const handler = createCelebrationHandler('star');

      expect(typeof handler).toBe('function');
      handler();
      expect(confetti).toHaveBeenCalled();
    });

    it('creates handler for message celebration', () => {
      const handler = createCelebrationHandler('message');

      expect(typeof handler).toBe('function');
      handler();
      expect(confetti).toHaveBeenCalled();
    });

    it('creates handler for achievement celebration', () => {
      const handler = createCelebrationHandler('achievement');

      expect(typeof handler).toBe('function');
      // Achievement uses setInterval, so it doesn't call confetti immediately
      // Just verify the handler exists and is callable
      expect(() => handler()).not.toThrow();
    });

    it('creates handler for milestone celebration', () => {
      const handler = createCelebrationHandler('milestone');

      expect(typeof handler).toBe('function');
      handler();
      expect(confetti).toHaveBeenCalled();
    });

    it('uses event origin when provided', () => {
      const handler = createCelebrationHandler('task');
      const mockEvent = {
        clientX: 256,
        clientY: 192,
      } as MouseEvent;

      handler(mockEvent);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { x: 0.25, y: 0.25 },
        })
      );
    });
  });

  describe('getOccasionCelebration', () => {
    const RealDate = global.Date;

    afterEach(() => {
      global.Date = RealDate;
    });

    it('returns heartRain for Valentines Day', () => {
      const mockDate = new RealDate(2024, 1, 14);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      const celebration = getOccasionCelebration();

      expect(celebration).toBe(heartRain);
    });

    it('returns snowfall for Christmas', () => {
      const mockDate = new RealDate(2024, 11, 25);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      const celebration = getOccasionCelebration();

      expect(celebration).toBe(snowfall);
    });

    it('returns fireworks for New Years Day', () => {
      const mockDate = new RealDate(2024, 0, 1);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      const celebration = getOccasionCelebration();

      expect(celebration).toBe(fireworks);
    });

    it('returns fireworks for New Years Eve', () => {
      const mockDate = new RealDate(2024, 11, 31);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      const celebration = getOccasionCelebration();

      expect(celebration).toBe(fireworks);
    });

    it('returns fireworks for July 4th', () => {
      const mockDate = new RealDate(2024, 6, 4);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      const celebration = getOccasionCelebration();

      expect(celebration).toBe(fireworks);
    });

    it('returns null for regular days', () => {
      const mockDate = new RealDate(2024, 5, 15);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      const celebration = getOccasionCelebration();

      expect(celebration).toBeNull();
    });
  });
});
