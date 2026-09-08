import { useAuth } from "../../context/AuthContext";
import { PerformanceBridgePage } from "./performance/PerformanceBridgePage";

/**
 * The /okrs URL is retained for existing bookmarks, but the backend currently
 * supports role targets and KPI definitions—not company objectives/key results.
 */
export function OkrsPage() {
  const { hasPermission } = useAuth();
  const canManage =
    hasPermission("roles", "update") ||
    hasPermission("kpis", "update") ||
    hasPermission("targets", "update");

  return <PerformanceBridgePage canManage={canManage} />;
}
