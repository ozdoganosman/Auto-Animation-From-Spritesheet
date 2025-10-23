import { GenericJSONExporter } from '../src/exporters/GenericJSONExporter';
import { MetadataExporter } from '../src/exporters/MetadataExporter';

describe('Exporters', () => {
    let jsonExporter: GenericJSONExporter;
    let metadataExporter: MetadataExporter;

    beforeEach(() => {
        jsonExporter = new GenericJSONExporter();
        metadataExporter = new MetadataExporter();
    });

    test('GenericJSONExporter should export animation data correctly', () => {
        const animationData = {
            frames: [
                { image: 'frame1.png', duration: 100 },
                { image: 'frame2.png', duration: 100 }
            ]
        };
        const exportedData = jsonExporter.export(animationData);
        expect(exportedData).toEqual(JSON.stringify(animationData));
    });

    test('MetadataExporter should export metadata correctly', () => {
        const metadata = {
            name: 'Test Animation',
            frameCount: 2,
            duration: 200
        };
        const exportedMetadata = metadataExporter.export(metadata);
        expect(exportedMetadata).toEqual(`Name: Test Animation, Frame Count: 2, Duration: 200`);
    });
});