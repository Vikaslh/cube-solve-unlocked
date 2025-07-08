import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import * as THREE from "three";
import { useLocation } from "react-router-dom";
import cubejs from 'cubejs';

// Simple 3D Cubelet component
function Cubelet({ position, color, rotation }: { position: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Animation config for each step
const animationConfigs = [
  // Step 1: White Cross (U face, y=1, rotate Y)
  { layer: (x: number, y: number, z: number) => y === 1, axis: 'y', dir: 1 },
  // Step 2: White Corners (D face, y=-1, rotate Y)
  { layer: (x: number, y: number, z: number) => y === -1, axis: 'y', dir: -1 },
  // Step 3: Middle Layer Edges (x=0, rotate X)
  { layer: (x: number, y: number, z: number) => x === 0, axis: 'x', dir: 1 },
  // Step 4: Yellow Cross (U face, y=1, rotate Z)
  { layer: (x: number, y: number, z: number) => y === 1, axis: 'z', dir: 1 },
  // Step 5: Yellow Corners (D face, y=-1, rotate X)
  { layer: (x: number, y: number, z: number) => y === -1, axis: 'x', dir: 1 },
  // Step 6: Final Layer Edges (z=1, rotate Y)
  { layer: (x: number, y: number, z: number) => z === 1, axis: 'y', dir: 1 },
];

// Rubik's Cube expects state as { front, back, left, right, up, down }
function getCubeStateFromLocation(location) {
  // Default color order: [front, back, left, right, up, down]
  const defaultColors = [
    Array(9).fill('#ffffff'), // front - white
    Array(9).fill('#eab308'), // back - yellow
    Array(9).fill('#f97316'), // left - orange
    Array(9).fill('#ef4444'), // right - red
    Array(9).fill('#22c55e'), // up - green
    Array(9).fill('#3b82f6'), // down - blue
  ];
  const standardColorMap = {
    'W': '#ffffff',
    'Y': '#eab308',
    'O': '#f97316',
    'R': '#ef4444',
    'G': '#22c55e',
    'B': '#3b82f6',
    '?': '#888888',
  };
  if (!location.state || !location.state.cubeColors) return defaultColors;
  // If cubeLabels is present, use it to map to standard colors
  if (location.state.cubeLabels && Array.isArray(location.state.cubeLabels) && location.state.cubeLabels.length === 6) {
    return location.state.cubeLabels.map(face =>
      Array.isArray(face) && face.length === 9
        ? face.map(label => standardColorMap[label] || '#888888')
        : Array(9).fill('#888888')
    );
  }
  const faces = location.state.cubeColors;
  // Map by face order
  return [
    faces[0] || defaultColors[0], // front
    faces[1] || defaultColors[1], // back
    faces[2] || defaultColors[2], // left
    faces[3] || defaultColors[3], // right
    faces[4] || defaultColors[4], // up
    faces[5] || defaultColors[5], // down
  ];
}

// Animated face turn for a given step
function AnimatedCube({ config, replayKey, cubeState }: { config: { layer: (x: number, y: number, z: number) => boolean; axis: 'x' | 'y' | 'z'; dir: 1 | -1 }, replayKey: number, cubeState: string[][][] }) {
  const groupRef = useRef<THREE.Group>(null);
  const [angle, setAngle] = useState(0);
  // Reset angle when replayKey changes
  useEffect(() => {
    setAngle(0);
    if (groupRef.current) {
      groupRef.current.rotation[config.axis] = 0;
    }
  }, [replayKey, config.axis]);
  useFrame((_, delta) => {
    if (angle < Math.PI / 2) {
      const newAngle = Math.min(angle + delta * 2, Math.PI / 2);
      setAngle(newAngle);
      if (groupRef.current) {
        groupRef.current.rotation[config.axis] = newAngle * config.dir;
      }
    }
  });
  // Render all cubelets, but rotate the selected layer as a group
  // Define getStickerColor here (same as in RubiksCube)
  const getStickerColor = (x: number, y: number, z: number) => {
    if (z === 1) return cubeState[0][(y+1)*3+(x+1)];
    if (z === -1) return cubeState[1][(y+1)*3+(2-x)];
    if (x === -1) return cubeState[2][(y+1)*3+(2-z)];
    if (x === 1) return cubeState[3][(y+1)*3+(z+1)];
    if (y === 1) return cubeState[4][(2-z)*3+(x+1)];
    if (y === -1) return cubeState[5][(z+1)*3+(x+1)];
    return "#222";
  };
  const cubelets = [];
  const animatedLayer = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) < 2) continue;
        const color = getStickerColor(x, y, z);
        if (config.layer(x, y, z)) {
          animatedLayer.push(
            <Cubelet key={`anim-${x},${y},${z}`} position={[x, y, z]} color={color} />
          );
        } else {
          cubelets.push(
            <Cubelet key={`${x},${y},${z}`} position={[x, y, z]} color={color} />
          );
        }
      }
    }
  }
  return (
    <>
      {cubelets}
      <group ref={groupRef}>{animatedLayer}</group>
    </>
  );
}

