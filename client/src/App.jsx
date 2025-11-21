import { useState, useEffect } from 'react';
import { getLinks, createLink, deleteLink } from './api';

function App() {
  const [links, setLinks] = useState([]);
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load links when page opens
  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const data = await getLinks();
      setLinks(data);
    } catch (err) {
      console.error("Failed to load links", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createLink(url, customCode);
      setUrl('');
      setCustomCode('');
      loadLinks(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code) => {
    if(!confirm("Are you sure you want to delete this link?")) return;
    await deleteLink(code);
    loadLinks();
  };

  const copyToClipboard = (shortCode) => {
    const fullUrl = `http://localhost:5000/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    alert("Copied to clipboard: " + fullUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">TinyLink</h1>
          <span className="text-sm text-gray-500">v1.0</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Create Link Form */}
        <section className="bg-white p-6 rounded-lg shadow mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Create a Short Link</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <input
              type="url"
              placeholder="Paste long URL here (https://...)"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Custom Code (Optional)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              maxLength={8}
              className="w-full md:w-48 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className={`p-3 rounded text-white font-medium transition-colors ${
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Creating...' : 'Shorten'}
            </button>
          </form>
        </section>

        {/* Links Table */}
        <section className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold">Your Links</h2>
            <button onClick={loadLinks} className="text-sm text-blue-600 hover:underline">Refresh</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <th className="p-4 font-medium">Short Code</th>
                  <th className="p-4 font-medium">Original URL</th>
                  <th className="p-4 font-medium text-center">Clicks</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {links.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      No links created yet. Create one above!
                    </td>
                  </tr>
                ) : (
                  links.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-blue-600">
                        <a 
                          href={`http://localhost:5000/${link.short_code}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {link.short_code}
                        </a>
                      </td>
                      <td className="p-4 text-gray-600 max-w-xs truncate" title={link.original_url}>
                        {link.original_url}
                      </td>
                      <td className="p-4 text-center font-semibold text-gray-700">
                        {link.click_count}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => copyToClipboard(link.short_code)}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleDelete(link.short_code)}
                          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;