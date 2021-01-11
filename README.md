# one-scroll

One scroll aims to normalize scroll events between different browsers and input devices and identify whether the event was triggered by the user or by the OS momentum scroll.

## Installation

```
npm install --save one-scroll
```

## Getting started

To create a new `one` instance:
```js
import One from 'one-scroll';
const el = document.getElementById('target-el');
const one = new One(el, {
  // default option values
  samples: 150,         // total samples used for momentum scroll detection
  dragThreshold: 8,     // drag distance to detect a trouch scroll event
  deltaThreshold: 0.5,  // threshold below which the event is considered inertial
  minDelta: 0.01,       // min delta to detect scroll events
  triggerOnly: false,   // don't emit events detected as inertial
  resetTime: 200,       // ms to reset scroll data, after this timeout following events will be treated as a different scroll action
});
```
You can then attach an event listener to the instance:
```js
one.addEventListener((e) => {
    // do something
})
```
The event being passed to the callback contains an additional property `one`:
```js
e.one = {
    averageEnd: 0.208       // average delta of the last 10% of the samples
    averageMiddle: 0.425    // average delta of the last 50% of the samples
    offset: -0.217          // (averageEnd - averageMiddle) used to detect inertial events
    delta: 0.15             // delta of the current event
    deltas: []              // all registered deltas for current scroll event
    direction: 1            // normalized scroll direction (+/- 1)
    id: 1                   // id of the current scroll action
    inertial: true          // wether the event is user-triggered or inertial
    timestamp: 1974.03      // timestamp of the scroll event
}
```

## License

[MIT](LICENSE).
