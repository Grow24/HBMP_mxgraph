'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function FlowBuilderIframe() {
  const [isLoading, setIsLoading] = useState(true);
  const [flowBuilderUrl] = useState('http://localhost:5173');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Flow Builder...</h2>
          <p className="text-gray-600">Initializing workflow engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to HBMP
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold">Flow Builder</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Integrated Mode</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <a href={flowBuilderUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open Standalone
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <iframe
          src={flowBuilderUrl}
          className="w-full h-full border-0"
          title="Flow Builder"
          onLoad={() => {
            const iframe = document.querySelector('iframe');
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'HBMP_INTEGRATION',
                apiEndpoint: 'http://localhost:3001/api',
                features: ['execution', 'persistence', 'export']
              }, '*');
            }
          }}
        />
      </div>
    </div>
  );
}
