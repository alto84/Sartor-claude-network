/**
 * Celebration Hook
 *
 * Easy-to-use hooks for triggering celebration effects throughout the app.
 */

import { useCallback } from "react";
import {
  celebrateTaskComplete,
  celebrateStar,
  celebrateMessage,
  celebrateAchievement,
  celebrateBig,
  sparkle,
  getOriginFromEvent,
  getOriginFromElement,
} from "@/lib/celebrations";

export type CelebrationType =
  | "task"
  | "star"
  | "message"
  | "achievement"
  | "milestone"
  | "sparkle";

/**
 * Hook to get celebration functions
 */
export function useCelebrations() {
  /**
   * Celebrate task completion
   */
  const celebrateTask = useCallback(
    (event?: MouseEvent | React.MouseEvent) => {
      const origin = event ? getOriginFromEvent(event) : undefined;
      celebrateTaskComplete(origin);
    },
    []
  );

  /**
   * Celebrate starring/favoriting
   */
  const celebrateFavorite = useCallback(
    (event?: MouseEvent | React.MouseEvent) => {
      const origin = event ? getOriginFromEvent(event) : undefined;
      celebrateStar(origin);
    },
    []
  );

  /**
   * Celebrate sending a message
   */
  const celebrateSend = useCallback(
    (event?: MouseEvent | React.MouseEvent) => {
      const origin = event ? getOriginFromEvent(event) : undefined;
      celebrateMessage(origin);
    },
    []
  );

  /**
   * Celebrate an achievement unlock
   */
  const celebrateUnlock = useCallback(() => {
    celebrateAchievement();
  }, []);

  /**
   * Big celebration for milestones
   */
  const celebrateMilestone = useCallback(() => {
    celebrateBig();
  }, []);

  /**
   * Small sparkle effect
   */
  const createSparkle = useCallback((x: number, y: number) => {
    sparkle(x, y);
  }, []);

  /**
   * Celebrate at an element's position
   */
  const celebrateAtElement = useCallback(
    (element: HTMLElement, type: CelebrationType = "task") => {
      const origin = getOriginFromElement(element);

      switch (type) {
        case "task":
          celebrateTaskComplete(origin);
          break;
        case "star":
          celebrateStar(origin);
          break;
        case "message":
          celebrateMessage(origin);
          break;
        case "achievement":
          celebrateAchievement();
          break;
        case "milestone":
          celebrateBig();
          break;
        case "sparkle":
          sparkle(
            origin.x * window.innerWidth,
            origin.y * window.innerHeight
          );
          break;
      }
    },
    []
  );

  return {
    celebrateTask,
    celebrateFavorite,
    celebrateSend,
    celebrateUnlock,
    celebrateMilestone,
    createSparkle,
    celebrateAtElement,
  };
}

/**
 * Create a click handler that triggers a celebration
 */
export function useCelebrationClick(
  type: CelebrationType,
  callback?: () => void
) {
  const celebrations = useCelebrations();

  return useCallback(
    (event: React.MouseEvent) => {
      const origin = getOriginFromEvent(event);

      switch (type) {
        case "task":
          celebrateTaskComplete(origin);
          break;
        case "star":
          celebrateStar(origin);
          break;
        case "message":
          celebrateMessage(origin);
          break;
        case "achievement":
          celebrateAchievement();
          break;
        case "milestone":
          celebrateBig();
          break;
      }

      if (callback) {
        callback();
      }
    },
    [type, callback]
  );
}

export default useCelebrations;
