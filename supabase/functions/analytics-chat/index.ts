import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { messages } = await req.json();

    // Fetch analytics data for context
    const { data: payments } = await supabaseClient
      .from('payments')
      .select('*, toilets(name, location)')
      .order('created_at', { ascending: false });

    // Calculate statistics
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const paymentMethodCounts = payments?.reduce((acc, p) => {
      acc[p.payment_method] = (acc[p.payment_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const toiletUsage = payments?.reduce((acc, p) => {
      if (p.toilets) {
        const key = `${p.toilets.name} (${p.toilets.location})`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    const dataSummary = {
      totalTransactions: payments?.length || 0,
      totalRevenue,
      averageTransaction: payments?.length ? (totalRevenue / payments.length).toFixed(2) : 0,
      paymentMethods: paymentMethodCounts,
      topToilets: Object.entries(toiletUsage)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a business analytics assistant for a toilet management system. You have access to the following data:

Total Transactions: ${dataSummary.totalTransactions}
Total Revenue: $${dataSummary.totalRevenue.toFixed(2)}
Average Transaction: $${dataSummary.averageTransaction}

Payment Methods Distribution:
${Object.entries(dataSummary.paymentMethods).map(([method, count]) => `- ${method}: ${count} transactions`).join('\n')}

Top 5 Most Used Toilets:
${dataSummary.topToilets.map(t => `- ${t.name}: ${t.count} uses`).join('\n')}

Provide helpful, actionable insights and answer questions about the business performance, trends, and growth opportunities.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI gateway error:', aiResponse.status);
      const errorText = await aiResponse.text();
      console.error('Error details:', errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to generate AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
