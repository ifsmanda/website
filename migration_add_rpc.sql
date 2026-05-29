-- =========================================================================
-- MIGRATION: ANTRIAN PPID CONCURRENCY-SAFE GENERATOR
-- Run this script in the Supabase SQL Editor to register the custom function.
-- =========================================================================

CREATE OR REPLACE FUNCTION register_ppid_consultation(
  p_name VARCHAR,
  p_role VARCHAR,
  p_phone VARCHAR,
  p_topic VARCHAR,
  p_consultation_date DATE,
  p_session VARCHAR
) RETURNS SETOF ws_ppid_consultations AS $$
DECLARE
  v_seq INT;
  v_formatted_seq VARCHAR(5);
  v_prefix CHAR(1);
  v_queue_number VARCHAR(10);
  v_inserted ws_ppid_consultations;
BEGIN
  -- Acquire a transaction-level advisory lock based on date and session to prevent concurrent writes
  PERFORM pg_advisory_xact_lock(hashtext(p_consultation_date::text || p_session));

  -- Get the current maximum sequence number for this date and session
  SELECT COALESCE(
    MAX(NULLIF(regexp_replace(queue_number, '^[^0-9]+', ''), '')::integer),
    0
  ) INTO v_seq
  FROM ws_ppid_consultations
  WHERE consultation_date = p_consultation_date
    AND session = p_session;

  v_seq := v_seq + 1;
  v_formatted_seq := lpad(v_seq::text, 2, '0');
  
  IF p_session LIKE '%Pagi%' THEN
    v_prefix := 'A';
  ELSE
    v_prefix := 'B';
  END IF;
  
  v_queue_number := v_prefix || '-' || v_formatted_seq;

  -- Insert the new consultation record
  INSERT INTO ws_ppid_consultations (
    name,
    role,
    phone,
    topic,
    consultation_date,
    session,
    queue_number,
    status
  ) VALUES (
    p_name,
    p_role,
    p_phone,
    p_topic,
    p_consultation_date,
    p_session,
    v_queue_number,
    'Pending'
  ) RETURNING * INTO v_inserted;

  RETURN NEXT v_inserted;
END;
$$ LANGUAGE plpgsql;
