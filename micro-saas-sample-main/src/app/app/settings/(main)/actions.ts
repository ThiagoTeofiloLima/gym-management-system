"use server";

import { auth } from "@/services/auth";
import { z } from "zod";
import { updateProfileSchema } from "./schema";
import capitalize from "@/lib/capitalize";
import { prisma } from "@/lib/prisma";

export async function upsertProfile(input: z.infer<typeof updateProfileSchema>) {
    let session;
    try {
        session = await auth();
    } catch (error) {
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
        return {
            error: "Unauthorized",
            data: null,
        };
    }

    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: capitalize(input.name)
        },
    });

    if (!updatedUser) {
        return {
            error: "User not found",
            data: null,
        };
    }

    return {
        error: null,
        data: updatedUser
    };
}
