"use server";

import { auth } from "@/services/auth";
import { z } from "zod";
import { updateProfileSchema } from "./schema";
import capitalize from "@/lib/capitalize";
import { jsonDb } from "@/services/json-db";

export async function upsertProfile(input: z.infer<typeof updateProfileSchema>) {
    let session;
    try {
        session = await auth();
    } catch (error) {
        // If auth fails, use a default user for development
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
        return {
            error: "Unauthorized",
            data: null,
        };
    }

    // Update user in JSON database
    const updatedUser = await jsonDb.updateUser(session.user.id, {
        name: capitalize(input.name)
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