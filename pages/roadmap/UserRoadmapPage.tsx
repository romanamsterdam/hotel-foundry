import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import RoadmapSidebar from "../../components/roadmap/RoadmapSidebar";
import RoadmapTaskTable from "../../components/roadmap/RoadmapTaskTable";
import { useUserRoadmapTasks } from "../../stores/userRoadmapTasks";

interface UserRoadmapPageProps {
  mode: "explore" | "project";
}

export default function UserRoadmapPage({ mode }: UserRoadmapPageProps) {
  const { projectId } = useParams();
  const {
    tasksByProject,
    activeChapterId,
    ensureProjectTasks,
    updateTask,
    saveTasks
  } = useUserRoadmapTasks();

  const projectKey = mode === "explore" ? "explore" : (projectId || "unknown");
  const tasks = tasksByProject[projectKey] || [];

  useEffect(() => {
    ensureProjectTasks(projectKey);
  }, [ensureProjectTasks, projectKey]);

  const handleTasksChange = (updatedTasks: any[]) => {
    // Update individual tasks through the store
    updatedTasks.forEach((task, index) => {
      const originalTask = tasks[index];
      if (originalTask && (
        originalTask.status !== task.status ||
        originalTask.due !== task.due ||
        originalTask.owner !== task.owner ||
        originalTask.comment !== task.comment
      )) {
        updateTask(projectKey, task.id, {
          status: task.status,
          due: task.due,
          owner: task.owner,
          comment: task.comment
        });
      }
    });
  };

  const handleSave = async (updatedTasks: any[]) => {
    // Update all tasks first
    handleTasksChange(updatedTasks);
    // Then trigger save
    await saveTasks(projectKey);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-slate-50 text-slate-900">
      {/* Main content grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <RoadmapSidebar />
        <div className="lg:col-span-9">
          <RoadmapTaskTable 
            projectKey={projectKey}
            rows={tasks}
            onChange={handleTasksChange}
            onSave={handleSave}
            activeChapterId={activeChapterId}
          />
        </div>
      </main>
    </div>
  );
}