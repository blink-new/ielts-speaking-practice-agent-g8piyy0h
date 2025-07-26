import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { action, ...params } = await req.json();
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const agentId = Deno.env.get('ELEVENLABS_AGENT_ID');

    if (!apiKey || !agentId) {
      throw new Error('ElevenLabs API key or Agent ID not configured');
    }

    let response;

    switch (action) {
      case 'start_conversation':
        // Start a new conversation session with the agent
        response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: agentId,
            ...params
          }),
        });
        break;

      case 'send_audio':
        // Send audio data to the conversation
        const { conversationId, audioData } = params;
        response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'audio/mpeg',
          },
          body: audioData,
        });
        break;

      case 'get_conversation':
        // Get conversation details
        const { conversationId: convId } = params;
        response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${convId}`, {
          method: 'GET',
          headers: {
            'xi-api-key': apiKey,
          },
        });
        break;

      case 'end_conversation':
        // End the conversation
        const { conversationId: endConvId } = params;
        response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${endConvId}`, {
          method: 'DELETE',
          headers: {
            'xi-api-key': apiKey,
          },
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('ElevenLabs Conversation API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process conversation request' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});