import Stripe from "stripe";
import { jsonDb } from "../json-db";

import { config } from "@/services/stripe/config";

export const stripe = new Stripe(config.stripe.secretKey || "", {
    apiVersion: "2024-04-10",
    httpClient: Stripe.createFetchHttpClient(),
});

export const getStripeCustomerByEmail = async (email: string) => {
    const customers = await stripe.customers.list({ email });
    return customers.data[0];
};

export const createStripeCustomer = async (input: {
    name?: string;
    email: string;
}) => {
    const customer = await getStripeCustomerByEmail(input.email);

    if (customer) return customer;

    const createdCustomer = await stripe.customers.create({
        email: input.email,
        name: input.name,
    });

    const createdCustomerSubscription = await stripe.subscriptions.create({
        customer: createdCustomer.id,
        items: [{ price: config.stripe.plans.free.priceId }],
    });

    // Update user in JSON database
    const user = await jsonDb.findUserByEmail(input.email);
    if (user) {
        await jsonDb.updateUser(user.id, {
            stripeCustomerId: createdCustomer.id,
            stripeSubscriptionId: createdCustomerSubscription.id,
            stripeSubscriptionStatus: createdCustomerSubscription.status,
            stripePriceId: config.stripe.plans.free.priceId,
        });
    }

    return createdCustomer;
};

export const createCheckoutSession = async (
    userId: string,
    userEmail: string,
    userStripeSubscriptionId: string
) => {
    try {
        const customer = await createStripeCustomer({
            email: userEmail,
        });

        const subscription = await stripe.subscriptionItems.list({
            subscription: userStripeSubscriptionId,
            limit: 1,
        });

        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
            flow_data: {
                type: "subscription_update_confirm",
                after_completion: {
                    type: "redirect",
                    redirect: {
                        return_url:
                            `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing?success=true`,
                    },
                },
                subscription_update_confirm: {
                    subscription: userStripeSubscriptionId,
                    items: [
                        {
                            id: subscription.data[0].id,
                            price: config.stripe.plans.pro.priceId,
                            quantity: 1,
                        },
                    ],
                },
            },
        });

        return {
            url: session.url,
        };
    } catch (error) {
        console.error(error);
        throw new Error("Error to create checkout session");
    }
};

export const handleProcessWebhookUpdatedSubscription = async (event: {
    object: Stripe.Subscription;
}) => {
    const stripeCustomerId = event.object.customer as string;
    const stripeSubscriptionId = event.object.id as string;
    const stripeSubscriptionStatus = event.object.status;
    const stripePriceId = event.object.items.data[0].price.id;

    // Find user in JSON database
    const users = await jsonDb.getData();
    const userExists = users.users.find(user =>
        user.stripeSubscriptionId === stripeSubscriptionId ||
        user.stripeCustomerId === stripeCustomerId
    );

    if (!userExists) {
        throw new Error("user of stripeCustomerId not found");
    }

    await jsonDb.updateUser(userExists.id, {
        stripeCustomerId,
        stripeSubscriptionId,
        stripeSubscriptionStatus,
        stripePriceId,
    });
};

type Plan = {
    priceId: string;
    quota: {
        TASKS: number;
    };
};

type Plans = {
    [key: string]: Plan;
};

export const getPlanByPrice = (priceId: string) => {
    const plans: Plans = config.stripe.plans;

    const planKey = Object.keys(plans).find(
        (key) => plans[key].priceId === priceId
    ) as keyof Plans | undefined;

    const plan = planKey ? plans[planKey] : null;

    if (!plan) {
        throw new Error(`Plan not found for priceId: ${priceId}`);
    }

    return {
        name: planKey,
        quota: plan.quota,
    };
};

export const getUserCurrentPlan = async (userId: string) => {
    const user = await jsonDb.findUserById(userId);

    if (!user || !user.stripePriceId) {
        // Default to free plan if no user or plan found
        const plan = {
            name: "free",
            quota: {
                TASKS: 5 // Free plan allows 5 tasks
            }
        };

        // Count user's todos
        const userTodos = await jsonDb.findTodosByUserId(userId);
        const currentTasks = userTodos.length;
        const availableTasks = plan.quota.TASKS;
        const usage = (currentTasks / availableTasks) * 100;

        return {
            name: plan.name,
            quota: {
                TASKS: {
                    available: availableTasks,
                    current: currentTasks,
                    usage: Math.min(usage, 100), // Cap at 100%
                },
            },
        };
    }

    const plan = getPlanByPrice(user.stripePriceId);

    // Count user's todos
    const userTodos = await jsonDb.findTodosByUserId(userId);
    const currentTasks = userTodos.length;
    const availableTasks = plan.quota.TASKS;
    const usage = (currentTasks / availableTasks) * 100;

    return {
        name: plan.name,
        quota: {
            TASKS: {
                available: availableTasks,
                current: currentTasks,
                usage: Math.min(usage, 100), // Cap at 100%
            },
        },
    };
};
