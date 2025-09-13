import { useEffect } from "react";
import { initDataSource } from "../lib/datasource";

export const useInitDs = () => {
  useEffect(() => { initDataSource(); }, []);
};