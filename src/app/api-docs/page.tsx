'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to prevent server-side rendering issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen">
      {mounted && (
        <SwaggerUI
          url="/api/docs"
          docExpansion="list"
          deepLinking={true}
          persistAuthorization={true}
          filter={true}
        />
      )}
    </div>
  );
} 