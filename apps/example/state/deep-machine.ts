import { atom } from 'jotai';
import { createMachine } from 'xstate';

import { spawnedActorFamily } from '@anatine/jotai-xstate';
import { appMachineAtom } from './app-machine';

export const deepMachine = createMachine({
  id: 'DeepMachine',
  initial: 'IDLE',
  states: {
    IDLE: {
      on: {
        'deep.start': [
          {
            target: 'RUNNING',
          },
        ],
      },
    },
    RUNNING: {
      entry: [
        ({ context, event }) => console.log('DEEP RUNNING', context, event),
      ],
    },
  },
});

export const deepMachineCacheAtom = atom((get) => {
  const ID = 'deepMachine';
  const { actorRef: parentRef } = get(appMachineAtom);
  console.log(`Spawn childMachine ${ID}`);
  return spawnedActorFamily({ actor: deepMachine, parent: parentRef, id: ID });
});

export const deepMachineAtom = atom(
  (get) => get(get(deepMachineCacheAtom)),
  (get, set, event) => get(get(deepMachineCacheAtom)).actorRef.send(event)
);
