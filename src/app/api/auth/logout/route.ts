import { logoutAction } from "@/app/actions/auth";

export async function POST() {
  await logoutAction();
}
