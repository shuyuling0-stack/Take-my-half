import React, { useRef, useEffect } from 'react';
import { Season, Particle } from '../types';

interface SeasonalCanvasProps {
  season: Season;
}

const SeasonalCanvas: React.FC<SeasonalCanvasProps> = ({ season }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let landedParticles: Particle[] = []; // Store accumulated leaves
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      landedParticles = []; // Clear piled leaves on resize
    };
    window.addEventListener('resize', resize);
    resize();

    // --- Helpers ---
    const random = (min: number, max: number) => Math.random() * (max - min) + min;
    
    // --- Initialization per season ---
    const initParticle = (type: 'snow' | 'rain' | 'petal' | 'leaf'): Particle => {
      if (type === 'snow') {
        return {
          x: Math.random() * width,
          y: Math.random() * height - height, // Start above
          vx: random(-1, 1),
          vy: random(1, 3),
          size: random(2, 5),
          color: 'rgba(255, 255, 255, 0.8)',
          type: 'snow'
        };
      } else if (type === 'rain') {
        return {
          x: Math.random() * width,
          y: Math.random() * height - height,
          vx: 0,
          vy: random(10, 15), // Fast rain
          size: random(10, 20), // Length of drop
          color: 'rgba(173, 216, 230, 0.6)',
          type: 'rain'
        };
      } else if (type === 'petal') {
        return {
          x: Math.random() * width,
          y: Math.random() * height - height,
          vx: random(-2, 2),
          vy: random(1, 3),
          // Reduced size from random(5, 10) to random(3, 7)
          size: random(3, 7),
          rotation: random(0, 360),
          rotationSpeed: random(-2, 2),
          color: `rgba(255, ${Math.floor(random(182, 220))}, ${Math.floor(random(193, 225))}, 0.8)`, // Pinkish
          type: 'petal'
        };
      } else { // Leaf
        return {
          x: Math.random() * width,
          y: Math.random() * height - height,
          vx: random(-3, 3),
          vy: random(1, 4),
          size: random(8, 14),
          rotation: random(0, 360),
          rotationSpeed: random(-3, 3),
          color: `rgba(${Math.floor(random(200, 255))}, ${Math.floor(random(100, 165))}, 0, 0.9)`, // Orange/Yellow
          type: 'leaf'
        };
      }
    };

    const createFirework = (x: number, y: number) => {
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = random(1, 4);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: random(2, 4),
          color: 'rgba(255, 255, 255, 1)', // White fireworks
          life: 1.0, // Opacity/Life
          type: 'firework'
        });
      }
    };

    // Initial fill
    const fillParticles = () => {
        particles = [];
        landedParticles = []; // Reset landed particles on season change
        
        let count = 150; // Default count for Spring/Winter
        if (season === Season.Summer) {
            count = 100;
        } else if (season === Season.Autumn) {
            count = 50; // Reduced count for Autumn leaves
        }

        const typeMap: Record<Season, 'petal' | 'rain' | 'leaf' | 'snow'> = {
            [Season.Spring]: 'petal',
            [Season.Summer]: 'rain',
            [Season.Autumn]: 'leaf',
            [Season.Winter]: 'snow',
        };
        
        for (let i = 0; i < count; i++) {
            particles.push({
                ...initParticle(typeMap[season]),
                y: Math.random() * height // Start randomly on screen initially
            });
        }
    };
    
    fillParticles();

    // Helper to draw shapes
    const drawParticleShape = (ctx: CanvasRenderingContext2D, p: Particle) => {
        if (p.type === 'rain') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, p.size);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (p.type === 'snow') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        } else if (p.type === 'petal') {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        } else if (p.type === 'leaf') {
             ctx.beginPath();
             ctx.moveTo(0, -p.size);
             ctx.lineTo(p.size/2, 0);
             ctx.lineTo(0, p.size);
             ctx.lineTo(-p.size/2, 0);
             ctx.closePath();
             ctx.fillStyle = p.color;
             ctx.fill();
        } else if (p.type === 'firework') {
             // White linear fireworks
             ctx.beginPath();
             ctx.moveTo(0, 0);
             // Draw spark line in direction of velocity
             ctx.lineTo(p.vx * 3, p.vy * 3);
             ctx.strokeStyle = `rgba(255, 255, 255, ${p.life})`;
             ctx.lineWidth = 2;
             ctx.stroke();
        }
    };

    // --- Animation Loop ---
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // 1. Draw Landed Particles (Autumn Leaves)
      for (const p of landedParticles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
        drawParticleShape(ctx, p);
        ctx.restore();
      }

      // 2. Update and Draw Active Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.type === 'firework') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1; // Gravity
          p.life = (p.life || 1) - 0.03;
          
          ctx.save();
          ctx.translate(p.x, p.y);
          drawParticleShape(ctx, p);
          ctx.restore();

          if ((p.life || 0) <= 0) {
            particles.splice(i, 1);
          }
          continue;
        }

        // Standard Falling Physics
        p.x += p.vx;
        p.y += p.vy;
        
        // Specific Season Behavior
        if (season === Season.Spring || season === Season.Autumn) {
            p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
            p.x += Math.sin(p.y * 0.01) * 0.5; // Sway
        }

        // Drawing
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
        drawParticleShape(ctx, p);
        ctx.restore();

        // Reset if out of bounds
        if (p.y > height) {
           if (p.type === 'rain') {
             // Spawn white linear fireworks at ground
             createFirework(p.x, height - 2);
             // Reset rain drop
             particles[i] = initParticle('rain');
           } else if (p.type === 'leaf') {
             // Accumulate leaves
             if (landedParticles.length < 200) { // Limit accumulation
                 landedParticles.push({
                    ...p,
                    y: height - random(5, 15), // Random scatter on ground
                    vx: 0, 
                    vy: 0,
                    landed: true
                 });
             }
             particles[i] = initParticle('leaf');
           } else {
             // Reset others to top
             const typeMap: Record<Season, 'petal' | 'leaf' | 'snow'> = {
                [Season.Spring]: 'petal',
                [Season.Autumn]: 'leaf',
                [Season.Winter]: 'snow',
                [Season.Summer]: 'leaf'
            };
            const pType = season === Season.Summer ? 'rain' : typeMap[season];
            particles[i] = initParticle(pType);
           }
        }
        
        // Wrap X
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [season]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[105]"
    />
  );
};

export default SeasonalCanvas;