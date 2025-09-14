import { getDs, initDataSource } from "./datasource";
export const initConsulting = initDataSource;
export const listConsulting = () => getDs().listConsulting();
export const updateConsulting = (id: string, patch: any) => getDs().updateConsulting(id, patch);