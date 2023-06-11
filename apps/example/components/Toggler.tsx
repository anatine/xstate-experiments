'use client';

import { atom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai/react';
import { assign, createMachine } from 'xstate';

import { atomWithActor } from '@anatine/jotai-xstate';

const toggleMachine = createMachine(
  {
    id: 'toggle',
    initial: 'inactive',
    context: { counter: 0 },
    types: {
      context: {} as { counter: number },
      events: {} as { type: 'TOGGLE' },
    },
    states: {
      inactive: {
        entry: ({ context }) => {
          console.log('STATE inactive', context);
        },
        on: {
          TOGGLE: {
            target: 'active',
            actions: [
              ({ context }) => {
                console.log('TOGGLE', context);
              },
              'increment',
            ],
          },
        },
      },
      active: {
        entry: ({ context }) => {
          console.log('STATE active', context);
        },
        on: {
          TOGGLE: {
            target: 'inactive',
            actions: [
              ({ context }) => {
                console.log('TOGGLE', context);
              },
              'increment',
            ],
          },
        },
      },
    },
  },
  {
    actions: {
      increment: assign({
        counter: ({ context }) => context.counter + 1,
      }),
    },
  }
);

const toggleMachineAtom = atomWithActor(toggleMachine);

const isActiveRef = atom((get) => {
  const { state } = get(toggleMachineAtom);
  return state.value === 'inactive';
});

export const Toggler = () => {
  const isActive = useAtomValue(isActiveRef);
  const send = useSetAtom(toggleMachineAtom);

  return (
    <button onClick={() => send({ type: 'TOGGLE' })} className="btn">
      {isActive ? 'Click to activate' : 'Active! Click to deactivate'}
    </button>
  );
};
