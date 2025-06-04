import { Download, Maximize2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

interface HtmlRendererProps {
  content: string;
  height?: string | number;
}

export function HtmlRenderer({ content, height = 500 }: HtmlRendererProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  console.log("[DEBUG] HtmlRenderer rendering content of length:", content?.length);

  const renderFullscreenIframe = () => {
    if (!isFullscreen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">HTML Content</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              srcDoc={content}
              title="HTML Content Fullscreen"
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'artifact.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="my-4 border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
          <span className="font-medium text-gray-700">HTML Content</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center"
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Fullscreen
            </button>
            <button
              onClick={handleDownload}
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </button>
          </div>
        </div>
        <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
          <iframe
            srcDoc={content}
            title="HTML Content"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-modals"
          />
        </div>
      </div>
      {renderFullscreenIframe()}
    </div>
  );
} 
