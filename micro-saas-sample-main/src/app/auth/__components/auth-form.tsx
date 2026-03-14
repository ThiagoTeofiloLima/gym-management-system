"use client"

import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { signIn } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { FcGoogle } from "react-icons/fc"
import ThemeSwitch from "@/app/app/settings/theme/__components/theme-switch"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export function AuthForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPending, startTransition] = useTransition()
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    
    // Pega o callbackUrl dos search params ou usa o padrão
    const callbackUrl = searchParams?.get("callbackUrl") || "/app"

    const form = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    })

    const handleGoogleSignIn = async () => {
        setIsSubmitting(true)
        try {
            await signIn("google", {
                callbackUrl,
                redirect: true
            })
        } catch (error) {
            toast({
                title: "Erro",
                variant: "destructive",
                description: "Ocorreu um erro ao fazer login com o Google.",
            })
            setIsSubmitting(false)
        }
    }

    const handleGithubSignIn = async () => {
        setIsSubmitting(true)
        try {
            await signIn("github", {
                callbackUrl,
                redirect: true
            })
        } catch (error) {
            toast({
                title: "Erro",
                variant: "destructive",
                description: "Ocorreu um erro ao fazer login com o GitHub.",
            })
            setIsSubmitting(false)
        }
    }

    const handleCredentialsSignIn = async (data: any) => {
        setIsSubmitting(true)
        
        console.log('🔐 Tentando login com:', { email: data.email, password: '***' })
        
        try {
            // NextAuth v5 retorna: { error?: string, url?: string, redirect?: boolean }
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            console.log('✅ Resultado do signIn:', JSON.stringify(result, null, 2))

            // Verifica se há erro
            if (result && 'error' in result && result.error) {
                console.error('❌ Erro do NextAuth:', result.error)
                toast({
                    title: "Erro",
                    variant: "destructive",
                    description: result.error as string,
                })
                setIsSubmitting(false)
                return
            }

            // Login bem-sucedido - NextAuth v5 retorna a URL de redirecionamento
            console.log('✅ Login bem-sucedido, redirecionando para:', callbackUrl)
            
            toast({
                title: "Login realizado",
                variant: "success",
                description: "Redirecionando...",
            })
            
            // Usa window.location para forçar recarregamento completo
            // Isso garante que o middleware seja executado novamente
            window.location.href = callbackUrl
            return
            
        } catch (error) {
            console.error('❌ Erro no login:', error)
            toast({
                title: "Erro",
                variant: "destructive",
                description: "Email ou senha inválidos.",
            })
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="mx-auto max-w-md space-y-6 w-full px-4">
                <div className="space-y-2 text-center">
                    <div className="flex justify-center items-center">
                        <h1 className="text-3xl font-bold ms-8 mx-4">
                            Gym Manager
                        </h1>
                        <ThemeSwitch className="mt-[2px]" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Faça login para gerenciar sua academia
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        disabled={isSubmitting}
                        className="w-full"
                        onClick={handleGoogleSignIn}
                    >
                        <FcGoogle className="w-5 h-5 mr-2" />
                        Continuar com Google
                    </Button>
                    <Button
                        disabled={isSubmitting}
                        className="w-full"
                        onClick={handleGithubSignIn}
                    >
                        <GitHubLogoIcon className="w-5 h-5 mr-2" />
                        Continuar com GitHub
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Ou use email e senha
                            </span>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={form.handleSubmit((data) => handleCredentialsSignIn(data))}>
                        <div className="space-y-2">
                            <input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                {...form.register("email")}
                            />
                        </div>
                        <div className="space-y-2">
                            <input
                                id="password"
                                type="password"
                                placeholder="Sua senha"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                {...form.register("password")}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || form.formState.isSubmitting}
                        >
                            {isSubmitting || form.formState.isSubmitting ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
