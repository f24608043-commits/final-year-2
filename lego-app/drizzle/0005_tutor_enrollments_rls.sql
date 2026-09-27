-- RLS Policies for tutor_enrollments table

-- Enable RLS
ALTER TABLE tutor_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view enrollments where they are the tutor or learner
CREATE POLICY "Users can view own enrollments"
ON tutor_enrollments FOR SELECT
USING (
  auth.uid() = tutor_id OR 
  auth.uid() = learner_id
);

-- Policy: Tutors can insert enrollment requests addressed to them
CREATE POLICY "Tutors can receive enrollment requests"
ON tutor_enrollments FOR INSERT
WITH CHECK (
  auth.uid() = learner_id AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = tutor_id AND role = 'tutor'
  )
);

-- Policy: Users can update enrollments where they are the tutor (accept/reject)
CREATE POLICY "Tutors can update enrollment status"
ON tutor_enrollments FOR UPDATE
USING (
  auth.uid() = tutor_id
)
WITH CHECK (
  auth.uid() = tutor_id
);

-- Policy: No delete allowed (use status updates instead)
CREATE POLICY "No direct deletes on enrollments"
ON tutor_enrollments FOR DELETE
USING (false);
