import type { Getter, WritableAtom } from 'jotai/vanilla';
import { atom } from 'jotai/vanilla';
import type {
  AnyActorRef,
  AnyInterpreter,
  AnyStateMachine,
  InterpreterFrom,
  Prop,
  StateFrom,
} from 'xstate';
import { interpret } from 'xstate';

import type { MaybeParam, Options } from './jotai-xstate.types';

export const RESTART = Symbol();

export function atomWithMachine<
  TMachine extends AnyStateMachine,
  TInterpreter = InterpreterFrom<TMachine>
>(
  getMachine: TMachine | ((get: Getter) => TMachine),
  getOptions?: Options<TMachine> | ((get: Getter) => Options<TMachine>)
): WritableAtom<
  StateFrom<TMachine>,
  // [MaybeParam<Prop<TInterpreter, 'send'>> | typeof RESTART],
  [MaybeParam<Prop<TInterpreter, 'send'>> | typeof RESTART],
  void
> {
  const cachedMachineAtom = atom<{
    machine: AnyStateMachine;
    service: AnyInterpreter;
  } | null>(null);
  if (process.env['NODE_ENV'] !== 'production') {
    cachedMachineAtom.debugPrivate = true;
  }

  const machineAtom = atom(
    (get) => {
      const cachedMachine = get(cachedMachineAtom);
      if (cachedMachine) {
        return cachedMachine;
      }
      let initializing = true;
      const safeGet: typeof get = (...args) => {
        if (initializing) {
          return get(...args);
        }
        throw new Error('get not allowed after initialization');
      };
      const machine = isGetter(getMachine) ? getMachine(safeGet) : getMachine;
      const options = isGetter(getOptions) ? getOptions(safeGet) : getOptions;
      initializing = false;
      const {
        guards,
        actions,
        actors,
        delays,
        context,
        ...interpreterOptions
      } = options || {};

      const machineConfig = {
        ...(guards ? { guards } : { guards: {} }),
        ...(actions ? { actions } : { actions: {} }),
        ...(actors ? { actors } : { actors: {} }),
        ...(delays ? { delays } : { delays: {} }),
      };

      const machineWithConfig = machine.provide({
        ...machineConfig,
        context: {
          ...machine.getContext(),
          ...context,
        },
      } as never);

      const service = interpret(machineWithConfig, interpreterOptions);
      return { machine: machineWithConfig, service };
    },
    (get, set) => {
      set(cachedMachineAtom, get(machineAtom));
    }
  );

  machineAtom.onMount = (commit) => {
    console.log('🚀 ~ file: jotai-xstate.ts:163 ~ commit:', commit);
    commit();
  };

  const cachedMachineStateAtom = atom<StateFrom<TMachine> | null>(null);
  if (process.env['NODE_ENV'] !== 'production') {
    cachedMachineStateAtom.debugPrivate = true;
  }

  const machineStateAtom = atom(
    (get) =>
      get(cachedMachineStateAtom) ??
      (get(machineAtom).machine.initialState as StateFrom<TMachine>),
    (get, set, registerCleanup: (cleanup: () => void) => void) => {
      const { service } = get(machineAtom);
      service.subscribe((nextState) => {
        console.log(
          '🚀 ~ file: jotai-xstate.ts:101 ~ service.subscribe ~ nextState:',
          nextState.value
        );
        set(cachedMachineStateAtom, nextState);
      });
      service.start();
      registerCleanup(() => {
        const { service } = get(machineAtom);
        service.stop();
      });
    }
  );

  if (process.env['NODE_ENV'] !== 'production') {
    machineStateAtom.debugPrivate = true;
  }

  machineStateAtom.onMount = (initialize) => {
    let unSubscribe: (() => void) | undefined | false;

    initialize((cleanup) => {
      if (unSubscribe === false) {
        cleanup();
      } else {
        unSubscribe = cleanup;
      }
    });

    return () => {
      if (unSubscribe) {
        unSubscribe();
      }
      unSubscribe = false;
    };
  };

  const machineStateWithServiceAtom = atom(
    (get) => get(machineStateAtom),
    (get, set, event: Parameters<AnyActorRef['send']>[0] | typeof RESTART) => {
      const { service } = get(machineAtom);
      if (event === RESTART) {
        service.stop();
        set(cachedMachineAtom, null);
        set(machineAtom);
        const { service: newService } = get(machineAtom);
        newService.subscribe((nextState) => {
          set(cachedMachineStateAtom, nextState);
        });
        newService.start();
      } else {
        service.send(event);
      }
    }
  );

  return machineStateWithServiceAtom;
}

const isGetter = <T>(v: T | ((get: Getter) => T)): v is (get: Getter) => T =>
  typeof v === 'function';
