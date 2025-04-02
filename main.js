import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { gsap } from 'gsap';
import { GUI } from 'dat.gui';

class DJController {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff); // White background
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.deck1 = {
            audio: null,
            isPlaying: false,
            rotation: 0,
            speed: 1,
            source: null,
            gainNode: this.audioContext.createGain(),
            bpm: 120,
            bpmText: null,
            eq: {
                low: this.audioContext.createBiquadFilter(),
                mid: this.audioContext.createBiquadFilter(),
                high: this.audioContext.createBiquadFilter()
            }
        };
        // Setup EQ filters for deck1
        this.deck1.eq.low.type = 'lowshelf';
        this.deck1.eq.low.frequency.value = 250;
        this.deck1.eq.mid.type = 'peaking';
        this.deck1.eq.mid.frequency.value = 1000;
        this.deck1.eq.mid.Q.value = 1;
        this.deck1.eq.high.type = 'highshelf';
        this.deck1.eq.high.frequency.value = 4000;
        
        // Connect EQ chain for deck1
        this.deck1.eq.low.connect(this.deck1.eq.mid);
        this.deck1.eq.mid.connect(this.deck1.eq.high);
        this.deck1.eq.high.connect(this.deck1.gainNode);
        this.deck1.gainNode.connect(this.audioContext.destination);
        
        this.deck2 = {
            audio: null,
            isPlaying: false,
            rotation: 0,
            speed: 1,
            source: null,
            gainNode: this.audioContext.createGain(),
            bpm: 120,
            bpmText: null,
            eq: {
                low: this.audioContext.createBiquadFilter(),
                mid: this.audioContext.createBiquadFilter(),
                high: this.audioContext.createBiquadFilter()
            }
        };
        // Setup EQ filters for deck2
        this.deck2.eq.low.type = 'lowshelf';
        this.deck2.eq.low.frequency.value = 250;
        this.deck2.eq.mid.type = 'peaking';
        this.deck2.eq.mid.frequency.value = 1000;
        this.deck2.eq.mid.Q.value = 1;
        this.deck2.eq.high.type = 'highshelf';
        this.deck2.eq.high.frequency.value = 4000;
        
        // Connect EQ chain for deck2
        this.deck2.eq.low.connect(this.deck2.eq.mid);
        this.deck2.eq.mid.connect(this.deck2.eq.high);
        this.deck2.eq.high.connect(this.deck2.gainNode);
        this.deck2.gainNode.connect(this.audioContext.destination);

        this.mixer = {
            deck1Volume: 1,
            deck2Volume: 1,
            crossfader: 0.5
        };

        this.activeFader = null;
        this.activeBpmSlider = null;

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Create scene elements
        this.createEnvironment();
        this.createTurntables();
        this.setupLights();
        this.setupEventListeners();

        // Start animation loop
        this.animate();
    }

    createEnvironment() {
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xeeeeee,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Create walls
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 10),
            wallMaterial
        );
        backWall.position.z = -10;
        backWall.position.y = 5;
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 10),
            wallMaterial
        );
        leftWall.position.x = -10;
        leftWall.position.y = 5;
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 10),
            wallMaterial
        );
        rightWall.position.x = 10;
        rightWall.position.y = 5;
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    createTurntables() {
        // Create turntable base
        const createTurntable = (position) => {
            const group = new THREE.Group();
            
            // Main body (larger cuboid like AT-LP120X)
            const bodyGeometry = new THREE.BoxGeometry(3, 0.8, 3);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xcccccc,
                metalness: 0.7,
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            // Platter (cylindrical)
            const platterGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32);
            const platterMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x222222,
                metalness: 0.9,
                roughness: 0.1
            });
            const platter = new THREE.Mesh(platterGeometry, platterMaterial);
            platter.position.y = 0.45;
            platter.castShadow = true;
            platter.receiveShadow = true;
            group.add(platter);

            // Record center label (blue circle)
            const labelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.11, 32);
            const labelMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x0000ff,
                metalness: 0.5,
                roughness: 0.5
            });
            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            label.position.y = 0.46;
            label.castShadow = true;
            label.receiveShadow = true;
            group.add(label);

            // Center hole
            const holeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16);
            const holeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x000000,
                metalness: 0.9,
                roughness: 0.1
            });
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            hole.position.y = 0.46;
            hole.castShadow = true;
            hole.receiveShadow = true;
            group.add(hole);

            // Play/Pause button (moved to bottom left)
            const buttonGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
            const buttonMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                metalness: 0.5,
                roughness: 0.5
            });
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(-1.2, 0.4, 1.2);
            button.castShadow = true;
            button.receiveShadow = true;
            button.userData.isButton = true;
            button.userData.deckNumber = position.x < 0 ? 1 : 2;
            group.add(button);

            // BPM Control Slider
            const bpmSliderGroup = new THREE.Group();
            
            // BPM Slider Track
            const bpmTrackGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6);
            const bpmTrackMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                metalness: 0.5,
                roughness: 0.5
            });
            const bpmTrack = new THREE.Mesh(bpmTrackGeometry, bpmTrackMaterial);
            bpmTrack.position.z = 0;
            bpmTrack.castShadow = true;
            bpmTrack.receiveShadow = true;
            bpmSliderGroup.add(bpmTrack);

            // BPM Slider Knob
            const bpmKnobGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.15);
            const bpmKnobMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                metalness: 0.8,
                roughness: 0.2
            });
            const bpmKnob = new THREE.Mesh(bpmKnobGeometry, bpmKnobMaterial);
            bpmKnob.position.z = 0; // Start at middle position
            bpmKnob.castShadow = true;
            bpmKnob.receiveShadow = true;
            
            // Add user data for interaction
            bpmKnob.userData.isBpmSlider = true;
            bpmKnob.userData.deckNumber = position.x < 0 ? 1 : 2;
            bpmKnob.userData.isDragging = false;
            bpmKnob.userData.initialZ = 0;
            bpmKnob.userData.minZ = -0.3; // Top position (slowest)
            bpmKnob.userData.maxZ = 0.3; // Bottom position (fastest)
            
            bpmSliderGroup.add(bpmKnob);
            bpmSliderGroup.position.set(1.2, 0.4, 1.0);
            group.add(bpmSliderGroup);

            // BPM Text Display
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const context = canvas.getContext('2d');
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = '48px Arial';
            context.fillStyle = 'black';
            context.textAlign = 'center';
            context.fillText('120 BPM', canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            const bpmTextGeometry = new THREE.PlaneGeometry(1, 0.5);
            const bpmTextMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            });
            const bpmText = new THREE.Mesh(bpmTextGeometry, bpmTextMaterial);
            bpmText.position.set(1.2, 0.6, 1.0);
            group.add(bpmText);

            // Store the BPM text mesh reference
            if (position.x < 0) {
                this.deck1.bpmText = bpmText;
            } else {
                this.deck2.bpmText = bpmText;
            }

            group.position.copy(position);
            return group;
        };

        // Create two turntables with more space between them
        this.turntable1 = createTurntable(new THREE.Vector3(-4, 1, 0));
        this.turntable2 = createTurntable(new THREE.Vector3(4, 1, 0));
        
        // Create and add the mixer
        this.mixer = this.createMixer();
        
        this.scene.add(this.turntable1);
        this.scene.add(this.turntable2);
        this.scene.add(this.mixer);
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x808080);
        this.scene.add(ambientLight);

        // Directional light (sunlight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Spotlights for each turntable
        const spotLight1 = new THREE.SpotLight(0xffffff, 1.5);
        spotLight1.position.set(-4, 5, 0);
        spotLight1.angle = Math.PI / 4;
        spotLight1.penumbra = 0.1;
        spotLight1.decay = 1.5;
        spotLight1.distance = 10;
        spotLight1.castShadow = true;
        this.scene.add(spotLight1);

        const spotLight2 = new THREE.SpotLight(0xffffff, 1.5);
        spotLight2.position.set(4, 5, 0);
        spotLight2.angle = Math.PI / 4;
        spotLight2.penumbra = 0.1;
        spotLight2.decay = 1.5;
        spotLight2.distance = 10;
        spotLight2.castShadow = true;
        this.scene.add(spotLight2);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Handle mouse events for faders
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            
            const intersects = raycaster.intersectObjects(this.scene.children, true);
            for (const intersect of intersects) {
                if (intersect.object.userData.isFader) {
                    this.activeFader = intersect.object.parent;
                    intersect.object.userData.isDragging = true;
                    // Store the initial mouse position and fader position
                    this.mouseStart = new THREE.Vector2(event.clientX, event.clientY);
                    this.faderStartZ = intersect.object.position.z;
                    // Disable orbit controls while dragging
                    this.controls.enabled = false;
                    break;
                }
            }
        });

        window.addEventListener('mousemove', (event) => {
            if (this.activeFader && this.activeFader.children[1].userData.isDragging) {
                this.handleFaderMove(event);
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.activeFader) {
                const faderKnob = this.activeFader.children[1];
                faderKnob.userData.isDragging = false;
                this.activeFader = null;
                this.mouseStart = null;
                this.faderStartZ = null;
                // Re-enable orbit controls
                this.controls.enabled = true;
            }
        });

        // Audio file loading
        document.getElementById('deck1-file').addEventListener('change', (e) => this.loadAudio(e, 1));
        document.getElementById('deck2-file').addEventListener('change', (e) => this.loadAudio(e, 2));

        // Mouse click for play/pause buttons
        window.addEventListener('click', (event) => this.handleButtonClick(event));

        // Add BPM slider interaction
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            
            const intersects = raycaster.intersectObjects(this.scene.children, true);
            for (const intersect of intersects) {
                if (intersect.object.userData.isBpmSlider) {
                    this.activeBpmSlider = intersect.object;
                    this.activeBpmSlider.userData.isDragging = true;
                    this.mouseStart = new THREE.Vector2(event.clientX, event.clientY);
                    this.faderStartZ = intersect.object.position.z;
                    this.controls.enabled = false;
                    break;
                }
            }
        });

        window.addEventListener('mousemove', (event) => {
            if (this.activeBpmSlider && this.activeBpmSlider.userData.isDragging) {
                this.handleBpmSliderMove(event);
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.activeBpmSlider) {
                this.activeBpmSlider.userData.isDragging = false;
                this.activeBpmSlider = null;
                this.controls.enabled = true;
            }
        });
    }

    handleButtonClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObjects(this.scene.children, true);
        for (const intersect of intersects) {
            if (intersect.object.userData.isButton) {
                this.togglePlay(intersect.object.userData.deckNumber);
                break;
            } else if (intersect.object.userData.isFader) {
                intersect.object.userData.isDragging = true;
                intersect.object.userData.startY = intersect.object.position.y;
                // Disable OrbitControls when starting to drag
                this.controls.enabled = false;
                break;
            }
        }
    }

    async loadAudio(event, deckNumber) {
        const file = event.target.files[0];
        if (!file) return;

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        if (deckNumber === 1) {
            this.deck1.audio = audioBuffer;
        } else {
            this.deck2.audio = audioBuffer;
        }
    }

    togglePlay(deckNumber) {
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        const turntable = deckNumber === 1 ? this.turntable1 : this.turntable2;
        
        if (!deck.audio) return;

        deck.isPlaying = !deck.isPlaying;
        const button = turntable.children[2]; // The play/pause button
        button.material.color.setHex(deck.isPlaying ? 0xff0000 : 0x00ff00);

        if (deck.isPlaying) {
            this.playAudio(deckNumber);
        } else {
            this.stopAudio(deckNumber);
        }
    }

    playAudio(deckNumber) {
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        if (!deck.audio) return;

        // Stop any existing playback
        if (deck.source) {
            deck.source.stop();
        }

        // Create new source and connect to EQ chain
        deck.source = this.audioContext.createBufferSource();
        deck.source.buffer = deck.audio;
        deck.source.connect(deck.eq.low);
        deck.source.start(0);
    }

    stopAudio(deckNumber) {
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        if (deck.source) {
            deck.source.stop();
            deck.source = null;
        }
    }

    setVolume(event, deckNumber) {
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        if (deck.source) {
            deck.source.gain.value = event.target.value / 100;
        }
    }

    setSpeed(event, deckNumber) {
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        deck.speed = parseFloat(event.target.value);
    }

    setCrossfader(event) {
        const value = event.target.value;
        const deck1Gain = value / 100;
        const deck2Gain = (100 - value) / 100;

        if (this.deck1.source) {
            this.deck1.source.gain.value = deck1Gain;
        }
        if (this.deck2.source) {
            this.deck2.source.gain.value = deck2Gain;
        }
    }

    createMixer() {
        const mixerGroup = new THREE.Group();
        mixerGroup.position.set(0, 1, 0);

        // Create mixer body (smaller size)
        const mixerBody = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.8, 3.5),
            new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                metalness: 0.8,
                roughness: 0.2
            })
        );
        mixerBody.castShadow = true;
        mixerBody.receiveShadow = true;
        mixerGroup.add(mixerBody);

        // Create EQ faders for deck 1
        const eq1Low = this.createFader(new THREE.Vector3(-1.5, 0.4, -1), 1, 'low');
        const eq1Mid = this.createFader(new THREE.Vector3(-1.2, 0.4, -1), 1, 'mid');
        const eq1High = this.createFader(new THREE.Vector3(-0.9, 0.4, -1), 1, 'high');
        
        // Create EQ faders for deck 2
        const eq2Low = this.createFader(new THREE.Vector3(0.9, 0.4, -1), 2, 'low');
        const eq2Mid = this.createFader(new THREE.Vector3(1.2, 0.4, -1), 2, 'mid');
        const eq2High = this.createFader(new THREE.Vector3(1.5, 0.4, -1), 2, 'high');

        // Create volume faders
        this.fader1 = this.createFader(new THREE.Vector3(-1, 0.4, 0), 1, 'volume');
        this.fader2 = this.createFader(new THREE.Vector3(1, 0.4, 0), 2, 'volume');
        
        // Add all faders to mixer group
        mixerGroup.add(eq1Low);
        mixerGroup.add(eq1Mid);
        mixerGroup.add(eq1High);
        mixerGroup.add(eq2Low);
        mixerGroup.add(eq2Mid);
        mixerGroup.add(eq2High);
        mixerGroup.add(this.fader1);
        mixerGroup.add(this.fader2);

        return mixerGroup;
    }

    createFader(position, deckNumber, type) {
        const faderGroup = new THREE.Group();
        
        // Fader track
        const trackGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6);
        const trackMaterial = new THREE.MeshStandardMaterial({ 
            color: type === 'low' ? 0xff0000 : 
                   type === 'mid' ? 0x00ff00 : 
                   type === 'high' ? 0x0000ff : 0x666666,
            metalness: 0.5,
            roughness: 0.5
        });
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.position.z = 0;
        track.castShadow = true;
        track.receiveShadow = true;
        faderGroup.add(track);

        // Fader knob
        const knobGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.15);
        const knobMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.8,
            roughness: 0.2
        });
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.position.z = 0; // Start at middle position
        knob.castShadow = true;
        knob.receiveShadow = true;
        
        // Add user data for interaction
        knob.userData.isFader = true;
        knob.userData.deckNumber = deckNumber;
        knob.userData.type = type;
        knob.userData.isDragging = false;
        knob.userData.initialZ = 0;
        knob.userData.minZ = -0.3;
        knob.userData.maxZ = 0.3;
        
        faderGroup.add(knob);
        faderGroup.position.copy(position);

        return faderGroup;
    }

    handleFaderMove(event) {
        if (!this.activeFader || !this.mouseStart || this.faderStartZ === null) return;

        const faderKnob = this.activeFader.children[1];
        
        // Calculate mouse movement
        const mouseDelta = new THREE.Vector2(
            event.clientX - this.mouseStart.x,
            event.clientY - this.mouseStart.y
        );
        
        // Convert mouse movement to fader movement (scaled appropriately)
        const faderDelta = mouseDelta.y * 0.01; // Adjust this value to control sensitivity
        
        // Calculate new Z position, constrained between min and max
        const newZ = Math.max(
            faderKnob.userData.minZ,
            Math.min(faderKnob.userData.maxZ, this.faderStartZ + faderDelta)
        );
        
        // Update fader position relative to its track
        faderKnob.position.z = newZ;
        
        // Calculate value (0 to 1) based on fader position, but reversed
        const value = 1 - ((newZ - faderKnob.userData.minZ) / 
                      (faderKnob.userData.maxZ - faderKnob.userData.minZ));
        
        const deckNumber = faderKnob.userData.deckNumber;
        const type = faderKnob.userData.type;
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        
        if (type === 'volume') {
            // Update the volume for the corresponding deck
            if (deckNumber === 1) {
                this.mixer.deck1Volume = value;
                deck.gainNode.gain.value = value;
            } else {
                this.mixer.deck2Volume = value;
                deck.gainNode.gain.value = value;
            }
        } else {
            // Update EQ gain based on fader position (-12dB to +12dB)
            const gain = (value * 24) - 12;
            deck.eq[type].gain.value = gain;
        }
    }

    handleBpmSliderMove(event) {
        if (!this.activeBpmSlider || !this.mouseStart || this.faderStartZ === null) return;

        const mouseDelta = new THREE.Vector2(
            event.clientX - this.mouseStart.x,
            event.clientY - this.mouseStart.y
        );
        
        // Convert mouse movement to fader movement (scaled appropriately)
        const faderDelta = mouseDelta.y * 0.01; // Adjust this value to control sensitivity
        
        // Calculate new Z position, constrained between min and max
        const newZ = Math.max(
            this.activeBpmSlider.userData.minZ,
            Math.min(this.activeBpmSlider.userData.maxZ, this.faderStartZ + faderDelta)
        );
        
        // Update fader position
        this.activeBpmSlider.position.z = newZ;
        
        // Calculate normalized position (0 to 1)
        const normalizedPosition = (newZ - this.activeBpmSlider.userData.minZ) / 
                                 (this.activeBpmSlider.userData.maxZ - this.activeBpmSlider.userData.minZ);
        
        // Map normalized position to BPM (115-125)
        // When normalizedPosition is 0 (top), BPM is 115
        // When normalizedPosition is 0.5 (middle), BPM is 120
        // When normalizedPosition is 1 (bottom), BPM is 125
        const bpm = 115 + (normalizedPosition * 10);
        
        const deckNumber = this.activeBpmSlider.userData.deckNumber;
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        
        if (Math.round(bpm) !== Math.round(deck.bpm)) {
            deck.bpm = bpm;
            this.updateBpmDisplay(deckNumber);
            
            // Update playback rate if audio is playing
            if (deck.source) {
                deck.source.playbackRate.value = bpm / 120; // Assuming 120 is the original BPM
            }
        }
    }

    updateBpmDisplay(deckNumber) {
        const deck = deckNumber === 1 ? this.deck1 : this.deck2;
        if (!deck.bpmText) return;

        const canvas = deck.bpmText.material.map.image;
        const context = canvas.getContext('2d');
        
        // Clear the canvas
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw new BPM text
        context.font = '48px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(`${Math.round(deck.bpm)} BPM`, canvas.width / 2, canvas.height / 2);
        
        // Update the texture
        deck.bpmText.material.map.needsUpdate = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate platters
        if (this.deck1.isPlaying) {
            this.turntable1.children[1].rotation.y += 0.01 * this.deck1.speed;
        }
        if (this.deck2.isPlaying) {
            this.turntable2.children[1].rotation.y += 0.01 * this.deck2.speed;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
const app = new DJController(); 