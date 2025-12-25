import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { FinancialCharts } from "../__components/financial-charts";

export default async function FinancialPage() {
    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Financeiro</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain>
                <FinancialCharts />
            </DashboardPageMain>
        </DashboardPage>
    );
}