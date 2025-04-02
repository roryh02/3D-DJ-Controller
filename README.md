# 3D DJ Controller

A web-based 3D DJ controller interface built with Three.js and Web Audio API. This project provides a virtual DJ setup with two turntables and a mixer, allowing users to load and mix audio tracks with visual feedback.

## Features

- Two virtual turntables with play/pause controls
- BPM control for each deck (115-125 BPM range)
- Volume faders for each deck
- 3-band EQ controls (Low, Mid, High) for each deck
- Real-time audio processing
- 3D visualization with interactive controls
- Responsive design
- Built-in drum loops for practice and mixing

## Drum Loops

The project includes a collection of drum loops in the `DrumLoops` directory:

These loops are perfect for:
- Practicing mixing techniques
- Testing the BPM controls
- Experimenting with EQ settings
- Learning the interface

To use the drum loops:
1. Load a drum loop file into either deck using the file input
2. Use the BPM controls to adjust the tempo (115-125 BPM range)
3. Mix between different loops using the volume faders
4. Shape the sound using the 3-band EQ controls

## Technologies Used

- Three.js for 3D rendering
- Web Audio API for audio processing
- Vite for development and building
- JavaScript (ES6+)

## Setup

### Using WebStorm (Recommended)

1. Open WebStorm
2. Clone the Repository "https://github.com/roryh02/3D-DJ-Controller.git"
3. Navigate to and select the 3D-DJ-Controller folder
4. Wait for WebStorm to index the project files
5. Open the integrated terminal (View -> Tool Windows -> Terminal)
6. Install dependencies:
```bash
npm install
```
7. Configure the run configuration:
   - Click on "More tool windows" in the left toolbar
   - Select "npm"
   - Open dev in the terminal
8.   Select `http://localhost:5173` and the project will open in your default browser.

### Using Command Line

1. Clone the repository:
```bash
git clone https://github.com/roryh02/3D-DJ-Controller.git
cd 3D-DJ-Controller
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Load audio files using the file inputs at the bottom of the screen
2. Use the play/pause buttons on each turntable to control playback
3. Adjust BPM using the sliders on each turntable
4. Control volume and EQ using the faders on the mixer
5. Use your mouse to rotate and zoom the view

## Project Structure

```
3D-DJ-Controller/
├── DrumLoops/          # Built-in drum loops for practice
├── src/                 # Source code
│   ├── main.js         # Main application logic
│   ├── index.html      # HTML template
│   └── styles.css      # CSS styles
├── package.json        # Project dependencies
└── README.md          # Project documentation
```

## License

MIT License - feel free to use this project for your own purposes. 