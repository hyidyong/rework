import { Workroom } from "@/components/workroom/workroom";
import { readPublicEnv } from "@/lib/env/schema";

export default function Home() {
  return <Workroom supabaseConfig={readPublicEnv()} />;
}
