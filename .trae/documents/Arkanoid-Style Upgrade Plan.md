# Arkanoid-Style Breakout Upgrade Plan

I will upgrade the game to match the classic "Arkanoid" style (NES version) with enhanced visuals, power-ups, and game mechanics.

## 1. Visual Overhaul
- **Background**: Replace the black background with a dark blue "tech/circuit" pattern.
- **Paddle (Vaus)**: Redesign the paddle from a simple rectangle to a metallic "Vaus" spaceship with engine details.
- **Bricks**: Add 3D bevel effects to bricks.
    - **Colored Bricks**: Standard 1-hit destroy.
    - **Silver Bricks**: Durable (require 2 hits to destroy).
    - **Gold Bricks**: Indestructible (optional, will use as "Hard" bricks for now).
- **UI**: Add a retro sidebar for High Score, 1UP, and Round number.

## 2. Gameplay Mechanics
- **Multi-Ball System**: Refactor the game engine to support multiple balls simultaneously (needed for the "Disruption" power-up).
- **Power-Up System**:
    - **Capsules**: Falling pills that appear randomly when bricks are destroyed.
    - **Types**:
        - **Enlarge (Blue 'E')**: Widens the paddle.
        - **Slow (Orange 'S')**: Slows down all balls.
        - **Multi-ball (Green 'M')**: Spawns 2 extra balls.
        - **Life (Grey 'P')**: Adds an extra life.
- **Level Design**: Create a more interesting brick layout (e.g., a pattern or shape) instead of a simple solid block.

## 3. Implementation Steps
1.  **Refactor**: Update `game.js` to use an array of `balls` instead of single variables.
2.  **Classes**: Create `PowerUp` class and enhance `Brick` objects with `hits` (health) and `type`.
3.  **Logic**: Implement power-up dropping, movement, and collision effects.
4.  **Rendering**:
    - Update `draw` functions for the new visual style.
    - Add the "circuit" background pattern.
5.  **Audio**: Add sounds for power-up collection and silver brick hits.

## 4. Verification
- Verify multi-ball physics work correctly.
- Verify power-up effects trigger properly.
- Verify silver bricks take 2 hits.
- Check mobile performance with the new visual elements.
