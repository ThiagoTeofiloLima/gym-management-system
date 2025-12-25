import { ReturnTypeWithoutPromise } from "@/types/return-type-without-promise";
import { getDashboardData } from "./actions";

export type DashboardData = ReturnTypeWithoutPromise<typeof getDashboardData>;