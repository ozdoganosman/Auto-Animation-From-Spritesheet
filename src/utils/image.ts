export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
    });
}

export function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width?: number, height?: number): void {
    if (width && height) {
        ctx.drawImage(img, x, y, width, height);
    } else {
        ctx.drawImage(img, x, y);
    }
}

export type Rect = { x: number; y: number; w: number; h: number };

export type AutoGridResult = {
    cols: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
    rects: Rect[]; // exact source rects for each frame (row-major)
};

// Auto-detect grid by scanning fully transparent columns/rows as separators.
// Assumptions: frames are arranged on a grid with transparent gaps between tiles.
export function autoDetectGrid(
    img: HTMLImageElement,
    options?: { alphaThreshold?: number; bgTolerance?: number; bgColor?: [number, number, number] }
): AutoGridResult | null {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;

    const mask = computeForegroundMask(img, {
        alphaThreshold: options?.alphaThreshold,
        bgTolerance: options?.bgTolerance,
        bgColor: options?.bgColor,
    });
    const integral = buildMaskIntegral(mask.data, w, h);

    const colHasPixel: boolean[] = new Array(w).fill(false);
    const rowHasPixel: boolean[] = new Array(h).fill(false);

    for (let y = 0; y < h; y++) {
        const s = rectSum(integral, w, h, 0, y, w, 1);
        if (s > 0) rowHasPixel[y] = true;
    }
    for (let x = 0; x < w; x++) {
        const s = rectSum(integral, w, h, x, 0, 1, h);
        if (s > 0) colHasPixel[x] = true;
    }

    const colSegments = mergeSmallGaps(toSegments(colHasPixel), 1);
    const rowSegments = mergeSmallGaps(toSegments(rowHasPixel), 1);

    if (colSegments.length === 0 || rowSegments.length === 0) return null;

    // Build rects by cartesian product of segments
    const rects: Rect[] = [];
    for (const rs of rowSegments) {
        for (const cs of colSegments) {
            const sum = rectSum(integral, w, h, cs.start, rs.start, cs.len, rs.len);
            if (sum > 0) rects.push({ x: cs.start, y: rs.start, w: cs.len, h: rs.len });
        }
    }

    // Derive frame size via mode of segment lengths
    const frameWidth = mostCommonLength(colSegments.map(s => s.len));
    const frameHeight = mostCommonLength(rowSegments.map(s => s.len));

    return {
        cols: colSegments.length,
        rows: rowSegments.length,
        frameWidth,
        frameHeight,
        rects
    };
}

function toSegments(hasPixel: boolean[]): Array<{ start: number; len: number }> {
    const segs: Array<{ start: number; len: number }> = [];
    const n = hasPixel.length;
    let start = -1;
    for (let i = 0; i < n; i++) {
        const filled = hasPixel[i];
        if (filled && start === -1) start = i; // begin non-empty segment
        if (!filled && start !== -1) {
            segs.push({ start, len: i - start });
            start = -1;
        }
    }
    if (start !== -1) segs.push({ start, len: n - start });
    return segs;
}

function mostCommonLength(arr: number[]): number {
    const freq: Record<string, number> = {};
    let best = arr[0] || 0;
    let max = 0;
    for (const v of arr) {
        const k = String(v);
        const f = (freq[k] = (freq[k] || 0) + 1);
        if (f > max) { max = f; best = v; }
    }
    return best;
}

export type AutoAnimation = { name: string; rects: Rect[] };
export type AutoAnimationsResult = {
    frameWidth: number;
    frameHeight: number;
    cols: number;
    animations: AutoAnimation[]; // one per non-empty row band
};

