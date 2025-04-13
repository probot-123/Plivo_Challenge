export async function GET() {
  return new Response(JSON.stringify({
    status: "ok",
    message: "Simple API is working",
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 