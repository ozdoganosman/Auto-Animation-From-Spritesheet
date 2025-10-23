import { Frame } from '../../core/Frame';

export class TexturePackerParser {
    parse(data: any): Frame[] {
        const frames: Frame[] = [];

        const json: any = typeof data === 'string' ? safeJsonParse(data) : data ?? {};
        const tpFrames = Array.isArray(json?.frames)
            ? json.frames
            : (json && typeof json?.frames === 'object')
            ? objectValues(json.frames)
            : [];

        for (const f of tpFrames) {
            const image = f?.filename ?? f?.name ?? '';
            const duration = Number(f?.duration ?? 100);
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

function objectValues(obj: any): any[] {
    const arr: any[] = [];
    for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
            arr.push(obj[k]);
        }
    }
    return arr;
}