// Higher-level helper: split the sheet into multiple animation strips (one per non-empty row band)
export function autoDetectAnimations(
    img: HTMLImageElement,
    options?: {
        alphaThreshold?: number;
        minFillRatio?: number;
        bgTolerance?: number;
        bgColor?: [number, number, number];
        // Heuristic tuning
        motionEpsilon?: number;   // px threshold to consider as motion on an axis
        biasEpsilon?: number;     // px threshold to consider bias significant
        areaSpikeRatio?: number;  // area peak vs mean ratio for 'attack'
        jumpRatio?: number;       // vertical motion dominance ratio for 'jump'
        jerkinessRatio?: number;  // step variance indicator for 'hurt'
        // Optional row-direction mapping for classic 4-strip sheets
        rowDirections?: Array<'up' | 'right' | 'down' | 'left'>;
    }
): AutoAnimationsResult | null {
    const minFillRatio = options?.minFillRatio ?? 0.01; // kare içinde en az %1 doluluk olsun
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;

    const maskRes = computeForegroundMask(img, {
        alphaThreshold: options?.alphaThreshold,
        bgTolerance: options?.bgTolerance,
        bgColor: options?.bgColor,
    });
    const mask = maskRes.data;
    const integral = buildMaskIntegral(mask, w, h);

    // Row presence (any opaque pixel in row)
    const rowHasPixel: boolean[] = new Array(h).fill(false);
    for (let y = 0; y < h; y++) {
        const s = rectSum(integral, w, h, 0, y, w, 1);
        if (s > 0) rowHasPixel[y] = true;
    }
    const rowSegments = toSegments(rowHasPixel);
    if (!rowSegments.length) return null;

    // First pass for typical sizes using whole-image column presence
    const colHasPixelGlobal: boolean[] = new Array(w).fill(false);
    for (let x = 0; x < w; x++) {
        const s = rectSum(integral, w, h, x, 0, 1, h);
        if (s > 0) colHasPixelGlobal[x] = true;
    }
    const colSegmentsGlobal = mergeSmallGaps(toSegments(colHasPixelGlobal), 1);

    const frameHeight = mostCommonLength(rowSegments.map(s => s.len));
    const frameWidth = colSegmentsGlobal.length ? mostCommonLength(colSegmentsGlobal.map(s => s.len)) : frameHeight; // fallback

    const animations: AutoAnimation[] = [];
    for (let rIdx = 0; rIdx < rowSegments.length; rIdx++) {
        const rs = rowSegments[rIdx];
        // Column presence restricted to this row band
        const colHasPixelRow: boolean[] = new Array(w).fill(false);
        for (let x = 0; x < w; x++) {
            const s = rectSum(integral, w, h, x, rs.start, 1, rs.len);
            if (s > 0) colHasPixelRow[x] = true;
        }
        const colSegmentsRow = mergeSmallGaps(toSegments(colHasPixelRow), 1);

    const rects: Rect[] = [];
        for (const cs of colSegmentsRow) {
            const filled = rectSum(integral, w, h, cs.start, rs.start, cs.len, rs.len);
            const area = cs.len * rs.len;
            if (area <= 0) continue;
            const ratio = filled / area;
            if (ratio >= minFillRatio) {
                rects.push({ x: cs.start, y: rs.start, w: cs.len, h: rs.len });
            }
        }
        if (rects.length) {
            // Heuristic naming based on centroid/area motion and optional row direction mapping
            const preferredDir = options?.rowDirections && options.rowDirections[rIdx] ? options.rowDirections[rIdx] : undefined;
            const name = classifyAnimation(
                rects,
                mask,
                w,
                integral,
                {
                    motionEpsilon: options?.motionEpsilon,
                    biasEpsilon: options?.biasEpsilon,
                    areaSpikeRatio: options?.areaSpikeRatio,
                    jumpRatio: options?.jumpRatio,
                    jerkinessRatio: options?.jerkinessRatio,
                    preferredDirection: preferredDir,
                }
            );
            animations.push({ name, rects });
        }
    }

    // Derive a representative cols value (mode of frame counts)
    const cols = animations.length ? mostCommonLength(animations.map(a => a.rects.length)) : 0;

    return {
        frameWidth,
        frameHeight,
        cols,
        animations
    };
}

