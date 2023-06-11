'use client';

import { useEffect, type PropsWithChildren } from 'react';
import Link from 'next/link';
import { atom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai/react';
import { EventFromBehavior } from 'xstate';

import { childMachineAtom } from '../../../state/child-machine';

const childStateValue = atom((get) => get(childMachineAtom).state.value);
const childSendAtom = atom(
  null,
  (get, set, action: { type: string; [key: string]: unknown }) => {
    const send = get(childMachineAtom).actorRef.send;
    send(action);
  }
);

export default function Layout({ children }: PropsWithChildren) {
  const childValue = useAtomValue(childStateValue);
  const sendChild = useSetAtom(childSendAtom);

  useEffect(() => {
    if (childValue !== 'IDLE') return;
    sendChild({ type: 'child.start' });
  }, [childValue, sendChild]);
  return (
    <div className="flex flex-col flex-grow gap-2">
      <div className="flex items-center justify-center gap-2">
        Current Child State:{' '}
        <span className="font-bold">{childValue.toString()}</span>
      </div>

      {children}
    </div>
  );
}
