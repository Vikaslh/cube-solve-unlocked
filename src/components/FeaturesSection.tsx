import { Card } from "@/components/ui/card";
import { Camera, Eye, Cpu, Play } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Image Capture",
    description: "Capture or upload photos of all 6 cube faces with guided interface",
    color: "text-cube-red"
  },
  {
    icon: Eye,
    title: "AI Detection",
    description: "Advanced computer vision detects colors and validates cube state",
    color: "text-cube-green"
  },
  {
    icon: Cpu,
    title: "Smart Solver",
    description: "Powerful algorithms generate optimal solving sequence",
    color: "text-cube-blue"
  },
  {
    icon: Play,
    title: "3D Animation",
    description: "Interactive 3D cube shows each solving step in real-time",
    color: "text-cube-orange"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered solution makes solving any Rubik's Cube simple and educational
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 bg-gradient-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glow group animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Process flow */}
        <div className="mt-16 relative">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 lg:space-x-8">
              {[1, 2, 3, 4].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-glow">
                    {step}
                  </div>
                  {index < 3 && (
                    <div className="w-8 lg:w-16 h-0.5 bg-gradient-to-r from-primary to-accent mx-2 lg:mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};