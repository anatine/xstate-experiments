'use client';

import { useEffect, type PropsWithChildren } from 'react';
import Link from 'next/link';
import { atom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai/react';

import { appMachineAtom } from '../../state/app-machine';

const appStateValueAtom = atom((get) => get(appMachineAtom).state.value);

export default function Layout({ children }: PropsWithChildren) {
  const stateValue = useAtomValue(appStateValueAtom);
  const send = useSetAtom(appMachineAtom);

  useEffect(() => {
    if (stateValue === 'IDLE') {
      send({ type: 'app.start' });
    }
  });

  if (stateValue === 'SERVER') return null;

  return (
    <div className="flex flex-col flex-grow gap-2 p-4">
      <div className="flex items-center justify-center gap-2">
        Current App State:{' '}
        <span className="font-bold">{stateValue?.toString()}</span>
      </div>

      {children}
    </div>
  );
}
