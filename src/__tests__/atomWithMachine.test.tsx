import React, { StrictMode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { useAtom } from 'jotai/react';
import { assign, createMachine } from 'xstate';

import { atomWithMachine, RESTART } from '../index';

describe('atomWithMachine', () => {
  it('toggle machine', async () => {
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

    const Toggler = () => {
      const [state, send] = useAtom(toggleMachineAtom);
      console.log(
        '🚀 ~ file: atomWithMachine.test.tsx:28 ~ Toggler ~ state:',
        state.value
      );

      return (
        <button onClick={() => send({ type: 'TOGGLE' })}>
          {state.value === 'inactive'
            ? 'Click to activate'
            : 'Active! Click to deactivate'}
        </button>
      );
    };

    const { findByText, getByText } = render(
      <StrictMode>
        <Toggler />
      </StrictMode>
    );

    await findByText('Click to activate');

    fireEvent.click(getByText('Click to activate'));

    await findByText('Active! Click to deactivate');

    fireEvent.click(getByText('Active! Click to deactivate'));
    await findByText('Click to activate');
  });

  it('restartable machine', async () => {
    const toggleMachine = createMachine(
      {
        id: 'toggle',
        initial: 'inactive',
        context: { counter: 0 },
        types: { context: {} as { counter: number } },
        on: { DISABLE: '.final' },
        states: {
          inactive: {
            on: { PRESS: 'active' },
          },
          active: {
            on: {
              PRESS: {
                actions: 'increment',
              },
            },
          },
          final: {
            type: 'final',
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

    const Toggler = () => {
      const [state, send] = useAtom(toggleMachineAtom);

      return (
        <>
          <button
            onClick={() => send({ type: 'PRESS' })}
            disabled={state.value === 'final'}
          >
            {state.value === 'inactive'
              ? 'Click to activate'
              : state.value === 'active'
              ? 'Increment'
              : 'Not actionable'}
          </button>
          <div>Count: {state.context.counter}</div>
          <button
            onClick={() => {
              send(state.value === 'final' ? RESTART : { type: 'DISABLE' });
            }}
          >
            {state.value === 'final' ? 'Restart machine' : 'Go to final state'}
          </button>
        </>
      );
    };

    const { findByText, getByText } = render(
      <StrictMode>
        <Toggler />
      </StrictMode>
    );

    await findByText('Click to activate');
    await findByText('Count: 0');

    fireEvent.click(getByText('Click to activate'));
    await findByText('Increment');
    await findByText('Count: 0');

    fireEvent.click(getByText('Increment'));
    await findByText('Count: 1');

    fireEvent.click(getByText('Increment'));
    await findByText('Count: 2');

    fireEvent.click(getByText('Go to final state'));
    await findByText('Not actionable');

    fireEvent.click(getByText('Restart machine'));
    await waitFor(() => {
      expect(findByText('Click to activate')).toBeDefined();
      expect(findByText('Count: 0')).toBeDefined();
    });
  });
});
