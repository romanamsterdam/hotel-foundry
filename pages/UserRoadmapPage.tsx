import React, { useEffect, useState } from "react";
import { useRoadmapData } from "../features/roadmap/useRoadmapData";
import type { TaskStatus } from "../lib/datasource";

export default function UserRoadmapPage() {
  const {
    projects, projectId, tasks, newProjectName,
    setProjectId, setNewProjectName,
    addProject, saveTask,
  } = useRoadmapData();

  return (
    <main className="p-4 space-y-4">
      {/* Project picker */}
      <div className="flex items-center gap-2">
        <select
          className="border rounded px-2 py-2"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input
          className="border rounded px-2 py-2"
          placeholder="New project name"
          value={newProjectName}
          onChange={e => setNewProjectName(e.target.value)}
        />
        <button className="border rounded px-3 py-2" onClick={addProject}>Create</button>
      </div>

      {/* Tasks list (inline editor wired in 3.2) */}
      <div id="tasks-root">
        {tasks.map(t => (
          <div key={t.id} className="border rounded p-3 mb-2 flex flex-wrap gap-2 items-center">
            <input
              className="border rounded px-2 py-1 flex-1 min-w-[200px]"
              defaultValue={t.title}
              onBlur={e => saveTask({ id: t.id, title: e.target.value })}
            />
            <select
              className="border rounded px-2 py-1"
              defaultValue={t.status}
              onChange={e => saveTask({ id: t.id, title: t.title, status: e.target.value as TaskStatus })}
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="stuck">Stuck</option>
            </select>
            <input
              type="date"
              className="border rounded px-2 py-1"
              defaultValue={t.due_date ?? ""}
              onChange={e => saveTask({ id: t.id, title: t.title, due_date: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1 w-36"
              placeholder="Owner"
              defaultValue={t.owner ?? ""}
              onBlur={e => saveTask({ id: t.id, title: t.title, owner: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1 flex-1 min-w-[220px]"
              placeholder="Comment"
              defaultValue={t.comment ?? ""}
              onBlur={e => saveTask({ id: t.id, title: t.title, comment: e.target.value })}
            />
          </div>
        ))}
        <button
          className="mt-2 border rounded px-3 py-2"
          onClick={() => saveTask({ title: "New task" })}
        >
          + Add task
        </button>
      </div>
    </main>
  );
}