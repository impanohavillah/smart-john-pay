import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const VALID_COMMANDS = ['FLUSH', 'OPEN', 'CLOSE', 'PERFUME'];
const IP_ADDRESS_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface WiFiCommandRequest {
  toiletId: string;
  command: string;
  ipAddress: string;
  secretCode: string;
}

function validateRequest(req: WiFiCommandRequest): string | null {
  if (!req.toiletId || !UUID_REGEX.test(req.toiletId)) {
    return "Invalid toilet ID format";
  }
  if (!req.command || !VALID_COMMANDS.includes(req.command)) {
    return `Invalid command. Must be one of: ${VALID_COMMANDS.join(', ')}`;
  }
  if (!req.ipAddress || !IP_ADDRESS_REGEX.test(req.ipAddress)) {
    return "Invalid IP address format";
  }
  if (!req.secretCode || req.secretCode.length < 6 || req.secretCode.length > 50) {
    return "Invalid secret code format";
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: WiFiCommandRequest = await req.json();
    
    // Validate input
    const validationError = validateRequest(requestData);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { toiletId, command, ipAddress, secretCode } = requestData;

    // Verify secret code from admin_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'secret_code')
      .single();

    if (settingsError || !settings || settings.setting_value !== secretCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid secret code' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct the command URL - sanitized via validation
    const commandUrl = `http://${ipAddress}/${command}?code=${encodeURIComponent(secretCode)}`;
    
    // Create initial log entry
    const { data: logData, error: logError } = await supabaseClient
      .from('command_logs')
      .insert({
        toilet_id: toiletId,
        command_type: command,
        control_mode: 'wifi',
        destination: ipAddress,
        status: 'sent',
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating command log:', logError.message);
    }

    // Send command via HTTP with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(commandUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Update log with success status
      if (logData) {
        await supabaseClient
          .from('command_logs')
          .update({ status: 'success' })
          .eq('id', logData.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Command sent successfully to ${ipAddress}`,
          status: response.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Network error';
      
      // Update log with failure status
      if (logData) {
        await supabaseClient
          .from('command_logs')
          .update({ 
            status: 'failed',
            error_message: errorMsg
          })
          .eq('id', logData.id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send command to device',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in send-wifi-command:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
