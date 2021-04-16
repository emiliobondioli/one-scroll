import normalizeWheel from "./vendor/normalize-wheel";

const defaultOptions = {
  samples: 150,
  dragThreshold: 8,
  deltaThreshold: 0.5,
  resetTime: 300,
};

function average(array, take) {
  if (!take) take = array.length;
  var sum = 0;
  var lastElements = array.slice(Math.max(array.length - take, 1));
  for (var i = 0; i < lastElements.length; i++) {
    sum = sum + lastElements[i];
  }
  return sum / take;
}

export class One {
  constructor(el, options = {}) {
    this.options = { ...defaultOptions, ...options };
    this.deltas = [];
    this.callbacks = [];
    this.el = el;
    this.touchStart = 0;
    this.lastScrollTime = 0;
    this.scrollId = 0;
    this.addListeners();
  }

  addListeners() {
    this.boundHandleScroll = this.handleScroll.bind(this);
    this.el.addEventListener("wheel", this.boundHandleScroll, {
      passive: false,
    });
    this.boundStartTouch = this.startTouch.bind(this);
    this.el.addEventListener("touchstart", this.boundStartTouch);
    this.boundHandleTouch = this.handleTouch.bind(this);
    this.el.addEventListener("touchmove", this.boundHandleTouch, {
      passive: false,
      cancelable: true,
    });
    this.boundEndScroll = this.endScroll.bind(this);
    this.el.addEventListener("mousedown", (e) => {
      document.body.addEventListener("mouseup", this.boundEndScroll);
      this.emitStart(e);
    });
  }

  removeListeners() {
    this.el.removeEventListener("wheel", this.boundHandleScroll);
    this.el.removeEventListener("touchstart", this.boundStartTouch);
    this.el.removeEventListener("touchmove", this.boundHandleTouch);
  }

  startTouch(e) {
    this.touchStart = e.touches[0].clientY;
    document.body.addEventListener("touchend", this.boundEndScroll);
    this.emitStart(e);
  }

  emitStart(e) {
    this.callbacks
      .filter((c) => c.type === "start")
      .forEach((c) => c.callback(e));
  }

  handleTouch(e) {
    this.offsetMobile = this.touchStart - e.touches[0].clientY;
    e.deltaY = e.wheelDelta = Math.sign(this.offsetMobile) * -2;
    if (Math.abs(this.offsetMobile) > this.options.dragThreshold)
      return this.handleScroll(e, true);
  }

  handleScroll(e, touch) {
    const wheel = normalizeWheel(e);
    const delta = Math.abs(wheel.spinY);
    const currentScrollTime = new Date().getTime();
    if (currentScrollTime - this.lastScrollTime > this.options.resetTime) {
      this.deltas = [];
      this.offsetMobile = 0;
      this.scrollId++;
      this.target = null;
      if(this.lastScrollTime !== 0) this.endScroll(e)
    }
    if (!this.target) this.target = e.target;
    this.lastScrollTime = currentScrollTime;
    if (this.deltas.length >= this.options.samples) this.deltas.shift();
    this.deltas.push(delta);
    const acc = this.computeAvg();
    const direction = Math.sign(wheel.spinY);
    e.one = {
      delta,
      direction,
      deltas: this.deltas,
      ...acc,
      id: this.scrollId,
      timestamp: e.timeStamp,
      target: this.target,
    };
    this.callbacks
      .filter(
        (c) =>
          c.type === "*" ||
          (touch && c.type === "touch") ||
          (!touch && c.type === "wheel")
      )
      .forEach((c) => c.callback(e));
    return false;
  }

  endScroll(e) {
    document.body.removeEventListener("mouseup", this.boundEndScroll);
    document.body.removeEventListener("touchend", this.boundEndScroll);
    this.callbacks
      .filter((c) => c.type === "end")
      .forEach((c) => c.callback(e));
  }

  computeAvg() {
    const averageEnd = average(this.deltas, this.options.samples / 10);
    const averageMiddle = average(this.deltas, this.options.samples / 2);
    const offset = averageEnd - averageMiddle;
    const inertial = offset < this.options.deltaThreshold;
    return {
      inertial: this.deltas.length <= 1 ? false : inertial,
      offset,
      averageEnd,
      averageMiddle,
    };
  }

  addEventListener(type, callback) {
    this.callbacks.push({ type, callback });
  }

  removeEventListener(type, callback = null) {
    const idx = this.callbacks.indexOf(callback);
    this.callbacks.splice(idx, 1);
  }
}
