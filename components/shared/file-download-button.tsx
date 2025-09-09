'use client';

import { Button } from '@/components/ui/button';
import { Download, FileText, Image } from 'lucide-react';

interface FileDownloadButtonProps {
  url: string;
  filename: string;
  filetype: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function FileDownloadButton({
  url,
  filename,
  filetype,
  variant = 'outline',
  size = 'default',
  className = '',
}: FileDownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getIcon = () => {
    if (filetype.includes('pdf')) {
      return <FileText className="h-4 w-4" />;
    } else if (filetype.includes('image')) {
      return <Image className="h-4 w-4" />;
    }
    return <Download className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (filetype.includes('pdf')) {
      return '下载 PDF';
    } else if (filetype.includes('image')) {
      return '下载图片';
    }
    return '下载文件';
  };

  return (
    <Button
      onClick={handleDownload}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      {getIcon()}
      {getButtonText()}
    </Button>
  );
}
