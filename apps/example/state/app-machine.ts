import { createMachine } from 'xstate';

import { atomWithActor } from '@anatine/jotai-xstate';

export const appMachine = createMachine({
  id: 'AppMachine',
  initial: 'IDLE',
  states: {
    IDLE: {
      on: {
        'app.start': [
          {
            target: 'RUNNING',
            guard: () => typeof window !== 'undefined',
          },
          {
            target: 'SERVER',
            guard: () => typeof window === 'undefined',
          },
        ],
      },
    },
    RUNNING: {
      entry: [
        ({ context, event }) =>
          console.log('RUNNING ON CLIENT', context, event),
      ],
    },
    SERVER: {
      entry: [
        ({ context, event }) =>
          console.log('RUNNING ON SERVER', context, event),
      ],
    },
  },
});

export const appMachineAtom = atomWithActor(appMachine);
