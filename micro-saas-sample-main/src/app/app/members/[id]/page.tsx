import * as db from "@/services/database";
import { notFound, redirect } from "next/navigation";
import MemberDetailPageClient from "./client";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
    const memberId = params.id;

    // Get all data from the database
    const member = await db.findMemberById(memberId);

    if (!member) {
        redirect('/app/members'); // Redirect to members list if not found
    }

    // Datas já são strings no Supabase
    const serializedMember = {
        ...member,
    };

    return <MemberDetailPageClient member={serializedMember} />;
}