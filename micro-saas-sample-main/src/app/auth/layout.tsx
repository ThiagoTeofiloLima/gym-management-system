import { ThemeProvider } from "../__components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <div className="min-h-screen bg-background">
                {children}
            </div>
            <Toaster />
        </ThemeProvider>
    );
}
