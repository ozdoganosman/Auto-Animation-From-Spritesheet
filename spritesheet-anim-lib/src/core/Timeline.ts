export class Timeline {
    private animations: Map<string, { startTime: number; duration: number; }>;

    constructor() {
        this.animations = new Map();
    }

    addAnimation(name: string, startTime: number, duration: number): void {
        this.animations.set(name, { startTime, duration });
    }

    removeAnimation(name: string): void {
        this.animations.delete(name);
    }

    update(time: number): void {
        this.animations.forEach((animation, name) => {
            if (time >= animation.startTime && time < animation.startTime + animation.duration) {
                // Logic to update the animation state
            }
        });
    }
}