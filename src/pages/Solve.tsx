import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Mock solving steps
const solvingSteps = [
  "R U R' U'",
  "F R F' R'", 
  "U R U' R'",
  "R U2 R'",
  "F R U R' U' F'",
  "R U R' F' R U R' U' R' F R2 U' R'",
  "U R U' R'",
  "R U R' U R U2 R'"
];

export default function Solve() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [solutionFound, setSolutionFound] = useState(false);
  const [cubeRotation, setCubeRotation] = useState({ x: -15, y: 0, z: 0 });
  const [isAnimatingMove, setIsAnimatingMove] = useState(false);
  
  // Get cube colors from capture page or use defaults
  const capturedColors = location.state?.cubeColors;
  const [cubeState, setCubeState] = useState({
    front: capturedColors?.[0] || Array(9).fill('#ef4444'), // red
    back: capturedColors?.[1] || Array(9).fill('#22c55e'),  // green
    left: capturedColors?.[2] || Array(9).fill('#f97316'),  // orange
    right: capturedColors?.[3] || Array(9).fill('#3b82f6'), // blue
    up: capturedColors?.[4] || Array(9).fill('#ffffff'),    // white
    down: capturedColors?.[5] || Array(9).fill('#eab308')   // yellow
  });

  useEffect(() => {
    // Simulate analysis
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
      setSolutionFound(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Animate move execution
  const animateMove = (move: string) => {
    setIsAnimatingMove(true);
    
    // Determine rotation based on move
    let newRotation = { ...cubeRotation };
    if (move.includes('R')) {
      newRotation.y += move.includes("'") ? -90 : 90;
    } else if (move.includes('L')) {
      newRotation.y += move.includes("'") ? 90 : -90;
    } else if (move.includes('U')) {
      newRotation.x += move.includes("'") ? 90 : -90;
    } else if (move.includes('D')) {
      newRotation.x += move.includes("'") ? -90 : 90;
    } else if (move.includes('F')) {
      newRotation.z += move.includes("'") ? -90 : 90;
    } else if (move.includes('B')) {
      newRotation.z += move.includes("'") ? 90 : -90;
    }
    
    setCubeRotation(newRotation);
    
    setTimeout(() => {
      setIsAnimatingMove(false);
    }, 800);
  };

  useEffect(() => {
    if (isPlaying && solutionFound) {
      const interval = setInterval(() => {
        if (currentStep < solvingSteps.length - 1) {
          setCurrentStep(prev => {
            const nextStep = prev + 1;
            animateMove(solvingSteps[nextStep]);
            return nextStep;
          });
        } else {
          setIsPlaying(false);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentStep, solutionFound]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentStep < solvingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      animateMove(solvingSteps[nextStep]);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      animateMove(solvingSteps[prevStep]);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/capture")}
            className="text-primary hover:text-primary-glow"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Capture
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Cube Solver</h1>
            <p className="text-muted-foreground">
              {isAnalyzing ? "Analyzing your cube..." : `Step ${currentStep + 1} of ${solvingSteps.length}`}
            </p>
          </div>
          
          <div className="w-24" /> {/* Spacer */}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 3D Cube Visualization */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-primary/20 h-96">
              <div className="w-full h-full flex items-center justify-center relative">
                {isAnalyzing ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Analyzing cube state...</p>
                    <div className="text-xs text-muted-foreground">
                      Using AI to detect colors and validate configuration
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    {/* Realistic 3D cube with move-based rotation animations */}
                    <div className="relative mx-auto" style={{ perspective: "800px" }}>
                      <div 
                        className={`relative w-48 h-48 mx-auto transition-all duration-800 ease-in-out ${
                          isAnimatingMove ? 'scale-110' : ''
                        }`}
                        style={{ 
                          transform: `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg) rotateZ(${cubeRotation.z}deg)`,
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        {/* Top face - Up */}
                        <div 
                          className={`absolute w-48 h-48 border-2 border-black/20 transition-all duration-500 ${
                            solvingSteps[currentStep].includes('U') ? 'shadow-intense animate-pulse' : ''
                          }`} 
                          style={{ 
                            transform: "rotateX(90deg) translateZ(96px)",
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div className="grid grid-cols-3 gap-1 p-1 h-full w-full">
                            {cubeState.up.map((color, i) => (
                              <div 
                                key={i} 
                                className="rounded-sm border border-black/30 transition-all duration-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Front face */}
                        <div 
                          className={`absolute w-48 h-48 border-2 border-black/20 transition-all duration-500 ${
                            solvingSteps[currentStep].includes('F') ? 'shadow-intense animate-pulse' : ''
                          }`}
                          style={{ 
                            transform: "translateZ(96px)",
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div className="grid grid-cols-3 gap-1 p-1 h-full w-full">
                            {cubeState.front.map((color, i) => (
                              <div 
                                key={i} 
                                className="rounded-sm border border-black/30 transition-all duration-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Right face */}
                        <div 
                          className={`absolute w-48 h-48 border-2 border-black/20 transition-all duration-500 ${
                            solvingSteps[currentStep].includes('R') ? 'shadow-intense animate-pulse' : ''
                          }`}
                          style={{ 
                            transform: "rotateY(90deg) translateZ(96px)",
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div className="grid grid-cols-3 gap-1 p-1 h-full w-full">
                            {cubeState.right.map((color, i) => (
                              <div 
                                key={i} 
                                className="rounded-sm border border-black/30 transition-all duration-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Left face */}
                        <div 
                          className={`absolute w-48 h-48 border-2 border-black/20 transition-all duration-500 ${
                            solvingSteps[currentStep].includes('L') ? 'shadow-intense animate-pulse' : ''
                          }`}
                          style={{ 
                            transform: "rotateY(-90deg) translateZ(96px)",
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div className="grid grid-cols-3 gap-1 p-1 h-full w-full">
                            {cubeState.left.map((color, i) => (
                              <div 
                                key={i} 
                                className="rounded-sm border border-black/30 transition-all duration-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Bottom face - Down */}
                        <div 
                          className={`absolute w-48 h-48 border-2 border-black/20 transition-all duration-500 ${
                            solvingSteps[currentStep].includes('D') ? 'shadow-intense animate-pulse' : ''
                          }`}
                          style={{ 
                            transform: "rotateX(-90deg) translateZ(96px)",
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div className="grid grid-cols-3 gap-1 p-1 h-full w-full">
                            {cubeState.down.map((color, i) => (
                              <div 
                                key={i} 
                                className="rounded-sm border border-black/30 transition-all duration-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Back face */}
                        <div 
                          className={`absolute w-48 h-48 border-2 border-black/20 transition-all duration-500 ${
                            solvingSteps[currentStep].includes('B') ? 'shadow-intense animate-pulse' : ''
                          }`}
                          style={{ 
                            transform: "rotateY(180deg) translateZ(96px)",
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div className="grid grid-cols-3 gap-1 p-1 h-full w-full">
                            {cubeState.back.map((color, i) => (
                              <div 
                                key={i} 
                                className="rounded-sm border border-black/30 transition-all duration-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                        <p className="text-sm text-accent font-semibold">Current Move</p>
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      </div>
                      <div className="bg-gradient-card rounded-lg p-4 border border-primary/20">
                        <p className="text-3xl font-bold text-primary animate-scale-in">{solvingSteps[currentStep]}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {solvingSteps[currentStep].includes("'") ? "Counter-clockwise rotation" : "Clockwise rotation"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Control Panel */}
            {solutionFound && (
              <Card className="p-6 bg-gradient-card border-primary/20">
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="hero" 
                      size="icon"
                      onClick={handlePlayPause}
                      className="w-12 h-12"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleNext}
                      disabled={currentStep === solvingSteps.length - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / solvingSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
          
          {/* Steps List */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-primary/20">
              <h3 className="text-lg font-semibold mb-4">Solution Steps</h3>
              
              {isAnalyzing ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary/50 rounded-full animate-pulse" />
                      <div className="h-4 bg-secondary/50 rounded flex-1 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {solvingSteps.map((step, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border transition-all duration-300 ${
                        index === currentStep
                          ? 'border-primary bg-primary/10 shadow-glow'
                          : index < currentStep
                          ? 'border-accent bg-accent/10'
                          : 'border-primary/20 bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === currentStep
                            ? 'bg-primary text-primary-foreground'
                            : index < currentStep
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-mono text-lg">{step}</div>
                          <div className="text-xs text-muted-foreground">
                            {index === currentStep ? 'Current move' : 
                             index < currentStep ? 'Completed' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            
            {/* Statistics */}
            {solutionFound && (
              <Card className="p-6 bg-gradient-card border-primary/20">
                <h3 className="text-lg font-semibold mb-4">Solution Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{solvingSteps.length}</div>
                    <div className="text-sm text-muted-foreground">Total Moves</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">~2m</div>
                    <div className="text-sm text-muted-foreground">Est. Time</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
        
        {/* Completion Message */}
        {currentStep === solvingSteps.length - 1 && solutionFound && (
          <Card className="mt-8 p-6 bg-gradient-cube text-center animate-scale-in">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">🎉 Cube Solved!</h2>
              <p className="text-white/80">
                Congratulations! You've successfully solved your Rubik's cube in {solvingSteps.length} moves.
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => navigate("/capture")}
                >
                  Solve Another Cube
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}