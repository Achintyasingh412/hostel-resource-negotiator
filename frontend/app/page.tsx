import { redirect } from "next/navigation";
import { HostelWorkspace } from "@/components/hostel-workspace";
import { getDemoSession } from "@/lib/demo-session";
import { getHostelDashboardData } from "@/lib/hostel-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getDemoSession();
  if (!session) redirect("/sign-in");

  const data = await getHostelDashboardData(session);

  return <HostelWorkspace data={data} />;
}
