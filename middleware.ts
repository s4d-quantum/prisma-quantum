import { NextRequest, NextResponse } from "next/server";

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000', // Next.js default
  'http://localhost:3001', // Vite frontend
];

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  // Set CORS headers for all requests
  const nextResponse = NextResponse.next();
  nextResponse.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
  nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  return nextResponse;
}

export const config = {
  matcher: ["/api/:path*"],
};
