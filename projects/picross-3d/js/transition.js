class Transition{
    constructor(target, prop, to, from, type, speed, onComplete){
        this.target = target;
        this.prop = prop;
        this.to = to;
        this.from = from;
        this.type = type;
        // speed is in units per second (frame-rate independent)
        this.speed = speed || 2.0;
        this.onComplete = onComplete || null;
    }
}