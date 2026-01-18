import { useState } from 'react';
import { Version } from '../api/client';

interface VersionListProps {
  versions: Version[];
  selectedVersions: number[];
  onVersionSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onMemoUpdate: (id: number, memo: string) => void;
  onViewPdf: (version: Version) => void;
}

function VersionList({
  versions,
  selectedVersions,
  onVersionSelect,
  onDelete,
  onMemoUpdate,
  onViewPdf,
}: VersionListProps) {
  const [editingMemo, setEditingMemo] = useState<number | null>(null);
  const [memoText, setMemoText] = useState('');

  const handleEditMemo = (version: Version) => {
    setEditingMemo(version.id);
    setMemoText(version.memo || '');
  };

  const handleSaveMemo = (id: number) => {
    onMemoUpdate(id, memoText);
    setEditingMemo(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Version History</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select 2 versions to compare
        </p>
      </div>

      <div className="divide-y">
        {versions.map((version, index) => {
          const isSelected = selectedVersions.includes(version.id);
          const versionNumber = versions.length - index;

          return (
            <div
              key={version.id}
              className={`p-4 transition-colors ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onVersionSelect(version.id)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      v{versionNumber}
                    </span>
                    <span className="font-medium text-gray-900 truncate">
                      {version.original_name}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(version.created_at)}
                  </div>

                  {editingMemo === version.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                        placeholder="Add memo..."
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveMemo(version.id)}
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMemo(null)}
                        className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : version.memo ? (
                    <div
                      onClick={() => handleEditMemo(version)}
                      className="mt-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
                    >
                      {version.memo}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditMemo(version)}
                      className="mt-2 text-sm text-gray-400 hover:text-gray-600"
                    >
                      + Add memo
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewPdf(version)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onDelete(version.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VersionList;
