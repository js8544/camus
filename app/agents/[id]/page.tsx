import TaskForm from "@/components/Form/task";

async function TaskPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return (
    <main className="flex flex-1 justify-center items-center h-screen bg-white dark:bg-gray-900">
      <TaskForm taskId={id} />
    </main>
  );
}

export default TaskPage;
