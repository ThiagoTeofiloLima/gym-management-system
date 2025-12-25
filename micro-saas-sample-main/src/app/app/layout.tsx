import { MainSidebar } from "./__components/main-sidebar";

// Create a mock user for development without authentication
const mockUser = {
    id: "mock-user-id",
    name: "Development User",
    email: "dev@example.com",
    image: null,
};

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Mock session for development without authentication
    const session = { user: mockUser };

    return (
        <div className="grid grid-cols-[16rem_1fr]">
            {session?.user && <MainSidebar user={session.user} />}

            <main>{children}</main>
        </div>
    );
}
