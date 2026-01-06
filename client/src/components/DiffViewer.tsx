import { DiffChange } from '../api/client';

interface DiffViewerProps {
  changes: DiffChange[];
}

function DiffViewer({ changes }: DiffViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-semibold">Text Diff</h3>
      </div>

      <div className="p-4 font-mono text-sm overflow-x-auto">
        <pre className="whitespace-pre-wrap">
          {changes.map((change, index) => {
            if (change.added) {
              return (
                <span key={index} className="diff-added block">
                  {change.value.split('\n').map((line, i) => (
                    line && <span key={i} className="block">+ {line}</span>
                  ))}
                </span>
              );
            }

            if (change.removed) {
              return (
                <span key={index} className="diff-removed block">
                  {change.value.split('\n').map((line, i) => (
                    line && <span key={i} className="block">- {line}</span>
                  ))}
                </span>
              );
            }

            return (
              <span key={index} className="text-gray-600 block">
                {change.value.split('\n').map((line, i) => (
                  line && <span key={i} className="block">  {line}</span>
                ))}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

export default DiffViewer;
