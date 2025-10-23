import { Frame } from './Frame';

export class Animation {
    private frames: Frame[];
    private currentFrameIndex: number;
    private isPlaying: boolean;
    private elapsedTime: number;

    constructor(frames: Frame[]) {
        this.frames = frames;
        this.currentFrameIndex = 0;
        this.isPlaying = false;
        this.elapsedTime = 0;
    }

    play(): void {
        this.isPlaying = true;
    }

    pause(): void {
        this.isPlaying = false;
    }

    stop(): void {
        this.isPlaying = false;
        this.currentFrameIndex = 0;
        this.elapsedTime = 0;
    }

    update(deltaTime: number): void {
        if (!this.isPlaying || this.frames.length === 0) return;

        this.elapsedTime += deltaTime;

        const currentFrame = this.frames[this.currentFrameIndex];
        if (this.elapsedTime >= currentFrame.duration) {
            this.elapsedTime = 0;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
        }
    }

    getCurrentFrame(): Frame | undefined {
        return this.frames[this.currentFrameIndex];
    }
}