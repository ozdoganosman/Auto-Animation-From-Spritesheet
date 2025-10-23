export type AnimationData = {
    frames: FrameData[];
    duration: number;
};

export type FrameData = {
    image: string;
    duration: number;
};

export type SpriteSheetData = {
    image: string;
    frameWidth: number;
    frameHeight: number;
    animations: { [key: string]: AnimationData };
};