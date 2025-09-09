import { FileDownloadButton } from '@/components/shared/file-download-button';
import TaskService from '@/lib/db/task-service';
import { TaskStatus } from '@prisma/client';
import { FileText } from 'lucide-react';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const { id: taskId } = await params;
  const task = await TaskService.getTaskById(taskId);

  if (!task) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">任务未找到</h1>
          <p className="text-gray-600">请检查任务ID是否正确</p>
        </div>
      </div>
    );
  }

  if (task.status !== TaskStatus.COMPLETED) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">任务未完成</h1>
          <p className="text-gray-600">任务状态: {task.status}</p>
        </div>
      </div>
    );
  }

  // 解析task results
  const results = task.results as any;
  const pdfData = results?.pdf;
  const screenshotData = results?.screenshot;

  return (
    <div className="h-full bg-beige overflow-y-auto">
      {/* 下载按钮固定在容器顶部 */}
      {screenshotData && (
        <div className="sticky top-0 z-10 bg-beige/80 backdrop-blur-sm p-4 flex justify-end">
          <div className="flex gap-3">
            <FileDownloadButton
              url={screenshotData.url}
              filename={screenshotData.filename}
              filetype={screenshotData.filetype}
              variant="default"
            />
            {pdfData && (
              <FileDownloadButton
                url={pdfData.url}
                filename={pdfData.filename}
                filetype={pdfData.filetype}
                variant="outline"
              />
            )}
          </div>
        </div>
      )}

      {/* 图片展示区域 */}
      {screenshotData ? (
        <div className="p-4">
          <div className="flex justify-center">
            <img
              src={screenshotData.url}
              alt="报告截图"
              className="max-w-full h-auto object-contain shadow-lg rounded-lg"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>暂无报告内容</p>
          </div>
        </div>
      )}
    </div>
  );
}
