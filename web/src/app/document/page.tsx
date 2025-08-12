'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DocumentPage = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to results page since this page now requires an ID
    router.push('/results');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-xl font-semibold">Redirecting to results...</div>
    </div>
  );
};

export default DocumentPage;