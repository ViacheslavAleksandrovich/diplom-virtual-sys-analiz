import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';

export interface TheoryMaterial {
  id: number;
  title: string;
  html_content: string;
  attachment?: string;
  video_url?: string;
  order_number: number;
  is_active: boolean;
}

interface TheoryViewerProps {
  materials: TheoryMaterial[];
  onMaterialViewed?: (id: number) => void;
}

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
    };
  }
}

const MATHJAX_SCRIPT_ID = 'mathjax-cdn-script';

const TheoryViewer: React.FC<TheoryViewerProps> = ({ materials, onMaterialViewed }) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(materials[0]?.id ?? null);
  const [mathJaxReady, setMathJaxReady] = useState(false);

  const handleSelectMaterial = (id: number) => {
    setSelectedMaterialId(id);
    onMaterialViewed?.(id);
  };

  useEffect(() => {
    if (!materials.some((item) => item.id === selectedMaterialId)) {
      setSelectedMaterialId(materials[0]?.id ?? null);
    }
  }, [materials, selectedMaterialId]);

  // Mark the initially visible material as viewed
  useEffect(() => {
    if (materials[0]?.id != null) {
      onMaterialViewed?.(materials[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === selectedMaterialId) ?? null,
    [materials, selectedMaterialId]
  );

  useEffect(() => {
    const hasFormula = Boolean(
      selectedMaterial?.html_content && /\\\(|\\\[|\$\$|\$[^$]/.test(selectedMaterial.html_content)
    );
    if (!hasFormula) {
      return;
    }

    if (document.getElementById(MATHJAX_SCRIPT_ID)) {
      window.MathJax?.typesetPromise?.().then(() => setMathJaxReady(true)).catch(() => undefined);
      return;
    }

    const script = document.createElement('script');
    script.id = MATHJAX_SCRIPT_ID;
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.MathJax?.typesetPromise?.().then(() => setMathJaxReady(true)).catch(() => undefined);
    };
    script.onerror = () => {
      setMathJaxReady(false);
    };
    document.head.appendChild(script);
  }, [selectedMaterial]);

  if (!materials.length) {
    return (
      <div className="app-card p-6 text-slate-600">
        Theory materials are not available for this module yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <aside className="app-card p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Theory materials</h2>
        <div className="space-y-2">
          {materials.map((material) => (
            <button
              key={material.id}
              type="button"
              onClick={() => handleSelectMaterial(material.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                selectedMaterialId === material.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {material.title}
            </button>
          ))}
        </div>
      </aside>

      <section className="lg:col-span-2 app-card p-6">
        {selectedMaterial && (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">{selectedMaterial.title}</h3>

            <div
              className="prose max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMaterial.html_content) }}
            />
            {!mathJaxReady && /\\\(|\\\[|\$\$|\$[^$]/.test(selectedMaterial.html_content) && (
              <p className="mt-3 text-xs text-amber-700">
                Formula rendering is temporarily unavailable. Refresh the page if formulas are not displayed.
              </p>
            )}

            {selectedMaterial.video_url && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Video</h4>
                <iframe
                  src={selectedMaterial.video_url}
                  title="Theory video"
                  className="w-full h-80 rounded-md border border-slate-200"
                  allowFullScreen
                />
              </div>
            )}

            {selectedMaterial.attachment && (
              <div className="mt-6">
                <a
                  href={selectedMaterial.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-700 font-medium hover:text-indigo-800"
                >
                  Open attachment
                </a>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default TheoryViewer;
