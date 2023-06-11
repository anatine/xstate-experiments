import {
  fromTransition,
  interpret,
  type ActorRef,
  type AnyEventObject,
} from 'xstate';

const emptyLogic = fromTransition((_) => undefined, undefined);
export function createEmptyActor(): ActorRef<AnyEventObject, undefined> {
  return interpret(emptyLogic);
}
