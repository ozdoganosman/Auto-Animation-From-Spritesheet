import { AsepriteParser } from '../src/parsers/aseprite/AsepriteParser';
import { TexturePackerParser } from '../src/parsers/texturepacker/TexturePackerParser';
import { GridParser } from '../src/parsers/grid/GridParser';

describe('AsepriteParser', () => {
    let parser: AsepriteParser;

    beforeEach(() => {
        parser = new AsepriteParser();
    });

    it('should parse Aseprite data correctly', () => {
        const data = {}; // Mock Aseprite data
        const frames = parser.parse(data);
        expect(frames).toBeDefined();
        // Additional assertions based on expected output
    });
});

describe('TexturePackerParser', () => {
    let parser: TexturePackerParser;

    beforeEach(() => {
        parser = new TexturePackerParser();
    });

    it('should parse TexturePacker data correctly', () => {
        const data = {}; // Mock TexturePacker data
        const frames = parser.parse(data);
        expect(frames).toBeDefined();
        // Additional assertions based on expected output
    });
});

describe('GridParser', () => {
    let parser: GridParser;

    beforeEach(() => {
        parser = new GridParser();
    });

    it('should parse grid data correctly', () => {
        const data = {}; // Mock grid data
        const frames = parser.parse(data);
        expect(frames).toBeDefined();
        // Additional assertions based on expected output
    });
});