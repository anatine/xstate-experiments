import { Atom, atom, type WritableAtom } from 'jotai';
import {
  type AnyActorBehavior,
  type EventFromBehavior,
  type Interpreter,
  type SnapshotFrom,
} from 'xstate';

import { type atomWithActor } from './atom-with-actor';
import { defaultCompare } from './utils';

// export function atomWithActorSelector<
//   TMachine extends AnyActorBehavior = AnyActorBehavior,
//   S extends SnapshotFrom<TMachine> = SnapshotFrom<TMachine>,
//   TActorAtom extends ReturnType<typeof atomWithActor> = any
//   // TActor extends AnyActorBehavior = ActorBehavior<ExtractAtomValue<TActorAtom>, any>,
//   // TActor extends AnyActorBehavior = ActorBehavior<any, any>
// >(
//   actorAtom: TActorAtom,
//   selector: (emitted: SnapshotFrom<TMachine>) => S,
//   compare: (a: S, b: S) => boolean = defaultCompare
// ) {
//   // const actorRef = atom<AnyActorRef | null>(null)
//   const cachedStateAtom = atom<S | null>(null);

//   const actorOrchestratorAtom = atom(
//     (get) => {
//       const cachedState = get(cachedStateAtom);
//       if (cachedState) {
//         return cachedState;
//       }
//       return get(actorAtom).getSnapshot();
//     },
//     (get, set, registerCleanup: (cleanup: () => void) => void) => {
//       const actor = get(actorAtom);
//       const subscription = actor.subscribe((nextState) => {
//         // TODO - fix casting issues later
//         const selection = selector(nextState as never);
//         const previous = get(cachedStateAtom);
//         if (previous && compare(selection, previous)) return;
//         set(cachedStateAtom, nextState as S);
//       });
//       registerCleanup(() => {
//         subscription.unsubscribe();
//       });
//     }
//   );
//   actorOrchestratorAtom.onMount = (initialize) => {
//     let unSubscribe: (() => void) | undefined | false;

//     initialize((cleanup) => {
//       if (unSubscribe === false) {
//         cleanup();
//       } else {
//         unSubscribe = cleanup;
//       }
//     });

//     return () => {
//       if (unSubscribe) {
//         unSubscribe();
//       }
//       unSubscribe = false;
//     };
//   };

//   const selectorAtom = atom(
//     (get) => get(actorOrchestratorAtom),
//     (
//       get,
//       set,
//       event: Parameters<
//         Interpreter<TMachine, EventFromBehavior<TMachine>>['send']
//       >
//     ) => {
//       const actor = get(actorAtom);
//       actor.send(...event);
//     }
//   );
//   return selectorAtom;
// }
