import { useEffect, useState, useCallback } from "react";
import { initDataSource } from "../../lib/datasource";
import { listProjects, createProject, listTasks, upsertTask } from "../../lib/roadmapApi";
import type { Project, RoadmapTask, TaskStatus } from "../../lib/datasource";

export function useRoadmapData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [newProjectName, setNewProjectName] = useState("");

  // initialize datasource + load projects
  useEffect(() => {
    initDataSource().then(() => {
      listProjects()
        .then(ps => {
          setProjects(ps);
          if (!projectId && ps.length) setProjectId(ps[0].id);
        })
        .catch(console.error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load tasks for selected project
  useEffect(() => {
    if (!projectId) return;
    listTasks(projectId).then(setTasks).catch(console.error);
  }, [projectId]);

  const addProject = useCallback(async () => {
    if (!newProjectName.trim()) return;
    const p = await createProject(newProjectName.trim());
    setProjects(prev => [...prev, p]);
    setProjectId(p.id);
    setNewProjectName("");
  }, [newProjectName]);

  const saveTask = useCallback(async (patch: Partial<RoadmapTask> & { id?: string; title: string }) => {
    const saved = await upsertTask({ ...patch, project_id: projectId });
    setTasks(prev => {
      const i = prev.findIndex(t => t.id === saved.id);
      if (i === -1) return [...prev, saved];
      const next = [...prev]; next[i] = saved; return next;
    });
  }, [projectId]);

  return {
    // state
    projects, projectId, tasks, newProjectName,
    // setters
    setProjectId, setNewProjectName,
    // actions
    addProject, saveTask,
  };
}