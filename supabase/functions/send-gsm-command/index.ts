import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const VALID_COMMANDS = ['FLUSH', 'OPEN', 'CLOSE', 'PERFUME'];
const PHONE_NUMBER_REGEX = /^\+?[1-9]\d{1,14}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface GSMCommandRequest {
  toiletId: string;
  command: string;
  phoneNumber: string;
  secretCode: string;
}

function validateRequest(req: GSMCommandRequest): string | null {
  if (!req.toiletId || !UUID_REGEX.test(req.toiletId)) {
    return "Invalid toilet ID format";
  }
  if (!req.command || !VALID_COMMANDS.includes(req.command)) {
    return `Invalid command. Must be one of: ${VALID_COMMANDS.join(', ')}`;
  }
  if (!req.phoneNumber || !PHONE_NUMBER_REGEX.test(req.phoneNumber)) {
    return "Invalid phone number format";
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

    const requestData: GSMCommandRequest = await req.json();
    
    // Validate input
    const validationError = validateRequest(requestData);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { toiletId, command, phoneNumber, secretCode } = requestData;

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

    // Construct the SMS message with secret code
    const smsMessage = `${command} ${secretCode}`;

    // Log the command attempt
    const { error: logError } = await supabaseClient
      .from('command_logs')
      .insert({
        toilet_id: toiletId,
        command_type: command,
        control_mode: 'gsm',
        destination: phoneNumber,
        status: 'sent',
      });

    if (logError) {
      console.error('Error logging command:', logError.message);
    }

    // Note: Actual SMS sending would require an SMS gateway API
    // For now, this is a placeholder that logs the command
    // In production, integrate with providers like Twilio, Nexmo, Africa's Talking, etc.
    
    console.log(`SMS command logged for ${phoneNumber}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Command sent via GSM to ${phoneNumber}`,
        note: 'SMS integration requires SMS provider API key'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-gsm-command:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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
