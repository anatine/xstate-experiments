import {
  assign,
  createMachine,
  pure,
  raise,
  sendTo,
  type AnyActorRef,
  type AnyEventObject,
  type AnyStateMachine,
  type BaseActionObject,
} from 'xstate';

export const ACTOR_SPAWN_TYPE = 'actorManager.spawn';
export const ACTOR_START_TYPE = 'actorManager.start';
export const ACTOR_STOP_TYPE = 'actorManager.stop';
export const ACTOR_ERROR_TYPE = 'actorManager.error';
export const ACTOR_PROCESS_EVENTS_TYPE = 'actorManager.processEvents';

export interface TargetedEvent extends AnyEventObject {
  actorSystemId?: string;
  actorSendWhenOnline?: boolean;
}

export type ActorManagerSpawnEvent = {
  type: typeof ACTOR_SPAWN_TYPE;
  id: string;
  actor: AnyStateMachine;
};

export type ActorManagerStartEvent = {
  type: typeof ACTOR_START_TYPE;
  id: string;
};

export type ActorManagerStopEvent = {
  type: typeof ACTOR_STOP_TYPE;
  id: string;
};

export type ActorManagerProcessEventsEvent = {
  type: typeof ACTOR_PROCESS_EVENTS_TYPE;
  systemId?: string;
};

export type ActorManagerErrorEvent = {
  type: typeof ACTOR_ERROR_TYPE;
  systemId?: string;
  error: string;
};

export type ActorManagerEvents =
  | ActorManagerSpawnEvent
  | ActorManagerStartEvent
  | ActorManagerStopEvent
  | ActorManagerProcessEventsEvent
  | ActorManagerErrorEvent
  | TargetedEvent;

export interface ActorManagerContext {
  actors: Record<
    string,
    {
      ref: AnyActorRef;
      running: boolean;
    }
  >;
  actorIds: string[];
  events: TargetedEvent[];
}

export const actorManagerMachine = createMachine(
  {
    id: 'ActorManager',
    initial: 'IDLE',
    states: {
      IDLE: {
        on: {
          [ACTOR_PROCESS_EVENTS_TYPE]: 'RUNNING',
        },
      },
      RUNNING: {
        entry: ['processEvents'],
        on: {
          [ACTOR_PROCESS_EVENTS_TYPE]: {
            target: 'RUNNING',
            reenter: true,
          },
          [ACTOR_STOP_TYPE]: {
            actions: ['stopActor'],
          },
          [ACTOR_START_TYPE]: {
            actions: ['startActor'],
          },
        },
      },
    },
    context: {
      actors: {},
      actorIds: [],
      events: [],
    },
    on: {
      [ACTOR_SPAWN_TYPE]: {
        actions: ['registerActor'],
      },
      [ACTOR_ERROR_TYPE]: {
        actions: ['handleError'],
      },
      '*': {
        actions: pure(({ context, event }) => {
          if ('actorSystemId' in event && event.actorSystemId) {
            const actor = context.actors[event.actorSystemId];
            if (actor && actor.running) {
              return sendTo(actor.ref, event);
            } else if (event.actorSendWhenOnline) {
              return assign({
                events: [...context.events, event],
              });
            } else {
              return [];
            }
          }
          return [];
        }),
      },
    },
    types: {} as {
      context: ActorManagerContext;
      events: ActorManagerEvents;
    },
  },
  {
    actions: {
      registerActor: pure(({ context, event }) => {
        const finalActions: BaseActionObject[] = [];

        if (event.type !== ACTOR_SPAWN_TYPE) {
          return finalActions;
        }
        if (typeof event.id !== 'string' || typeof event.actor !== 'object') {
          return raise(() => ({
            type: ACTOR_ERROR_TYPE,
            error: `Invalid event`,
            systemId: event.id,
          }));
        }
        if (context.actors[event.id]) {
          return raise(() => ({
            type: ACTOR_ERROR_TYPE,
            error: `Actor with id ${event.id} already exists`,
            systemId: event.id,
          }));
        }

        return [
          assign({
            actors: ({ spawn }) => ({
              ...context.actors,
              [event.id]: {
                ref: spawn(event.actor, {
                  id: event.id,
                  systemId: event.id,
                }),
                running: true,
              },
            }),
          }),
          raise(() => ({
            type: ACTOR_PROCESS_EVENTS_TYPE,
            systemId: event.id,
          })),
        ];
      }),

      handleError: ({ event }) => {
        if (process?.env?.['NODE_ENV'] !== 'production') {
          console.error(event);
        }
      },

      processEvents: pure(({ context, event }) => {
        if (event.type !== ACTOR_PROCESS_EVENTS_TYPE) {
          return [];
        }

        const finalActions: BaseActionObject[] = [];
        const eventActions: BaseActionObject[] = [];

        const handleEventsForActor = (actorId: string) => {
          finalActions.push(
            assign({
              events: context['events'].filter((e) => {
                const match = e.actorSystemId === actorId;

                if (match) {
                  eventActions.push(sendTo(actorId, e));
                }
                return !match;
              }),
            })
          );
          return [...finalActions, ...eventActions];
        };

        if (typeof event.systemId === 'string') {
          handleEventsForActor(event.systemId);
          return [...finalActions, ...eventActions];
        }

        const actorIds = Object.keys(context.actors);
        for (let i = 0; i < actorIds.length; i++) {
          const actorId = actorIds[i];
          const actor = context.actors[actorId];
          if (actor.running) {
            handleEventsForActor(actorId);
          }
        }
        return [...finalActions, ...eventActions];
      }),

      stopActor: pure(({ context, event }) => {
        if (event.type !== ACTOR_STOP_TYPE || typeof event.id !== 'string') {
          return [];
        }
        const actor = context.actors[event.id];
        if (!actor || !actor.running) {
          return [];
        }
        actor.ref.stop();
        return assign({
          actors: {
            ...context.actors,
            [event.id]: {
              ...actor,
              running: false,
            },
          },
        });
      }),

      startActor: pure(({ context, event }) => {
        if (event.type !== ACTOR_START_TYPE || typeof event.id !== 'string') {
          return [];
        }
        const actor = context.actors[event.id];
        if (!actor || actor.running || !actor.ref) {
          return [];
        }
        actor.ref.start?.();
        return assign({
          actors: {
            ...context.actors,
            [event.id]: {
              ...actor,
              running: true,
            },
          },
        });
      }),
    },
  }
);
