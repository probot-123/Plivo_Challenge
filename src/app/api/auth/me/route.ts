import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401 }
    );
  }

  const user = await currentUser();
  const role = await getUserRole();

  return NextResponse.json({
    id: user?.id,
    email: user?.emailAddresses[0]?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
    imageUrl: user?.imageUrl,
    role,
  });
} 