// 3x3 Rubik's Cube (static, colored faces)
function RubiksCube({ cubeState }: { cubeState: string[][][] }) {
  // cubeState: [front, back, left, right, up, down] (each 9 colors)
  // We'll only color the outer stickers for now
  const getStickerColor = (x, y, z) => {
    // Map cubelet to face and sticker index
    // Faces: 0=front(z=1), 1=back(z=-1), 2=left(x=-1), 3=right(x=1), 4=up(y=1), 5=down(y=-1)
    if (z === 1) return cubeState[0][(y+1)*3+(x+1)];
    if (z === -1) return cubeState[1][(y+1)*3+(2-x)];
    if (x === -1) return cubeState[2][(y+1)*3+(2-z)];
    if (x === 1) return cubeState[3][(y+1)*3+(z+1)];
    if (y === 1) return cubeState[4][(2-z)*3+(x+1)];
    if (y === -1) return cubeState[5][(z+1)*3+(x+1)];
    return "#222";
  };
  const cubelets = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) < 2) continue;
        cubelets.push(
          <Cubelet key={`${x},${y},${z}`} position={[x, y, z]} color={getStickerColor(x, y, z)} />
        );
      }
    }
  }
  return <>{cubelets}</>;
}

// Face color helper (moved out for reuse)
function faceColor(x: number, y: number, z: number) {
  const colors = [
    "#ffffff", // up (white)
    "#eab308", // down (yellow)
    "#ef4444", // front (red)
    "#22c55e", // back (green)
    "#3b82f6", // right (blue)
    "#f97316", // left (orange)
  ];
  if (y === 1) return colors[0]; // up
  if (y === -1) return colors[1]; // down
  if (z === 1) return colors[2]; // front
  if (z === -1) return colors[3]; // back
  if (x === 1) return colors[4]; // right
  if (x === -1) return colors[5]; // left
  return "#222";
}

const steps = [
  {
    title: "Step 1: White Cross",
    description: "Solve the white cross on the bottom layer. Align the white edge pieces with the center pieces on adjacent sides.",
    tips: [
      "Find white edge pieces and move them to the bottom layer.",
      "Align the side color of each white edge with the center color of that face.",
      "Repeat until all four white edges form a cross."
    ]
  },
  {
    title: "Step 2: White Corners",
    description: "Insert the white corner pieces to complete the first layer.",
    tips: [
      "Locate a white corner in the top layer.",
      "Position it above where it needs to go, then use R U R' U' until it is placed.",
      "Repeat for all four corners."
    ]
  },
  {
    title: "Step 3: Middle Layer Edges",
    description: "Solve the four edge pieces of the middle layer (no yellow on them).",
    tips: [
      "Find a non-yellow edge in the top layer.",
      "Align its color with the center, then use the appropriate algorithm to insert it left or right (U R U' R' U' F' U F or U' L' U L U F U' F')."
    ]
  },
  {
    title: "Step 4: Yellow Cross",
    description: "Form a yellow cross on the top layer.",
    tips: [
      "Use the F R U R' U' F' algorithm to orient yellow edges.",
      "Repeat until a yellow cross appears."
    ]
  },
  {
    title: "Step 5: Yellow Corners",
    description: "Position and orient the yellow corners.",
    tips: [
      "Use the R U R' U R U2 R' algorithm to orient yellow corners.",
      "Repeat for each unsolved corner."
    ]
  },
  {
    title: "Step 6: Final Layer Edges",
    description: "Permute the last layer edges to finish the cube.",
    tips: [
      "Use the algorithm F2 U L R' F2 L' R U F2 to swap edges.",
      "Repeat as needed until the cube is solved."
    ]
  }
];

