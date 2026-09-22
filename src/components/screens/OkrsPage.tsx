import { useAuth } from "../../context/AuthContext";
import { PerformanceBridgePage } from "./performance/PerformanceBridgePage";

/**
 * The /okrs URL is retained for existing bookmarks and hosts the supported
 * Revenue Execution objectives, key results, and target summary view.
 */
export function OkrsPage() {
  const { hasPermission } = useAuth();
  const canManage =
    hasPermission("revenue_execution", "create") ||
    hasPermission("revenue_execution", "update") ||
    hasPermission("roles", "update") ||
    hasPermission("kpis", "update") ||
    hasPermission("targets", "update");

  return <PerformanceBridgePage canManage={canManage} />;
}
