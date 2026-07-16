import { Navigate, useParams } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import {
  defaultContestWorkspaceSection,
  getContestWorkspacePath,
} from "./contest-workspace"

export function ProviderContestRuntimePage() {
  const { contestId } = useParams()
  if (!contestId) {
    return <Navigate replace to={routePaths.providerContests} />
  }

  return (
    <Navigate
      replace
      to={getContestWorkspacePath(contestId, defaultContestWorkspaceSection)}
    />
  )
}