export default function SolveFromStart() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const cubeState = getCubeStateFromLocation(location);
  const [solution, setSolution] = useState<string|null>(null);

  // Compute solution if cubeLabels are present
  useEffect(() => {
    if (location.state && location.state.cubeLabels) {
      // Convert cubeLabels to cubejs string (URFDLB order, center first)
      // cubejs expects a string of 54 chars: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
      // Our order: [front, back, left, right, up, down] (0-5)
      // Map: U=up(4), R=right(3), F=front(0), D=down(5), L=left(2), B=back(1)
      const faces = location.state.cubeLabels;
      const faceMap = [4, 3, 0, 5, 2, 1]; // U, R, F, D, L, B
      const faceOrder = [4, 3, 0, 5, 2, 1];
      // But cubejs expects: U, R, F, D, L, B (in that order)
      let cubeString = '';
      // U
      cubeString += faces[4].join('');
      // R
      cubeString += faces[3].join('');
      // F
      cubeString += faces[0].join('');
      // D
      cubeString += faces[5].join('');
      // L
      cubeString += faces[2].join('');
      // B
      cubeString += faces[1].join('');
      try {
        const solution = cubejs().solve(cubeString);
        setSolution(solution);
      } catch (e) {
        setSolution('Could not solve: ' + e.message);
      }
    }
  }, [location.state?.cubeLabels]);

  // Defensive check for cubeState validity
  let isValidCubeState = true;
  if (!Array.isArray(cubeState) || cubeState.length !== 6) {
    isValidCubeState = false;
  } else {
    for (let i = 0; i < 6; i++) {
      if (!Array.isArray(cubeState[i]) || cubeState[i].length !== 9 || cubeState[i].some(c => typeof c !== 'string' || !c)) {
        isValidCubeState = false;
        break;
      }
    }
  }
  if (!isValidCubeState) {
    console.error('Invalid cube state received:', {
      locationState: location.state,
      cubeState
    });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Navigation />
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Cube Data</h1>
          <p className="text-muted-foreground mb-4">The cube data could not be loaded or is malformed. Please go back and recapture all faces.</p>
          <pre className="text-xs text-left bg-black/70 text-white p-2 rounded max-w-xl mx-auto overflow-x-auto mb-2" style={{maxHeight: 200}}>
            {JSON.stringify(cubeState, null, 2)}
          </pre>
          <button className="px-4 py-2 rounded bg-primary text-white" onClick={() => window.location.href = '/capture'}>Back to Capture</button>
        </div>
      </div>
    );
  }

  const goNext = () => {
    setCurrentStep((s) => {
      const next = Math.min(s + 1, steps.length - 1);
      setReplayKey((k) => k + 1); // reset animation
      return next;
    });
  };
  const goPrev = () => {
    setCurrentStep((s) => {
      const prev = Math.max(s - 1, 0);
      setReplayKey((k) => k + 1); // reset animation
      return prev;
    });
  };
  const handleReplay = () => setReplayKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {solution && (
        <div className="container mx-auto px-4 pt-8 pb-2">
          <div className="bg-gradient-card border border-primary/20 rounded-lg p-4 mb-6 text-center">
            <h2 className="text-xl font-bold mb-2 text-primary">Solution Moves</h2>
            <div className="text-lg font-mono text-foreground break-words whitespace-pre-wrap">{solution}</div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl lg:text-6xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Solve a Rubik's Cube from Start</h1>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Follow these step-by-step instructions to solve a standard 3×3 Rubik's Cube layer by layer. Each step includes tips and the most common algorithms used by speedcubers.
        </p>
        <div className="flex justify-center mb-8">
          <button
            className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50 mr-4"
            onClick={goPrev}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
            onClick={goNext}
            disabled={currentStep === steps.length - 1}
          >
            Next
          </button>
          {animationConfigs[currentStep] && (
            <button
              className="ml-4 px-4 py-2 rounded bg-accent text-white"
              onClick={handleReplay}
            >
              Replay Animation
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-8">
          {/* 3D Cube Visualization */}
          <div className="w-full max-w-md h-72 bg-gradient-card rounded-lg flex items-center justify-center border border-primary/20 shadow-glow">
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[10, 10, 5]} intensity={0.7} />
              {animationConfigs[currentStep] ? (
                <AnimatedCube config={animationConfigs[currentStep]} replayKey={replayKey} cubeState={cubeState} />
              ) : (
                <RubiksCube cubeState={cubeState} />
              )}
              <OrbitControls enablePan={false} />
            </Canvas>
          </div>
          {/* Step Card */}
          <Card className="p-6 bg-gradient-card border-primary/20 w-full max-w-xl animate-scale-in">
            <h2 className="text-2xl font-semibold mb-2 text-foreground">{steps[currentStep].title}</h2>
            <p className="mb-4 text-muted-foreground">{steps[currentStep].description}</p>
            <ul className="list-disc list-inside space-y-2 text-left">
              {steps[currentStep].tips.map((tip, i) => (
                <li key={i} className="text-sm text-foreground">{tip}</li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="flex justify-center mt-8 text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
} 