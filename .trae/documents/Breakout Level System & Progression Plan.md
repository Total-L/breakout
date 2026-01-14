I will implement a level system with 5 distinct stages, increasing difficulty, and smooth transitions.

## 1. Level Design (Algorithmic & Responsive)
Since the game runs on both Desktop (10 columns) and Mobile (6 columns), I will use **algorithmic level generation** instead of fixed arrays. This ensures the patterns look good on any screen size.

*   **Level 1: The Classic**
    *   Standard solid rows of bricks.
    *   *Difficulty:* Low. Standard speed.
*   **Level 2: The Columns**
    *   Vertical columns with gaps between them. Requires better aim.
    *   *Difficulty:* Medium.
*   **Level 3: The Pyramid**
    *   Bricks arranged in a triangle/pyramid shape (fewer at bottom, more at top).
    *   *Difficulty:* Medium-Hard.
*   **Level 4: The Checkerboard**
    *   Alternating bricks and empty spaces.
    *   *Difficulty:* Hard. High chance of "Silver" (2-hit) bricks.
*   **Level 5: The Fortress**
    *   A block of bricks surrounded by "Silver" (hard) bricks on the outside.
    *   *Difficulty:* Expert. Faster ball speed.

## 2. Difficulty Progression
*   **Speed:** Base ball speed will increase by **10-15%** for each new level.
*   **Brick Hardness:**
    *   Level 1-2: Mostly normal bricks.
    *   Level 3-4: 20-30% Silver bricks (2 hits).
    *   Level 5: Gold/Silver bricks (3+ hits) protecting weak points.
*   **Paddle:** Paddle size resets to default at the start of each level (removes "Expand" power-up if active).

## 3. Game Flow & Transitions
*   **New Game State:** Introduce `LEVEL_TRANSITION` state.
*   **Transition Effect:**
    *   When all bricks are cleared, the game pauses.
    *   Overlay text: "LEVEL 1 COMPLETE" -> "READY FOR LEVEL 2".
    *   After 2 seconds, the new level loads with the ball reset to the paddle.
*   **Win Condition:** Completing Level 5 loops back to Level 1 (New Game+) with retained score but even faster speed, or shows a "You Win" screen.

## 4. Implementation Steps
1.  **Refactor `initBricks`:** Modify it to accept a `level` parameter and use switch-case logic to generate different patterns based on `(col, row)` coordinates.
2.  **Update Game Loop:** Modify `collisionDetection` to detect "Level Clear" -> trigger Transition -> Load Next Level.
3.  **Visuals:** Add `drawLevelTransition()` to render the inter-level text on the Canvas.
4.  **Mobile Adaptation:** Ensure all patterns scale correctly to the reduced column count on mobile.
