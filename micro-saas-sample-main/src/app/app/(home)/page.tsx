import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { getDashboardData } from "./actions";
import { DashboardCharts } from "../__components/dashboard-charts";

export default async function AppPage() {
    const gymData = await getDashboardData();

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Dashboard da Academia</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain>
                <DashboardCharts gymData={gymData} />
            </DashboardPageMain>
        </DashboardPage>
    );
}
