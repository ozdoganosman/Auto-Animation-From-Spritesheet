import { Frame } from '../../core/Frame';

export class AsepriteParser {
    parse(data: any): Frame[] {
        const frames: Frame[] = [];

        const json: any = typeof data === 'string' ? safeJsonParse(data) : data ?? {};
        const list = Array.isArray(json.frames)
            ? json.frames
            : Array.isArray(json?.meta?.frameTags)
            ? json.meta.frameTags
            : [];

        for (const frameData of list) {
            const image = frameData?.filename ?? frameData?.name ?? '';
            const duration = Number(frameData?.duration ?? 100);
            frames.push(new Frame(image, duration));
        }

        return frames;
    }
}

function safeJsonParse(s: string): any {
    try {
        return JSON.parse(s);
    } catch {
        return {};
    }
}