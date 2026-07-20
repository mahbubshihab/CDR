import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, LogOut, Loader2, Database, Key } from 'lucide-react';

export const Login: React.FC = () => {
  const { 
    currentUser, 
    status, 
    validUntil, 
    signInWithGoogle, 
    signOutUser 
  } = useAuth();
  
  const [btnLoading, setBtnLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas particle network and data stream animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
        this.color = Math.random() > 0.4 ? 'rgba(62, 207, 142, 0.4)' : 'rgba(59, 130, 246, 0.4)'; // Brand Green or Blue
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;
      }

      draw(cCtx: CanvasRenderingContext2D) {
        cCtx.beginPath();
        cCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        cCtx.fillStyle = this.color;
        cCtx.fill();
      }
    }

    // Binary code stream class
    class CodeStream {
      x: number;
      y: number;
      text: string;
      speed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.text = Math.random() > 0.5 ? '1' : '0';
        this.speed = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.2 + 0.05;
      }

      update() {
        this.y += this.speed;
        if (this.y > height) {
          this.y = 0;
          this.x = Math.random() * width;
        }
      }

      draw(cCtx: CanvasRenderingContext2D) {
        cCtx.font = '9px Courier New';
        cCtx.fillStyle = `rgba(62, 207, 142, ${this.opacity})`;
        cCtx.fillText(this.text, this.x, this.y);
      }
    }

    const particles: Particle[] = Array.from({ length: 65 }, () => new Particle());
    const streams: CodeStream[] = Array.from({ length: 45 }, () => new CodeStream());
    let mouse = { x: -9999, y: -9999 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Main animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(7, 7, 9, 0.2)'; // Faint trails
      ctx.fillRect(0, 0, width, height);

      // Render streams
      streams.forEach((stream) => {
        stream.update();
        stream.draw(ctx);
      });

      // Update & Draw particles
      particles.forEach((p, idx) => {
        p.update();
        p.draw(ctx);

        // Connect particles close to mouse
        if (mouse.x !== -9999) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(62, 207, 142, ${(1 - dist / 150) * 0.15})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw connections between particles
        for (let i = idx + 1; i < particles.length; i++) {
          const other = particles[i];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(62, 207, 142, ${(1 - dist / 110) * 0.12})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = async () => {
    setBtnLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleSignOut = async () => {
    setBtnLoading(true);
    try {
      await signOutUser();
    } catch (err) {
      console.error(err);
    } finally {
      setBtnLoading(false);
    }
  };

  const isExpired = currentUser && status === 'approved' && validUntil && (new Date() > new Date(validUntil.seconds * 1000));

  if (btnLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#070709] text-gray-200">
        <Loader2 className="h-10 w-10 text-[#3ecf8e] animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-widest text-[#3ecf8e]/80 uppercase font-mono">SECURE LINKING ACTIVE...</p>
      </div>
    );
  }

  // Case 1: Logged in but Pending Approval
  if (currentUser && status === 'pending') {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#070709] p-6 relative">
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
        
        <div className="max-w-md w-full bg-[#111113]/80 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl shadow-yellow-500/5 animate-in fade-in duration-300 relative z-10">
          <div className="inline-flex p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-500">
            <ShieldAlert className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wide font-sans">Access Pending</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
              Your account has been registered successfully. However, accessing the CDR platform requires administrator approval. Please contact a system administrator to verify your credentials.
            </p>
          </div>
          
          <div className="bg-[#18181b]/60 border border-[#27272a] p-4 rounded-2xl text-left space-y-3 font-sans">
            <div className="flex items-center gap-3">
              {currentUser.photoURL && (
                <img src={currentUser.photoURL} alt="Profile" className="h-10 w-10 rounded-full border border-gray-700 object-cover" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate">{currentUser.displayName}</p>
                <p className="text-[10px] text-gray-500 font-mono truncate">{currentUser.email}</p>
              </div>
            </div>
            <div className="h-px bg-gray-800" />
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-500 font-bold uppercase tracking-wider">Status:</span>
              <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-500 border border-yellow-500/20 rounded-md font-bold uppercase tracking-wider">Pending Approval</span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-gray-850 border border-[#27272a] text-xs font-semibold rounded-2xl text-gray-400 hover:text-white cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Use Different Account</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Access Rejected
  if (currentUser && status === 'rejected') {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#070709] p-6 relative">
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

        <div className="max-w-md w-full bg-[#111113]/80 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl shadow-red-500/5 animate-in fade-in duration-300 relative z-10">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wide font-sans">Access Denied</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
              Your access request has been declined. Please reach out to your system administrator for further details.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-gray-850 border border-[#27272a] text-xs font-semibold rounded-2xl text-gray-400 hover:text-white cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Access Expired
  if (currentUser && isExpired) {
    const expireDate = new Date(validUntil.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#070709] p-6 relative">
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

        <div className="max-w-md w-full bg-[#111113]/80 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl shadow-red-500/5 animate-in fade-in duration-300 relative z-10">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
            <ShieldAlert className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wide font-sans">Access Expired</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
              Your platform access period expired on <span className="font-mono text-red-400 font-bold">{expireDate}</span>. Please request an administrator to extend your account validity date.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-gray-850 border border-[#27272a] text-xs font-semibold rounded-2xl text-gray-400 hover:text-white cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 4: Default Futuristic Login Form
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#070709] relative overflow-hidden p-6 text-left">
      {/* Background Interactive canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Cyber Glow Overlays */}
      <div className="absolute top-[-25%] left-[-25%] w-[60%] h-[60%] rounded-full bg-[#3ecf8e]/3 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-25%] w-[60%] h-[60%] rounded-full bg-blue-500/3 blur-[140px] pointer-events-none" />

      {/* High-Level Forensic HUD Card */}
      <div className="max-w-md w-full bg-[#0a0a0c]/80 backdrop-blur-xl border border-[#3ecf8e]/20 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-[#3ecf8e]/5 space-y-8 animate-in fade-in zoom-in-95 duration-500 relative z-10 overflow-hidden group">
        {/* HUD Corner Tech Lines */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#3ecf8e]/40 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#3ecf8e]/40 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#3ecf8e]/40 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#3ecf8e]/40 rounded-br-2xl pointer-events-none" />

        {/* Scan Line Effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3ecf8e]/25 to-transparent animate-pulse pointer-events-none shadow-[0_0_15px_#3ecf8e]" style={{
          animation: 'scan 4s linear infinite'
        }} />

        <div className="space-y-4">
          <div className="inline-flex p-3 bg-[#3ecf8e]/10 border border-[#3ecf8e]/25 rounded-2xl text-[#3ecf8e] shadow-lg shadow-[#3ecf8e]/5">
            <Database className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-gray-150 tracking-tight uppercase font-sans">CDR Analyzer</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase font-mono">Secure Telecommunication Laboratory</p>
          </div>
        </div>

        <div className="space-y-4 font-sans">
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Authorized network tracing and case synchronization portal. Log in with your secure credentials to verify your investigator status and access analytics modules.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-sans">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#141417] hover:bg-[#1a1a1f] text-gray-200 border border-[#27272a] hover:border-[#3ecf8e]/40 font-semibold text-sm rounded-2xl cursor-pointer shadow-xl transition-all font-sans relative overflow-hidden group"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div className="flex items-center gap-2 justify-center text-[10px] text-gray-650 uppercase font-mono font-bold tracking-widest pt-3 border-t border-gray-800/40 select-none">
          <Key className="h-3.5 w-3.5 text-gray-600" />
          <span>Secure Encrypted Forensic Gateway Active</span>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};
