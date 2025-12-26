import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { jsonDb } from "@/services/json-db";
import Link from "next/link";
import MembersPageClient from "./__components/MemberForm";

// Mock function to get current user ID - in a real app, this would come from session
async function getCurrentUserId() {
  // Return the mock user ID
  return "user-1";
}

export default async function MembersPage() {
    // Get the current user ID
    const userId = await getCurrentUserId();

    // Get members for the current user from the database
    const allData = await jsonDb.getData();
    const userMembers = allData.members.filter(
      (member) => member.userId === userId
    );

    return (
        <MembersPageClient initialMembers={userMembers} />
    );
}