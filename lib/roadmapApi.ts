import { getDs, initDataSource } from "./datasource";
export const initRoadmap = initDataSource;
export const listProjects = () => getDs().listProjects();
export const createProject = (name: string) => getDs().createProject(name);
export const listTasks = (projectId: string) => getDs().listTasks(projectId);
export const upsertTask = (input: any) => getDs().upsertTask(input);