-- Create a function to reset recovery code attempts for a specific user
-- Only admins can call this (enforced via RLS on the underlying table)
CREATE OR REPLACE FUNCTION public.reset_recovery_code_attempts(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Check if caller is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can reset recovery code attempts';
  END IF;

  -- Delete all attempts for the user and return count
  DELETE FROM public.recovery_code_attempts
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Log this action to admin audit log
  INSERT INTO public.admin_access_audit_log (
    user_id,
    table_name,
    operation,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    'recovery_code_attempts',
    'RESET',
    p_user_id::text,
    jsonb_build_object('deleted_count', v_deleted_count),
    NULL
  );
  
  RETURN v_deleted_count;
END;
$$;