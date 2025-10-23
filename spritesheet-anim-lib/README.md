# Spritesheet Animation Library

This library provides a comprehensive solution for converting spritesheets into animations for use in various game projects. It supports multiple formats and frameworks, making it versatile for developers.

## Features

- **Animation Management**: Create and control animations with ease.
- **Multiple Parsers**: Supports Aseprite, TexturePacker, and grid-based spritesheets.
- **Exporters**: Export animation data in JSON format and metadata.
- **Framework Adapters**: Integrate seamlessly with Phaser, PixiJS, and Three.js.
- **Utility Functions**: Includes utilities for image manipulation and mathematical operations.

## Development

This repo is set up with TypeScript and Jest.


```powershell
npm install
```


```powershell
npm test
```


```powershell
npm run build
```

## Deploying the demo

### Netlify (recommended)
This repo includes a `netlify.toml` so you can deploy with a few clicks:

1. Push this repo to GitHub (already done).
2. In Netlify: Add new site → Import from Git → pick this repo.
3. Build command: auto-detected from `netlify.toml` (or set `npm run site`).
4. Publish directory: `dist`.
5. Deploy. Root path will redirect to `demo/`.

Optional CLI deploy (requires login):

```powershell
# one-time
npm i -g netlify-cli
netlify login

# inside project
netlify init   # link to a new or existing site
npm run site
netlify deploy --dir=dist --prod
```

### GitHub Pages
GitHub Actions workflow `deploy-pages.yml` builds and publishes to Pages when you push to `main` or `master`.

## Usage

### Basic Example

```typescript
import { SpriteSheet, Animation, GridParser } from './src';

const sheet = new SpriteSheet();
// load image if running in browser
// await sheet.load('path/to/spritesheet.png');

// create frames via grid parser (no DOM required)
const grid = new GridParser();
const frames = grid.parse({ frameWidth: 64, frameHeight: 64, rows: 1, cols: 8, frameDuration: 80 });
const anim = new Animation(frames);
anim.play();
```

### Parsing Spritesheets

You can parse different types of spritesheets using the provided parsers:

```typescript
import { AsepriteParser } from './src/parsers/aseprite/AsepriteParser';

const parser = new AsepriteParser();
const frames = parser.parse({ frames: [{ filename: 'idle_0.png', duration: 80 }] });
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.