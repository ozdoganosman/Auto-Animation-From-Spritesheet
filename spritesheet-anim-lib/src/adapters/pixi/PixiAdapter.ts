declare const PIXI: any;

export class PixiAdapter {
    private spriteSheet: any;

    constructor(spriteSheet?: any) {
        this.spriteSheet = spriteSheet;
    }

    public createAnimation(animationName: string, _frameRate: number): any {
        if (!this.spriteSheet || !this.spriteSheet.animations) return null;
        const frames = this.spriteSheet.animations[animationName] || [];
        const textures = frames.map((frame: string) => (PIXI && PIXI.Texture ? PIXI.Texture.from(frame) : frame));
        return PIXI && PIXI.AnimatedSprite ? new PIXI.AnimatedSprite(textures) : { textures, play() {}, stop() {}, animationSpeed: 1 };
    }

    public playAnimation(animatedSprite: any): void {
        if (animatedSprite && typeof animatedSprite.play === 'function') animatedSprite.play();
    }

    public stopAnimation(animatedSprite: any): void {
        if (animatedSprite && typeof animatedSprite.stop === 'function') animatedSprite.stop();
    }

    public setAnimationSpeed(animatedSprite: any, speed: number): void {
        if (animatedSprite) animatedSprite.animationSpeed = speed;
    }

    public addToStage(animatedSprite: any, stage: any): void {
        if (stage && typeof stage.addChild === 'function') stage.addChild(animatedSprite);
    }
}