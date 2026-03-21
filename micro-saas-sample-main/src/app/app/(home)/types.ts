import { ReturnTypeWithoutPromise } from "@/types/return-type-without-promise";
import { getDashboardData } from "./actions";

export type DashboardData = ReturnTypeWithoutPromise<typeof getDashboardData>;

export interface ToDo {
    id: string;
    title: string;
    doneAt: string | null;
    createdAt: string;
    userId?: string;
}