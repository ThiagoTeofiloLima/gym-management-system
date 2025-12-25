import { jsonDb } from "@/services/json-db";
import { notFound, redirect } from "next/navigation";
import MemberDetailPageClient from "./client";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
    const memberId = params.id;
    
    // Get all data from the database
    const allData = await jsonDb.getData();
    const member = allData.members.find(m => m.id === memberId);
    
    if (!member) {
        redirect('/app/members'); // Redirect to members list if not found
    }

    return <MemberDetailPageClient member={member} />;
}