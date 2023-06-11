import Link from 'next/link';

export default function DynamicPage() {
  return (
    <div className="flex flex-col flex-grow justify-center items-center gap-2 p-4 font-bold text-3xl">
      Child Page
      <Link href="/dynamic" className="btn btn-sm">
        Return To Root
      </Link>
      <Link href="/dynamic/child/deep" className="btn btn-sm">
        Go Deeper
      </Link>
    </div>
  );
}
