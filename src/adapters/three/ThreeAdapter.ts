export class ThreeAdapter {
    constructor() {
        // Placeholder adapter for Three.js; safe no-ops for tests
    }

    loadSpriteSheet(_spriteSheet: any): void {
        // Load the sprite sheet into Three.js (not implemented in tests)
    }

    createAnimation(_animationData: any): any {
        // Create a Three.js animation from the provided animation data
        return {};
    }

    playAnimation(_animation: any): void {
        // no-op
    }

    stopAnimation(_animation: any): void {
        // no-op
    }

    update(_deltaTime: number): void {
        // no-op
    }
}