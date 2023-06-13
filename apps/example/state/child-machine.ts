import { atom } from 'jotai';
import { createMachine } from 'xstate';

import { atomWithSpawnedActor } from '@anatine/jotai-xstate';
import { appMachineAtom } from './app-machine';

export const childMachine = createMachine({
  id: 'ChildMachine',
  initial: 'IDLE',
  states: {
    IDLE: {
      on: {
        'child.start': [
          {
            target: 'RUNNING',
          },
        ],
      },
    },
    RUNNING: {
      entry: [
        ({ context, event }) => console.log('CHILD RUNNING', context, event),
      ],
    },
  },
});

export const childMachineAtom = atomWithSpawnedActor(
  childMachine,
  appMachineAtom,
  { id: 'childMachine' }
);
