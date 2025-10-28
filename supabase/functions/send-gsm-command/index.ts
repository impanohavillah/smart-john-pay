import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GSMCommandRequest {
  toiletId: string;
  command: string;
  phoneNumber: string;
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

    const { toiletId, command, phoneNumber, secretCode }: GSMCommandRequest = await req.json();

    console.log(`Sending GSM command: ${command} to ${phoneNumber}`);

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
      console.error('Error logging command:', logError);
    }

    // Note: Actual SMS sending would require an SMS gateway API
    // For now, this is a placeholder that logs the command
    // In production, integrate with providers like Twilio, Nexmo, Africa's Talking, etc.
    
    console.log(`SMS would be sent to ${phoneNumber}: ${smsMessage}`);

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
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
