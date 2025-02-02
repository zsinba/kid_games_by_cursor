/* soundManager.js */
class SoundManager {
    constructor() {
        this.sounds = {
            background: new Audio('sounds/sci-fi-sound-effect-designed-circuits-hum-24-200825.mp3'),
            grab: new Audio('sounds/elemental-magic-spell-impact-outgoing-228342.mp3'),
            drop: new Audio('sounds/downfall-3-208028.mp3'),
            success: new Audio('sounds/ascent-braam-magma-brass-d-cinematic-trailer-sound-effect-222269.mp3'),
            fail: new Audio('sounds/wrong-place-129242.mp3'),
            gameOver: new Audio('sounds/game-over-2-sound-effect-230463.mp3'),
            click: new Audio('sounds/stab-f-01-brvhrtz-224599.mp3'),
            hover: new Audio('sounds/riser-hit-sfx-001-289802.mp3')
        };

        // 设置背景音乐循环播放
        this.sounds.background.loop = true;

        // 设置音量
        this.sounds.background.volume = 0.3;
        this.sounds.grab.volume = 0.6;
        this.sounds.drop.volume = 0.6;
        this.sounds.success.volume = 0.6;
        this.sounds.fail.volume = 0.4;
        this.sounds.gameOver.volume = 0.6;
        this.sounds.click.volume = 0.3;
        this.sounds.hover.volume = 0.2;

        this.enabled = true;
    }

    play(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        if (sound) {
            // 对于非背景音乐，每次播放前重置时间
            if (soundName !== 'background') {
                sound.currentTime = 0;
            }
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAll();
        } else {
            this.play('background');
        }
        return this.enabled;
    }
}

// 创建全局音效管理器实例
window.soundManager = new SoundManager();

if (typeof module !== 'undefined') {
    module.exports = SoundManager;
}