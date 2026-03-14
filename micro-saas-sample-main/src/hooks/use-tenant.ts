// Re-export de utilitários multi-tenant para conveniência
export { 
  getTenantContext, 
  hasPermission, 
  applyTenantFilter, 
  getTenantWhereClause,
  canAccessGym,
  getUserAccessibleGyms,
  withTenantContext,
  type TenantContext,
  type UserRole,
} from "@/lib/multi-tenant"

// Hooks serão implementados diretamente nos componentes quando necessário
