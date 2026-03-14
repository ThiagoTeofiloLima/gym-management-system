import { AuthForm } from "./__components/auth-form"
import { Suspense } from "react"

export default function AuthPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AuthForm />
        </Suspense>
    )
}
