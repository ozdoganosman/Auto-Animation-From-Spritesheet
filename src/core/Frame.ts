export class Frame {
    image: any;
    duration: number;

    constructor(image: any, duration: number) {
        this.image = image;
        this.duration = duration;
    }

    getImage(): any {
        return this.image;
    }

    getDuration(): number {
        return this.duration;
    }

    setImage(image: any): void {
        this.image = image;
    }

    setDuration(duration: number): void {
        this.duration = duration;
    }
}