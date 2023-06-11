import { type User } from 'firebase/auth';
import { createMachine } from 'xstate';

export const authMachine = createMachine(
  {
    context: {
      authUser: null,
    },
    initial: 'Idle',
    states: {
      Idle: {
        always: {
          target: 'Loading',
          actions: 'startAuthSubscription',
        },
      },
      Loading: {
        on: {
          'auth.data': {
            target: 'Signed In',
          },
          'auth.null': {
            target: 'Signed Out',
          },
        },
      },
      'Signed In': {
        entry: ['setAuthData', 'auth.update'],
        invoke: {
          src: 'userState',
          id: 'userState',
          systemId: 'userState',
        },
        on: {
          'auth.null': {
            target: 'Signed Out',
          },
        },
      },
      'Signed Out': {
        entry: ['clearAuthData', 'auth.update'],
        on: {
          'auth.data': {
            target: 'Signed In',
          },
        },
      },
    },
    on: {
      'auth.update': {
        actions: ['notifyUserState'],
      },
    },
    types: {
      context: {} as { authUser: null | User },
    },
  },
  {
    actions: {
      notifyUserState: ({ self, context }) => {
        self.system?.get('userState')?.send({
          type: 'auth.update',
          params: context.authUser?.uid || null,
        });
      },
    },
  }
);
