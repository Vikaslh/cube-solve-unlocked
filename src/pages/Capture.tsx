import { useState, useRef, useEffect } from "react";
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

// Standard cube colors and labels
const standardColors = [
  { label: 'W', rgb: [255,255,255], hex: '#ffffff' }, // White
  { label: 'Y', rgb: [234,179,8], hex: '#eab308' },  // Yellow
  { label: 'O', rgb: [249,115,22], hex: '#f97316' }, // Orange
  { label: 'R', rgb: [239,68,68], hex: '#ef4444' },  // Red
  { label: 'G', rgb: [34,197,94], hex: '#22c55e' },  // Green
  { label: 'B', rgb: [59,130,246], hex: '#3b82f6' }, // Blue
];

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.substring(0,2), 16),
    parseInt(hex.substring(2,4), 16),
    parseInt(hex.substring(4,6), 16)
  ];
}

function getNearestColorLabel(hex) {
  const rgb = hexToRgb(hex);
  let minDist = Infinity;
  let label = '?';
  for (const c of standardColors) {
    const d = Math.sqrt(
      Math.pow(rgb[0] - c.rgb[0], 2) +
      Math.pow(rgb[1] - c.rgb[1], 2) +
      Math.pow(rgb[2] - c.rgb[2], 2)
    );
    if (d < minDist) {
      minDist = d;
      label = c.label;
    }
  }
  return label;
}

export default function Capture() {
  const navigate = useNavigate();
  const [currentFace, setCurrentFace] = useState(0);
  const [capturedFaces, setCapturedFaces] = useState<Set<number>>(new Set());
  const [images, setImages] = useState<{[key: number]: string}>({});
  const [detectedColors, setDetectedColors] = useState<{[key: number]: string[]}>({});
  const [cvLoaded, setCvLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captureError, setCaptureError] = useState("");

  // Load OpenCV.js
  useEffect(() => {
    if (window.cv) {
      setCvLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;
    script.onload = () => {
      window.cv['onRuntimeInitialized'] = () => setCvLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Start camera on mount
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err) {
        // Camera not available or permission denied
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // OpenCV color detection for a 3x3 grid
  const detectColorsFromImage = async (faceIndex: number, imageUrl: string) => {
    if (!cvLoaded) return Array(9).fill('#888');
    return new Promise<string[]>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const grid = [];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const x = Math.floor((col + 0.5) * img.width / 3);
            const y = Math.floor((row + 0.5) * img.height / 3);
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            grid.push(rgbToHex(pixel[0], pixel[1], pixel[2]));
          }
        }
        resolve(grid);
      };
    });
  };

  // Helper: RGB to HEX
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // Capture from camera
  const handleCapture = async () => {
    setCaptureError("");
    if (!videoReady || !videoRef.current) {
      setCaptureError("Camera is not ready. Please wait for the preview to load.");
      return;
    }
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCaptureError("Camera is not ready. Please wait for the preview to load.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/png');
    const newCapturedFaces = new Set(capturedFaces);
    newCapturedFaces.add(currentFace);
    setCapturedFaces(newCapturedFaces);
    setImages(prev => ({ ...prev, [currentFace]: url }));
    const colors = await detectColorsFromImage(currentFace, url);
    setDetectedColors(prev => ({ ...prev, [currentFace]: colors }));
    if (currentFace < cubeFaces.length - 1) {
      setCurrentFace(currentFace + 1);
      setVideoReady(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImages(prev => ({ ...prev, [currentFace]: url }));
      
      const newCapturedFaces = new Set(capturedFaces);
      newCapturedFaces.add(currentFace);
      setCapturedFaces(newCapturedFaces);
      
      // Detect colors from uploaded image using OpenCV
      const colors = await detectColorsFromImage(currentFace, url);
      setDetectedColors(prev => ({ ...prev, [currentFace]: colors }));
      
      if (currentFace < cubeFaces.length - 1) {
        setCurrentFace(currentFace + 1);
      }
    }
  };

  const allFacesCaptured = capturedFaces.size === cubeFaces.length;

  // Helper to get color labels for all faces
  function getAllFaceLabels() {
    return [0,1,2,3,4,5].map(i => (detectedColors[i] || Array(9).fill('#888')).map(getNearestColorLabel));
  }

  const handleProceed = () => {
    // Convert detectedColors object to array in face order
    const facesArray = [0,1,2,3,4,5].map(i => detectedColors[i] || Array(9).fill('#888'));
    const labelArray = getAllFaceLabels();
    navigate('/solve-from-start', { state: { cubeColors: facesArray, cubeLabels: labelArray } });
  };

  useEffect(() => {
    // Reset videoReady when switching to a new face that has no image
    if (!images[currentFace]) {
      setVideoReady(false);
      // Reattach video stream to video element for new face
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [currentFace]);

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
                    <div className="relative w-full h-full">
                      <img 
                        src={images[currentFace]} 
                        alt={`${cubeFaces[currentFace].name} face`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        className="absolute top-2 right-2 bg-white/80 text-black px-2 py-1 rounded shadow hover:bg-white"
                        onClick={() => {
                          setImages(prev => {
                            const newImages = { ...prev };
                            delete newImages[currentFace];
                            return newImages;
                          });
                          setCapturedFaces(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(currentFace);
                            return newSet;
                          });
                          setDetectedColors(prev => {
                            const newColors = { ...prev };
                            delete newColors[currentFace];
                            return newColors;
                          });
                          setVideoReady(false);
                        }}
                        type="button"
                      >
                        Recapture
                      </button>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover rounded-lg"
                      style={{ background: '#222' }}
                      key={`face-${currentFace}`}
                      onCanPlay={() => setVideoReady(true)}
                    />
                  )}
                </div>
                {captureError && (
                  <div className="text-red-500 text-xs mt-2">{captureError}</div>
                )}
                {/* Detected Color Grid */}
                {detectedColors[currentFace] && (
                  <div className="mt-4 flex flex-col items-center">
                    <div className="grid grid-cols-3 gap-1">
                      {detectedColors[currentFace].map((color, i) => (
                        <div key={i} className="w-8 h-8 rounded border flex items-center justify-center text-xs font-bold" style={{ background: color, borderColor: '#333', color: '#000', textShadow: '0 1px 2px #fff' }}>
                          {getNearestColorLabel(color)}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Detected colors (labelled)</div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button 
                    variant="hero" 
                    className="flex-1"
                    onClick={handleCapture}
                    disabled={!videoReady}
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
            {allFacesCaptured && (
              <div className="mt-6 flex justify-center">
                <Button variant="hero" size="lg" onClick={handleProceed}>
                  Visualize & Solve
                </Button>
              </div>
            )}
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