-- Fix payment insertion security issue
-- Remove the policy that allows users to insert their own payments
-- Payments should only be inserted through verified edge functions

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;

-- Create a new policy that only allows service role to insert payments
-- This ensures payments can only be created through edge functions after verification
CREATE POLICY "Service role can insert payments" 
ON public.payments 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Add a comment to document the security reasoning
COMMENT ON POLICY "Service role can insert payments" ON public.payments IS 
'Payments can only be inserted through edge functions using service role authentication. This prevents users from creating fake payment records and ensures all payments are verified through actual payment gateways.';