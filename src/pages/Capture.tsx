import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cubeFaces = [
  { name: "Front", color: "cube-white", position: "front" },
  { name: "Back", color: "cube-yellow", position: "back" },
  { name: "Left", color: "cube-orange", position: "left" },
  { name: "Right", color: "cube-red", position: "right" },
  { name: "Up", color: "cube-green", position: "up" },
  { name: "Down", color: "cube-blue", position: "down" }
];

export default function Capture() {
  const navigate = useNavigate();
  const [currentFace, setCurrentFace] = useState(0);
  const [capturedFaces, setCapturedFaces] = useState<Set<number>>(new Set());
  const [images, setImages] = useState<{[key: number]: string}>({});
  const [detectedColors, setDetectedColors] = useState<{[key: number]: string[]}>({});

  // Simulate color detection from images
  const detectColorsFromImage = (faceIndex: number) => {
    // Simulate color detection - in real app this would use CV/AI
    const colorMaps = [
      Array(9).fill('#ffffff'), // Front - white
      Array(9).fill('#eab308'), // Back - yellow  
      Array(9).fill('#f97316'), // Left - orange
      Array(9).fill('#ef4444'), // Right - red
      Array(9).fill('#22c55e'), // Up - green
      Array(9).fill('#3b82f6')  // Down - blue
    ];
    
    return colorMaps[faceIndex];
  };

  const handleCapture = () => {
    // Simulate image capture
    const newCapturedFaces = new Set(capturedFaces);
    newCapturedFaces.add(currentFace);
    setCapturedFaces(newCapturedFaces);
    
    // Create a placeholder image URL
    setImages(prev => ({
      ...prev,
      [currentFace]: `https://picsum.photos/300/300?random=${currentFace}`
    }));
    
    // Detect colors from the captured image
    const colors = detectColorsFromImage(currentFace);
    setDetectedColors(prev => ({
      ...prev,
      [currentFace]: colors
    }));
    
    // Auto-advance to next face
    if (currentFace < cubeFaces.length - 1) {
      setCurrentFace(currentFace + 1);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImages(prev => ({
        ...prev,
        [currentFace]: url
      }));
      
      const newCapturedFaces = new Set(capturedFaces);
      newCapturedFaces.add(currentFace);
      setCapturedFaces(newCapturedFaces);
      
      // Detect colors from uploaded image
      const colors = detectColorsFromImage(currentFace);
      setDetectedColors(prev => ({
        ...prev,
        [currentFace]: colors
      }));
      
      if (currentFace < cubeFaces.length - 1) {
        setCurrentFace(currentFace + 1);
      }
    }
  };

  const allFacesCaptured = capturedFaces.size === cubeFaces.length;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-primary hover:text-primary-glow"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Capture Cube Faces</h1>
            <p className="text-muted-foreground">
              {capturedFaces.size} of {cubeFaces.length} faces captured
            </p>
          </div>
          
          <div className="w-24" /> {/* Spacer */}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Capture Interface */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-primary/20">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className={`w-8 h-8 rounded-lg bg-${cubeFaces[currentFace].color} border-2 border-white/20`} />
                  <h2 className="text-xl font-semibold">
                    {cubeFaces[currentFace].name} Face
                  </h2>
                  {capturedFaces.has(currentFace) && (
                    <CheckCircle className="w-6 h-6 text-accent" />
                  )}
                </div>
                
                {/* Camera Preview / Image Display */}
                <div className="w-full h-64 bg-secondary/50 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center relative overflow-hidden">
                  {images[currentFace] ? (
                    <img 
                      src={images[currentFace]} 
                      alt={`${cubeFaces[currentFace].name} face`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Capture or upload the {cubeFaces[currentFace].name.toLowerCase()} face
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button 
                    variant="hero" 
                    className="flex-1"
                    onClick={handleCapture}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture
                  </Button>
                  <label className="flex-1">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </span>
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>
                </div>
              </div>
            </Card>
            
            {/* Navigation */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                disabled={currentFace === 0}
                onClick={() => setCurrentFace(currentFace - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                variant="outline" 
                disabled={currentFace === cubeFaces.length - 1}
                onClick={() => setCurrentFace(currentFace + 1)}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* Progress Overview */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-primary/20">
              <h3 className="text-lg font-semibold mb-4">Capture Progress</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {cubeFaces.map((face, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      index === currentFace 
                        ? 'border-primary bg-primary/10' 
                        : capturedFaces.has(index)
                        ? 'border-accent bg-accent/10'
                        : 'border-primary/20 bg-secondary/50'
                    }`}
                    onClick={() => setCurrentFace(index)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded bg-${face.color} border border-white/20`} />
                      <div>
                        <div className="font-medium text-sm">{face.name}</div>
                        {capturedFaces.has(index) && (
                          <CheckCircle className="w-4 h-4 text-accent mt-1" />
                        )}
                      </div>
                    </div>
                    
                    {images[index] && (
                      <img 
                        src={images[index]} 
                        alt={`${face.name} preview`}
                        className="w-full h-16 object-cover rounded mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Next Step */}
            {allFacesCaptured && (
              <Card className="p-6 bg-gradient-cube border-accent animate-scale-in">
                <div className="text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-white mx-auto" />
                  <h3 className="text-lg font-semibold text-white">All Faces Captured!</h3>
                  <p className="text-white/80">Ready to analyze your cube and find the solution</p>
                  <Button 
                    variant="outline" 
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => navigate("/solve", { state: { cubeColors: detectedColors } })}
                  >
                    Analyze & Solve
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}