import { prisma } from "@/services/database";
import { notFound, redirect } from "next/navigation";
import MemberDetailPageClient from "./client";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
    const memberId = params.id;

    // Get all data from the database
    const member = await prisma.member.findUnique({
        where: { id: memberId }
    });

    if (!member) {
        redirect('/app/members'); // Redirect to members list if not found
    }

    const serializedMember = {
        ...member,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
    };

    return <MemberDetailPageClient member={serializedMember} />;
}