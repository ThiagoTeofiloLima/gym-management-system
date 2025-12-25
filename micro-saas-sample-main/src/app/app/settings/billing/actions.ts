"use server";

import { auth } from "@/services/auth";
import { createCheckoutSession } from "@/services/stripe";
import { redirect } from "next/navigation";

export async function createCheckoutSessionAction(): Promise<void> {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Not authorized");
    }

    // For development, use a mock checkout session or skip Stripe integration
    // In a real implementation, you would call the actual createCheckoutSession function
    // const checkoutSession = await createCheckoutSession(
    //     session.user.id as string,
    //     session.user.email as string,
    //     session.user.stripeSubscriptionId as string
    // );

    // For now, redirect to a mock success page since we're bypassing payment
    return redirect("/app/settings/billing?success=true");
}
