import React from 'react';
import { useLocation } from 'wouter';
import { Zap, Play, AlertTriangle, Shield } from 'lucide-react';
import { useArchitectureStore } from '../store/architectureStore';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { loadSampleArchitecture } = useArchitectureStore();

  const handleStartBlank = () => {
    // Clear out to blank (we can load fragile as blank or empty)
    useArchitectureStore.setState({ architecture: { id: "blank", name: "New Architecture", region: "us-east-1", zones: [{ id: "az-a", name: "AZ-A", color: "#121F30" }], nodes: [], edges: [] } });
    setLocation('/designer');
  };

  const loadDemo = (id: string) => {
    loadSampleArchitecture(id);
    setLocation('/designer');
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foreground selection:bg-app-blue/30 overflow-x-hidden">
      
      {/* Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-app-blue">
          <Zap className="w-6 h-6 fill-current" />
          <span className="font-bold text-xl tracking-tight text-white">FailureForge</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => loadDemo('resilient-ecommerce')} className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Try Demo
          </button>
        </div>
      </header>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="pt-32 pb-20 px-4 text-center max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-app-blue/10 border border-app-blue/20 text-app-blue text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-app-blue animate-pulse"></span>
          INTERACTIVE ARCHITECTURE SIMULATOR
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
          Build it. Break it. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-app-blue via-app-cyan to-app-green">Architect it better.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
          Design cloud systems, simulate catastrophic failures, and discover how resilient your architecture really is using AWS Well-Architected principles.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => loadDemo('fragile-startup')}
            className="w-full sm:w-auto px-8 py-4 bg-app-blue hover:bg-[#1A6FF0] text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(47,128,255,0.3)] hover:shadow-[0_0_40px_rgba(47,128,255,0.5)] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Try Guided Demo
          </button>
          <button 
            onClick={handleStartBlank}
            className="w-full sm:w-auto px-8 py-4 bg-bg-elevated hover:bg-border border border-border text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            Start Blank Architecture
          </button>
        </div>
      </motion.section>

      {/* Templates Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="py-20 px-4 max-w-7xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-center mb-12">Start from a scenario</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div 
            onClick={() => loadDemo('fragile-startup')}
            className="bg-bg-panel border border-border rounded-xl p-6 hover:border-app-blue/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-app-red/10 flex items-center justify-center text-app-red mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="px-2 py-1 rounded bg-app-red/10 text-app-red text-xs font-bold">Health: 41</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Fragile Startup</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              A basic single-zone setup with no redundancy. Perfect for learning how quickly things break.
            </p>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => loadDemo('resilient-ecommerce')}
            className="bg-bg-panel border border-border rounded-xl p-6 hover:border-app-blue/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-app-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-lg bg-app-green/10 flex items-center justify-center text-app-green mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <span className="px-2 py-1 rounded bg-app-green/10 text-app-green text-xs font-bold">Health: 85</span>
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10">Resilient E-Commerce</h3>
            <p className="text-text-secondary text-sm leading-relaxed relative z-10">
              Multi-AZ deployment with caching, queues, and database replication. Built for high availability.
            </p>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => loadDemo('event-driven')}
            className="bg-bg-panel border border-border rounded-xl p-6 hover:border-app-blue/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-app-cyan/10 flex items-center justify-center text-app-cyan mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <span className="px-2 py-1 rounded bg-app-amber/10 text-app-amber text-xs font-bold">Health: 72</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Event-Driven Platform</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Asynchronous architecture using message buses and decoupled workers for scalability.
            </p>
          </div>

        </div>
      </motion.section>

    </div>
  );
}
