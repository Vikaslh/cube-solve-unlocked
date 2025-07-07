import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Camera } from "lucide-react";
import heroImage from "@/assets/hero-cube.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-white via-primary-glow to-accent bg-clip-text text-transparent leading-tight">
                CubeSolver.ai
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl">
                Solve any 3×3 Rubik's Cube instantly using AI-powered computer vision. 
                Just capture or upload images of all 6 faces.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="group" onClick={() => window.location.href = '/capture'}>
                <Camera className="w-5 h-5" />
                Start Solving
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/capture'}>
                <Upload className="w-5 h-5" />
                Upload Images
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-primary/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-glow">99.9%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">&lt; 30s</div>
                <div className="text-sm text-muted-foreground">Solve Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-glow">3D</div>
                <div className="text-sm text-muted-foreground">Animation</div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative animate-scale-in">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-cube rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              
              {/* Main image */}
              <div className="relative bg-gradient-card rounded-2xl p-8 shadow-card backdrop-blur-sm border border-primary/20">
                <img 
                  src={heroImage} 
                  alt="3D Rubik's Cube" 
                  className="w-full h-auto animate-float"
                />
                
                {/* Floating elements */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-accent rounded-full animate-pulse" />
                <div className="absolute bottom-8 left-4 w-2 h-2 bg-primary-glow rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 -right-2 w-4 h-4 bg-cube-green rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
};