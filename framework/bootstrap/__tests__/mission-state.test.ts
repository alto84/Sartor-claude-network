/**
 * Tests for Mission State Tracker
 */

import { describe, it, expect } from '@jest/globals';
import {
  getMissionContext,
  getPhaseRestrictions,
  formatMissionContextForPrompt,
  getCurrentMissionState,
  type MissionConfig,
  type MissionContext,
} from './mission-state.js';

describe('Mission State Tracker', () => {
  describe('getPhaseRestrictions', () => {
    it('should return bootstrap restrictions', () => {
      const restrictions = getPhaseRestrictions('bootstrap');
      expect(restrictions).toContain('Full access granted - learning mode');
      expect(restrictions).toContain('Focus on initialization and setup');
    });

    it('should return research restrictions', () => {
      const restrictions = getPhaseRestrictions('research');
      expect(restrictions).toContain('Read-only mode - no code changes');
      expect(restrictions).toContain('Must cite sources for all claims');
    });

    it('should return implementation restrictions', () => {
      const restrictions = getPhaseRestrictions('implementation');
      expect(restrictions).toContain('Can edit code and create files');
      expect(restrictions).toContain('Must write tests for all changes');
    });

    it('should return validation restrictions', () => {
      const restrictions = getPhaseRestrictions('validation');
      expect(restrictions).toContain('Run tests and verify correctness');
      expect(restrictions).toContain('No fabrication of test results');
    });

    it('should return reporting restrictions', () => {
      const restrictions = getPhaseRestrictions('reporting');
      expect(restrictions).toContain('No new code changes allowed');
      expect(restrictions).toContain('Synthesis and documentation only');
    });

    it('should handle unknown phase', () => {
      const restrictions = getPhaseRestrictions('unknown');
      expect(restrictions).toContain('Unknown phase - proceed with caution');
    });
  });

  describe('urgency calculation', () => {
    it('should return critical urgency for <4 hours remaining', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        final_report_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.urgency).toBe('critical');
    });

    it('should return high urgency for 4-12 hours remaining', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
        final_report_time: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.urgency).toBe('high');
    });

    it('should return medium urgency for 12-24 hours remaining', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
        final_report_time: new Date(Date.now() + 17 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.urgency).toBe('medium');
    });

    it('should return low urgency for >24 hours remaining', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(), // 30 hours from now
        final_report_time: new Date(Date.now() + 29 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.urgency).toBe('low');
    });
  });

  describe('phase detection', () => {
    it('should detect bootstrap phase (<10% progress)', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 99 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 98 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.phase).toBe('bootstrap');
    });

    it('should detect research phase (10-40% progress)', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 80 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 79 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.phase).toBe('research');
    });

    it('should detect implementation phase (40-70% progress)', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.phase).toBe('implementation');
    });

    it('should detect validation phase (70-90% progress)', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.phase).toBe('validation');
    });

    it('should detect reporting phase (90-100% progress)', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 95 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.phase).toBe('reporting');
    });
  });

  describe('checkpoints generation', () => {
    it('should generate bootstrap checkpoints', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 99 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 98 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.checkpoints).toContain('Load mission configuration');
      expect(context.checkpoints).toContain('Initialize memory systems');
    });

    it('should add urgent checkpoint when <1 hour remaining', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 99 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 0.5 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 0.4 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.checkpoints).toContain('URGENT: Wrap up immediately');
    });

    it('should add transition checkpoint when <4 hours remaining', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.checkpoints).toContain('Begin transition to reporting phase');
    });
  });

  describe('warnings', () => {
    it('should add validation transition warning at 70% progress', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.warnings.some(w => w.includes('validation phase'))).toBe(true);
    });

    it('should add reporting transition warning at 90% progress', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 92 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.warnings.some(w => w.includes('reporting phase'))).toBe(true);
    });
  });

  describe('formatMissionContextForPrompt', () => {
    it('should format context with all sections', () => {
      const context: MissionContext = {
        phase: 'implementation',
        deadline: '2025-12-31T23:59:59Z',
        progressPercent: 50,
        urgency: 'medium',
        restrictions: ['Must write tests', 'No untested code'],
        checkpoints: ['Write code', 'Run tests'],
        warnings: ['Test warning'],
      };

      const formatted = formatMissionContextForPrompt(context);

      expect(formatted).toContain('Phase**: IMPLEMENTATION');
      expect(formatted).toContain('Deadline**: 2025-12-31T23:59:59Z');
      expect(formatted).toContain('Progress**: 50.0%');
      expect(formatted).toContain('Urgency Level**: MEDIUM');
      expect(formatted).toContain('Must write tests');
      expect(formatted).toContain('Write code');
      expect(formatted).toContain('Test warning');
    });

    it('should include urgency indicator for critical', () => {
      const context: MissionContext = {
        phase: 'reporting',
        deadline: '2025-12-31T23:59:59Z',
        progressPercent: 95,
        urgency: 'critical',
        restrictions: [],
        checkpoints: [],
        warnings: [],
      };

      const formatted = formatMissionContextForPrompt(context);
      expect(formatted).toContain('[CRITICAL URGENCY]');
    });

    it('should not show warnings section when empty', () => {
      const context: MissionContext = {
        phase: 'bootstrap',
        deadline: '2025-12-31T23:59:59Z',
        progressPercent: 5,
        urgency: 'low',
        restrictions: ['Focus on setup'],
        checkpoints: ['Load config'],
        warnings: [],
      };

      const formatted = formatMissionContextForPrompt(context);
      expect(formatted).not.toContain('### WARNINGS');
    });
  });

  describe('integration with getCurrentMissionState', () => {
    it('should handle complete phase by mapping to reporting', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Past deadline
        final_report_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);
      expect(context.phase).toBe('reporting');
    });

    it('should include all required fields', () => {
      const config: MissionConfig = {
        name: 'test-mission',
        start_time: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
        final_report_time: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
      };

      const context = getMissionContext(config);

      expect(context).toHaveProperty('phase');
      expect(context).toHaveProperty('deadline');
      expect(context).toHaveProperty('progressPercent');
      expect(context).toHaveProperty('urgency');
      expect(context).toHaveProperty('restrictions');
      expect(context).toHaveProperty('checkpoints');
      expect(context).toHaveProperty('warnings');

      expect(Array.isArray(context.restrictions)).toBe(true);
      expect(Array.isArray(context.checkpoints)).toBe(true);
      expect(Array.isArray(context.warnings)).toBe(true);
    });
  });
});
