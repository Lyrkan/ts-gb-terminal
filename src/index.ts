const fs = require('fs');
const yargs = require('yargs');
const keypress = require('keypress');

import { System } from 'ts-gb/dist/system';
import { CPU_CLOCK_FREQUENCY } from 'ts-gb/dist/cpu/cpu';
import { TerminalRenderer } from 'ts-gb/dist/display/renderers/terminal-renderer';
import { BUTTON } from 'ts-gb/dist/controls/joypad';

// Parse arguments
const argv = yargs
  .usage('$0 <rom> [options]', 'Start a game', (conf: any) => {
    conf.positional('rom', {
      describe: 'Path to the ROM that should be used',
      type: 'string',
    });
  })
  .help('help').alias('help', 'h')
  .version('version', '1.0.0').alias('version', 'v')
  .options({})
  .argv;

// Initialize emulator and renderer
const system = new System();
const renderer = new TerminalRenderer(system.display);

// Load given ROM
const fileBuffer = fs.readFileSync(argv.rom);

if (!fileBuffer) {
  throw new Error(`Could not open ROM file "${argv.rom}"`);
}

system.loadGame(
  fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  )
);

// Detect key presses
keypress(process.stdin);
process.stdin.on('keypress', (ch, key) => {
  if (!key) {
    return;
  }

  switch (key.name) {
    case 'a':
      system.joypad.down(BUTTON.A);
      break;
    case 'b':
      system.joypad.down(BUTTON.B);
      break;
    case 'return':
      system.joypad.down(BUTTON.START);
      break;
    case 'space':
      system.joypad.down(BUTTON.SELECT);
      break;
    case 'up':
      system.joypad.down(BUTTON.UP);
      break;
    case 'down':
      system.joypad.down(BUTTON.DOWN);
      break;
    case 'left':
      system.joypad.down(BUTTON.LEFT);
      break;
    case 'right':
      system.joypad.down(BUTTON.RIGHT);
      break;
    case 'q':
      process.exit(0);
      break;
  }
});

if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}

process.stdin.resume();

// Clear screen
process.stdout.write('\u001Bc');

// Game loop
let lastLoopTime = Date.now();
const renderLoop = () => {
  const loopTime = Date.now();
  const deltaLoopTime = loopTime - lastLoopTime;

  // Run as many system clocks as needed
  const ticks = Math.min(
    (CPU_CLOCK_FREQUENCY * deltaLoopTime) / 1000,
    CPU_CLOCK_FREQUENCY / 30
  );

  for (let i = 0; i < ticks; i++) {
    system.tick();
  }

  // Render the current frame
  renderer.renderFrame();
  process.stdout.write('\n      Controls: A, B, Enter (Start), Space (Select), Arrows, Q (Exit)');

  // Reset all pressed buttons since
  // we can't detect key releases.
  system.joypad.pressedButtons.clear();

  lastLoopTime = loopTime;
  setImmediate(renderLoop);
};

renderLoop();
