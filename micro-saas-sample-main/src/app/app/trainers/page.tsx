import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { TrainerManagement } from "../__components/trainers/trainer-management";

export default async function TrainersPage() {
    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Personal Trainers</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain>
                <TrainerManagement />
            </DashboardPageMain>
        </DashboardPage>
    );
}