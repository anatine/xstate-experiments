'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { atom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai/react';

import { deepMachineAtom } from '../../../../state/deep-machine';

const deepStateValueAtom = atom((get) =>
  get(deepMachineAtom).state.value.toString()
);

export default function DynamicPage() {
  const deepStateValue = useAtomValue(deepStateValueAtom);
  const sendDeep = useSetAtom(deepMachineAtom);

  useEffect(() => {
    if (deepStateValue !== 'IDLE') return;
    sendDeep({ type: 'deep.start' });
  }, [deepStateValue, sendDeep]);

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        Current Deep State: <span className="font-bold">{deepStateValue}</span>
      </div>
      <div className="flex flex-col flex-grow justify-center items-center gap-2 p-4 font-bold text-3xl">
        Deep Page
        <Link href="/dynamic" className="btn btn-sm">
          Return To Root
        </Link>
        <Link href="/dynamic/child" className="btn btn-sm">
          Return To Child
        </Link>
      </div>
    </>
  );
}
