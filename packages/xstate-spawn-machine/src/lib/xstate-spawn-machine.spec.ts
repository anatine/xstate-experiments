import { createMachine, interpret } from 'xstate';

import { actorManagerMachine } from './xstate-spawn-machine';

describe('xstateSpawnMachine', () => {
  it('should work', () => {
    const rootMachine = createMachine({
      id: 'rootMachine',
      initial: 'running',
      states: {
        running: {
          invoke: {
            id: 'actorManager',
            systemId: 'actorManager',
            src: actorManagerMachine,
          },
        },
      },
    });

    const childMachine = createMachine({
      id: 'childMachine',
      initial: 'idle',
      states: {
        idle: {
          on: {
            start: 'running',
          },
        },
        running: {
          on: {
            stop: 'idle',
          },
        },
      },
    });

    const deepChildMachine = createMachine({
      id: 'deepChildMachine',
      initial: 'idle',
      states: {
        idle: {
          on: {
            start: 'running',
          },
        },
        running: {
          on: {
            stop: 'idle',
          },
        },
      },
    });

    const service = interpret(rootMachine);
    service.start();

    const actorMangerService = service.system.get('actorManager');
    expect(actorMangerService).toBeDefined();

    actorMangerService.send({
      type: 'actorManager.spawn',
      id: 'child',
      actor: childMachine,
    });

    const childService = service.system.get('child');
    expect(childService).toBeDefined();
    expect(childService.getSnapshot().value).toBe('idle');

    actorMangerService.send({
      type: 'start',
      actorSystemId: 'child',
    });
    expect(childService.getSnapshot().value).toBe('running');

    actorMangerService.send({
      type: 'start',
      actorSystemId: 'deepChild',
      actorSendWhenOnline: true,
    });

    actorMangerService.send({
      type: 'actorManager.spawn',
      id: 'deepChild',
      actor: deepChildMachine,
    });
    const deepChildService = service.system.get('deepChild');

    expect(deepChildService).toBeDefined();
    expect(deepChildService.getSnapshot().value).toBe('running');
  });
});
