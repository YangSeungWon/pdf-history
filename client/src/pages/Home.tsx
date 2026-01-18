import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Version } from '../api/client';
import PdfUploader from '../components/PdfUploader';
import VersionList from '../components/VersionList';
import PdfPreview from '../components/PdfPreview';

function Home() {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [viewingPdf, setViewingPdf] = useState<Version | null>(null);

  const loadVersions = async () => {
    try {
      const data = await api.versions.list();
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  const handleUploadSuccess = () => {
    loadVersions();
  };

  const handleVersionSelect = (id: number) => {
    setSelectedVersions(prev => {
      if (prev.includes(id)) {
        return prev.filter(v => v !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      const [id1, id2] = selectedVersions.sort((a, b) => a - b);
      navigate(`/compare?v1=${id1}&v2=${id2}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this version?')) {
      try {
        await api.versions.delete(id);
        setSelectedVersions(prev => prev.filter(v => v !== id));
        loadVersions();
      } catch (err) {
        console.error('Failed to delete version:', err);
      }
    }
  };

  const handleMemoUpdate = async (id: number, memo: string) => {
    try {
      await api.versions.updateMemo(id, memo);
      loadVersions();
    } catch (err) {
      console.error('Failed to update memo:', err);
    }
  };

  return (
    <div className="space-y-6">
      <PdfUploader onUploadSuccess={handleUploadSuccess} />

      {selectedVersions.length === 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-800">
            2 versions selected for comparison
          </span>
          <button
            onClick={handleCompare}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Compare Versions
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading versions...</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No versions yet. Upload your first PDF!
        </div>
      ) : (
        <VersionList
          versions={versions}
          selectedVersions={selectedVersions}
          onVersionSelect={handleVersionSelect}
          onDelete={handleDelete}
          onMemoUpdate={handleMemoUpdate}
          onViewPdf={setViewingPdf}
        />
      )}

      {viewingPdf && (
        <PdfPreview
          url={api.versions.getPdfUrl(viewingPdf.id)}
          filename={viewingPdf.original_name}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  );
}

export default Home;
