import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  url: string;
  filename: string;
  onClose: () => void;
}

function PdfPreview({ url, filename, onClose }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(s => Math.min(3, Math.max(0.5, s + delta)));
    }
  }, []);

  const clearHighlights = useCallback(() => {
    if (!viewerRef.current) return;
    const marks = viewerRef.current.querySelectorAll('mark[data-pdf-search]');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
  }, []);

  const highlightMatches = useCallback((text: string) => {
    clearHighlights();
    if (!text || !viewerRef.current) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }

    const textSpans = viewerRef.current.querySelectorAll('.react-pdf__Page__textContent span');
    let total = 0;

    textSpans.forEach((span) => {
      const content = span.textContent || '';
      const lowerContent = content.toLowerCase();
      const lowerSearch = text.toLowerCase();

      if (lowerContent.includes(lowerSearch)) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let idx = lowerContent.indexOf(lowerSearch);

        while (idx !== -1) {
          if (idx > lastIndex) {
            fragment.appendChild(document.createTextNode(content.slice(lastIndex, idx)));
          }
          const mark = document.createElement('mark');
          mark.setAttribute('data-pdf-search', '');
          mark.setAttribute('data-match-index', String(total));
          mark.style.backgroundColor = 'rgba(255, 200, 0, 0.5)';
          mark.style.color = 'inherit';
          mark.style.padding = '0';
          mark.textContent = content.slice(idx, idx + lowerSearch.length);
          fragment.appendChild(mark);
          total++;
          lastIndex = idx + lowerSearch.length;
          idx = lowerContent.indexOf(lowerSearch, lastIndex);
        }

        if (lastIndex < content.length) {
          fragment.appendChild(document.createTextNode(content.slice(lastIndex)));
        }
        span.textContent = '';
        span.appendChild(fragment);
      }
    });

    setMatchCount(total);
    setCurrentMatch(total > 0 ? 1 : 0);
  }, [clearHighlights]);

  const scrollToMatch = useCallback((index: number) => {
    if (!viewerRef.current) return;
    const marks = viewerRef.current.querySelectorAll('mark[data-pdf-search]');

    marks.forEach((m) => {
      (m as HTMLElement).style.backgroundColor = 'rgba(255, 200, 0, 0.5)';
    });

    if (marks[index - 1]) {
      (marks[index - 1] as HTMLElement).style.backgroundColor = 'rgba(255, 130, 0, 0.8)';
      marks[index - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const goToNextMatch = useCallback(() => {
    if (matchCount === 0) return;
    const next = currentMatch >= matchCount ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    scrollToMatch(next);
  }, [matchCount, currentMatch, scrollToMatch]);

  const goToPrevMatch = useCallback(() => {
    if (matchCount === 0) return;
    const prev = currentMatch <= 1 ? matchCount : currentMatch - 1;
    setCurrentMatch(prev);
    scrollToMatch(prev);
  }, [matchCount, currentMatch, scrollToMatch]);

  const openSearch = useCallback(() => {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchText('');
    clearHighlights();
    setMatchCount(0);
    setCurrentMatch(0);
  }, [clearHighlights]);

  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && showSearch) {
        closeSearch();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, closeSearch, showSearch]);

  useEffect(() => {
    if (searchText) {
      const timer = setTimeout(() => highlightMatches(searchText), 200);
      return () => clearTimeout(timer);
    } else {
      clearHighlights();
      setMatchCount(0);
      setCurrentMatch(0);
    }
  }, [searchText, highlightMatches, clearHighlights]);

  useEffect(() => {
    if (currentMatch > 0) {
      scrollToMatch(currentMatch);
    }
  }, [currentMatch, scrollToMatch]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <span className="font-medium truncate">{filename}</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
            >
              -
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.25))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
            >
              +
            </button>
          </div>
          <span className="text-sm text-gray-400">
            {numPages} pages
          </span>
          <button
            onClick={openSearch}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
          >
            Search
          </button>
          <a
            href={url}
            download
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
          >
            Download
          </a>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-3">
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.shiftKey ? goToPrevMatch() : goToNextMatch();
              }
            }}
            placeholder="Search in PDF..."
            className="px-3 py-1.5 bg-gray-700 text-white border border-gray-600 rounded text-sm w-64 focus:outline-none focus:border-blue-500"
          />
          {searchText && (
            <span className="text-sm text-gray-400">
              {matchCount > 0 ? `${currentMatch} / ${matchCount}` : 'No results'}
            </span>
          )}
          <button
            onClick={goToPrevMatch}
            disabled={matchCount === 0}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white text-sm disabled:opacity-50"
          >
            &uarr;
          </button>
          <button
            onClick={goToNextMatch}
            disabled={matchCount === 0}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white text-sm disabled:opacity-50"
          >
            &darr;
          </button>
          <button
            onClick={closeSearch}
            className="px-2 py-1 text-gray-400 hover:text-white text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* PDF Viewer */}
      <div ref={viewerRef} className="flex-1 overflow-auto flex flex-col items-center p-4 bg-gray-800 gap-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-white">Loading PDF...</div>}
          error={<div className="text-red-400">Failed to load PDF</div>}
        >
          {Array.from({ length: numPages }, (_, index) => (
            <div key={index + 1} className="shadow-lg mb-4">
              <Page
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

export default PdfPreview;
