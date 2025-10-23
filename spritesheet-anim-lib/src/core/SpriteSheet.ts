import { Frame } from './Frame';
import { Animation } from './Animation';

export class SpriteSheet {
    private image?: any;
    private frames: Frame[];
    private animations: Map<string, Animation>;

    constructor() {
        this.frames = [];
        this.animations = new Map();
    }

    public async load(imageUrl: string): Promise<void> {
        this.image = await this.loadImage(imageUrl);
    }

    private loadImage(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = (error) => reject(error);
        });
    }

    public getFrame(index: number): Frame | undefined {
        return this.frames[index];
    }

    public getAnimation(animationName: string): Animation | undefined {
        return this.animations.get(animationName);
    }

    public addFrame(frame: Frame): void {
        this.frames.push(frame);
    }

    public addAnimation(name: string, animation: Animation): void {
        this.animations.set(name, animation);
    }
}