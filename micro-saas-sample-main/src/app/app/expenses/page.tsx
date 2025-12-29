import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { ExpenseManagement } from "../__components/expenses/expense-management";

export default async function ExpensesPage() {
    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Despesas</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain>
                <ExpenseManagement />
            </DashboardPageMain>
        </DashboardPage>
    );
}