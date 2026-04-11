import { NextResponse, type NextRequest } from "next/server";

export async function middleware(_request: NextRequest) {
  // Auth check disabled — let AuthProvider handle it client-side
  // The AuthProvider in layout.tsx already checks session and shows login state
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