// --- Heuristic classifier for animation type and direction ---
function classifyAnimation(
    rects: Rect[],
    mask: Uint8Array,
    imgW: number,
    integral: Int32Array,
    opts?: {
        motionEpsilon?: number;
        biasEpsilon?: number;
        areaSpikeRatio?: number;
        jumpRatio?: number;
        jerkinessRatio?: number;
        preferredDirection?: 'up' | 'right' | 'down' | 'left';
    }
): string {
    const motionEps = opts?.motionEpsilon ?? 2;
    const biasEps = opts?.biasEpsilon ?? 0.5;
    const areaSpike = opts?.areaSpikeRatio ?? 1.35;
    const jumpDom = opts?.jumpRatio ?? 1.6; // vertical dominance factor

    const centers: Array<{ cx: number; cy: number }> = [];
    for (const r of rects) {
        const c = centroidFromMask(mask, imgW, r);
        centers.push({ cx: c.cx, cy: c.cy });
    }
    if (!centers.length) return 'anim';

    // Ranges of motion
    const xs = centers.map(c => c.cx);
    const ys = centers.map(c => c.cy);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    // Mean bias relative to cell center
    const meanBiasX = centers.reduce((a, c, i) => a + (c.cx - rects[i].w / 2), 0) / centers.length;
    const meanBiasY = centers.reduce((a, c, i) => a + (c.cy - rects[i].h / 2), 0) / centers.length;

    // Area per frame using integral
    const imgH = (integral.length / (imgW + 1)) - 1; // since integral is (w+1)*(h+1)
    const areas = rects.map(r => rectSum(integral, imgW, imgH, r.x, r.y, r.w, r.h));
    const meanArea = areas.reduce((a, v) => a + v, 0) / Math.max(1, areas.length);
    const maxArea = Math.max(...areas);
    const minArea = Math.min(...areas);
    const areaRangeRatio = meanArea > 0 ? (maxArea / Math.max(1, meanArea)) : 1;

    // Determine type
    let type = 'walk';
    const lowMotion = (rangeX < motionEps && rangeY < motionEps) || rects.length <= 2;
    if (lowMotion) type = 'idle';

    // Advanced labels
    if (type !== 'idle') {
        if (areaRangeRatio >= areaSpike) {
            type = 'attack';
        } else if (rangeY > rangeX * jumpDom) {
            // look for an up-down or down-up turning point
            let signChanges = 0;
            for (let i = 1; i < centers.length - 1; i++) {
                const dy1 = centers[i].cy - centers[i - 1].cy;
                const dy2 = centers[i + 1].cy - centers[i].cy;
                if (dy1 === 0 || dy2 === 0) continue;
                if ((dy1 > 0 && dy2 < 0) || (dy1 < 0 && dy2 > 0)) signChanges++;
            }
            if (signChanges >= 1) type = 'jump';
        } else {
            // jerkiness for 'hurt'
            let stepSum = 0;
            for (let i = 1; i < centers.length; i++) {
                const dx = centers[i].cx - centers[i - 1].cx;
                const dy = centers[i].cy - centers[i - 1].cy;
                stepSum += Math.hypot(dx, dy);
            }
            const denom = (rangeX + rangeY) > 0 ? (rangeX + rangeY) : 1;
            const jerkiness = stepSum / denom;
            if (jerkiness > (opts?.jerkinessRatio ?? 2.2)) type = 'hurt';
        }
    }

    // Determine direction by larger motion axis or bias
    let dir = '';
    if (opts?.preferredDirection) {
        dir = opts.preferredDirection;
    } else {
        if (rangeX > rangeY + biasEps) {
            dir = meanBiasX >= 0 ? 'right' : 'left';
        } else if (rangeY > rangeX + biasEps) {
            dir = meanBiasY >= 0 ? 'down' : 'up';
        } else {
            if (Math.abs(meanBiasX) > Math.abs(meanBiasY) + biasEps) dir = meanBiasX >= 0 ? 'right' : 'left';
            else if (Math.abs(meanBiasY) > biasEps) dir = meanBiasY >= 0 ? 'down' : 'up';
        }
    }

    return dir ? `${type}_${dir}` : type;
}

function centroidFromMask(mask: Uint8Array, imgW: number, r: Rect): { cx: number; cy: number; count: number } {
    let sumX = 0, sumY = 0, count = 0;
    for (let y = r.y; y < r.y + r.h; y++) {
        const row = y * imgW;
        for (let x = r.x; x < r.x + r.w; x++) {
            if (mask[row + x]) {
                sumX += (x - r.x);
                sumY += (y - r.y);
                count++;
            }
        }
    }
    if (count === 0) return { cx: r.w / 2, cy: r.h / 2, count: 0 };
    return { cx: sumX / count, cy: sumY / count, count };
}

