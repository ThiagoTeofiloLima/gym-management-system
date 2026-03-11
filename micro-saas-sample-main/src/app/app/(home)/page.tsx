import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { getDashboardData } from "./actions";
import { DashboardCharts } from "../__components/dashboard-charts";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default async function AppPage() {
    const gymData = await getDashboardData();

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Dashboard da Academia</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain>
                {/* Card de Multi-Tenancy */}
                <div className="mb-6">
                    <Link href="/app/gyms">
                        <Card className="hover:bg-gray-800 transition-colors cursor-pointer border-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-500" />
                                    Gestão de Academias (Multi-Tenant)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    🏋️ Visualize e gerencie todas as academias. Admin pode ver todos os dados.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <DashboardCharts gymData={gymData} />
            </DashboardPageMain>
        </DashboardPage>
    );
}
