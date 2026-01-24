class SoundManager {
    constructor() {
        // Sound effects - reliable sources
        this.correctSound = new Audio('https://ia801609.us.archive.org/16/items/ApplauseSound/Applause.mp3'); // Applause sound
        this.wrongSound = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/explosion_02.wav'); // Explosion/error
        this.bgMusic = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3'); // Adventure music

        // Preload
        this.correctSound.load();
        this.wrongSound.load();
        this.bgMusic.load();

        // Config
        this.bgMusic.loop = true;
        this.correctSound.volume = 0.7;
        this.wrongSound.volume = 0.8;

        // Persist settings
        this.musicMuted = localStorage.getItem('musicMuted') === 'true';
        this.sfxMuted = localStorage.getItem('sfxMuted') === 'true';

        // Beach ambience sounds (Local files to avoid 403 errors)
        this.waveSound = new Audio('/audio/waves.mp3'); // Ocean waves
        this.seagullSound = new Audio('/audio/seagull.mp3'); // Seagulls

        this.waveSound.loop = true;
        this.waveSound.volume = 0.3;
        this.seagullSound.loop = true;
        this.seagullSound.volume = 0.2;

        // Web Audio Context for synthetic SFX (Tick Tock)
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        console.log(`[SoundManager] Init. Music: ${!this.musicMuted}, SFX: ${!this.sfxMuted}`);
    }

    playBeachAmbience() {
        if (this.sfxMuted) return;

        try {
            this.waveSound.play().catch(e => console.warn("Wave sound failed", e));
            this.seagullSound.play().catch(e => console.warn("Seagull sound failed", e));
        } catch (e) {
            console.error("Beach ambience error", e);
        }
    }

    stopBeachAmbience() {
        try {
            this.waveSound.pause();
            this.waveSound.currentTime = 0;
            this.seagullSound.pause();
            this.seagullSound.currentTime = 0;
        } catch (e) {
            console.error("Stop beach ambience error", e);
        }
    }

    playTick(isUrgent = false) {
        if (this.sfxMuted) return;

        try {
            // Resume context if suspended (browser requirements)
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            // "Woodblock" tick sound
            osc.type = 'sine';
            // Urgent: Higher pitch, Normal: Lower pitch
            osc.frequency.setValueAtTime(isUrgent ? 800 : 600, this.audioCtx.currentTime);

            // Short burst envelope
            gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

            osc.start(this.audioCtx.currentTime);
            osc.stop(this.audioCtx.currentTime + 0.1);

        } catch (e) {
            console.error("Tick error", e);
        }
    }

    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        localStorage.setItem('musicMuted', this.musicMuted);

        if (this.musicMuted) {
            this.bgMusic.pause();
        } else {
            this.bgMusic.play().catch(e => console.warn("Music resume failed", e));
        }
        return !this.musicMuted;
    }

    toggleSfx() {
        this.sfxMuted = !this.sfxMuted;
        localStorage.setItem('sfxMuted', this.sfxMuted);
        console.log(`[SoundManager] SFX Toggled directly. New state Muted: ${this.sfxMuted}`);
        return !this.sfxMuted;
    }

    playMusic() {
        if (this.musicMuted) return;
        try {
            this.bgMusic.play().catch(e => console.warn("Music play failed", e));
        } catch (e) {
            console.error("Music error", e);
        }
    }

    stopMusic() {
        try {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        } catch (e) {
            console.error("Music error", e);
        }
    }

    playCorrect() {
        if (this.sfxMuted) return;
        try {
            // Resume context if suspended
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            // Create a short "success" chime (upward notes)
            const now = this.audioCtx.currentTime;

            // First note (higher)
            const osc1 = this.audioCtx.createOscillator();
            const gain1 = this.audioCtx.createGain();
            osc1.connect(gain1);
            gain1.connect(this.audioCtx.destination);

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(800, now);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc1.start(now);
            osc1.stop(now + 0.15);

            // Second note (even higher) - delayed slightly
            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1000, now + 0.08);
            gain2.gain.setValueAtTime(0.3, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc2.start(now + 0.08);
            osc2.stop(now + 0.25);

        } catch (e) {
            console.error("Success sound error", e);
        }
    }

    playWrong() {
        console.log(`[SoundManager] playWrong requested. Muted: ${this.sfxMuted}`);
        if (this.sfxMuted) return;
        try {
            this.wrongSound.currentTime = 0;
            this.wrongSound.play().catch(e => console.warn("Audio play failed", e));
        } catch (e) {
            console.error("Sound error", e);
        }
    }
}

export const soundManager = new SoundManager();
