export class ExamTimer {
    constructor({ duration, onTick, onFinish }) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onFinish = onFinish;
        this.interval = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.remaining--;
            if (this.onTick) this.onTick(this.remaining);
            if (this.remaining <= 0) {
                this.stop();
                if (this.onFinish) this.onFinish();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
    }

    reset(newDuration) {
        this.stop();
        this.remaining = newDuration !== undefined ? newDuration : this.duration;
        if (this.onTick) this.onTick(this.remaining);
    }

    getRemaining() {
        return this.remaining;
    }

    getFormattedTime() {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}