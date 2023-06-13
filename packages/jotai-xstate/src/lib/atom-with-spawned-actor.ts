import { atom, type Getter } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  type AnyActorRef,
  type AnyStateMachine,
  type EventFromBehavior,
  type Interpreter,
  type InterpreterOptions,
  type SnapshotFrom,
} from 'xstate';

import { atomWithActor } from './atom-with-actor';
import { isGetter } from './utils';

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

export function atomWithSpawnedActor<
  TMachine extends AnyStateMachine,
  PMachineAtom extends ReturnType<typeof atomWithActor>
>(
  getMachine: TMachine | ((get: Getter) => TMachine),
  getParentMachine: PMachineAtom | ((get: Getter) => PMachineAtom),
  getOptions?:
    | Partial<InterpreterOptions<TMachine>>
    | ((get: Getter) => Partial<InterpreterOptions<TMachine>>)
) {
  let cheatCache:
    | {
        state: SnapshotFrom<TMachine>;
        actorRef: Interpreter<TMachine, EventFromBehavior<TMachine>>;
      }
    | undefined = undefined;

  const interpretedMachineAtom = atom<null | {
    state: SnapshotFrom<TMachine>;
    actorRef: Interpreter<TMachine, EventFromBehavior<TMachine>>;
  }>(null);
  const actorOrchestratorAtom = atom(
    (get) => {
      const cached = get(interpretedMachineAtom);
      if (cached) {
        cheatCache = undefined;
        return cached;
      }
      if (cheatCache) {
        return cheatCache;
      }

      let initializing = true;
      const safeGet: typeof get = (...args) => {
        if (initializing) {
          return get(...args);
        }
        throw new Error('get not allowed after initialization');
      };
      const machine = isGetter(getMachine) ? getMachine(safeGet) : getMachine;
      const parentMachine = get(
        isGetter(getParentMachine)
          ? getParentMachine(safeGet)
          : getParentMachine
      );
      const options = isGetter(getOptions) ? getOptions(safeGet) : getOptions;

      const foundId = options?.systemId || options?.id || machine.id;
      const foundActor = parentMachine.actorRef.system?.get(foundId);
      initializing = false;

      // TODO Problem here is that this function gets call on first call then on mount, causing the actor to try and create twice :(
      if (foundActor) {
        throw new Error(
          `Actor with id ${foundId} already exists in parent machine`
        );
      } else console.log(`creating actor with id ${foundId}`);
      cheatCache = get(
        atomWithActor(machine, {
          parent: parentMachine.actorRef,
          id: foundId,
          systemId: foundId,
          ...options,
        })
      );
      return cheatCache;
    },

    (get, set) => {
      if (get(interpretedMachineAtom) === null) return;
      set(interpretedMachineAtom, get(actorOrchestratorAtom));
    }
  );
  actorOrchestratorAtom.onMount = (commit) => {
    console.log('🚀 ~ file: atom-with-actor.ts:242 ~ commit:');
    commit();
  };

  const spawnedActorAtom = atom(
    (get) => get(actorOrchestratorAtom),
    (get, set, action: EventFromBehavior<TMachine>) => {
      const actor = get(actorOrchestratorAtom).actorRef;
      actor.send(action);
    }
  );
  return spawnedActorAtom;
}
