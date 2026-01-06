import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, DiffResult } from '../api/client';
import DiffViewer from '../components/DiffViewer';

function Compare() {
  const [searchParams] = useSearchParams();
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const v1 = searchParams.get('v1');
  const v2 = searchParams.get('v2');

  useEffect(() => {
    if (!v1 || !v2) {
      setError('Missing version parameters');
      setLoading(false);
      return;
    }

    const loadDiff = async () => {
      try {
        const result = await api.diff(parseInt(v1), parseInt(v2));
        setDiffResult(result);
      } catch (err) {
        setError('Failed to load diff');
      } finally {
        setLoading(false);
      }
    };

    loadDiff();
  }, [v1, v2]);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading comparison...</div>
    );
  }

  if (error || !diffResult) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || 'Unknown error'}</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const { version1, version2, diff } = diffResult;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Version Comparison</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-gray-500">Old Version</div>
            <div className="font-medium">{version1.original_name}</div>
            <div className="text-xs text-gray-400">
              {new Date(version1.created_at).toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-500">New Version</div>
            <div className="font-medium">{version2.original_name}</div>
            <div className="text-xs text-gray-400">
              {new Date(version2.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-sm mb-4">
          <span className="text-green-600">
            +{diff.stats.additions} additions
          </span>
          <span className="text-red-600">
            -{diff.stats.deletions} deletions
          </span>
          <span className="text-gray-500">
            {diff.stats.unchanged} unchanged
          </span>
        </div>
      </div>

      <DiffViewer changes={diff.changes} />
    </div>
  );
}

export default Compare;
