import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WiFiCommandRequest {
  toiletId: string;
  command: string;
  ipAddress: string;
  secretCode: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { toiletId, command, ipAddress, secretCode }: WiFiCommandRequest = await req.json();

    console.log(`Sending WiFi command: ${command} to ${ipAddress}`);

    // Construct the HTTP request URL
    const commandUrl = `http://${ipAddress}/${command.toLowerCase()}?code=${secretCode}`;

    // Log the command attempt
    await supabaseClient
      .from('command_logs')
      .insert({
        toilet_id: toiletId,
        command_type: command,
        control_mode: 'wifi',
        destination: ipAddress,
        status: 'sent',
      });

    try {
      // Send HTTP request to the toilet's WiFi module
      const response = await fetch(commandUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update log with success status
      await supabaseClient
        .from('command_logs')
        .update({ status: 'success' })
        .eq('toilet_id', toiletId)
        .eq('command_type', command)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log(`WiFi command successful: ${commandUrl}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Command sent via WiFi to ${ipAddress}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (fetchError) {
      // Update log with failed status
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      
      await supabaseClient
        .from('command_logs')
        .update({ 
          status: 'failed',
          error_message: errorMessage
        })
        .eq('toilet_id', toiletId)
        .eq('command_type', command)
        .order('created_at', { ascending: false })
        .limit(1);

      throw fetchError;
    }
  } catch (error) {
    console.error('Error in send-wifi-command:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
