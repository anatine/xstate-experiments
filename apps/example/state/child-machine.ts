import { atom } from 'jotai';
import { createMachine } from 'xstate';

import { spawnedActorFamily } from '@anatine/jotai-xstate';
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

export const childMachineCacheAtom = atom((get) => {
  const ID = 'childMachine';
  const { actorRef: parentRef } = get(appMachineAtom);
  console.log(`Spawn childMachine ${ID}`);
  return spawnedActorFamily({ actor: childMachine, parent: parentRef, id: ID });
});

export const childMachineAtom = atom((get) => get(get(childMachineCacheAtom)));
