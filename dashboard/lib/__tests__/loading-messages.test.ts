import {
  loadingMessages,
  getRandomLoadingMessage,
  contextualLoadingMessages,
  getContextualMessage,
  loadingDots,
  getTimeGreeting,
  getMotivationalMessage,
  emptyStateMessages,
  getEmptyStateMessage,
} from '../loading-messages';

describe('Loading Messages Library', () => {
  describe('loadingMessages array', () => {
    it('contains multiple messages', () => {
      expect(loadingMessages.length).toBeGreaterThan(10);
    });

    it('contains only string messages', () => {
      loadingMessages.forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getRandomLoadingMessage', () => {
    it('returns a string from the loadingMessages array', () => {
      const message = getRandomLoadingMessage();

      expect(typeof message).toBe('string');
      expect(loadingMessages).toContain(message);
    });

    it('returns different messages over multiple calls (probabilistically)', () => {
      const results = new Set<string>();

      // Call multiple times to get different messages
      for (let i = 0; i < 50; i++) {
        results.add(getRandomLoadingMessage());
      }

      // Should have gotten at least a few different messages
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('contextualLoadingMessages', () => {
    it('has all expected contexts', () => {
      expect(contextualLoadingMessages).toHaveProperty('saving');
      expect(contextualLoadingMessages).toHaveProperty('loading');
      expect(contextualLoadingMessages).toHaveProperty('sending');
      expect(contextualLoadingMessages).toHaveProperty('thinking');
      expect(contextualLoadingMessages).toHaveProperty('celebrating');
    });

    it('each context has multiple messages', () => {
      Object.values(contextualLoadingMessages).forEach((messages) => {
        expect(messages.length).toBeGreaterThan(0);
        messages.forEach((message) => {
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('getContextualMessage', () => {
    it('returns a message for saving context', () => {
      const message = getContextualMessage('saving');

      expect(typeof message).toBe('string');
      expect(contextualLoadingMessages.saving).toContain(message);
    });

    it('returns a message for loading context', () => {
      const message = getContextualMessage('loading');

      expect(typeof message).toBe('string');
      expect(contextualLoadingMessages.loading).toContain(message);
    });

    it('returns a message for sending context', () => {
      const message = getContextualMessage('sending');

      expect(typeof message).toBe('string');
      expect(contextualLoadingMessages.sending).toContain(message);
    });

    it('returns a message for thinking context', () => {
      const message = getContextualMessage('thinking');

      expect(typeof message).toBe('string');
      expect(contextualLoadingMessages.thinking).toContain(message);
    });

    it('returns a message for celebrating context', () => {
      const message = getContextualMessage('celebrating');

      expect(typeof message).toBe('string');
      expect(contextualLoadingMessages.celebrating).toContain(message);
    });
  });

  describe('loadingDots', () => {
    it('has the expected loading dot patterns', () => {
      expect(loadingDots).toEqual(['.', '..', '...', '..']);
    });

    it('can be cycled through for animation', () => {
      const index = 0;
      expect(loadingDots[index]).toBe('.');
      expect(loadingDots[(index + 1) % loadingDots.length]).toBe('..');
      expect(loadingDots[(index + 2) % loadingDots.length]).toBe('...');
      expect(loadingDots[(index + 3) % loadingDots.length]).toBe('..');
    });
  });

  describe('getTimeGreeting', () => {
    // Save original Date
    const RealDate = Date;

    afterEach(() => {
      // Restore original Date
      global.Date = RealDate;
    });

    it('returns morning greeting between 5am and 12pm', () => {
      // Mock date to 9am
      const mockDate = new Date(2024, 0, 1, 9, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const greeting = getTimeGreeting();
      expect(greeting).toBe('Good morning');
    });

    it('returns afternoon greeting between 12pm and 5pm', () => {
      const mockDate = new Date(2024, 0, 1, 14, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const greeting = getTimeGreeting();
      expect(greeting).toBe('Good afternoon');
    });

    it('returns evening greeting between 5pm and 9pm', () => {
      const mockDate = new Date(2024, 0, 1, 19, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const greeting = getTimeGreeting();
      expect(greeting).toBe('Good evening');
    });

    it('returns night owl greeting after 9pm', () => {
      const mockDate = new Date(2024, 0, 1, 23, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const greeting = getTimeGreeting();
      expect(greeting).toBe('Hello, night owl');
    });

    it('returns night owl greeting before 5am', () => {
      const mockDate = new Date(2024, 0, 1, 3, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const greeting = getTimeGreeting();
      expect(greeting).toBe('Hello, night owl');
    });
  });

  describe('getMotivationalMessage', () => {
    it('returns a string', () => {
      const message = getMotivationalMessage();

      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('returns different messages over multiple calls', () => {
      const results = new Set<string>();

      for (let i = 0; i < 50; i++) {
        results.add(getMotivationalMessage());
      }

      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('emptyStateMessages', () => {
    it('has all expected contexts', () => {
      expect(emptyStateMessages).toHaveProperty('tasks');
      expect(emptyStateMessages).toHaveProperty('vault');
      expect(emptyStateMessages).toHaveProperty('messages');
      expect(emptyStateMessages).toHaveProperty('family');
    });

    it('each context has multiple messages', () => {
      Object.values(emptyStateMessages).forEach((messages) => {
        expect(messages.length).toBeGreaterThan(0);
        messages.forEach((message) => {
          expect(typeof message).toBe('string');
        });
      });
    });
  });

  describe('getEmptyStateMessage', () => {
    it('returns a message for tasks context', () => {
      const message = getEmptyStateMessage('tasks');

      expect(typeof message).toBe('string');
      expect(emptyStateMessages.tasks).toContain(message);
    });

    it('returns a message for vault context', () => {
      const message = getEmptyStateMessage('vault');

      expect(typeof message).toBe('string');
      expect(emptyStateMessages.vault).toContain(message);
    });

    it('returns a message for messages context', () => {
      const message = getEmptyStateMessage('messages');

      expect(typeof message).toBe('string');
      expect(emptyStateMessages.messages).toContain(message);
    });

    it('returns a message for family context', () => {
      const message = getEmptyStateMessage('family');

      expect(typeof message).toBe('string');
      expect(emptyStateMessages.family).toContain(message);
    });
  });
});
