import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { useLocation } from "react-router-dom";

// Simple 3D Cubelet component
function Cubelet({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Get cube state from location or use defaults
function getCubeStateFromLocation(location) {
  const defaultColors = [
    Array(9).fill('#ffffff'), // front - white
    Array(9).fill('#eab308'), // back - yellow
    Array(9).fill('#f97316'), // left - orange
    Array(9).fill('#ef4444'), // right - red
    Array(9).fill('#22c55e'), // up - green
    Array(9).fill('#3b82f6'), // down - blue
  ];

  if (!location.state || !location.state.cubeColors) return defaultColors;
  
  const faces = location.state.cubeColors;
  return [
    faces[0] || defaultColors[0], // front
    faces[1] || defaultColors[1], // back
    faces[2] || defaultColors[2], // left
    faces[3] || defaultColors[3], // right
    faces[4] || defaultColors[4], // up
    faces[5] || defaultColors[5], // down
  ];
}

// Simple static cube
function RubiksCube({ cubeState, highlightedFaces = [] }: { cubeState: string[][]; highlightedFaces?: string[] }) {
  const getStickerColor = (x, y, z) => {
    // Map cubelet position to face and sticker
    if (z === 1) return cubeState[0][(y+1)*3+(x+1)]; // front
    if (z === -1) return cubeState[1][(y+1)*3+(2-x)]; // back
    if (x === -1) return cubeState[2][(y+1)*3+(2-z)]; // left
    if (x === 1) return cubeState[3][(y+1)*3+(z+1)]; // right
    if (y === 1) return cubeState[4][(2-z)*3+(x+1)]; // up
    if (y === -1) return cubeState[5][(z+1)*3+(x+1)]; // down
    return "#222";
  };

  const cubelets = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) < 2) continue; // Skip center cube
        cubelets.push(
          <Cubelet key={`${x},${y},${z}`} position={[x, y, z]} color={getStickerColor(x, y, z)} />
        );
      }
    }
  }
  return <>{cubelets}</>;
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
      "Align its color with the center, then use the appropriate algorithm to insert it left or right."
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
      "Use the appropriate edge permutation algorithm.",
      "Repeat as needed until the cube is solved."
    ]
  }
];

export default function SolveFromStart() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const cubeState = getCubeStateFromLocation(location);

  // Defensive check for cubeState validity
  let isValidCubeState = true;
  if (!Array.isArray(cubeState) || cubeState.length !== 6) {
    isValidCubeState = false;
  } else {
    for (let i = 0; i < 6; i++) {
      if (!Array.isArray(cubeState[i]) || cubeState[i].length !== 9) {
        isValidCubeState = false;
        break;
      }
    }
  }

  if (!isValidCubeState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Navigation />
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Cube Data</h1>
          <p className="text-muted-foreground mb-4">The cube data could not be loaded. Please go back and recapture all faces.</p>
          <button className="px-4 py-2 rounded bg-primary text-white" onClick={() => window.location.href = '/capture'}>
            Back to Capture
          </button>
        </div>
      </div>
    );
  }

  const goNext = () => {
    setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    setAnimationKey(k => k + 1);
  };

  const goPrev = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
    setAnimationKey(k => k + 1);
  };

  const handleReplay = () => setAnimationKey(k => k + 1);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl lg:text-6xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Solve a Rubik's Cube from Start
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Follow these step-by-step instructions to solve a standard 3×3 Rubik's Cube layer by layer.
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
          <button
            className="ml-4 px-4 py-2 rounded bg-accent text-white"
            onClick={handleReplay}
          >
            Replay Animation
          </button>
        </div>

        <div className="flex flex-col items-center gap-8">
          {/* Simple 3D Cube Visualization */}
          <div className="w-full max-w-md h-72 bg-gradient-card rounded-lg flex items-center justify-center border border-primary/20 shadow-glow">
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[10, 10, 5]} intensity={0.7} />
              <group key={animationKey}>
                <RubiksCube cubeState={cubeState} />
              </group>
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