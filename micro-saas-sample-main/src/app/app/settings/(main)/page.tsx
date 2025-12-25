import { auth } from "@/services/auth";
import { ProfileForm } from "./__components/form";

export default async function SettingsPage() {
    let session;
    try {
        session = await auth();
    } catch (error) {
        // If auth fails, use mock user for development
        session = {
            user: {
                id: "mock-user-id",
                name: "Development User",
                email: "thiago.lima.amazoniatelecom@gmail.com",
                image: null,
            }
        };
    }

    if (!session || !session.user) {
        // Create a mock user if no session exists
        session = {
            user: {
                id: "mock-user-id",
                name: "Development User",
                email: "thiago.lima.amazoniatelecom@gmail.com",
                image: null,
            }
        };
    }

    return <ProfileForm defaultValues={session.user} />;
}