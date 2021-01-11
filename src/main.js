import normalizeWheel from "./vendor/normalize-wheel";

const defaultOptions = {
  samples: 150,
  dragThreshold: 8,
  deltaThreshold: 0.5,
  minDelta: 0.01,
  triggerOnly: false,
  resetTime: 200
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

export default class One {
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
  }

  removeListeners() {
    this.el.removeEventListener("wheel", this.boundHandleScroll);
    this.el.removeEventListener("touchstart", this.boundStartTouch);
    this.el.removeEventListener("touchmove", this.boundHandleTouch);
  }

  startTouch(e) {
    this.touchStart = e.touches[0].clientY;
  }

  handleTouch(e) {
    this.offsetMobile = touchStart - e.touches[0].clientY;
    e.deltaY = e.wheelDelta = Math.sign(offsetMobile) * -2;
    if (Math.abs(offsetMobile) > this.options.dragThreshold)
      return handleScroll(e);
  }

  handleScroll(e) {
    const wheel = normalizeWheel(e);
    const delta = Math.abs(wheel.spinY);
    const currentScrollTime = new Date().getTime();
    if (currentScrollTime - this.lastScrollTime > this.options.resetTime) {
      this.deltas = [];
      this.offsetMobile = 0;
      this.scrollId++;
    }
    this.lastScrollTime = currentScrollTime;
    if (delta < this.options.minDelta) return false;
    if (this.deltas.length >= this.options.samples) this.deltas.shift();
    this.deltas.push(delta);
    const acc = this.computeAvg();
    const direction = Math.sign(wheel.spinY);
    if (!this.options.triggerOnly || !acc.inertial) {
      e.one = {
        delta,
        direction,
        deltas: this.deltas,
        ...acc,
        id: this.scrollId,
        timestamp: e.timeStamp
      };
      this.callbacks.forEach((c) => c(e));
    }
  }

  computeAvg() {
    const averageEnd = average(this.deltas, this.options.samples/10);
    const averageMiddle = average(this.deltas, this.options.samples/2);
    const offset = averageEnd - averageMiddle;
    const inertial = offset < this.options.deltaThreshold;
    return {
      inertial: this.deltas.length <= 1 ? false : inertial,
      offset,
      averageEnd,
      averageMiddle,
    };
  }

  addEventListener(callback) {
    this.callbacks.push(callback);
  }

  removeEventListener(callback) {
    const idx = this.callbacks.indexOf(callback);
    this.callbacks.splice(idx, 1);
  }
}
