/// <reference types="vite/client" />

// Player.js API for Bunny Stream
// See: https://github.com/nicholasserra/playerjs
declare namespace playerjs {
  class Player {
    constructor(element: HTMLIFrameElement | HTMLElement);
    
    on(event: 'ready', callback: () => void): void;
    on(event: 'play', callback: () => void): void;
    on(event: 'pause', callback: () => void): void;
    on(event: 'ended', callback: () => void): void;
    on(event: 'timeupdate', callback: (data: { seconds: number; duration: number }) => void): void;
    on(event: 'error', callback: (error: unknown) => void): void;
    
    off(event: string, callback?: (...args: unknown[]) => void): void;
    
    play(): void;
    pause(): void;
    getPaused(callback: (paused: boolean) => void): void;
    mute(): void;
    unmute(): void;
    getMuted(callback: (muted: boolean) => void): void;
    setVolume(volume: number): void;
    getVolume(callback: (volume: number) => void): void;
    getDuration(callback: (duration: number) => void): void;
    setCurrentTime(seconds: number): void;
    getCurrentTime(callback: (seconds: number) => void): void;
    setLoop(loop: boolean): void;
    getLoop(callback: (loop: boolean) => void): void;
    supports(method: string, callback: (supported: boolean) => void): void;
  }
}

declare global {
  const playerjs: typeof playerjs;
}
