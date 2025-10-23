import { Frame } from '../../core/Frame';

export class GridParser {
    parse(data: any): Frame[] {
        const frames: Frame[] = [];
        const frameWidth = data?.frameWidth ?? 0;
        const frameHeight = data?.frameHeight ?? 0;
        const rows = data?.rows ?? 0;
        const cols = data?.cols ?? 0;
        const frameDuration = data?.frameDuration ?? 100;

        if (!frameWidth || !frameHeight || !rows || !cols) {
            // Insufficient data; return empty list rather than throwing
            return frames;
        }

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Avoid DOM usage in parsing to keep it environment-agnostic
                const name = `r${row}c${col}`;
                frames.push(new Frame(name, frameDuration));
            }
        }

        return frames;
    }
}