export class MetadataExporter {
    export(metadata: any): string {
        const name = metadata?.name ?? '';
        const frameCount = metadata?.frameCount ?? 0;
        const duration = metadata?.duration ?? 0;
        return `Name: ${name}, Frame Count: ${frameCount}, Duration: ${duration}`;
    }
}