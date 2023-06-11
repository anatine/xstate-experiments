import { atom, type Getter } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  AnyActorRef,
  interpret,
  InterpreterStatus,
  type AnyStateMachine,
  type EventFromBehavior,
  type Interpreter,
  type InterpreterOptions,
  type SnapshotFrom,
} from 'xstate';

import { isGetter } from './utils';

export function atomWithActor<TMachine extends AnyStateMachine>(
  getMachine: TMachine | ((get: Getter) => TMachine),
  getOptions?:
    | Partial<InterpreterOptions<TMachine>>
    | ((get: Getter) => Partial<InterpreterOptions<TMachine>>)
) {
  const interpretedMachineAtom = atom<null | {
    machine: TMachine;
    actor: Interpreter<TMachine, EventFromBehavior<TMachine>>;
  }>(null);

  const cachedMachineStateAtom = atom<SnapshotFrom<TMachine> | null>(null);
  if (process.env['NODE_ENV'] !== 'production') {
    cachedMachineStateAtom.debugPrivate = true;
  }

  const machineOperatorAtom = atom(
    (get) => {
      const interpretedMachine = get(interpretedMachineAtom);
      if (interpretedMachine) return interpretedMachine;

      let initializing = true;
      const safeGet: typeof get = (...args) => {
        if (initializing) {
          return get(...args);
        }
        throw new Error('get not allowed after initialization');
      };
      const machine = isGetter(getMachine) ? getMachine(safeGet) : getMachine;
      const options = isGetter(getOptions) ? getOptions(safeGet) : getOptions;
      if (options?.systemId && options?.parent && options.parent.system) {
        const existingActor = options.parent.system?.get(options.systemId);
        if (existingActor) {
          return {
            machine,
            actor: existingActor as Interpreter<
              TMachine,
              EventFromBehavior<TMachine>
            >,
          };
        }
      }

      const actor = interpret(machine, options);
      initializing = false;
      return { machine, actor };
    },
    (get, set) => {
      if (get(interpretedMachineAtom) === null) return;
      set(interpretedMachineAtom, get(machineOperatorAtom));
    }
  );
  machineOperatorAtom.onMount = (commit) => {
    commit();
  };

  const actorOrchestratorAtom = atom(
    (get) => get(machineOperatorAtom).actor,
    (get, set, registerCleanup: (cleanup: () => void) => void) => {
      const { actor } = get(machineOperatorAtom);
      const subscription = actor.subscribe((nextState) => {
        set(cachedMachineStateAtom, nextState);
      });
      actor.start();
      registerCleanup(() => {
        const { actor } = get(machineOperatorAtom);
        subscription.unsubscribe();
        if (!actor._parent) {
          actor.stop();
          actor.status = InterpreterStatus.NotStarted;
          (actor as any)._initState();
        }
      });
    }
  );
  actorOrchestratorAtom.onMount = (initialize) => {
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

  const actorStateAtom = atom(
    (get) => {
      const state =
        get(cachedMachineStateAtom) ??
        (get(actorOrchestratorAtom).getSnapshot() as SnapshotFrom<TMachine>);
      const actorRef = get(actorOrchestratorAtom);
      return { state, actorRef };
    },
    (
      get,
      set,
      action:
        | EventFromBehavior<TMachine>
        | ({ type: string } & Record<string, unknown>)
    ) => {
      const actor = get(actorOrchestratorAtom);
      actor.send(action as EventFromBehavior<TMachine>);
    }
  );

  return actorStateAtom;
}

/**
 * 
: WritableAtom<
  // Interpreter<TMachine, EventFromBehavior<TMachine>>,
  SnapshotFrom<TMachine>,
  EventFromBehavior<TMachine> | AnyActorBehavior,
  void
>
 */

export interface SpawnedActor {
  actor: AnyStateMachine;
  parent: AnyActorRef;
  id: string;
}

export const spawnedActorFamily = atomFamily(
  ({ actor, parent, id }: SpawnedActor) => {
    return atomWithActor(actor, { parent, id, systemId: id });
  }
);
