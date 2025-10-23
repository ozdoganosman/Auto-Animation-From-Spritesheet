export class PhaserAdapter {
    private scene: any;

    constructor(scene?: any) {
        this.scene = scene;
    }

    public createAnimation(key: string, frames: string[], frameRate: number, loop: boolean = true): void {
        if (!this.scene || !this.scene.anims) return;
        this.scene.anims.create({
            key: key,
            frames: frames.map((frame: string) => ({ key: frame })),
            frameRate: frameRate,
            repeat: loop ? -1 : 0
        });
    }

    public playAnimation(sprite: any, animationKey: string): void {
        if (sprite && typeof sprite.play === 'function') sprite.play(animationKey);
    }

    public stopAnimation(sprite: any): void {
        if (sprite && typeof sprite.stop === 'function') sprite.stop();
    }

    public updateAnimation(_sprite: any, _deltaTime: number): void {
        // no-op in adapter; engine handles timing
    }
}