'use client';

import { useAtom } from 'jotai/react';
import { assign, createMachine } from 'xstate';

import { atomWithMachine } from '@anatine/jotai-xstate';

const toggleMachine = createMachine(
  {
    id: 'toggle',
    initial: 'inactive',
    context: { counter: 0 },

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

const toggleMachineAtom = atomWithMachine(() => toggleMachine);

export const Toggler = () => {
  const [state, send] = useAtom(toggleMachineAtom);
  console.log(
    '🚀 ~ file: atomWithMachine.test.tsx:28 ~ Toggler ~ state:',
    state.value
  );

  return (
    <button onClick={() => send({ type: 'TOGGLE' })} className="btn">
      {state.value === 'inactive'
        ? 'Click to activate'
        : 'Active! Click to deactivate'}
    </button>
  );
};
