import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { api, Version } from '../api/client';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function Compare() {
  const [searchParams] = useSearchParams();
  const [version1, setVersion1] = useState<Version | null>(null);
  const [version2, setVersion2] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [numPages1, setNumPages1] = useState(0);
  const [numPages2, setNumPages2] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [syncScroll, setSyncScroll] = useState(true);

  const v1 = searchParams.get('v1');
  const v2 = searchParams.get('v2');

  useEffect(() => {
    if (!v1 || !v2) {
      setError('Missing version parameters');
      setLoading(false);
      return;
    }

    const loadVersions = async () => {
      try {
        const [ver1, ver2] = await Promise.all([
          api.versions.get(parseInt(v1)),
          api.versions.get(parseInt(v2))
        ]);
        setVersion1(ver1);
        setVersion2(ver2);
      } catch {
        setError('Failed to load versions');
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [v1, v2]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (error || !version1 || !version2) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || 'Unknown error'}</p>
        <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  const maxPages = Math.max(numPages1, numPages2);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-3 flex items-center justify-between flex-shrink-0">
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          &larr; Back
        </Link>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
              className="rounded"
            />
            Sync pages
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              -
            </button>
            <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.25))}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              +
            </button>
          </div>

          {syncScroll && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                &lt;
              </button>
              <span className="text-sm">
                {pageNumber} / {maxPages}
              </span>
              <button
                onClick={() => setPageNumber(p => Math.min(maxPages, p + 1))}
                disabled={pageNumber >= maxPages}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side by side viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Old version */}
        <div className="flex-1 flex flex-col border-r">
          <div className="bg-red-50 px-3 py-2 border-b flex-shrink-0">
            <div className="text-sm font-medium text-red-800 truncate">
              {version1.original_name}
            </div>
            <div className="text-xs text-red-600">
              {new Date(version1.created_at).toLocaleString()}
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <Document
              file={api.versions.getPdfUrl(version1.id)}
              onLoadSuccess={({ numPages }) => setNumPages1(numPages)}
              loading={<div className="text-gray-500">Loading PDF...</div>}
              error={<div className="text-red-500">Failed to load</div>}
            >
              <Page
                pageNumber={syncScroll ? pageNumber : 1}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </div>

        {/* Right - New version */}
        <div className="flex-1 flex flex-col">
          <div className="bg-green-50 px-3 py-2 border-b flex-shrink-0">
            <div className="text-sm font-medium text-green-800 truncate">
              {version2.original_name}
            </div>
            <div className="text-xs text-green-600">
              {new Date(version2.created_at).toLocaleString()}
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <Document
              file={api.versions.getPdfUrl(version2.id)}
              onLoadSuccess={({ numPages }) => setNumPages2(numPages)}
              loading={<div className="text-gray-500">Loading PDF...</div>}
              error={<div className="text-red-500">Failed to load</div>}
            >
              <Page
                pageNumber={syncScroll ? pageNumber : 1}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Compare;
