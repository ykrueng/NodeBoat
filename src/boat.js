const {Board, ESC, Fn, Led, Servo} = require('johnny-five');
const keypress = require('keypress');

const THROTTLE_STEP = 5;
const FORWARD_START = 50;
const REVERSE_START = 50;

const STEER_STEP = 5;
const SERVO_OFFSET = -15;
const RIGHT_START = 45 + SERVO_OFFSET;
const LEFT_START = 135 + SERVO_OFFSET;
const CENTER_START = 90 + SERVO_OFFSET;

const CONTROLS = {
  up: {
    start: FORWARD_START,
    step: THROTTLE_STEP,
    print: 'FORWARD'
  },
  down: {
    start: REVERSE_START,
    step: THROTTLE_STEP,
    print: 'REVERSE'
  },
  left: {
    start: LEFT_START,
    step: STEER_STEP,
    print: 'LEFT'
  },
  right: {
    start: RIGHT_START,
    step: STEER_STEP,
    print: 'RIGHT'
  },
  c: {
    start: CENTER_START,
    step: 0,
    print: 'CENTER'
  }
}

const STEERING = ['left', 'right', 'c'];

const board = new Board({
  port: '/dev/tty.turtle-DevB', // path to bluetooth connection, i.e. /dev/tty.ROBOT_NAME-SPPDev or COMX
});

board.on('ready', () => {
  const led = new Led(13);
  const esc = new ESC({
    device: 'FORWARD_REVERSE',
    pin: 11,
  });
  const servo = new Servo(10, { offset: CENTER_START });
  let speed = 0;
  let degree = 90;
  let last = null;

  servo.to(CONTROLS.c.start, 1000);

  // just to make sure the program is running
  led.blink(500);

  function controller(_, key) {
    let change = 0;

    if (key) {
      if (key.name === 'g') {
        degree--;
        console.log('degree:', degree);
        servo.to(degree, 100);
      }
      if (!key.shift) {
        change = esc.neutral;
        speed = 0;
      } else {
        if (key.name === 'up' || key.name === 'down') {
          if (last !== key.name) {
            change = esc.neutral;
            speed = 0;
          } else {
            if (!speed) {
              speed = CONTROLS[key.name].start;
            } else {
              speed += CONTROLS[key.name].step;
            }

            change =
              key.name === 'up' ? esc.neutral + speed : esc.neutral - speed;
          }

          last = key.name;
        }

        if (STEERING.includes(key.name)) {
          servo.to(CONTROLS[key.name].start, 1000);
          console.log(`${CONTROLS[key.name].print}`);
        }
        if (change) {
          console.log(`${CONTROLS[key.name].print}: ${change}`);
          esc.throttle(change);
        }
      }
    }
  }

  keypress(process.stdin);

  process.stdin.on('keypress', controller);
  process.stdin.setRawMode(true);
  process.stdin.resume();
});

board.on('error', error => {
  console.error(error);
  process.exit(1);
});
