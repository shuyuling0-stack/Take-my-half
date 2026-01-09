export enum Season {
  Spring = 'Spring',
  Summer = 'Summer',
  Autumn = 'Autumn',
  Winter = 'Winter'
}

export interface MediaData {
  url: string;
  type: 'audio' | 'video';
  name: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life?: number; // For fireworks
  maxLife?: number;
  rotation?: number;
  rotationSpeed?: number;
  type?: 'rain' | 'firework' | 'petal' | 'leaf' | 'snow';
  landed?: boolean;
}