import dynamic from 'next/dynamic';

// Dynamically import the client component with no SSR
const LooseEndsClient = dynamic(() => import('@/components/LooseEndsClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function LooseEndsPage() {
  return <LooseEndsClient />;
}