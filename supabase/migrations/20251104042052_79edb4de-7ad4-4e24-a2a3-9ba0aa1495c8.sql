-- Fix command_logs RLS policies to restrict access properly
DROP POLICY IF EXISTS "Authenticated users can view own command logs" ON public.command_logs;
DROP POLICY IF EXISTS "Authenticated users can insert command logs" ON public.command_logs;
DROP POLICY IF EXISTS "Only admins can modify command logs" ON public.command_logs;

-- Only admins can view command logs (audit trail)
CREATE POLICY "Admins can view all command logs"
ON public.command_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert logs (for app functionality)
CREATE POLICY "Authenticated users can insert command logs"
ON public.command_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Prevent modification of command logs to maintain audit integrity
CREATE POLICY "No one can update command logs"
ON public.command_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No one can delete command logs"
ON public.command_logs
FOR DELETE
TO authenticated
USING (false);