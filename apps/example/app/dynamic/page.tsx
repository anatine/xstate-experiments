import Link from 'next/link';

export default function DynamicPage() {
  return (
    <div className="flex flex-col flex-grow justify-center items-center gap-4 p-4 font-bold text-3xl">
      Root Page
      <Link href="/dynamic/child" className="btn btn-primary btn-sm">
        Start Child Actor
      </Link>
    </div>
  );
}