function buildMaskIntegral(mask: Uint8Array, w: number, h: number): Int32Array {
    const integral = new Int32Array((w + 1) * (h + 1));
    for (let y = 1; y <= h; y++) {
        let rowsum = 0;
        for (let x = 1; x <= w; x++) {
            const v = mask[(y - 1) * w + (x - 1)] ? 1 : 0;
            rowsum += v;
            const idx = y * (w + 1) + x;
            integral[idx] = integral[(y - 1) * (w + 1) + x] + rowsum;
        }
    }
    return integral;
}

function rectSum(integral: Int32Array, imgW: number, imgH: number, x: number, y: number, w: number, h: number): number {
    // imgW/imgH are the original image dimensions used to build integral
    const stride = imgW + 1;
    const x1 = x, y1 = y, x2 = x + w, y2 = y + h;
    const A = integral[y1 * stride + x1];
    const B = integral[y1 * stride + x2];
    const C = integral[y2 * stride + x1];
    const D = integral[y2 * stride + x2];
    return D - B - C + A;
}

function computeForegroundMask(
    img: HTMLImageElement,
    opts?: { alphaThreshold?: number; bgTolerance?: number; bgColor?: [number, number, number] }
): { data: Uint8Array } {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const rgba = ctx.getImageData(0, 0, w, h).data;

    const alphaThr = opts?.alphaThreshold ?? 1;
    let bg: [number, number, number];
    if (opts?.bgColor) {
        bg = opts.bgColor;
    } else {
        bg = estimateBackgroundColor(rgba, w, h);
    }
    const tol = opts?.bgTolerance ?? 16; // 0..255 per channel; Euclidean approx via L1

    const out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
        const r = rgba[i * 4 + 0];
        const g = rgba[i * 4 + 1];
        const b = rgba[i * 4 + 2];
        const a = rgba[i * 4 + 3];
        const d = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
        out[i] = a >= alphaThr && d > tol ? 1 : 0;
    }
    return { data: out };
}

function estimateBackgroundColor(rgba: Uint8ClampedArray, w: number, h: number): [number, number, number] {
    // Sample border pixels and take the most frequent (by simple binning)
    const samples: Array<[number, number, number]> = [];
    const pushPixel = (idx: number) => {
        samples.push([rgba[idx], rgba[idx + 1], rgba[idx + 2]]);
    };
    for (let x = 0; x < w; x++) {
        pushPixel((0 * w + x) * 4);
        pushPixel(((h - 1) * w + x) * 4);
    }
    for (let y = 0; y < h; y++) {
        pushPixel((y * w + 0) * 4);
        pushPixel((y * w + (w - 1)) * 4);
    }
    // Bin colors into 16-level buckets per channel
    const map = new Map<string, [number, number, number, number]>();
    for (const [r, g, b] of samples) {
        const R = (r >> 4) & 0xf;
        const G = (g >> 4) & 0xf;
        const B = (b >> 4) & 0xf;
        const key = `${R},${G},${B}`;
        const entry = map.get(key);
        if (entry) entry[3] += 1; else map.set(key, [R, G, B, 1]);
    }
    let best: [number, number, number, number] = [0, 0, 0, -1];
    for (const v of map.values()) {
        if (v[3] > best[3]) best = v;
    }
    // Convert back to 0..255 by mid-bucket
    return [best[0] * 16 + 8, best[1] * 16 + 8, best[2] * 16 + 8];
}

function mergeSmallGaps(segments: Array<{ start: number; len: number }>, maxGap: number): Array<{ start: number; len: number }> {
    if (segments.length <= 1) return segments;
    const out: Array<{ start: number; len: number }> = [];
    let cur = { ...segments[0] };
    for (let i = 1; i < segments.length; i++) {
        const prevEnd = cur.start + cur.len;
        const gap = segments[i].start - prevEnd;
        if (gap <= maxGap) {
            // merge
            const newEnd = segments[i].start + segments[i].len;
            cur.len = newEnd - cur.start;
        } else {
            out.push(cur);
            cur = { ...segments[i] };
        }
    }
    out.push(cur);
    return out;
}