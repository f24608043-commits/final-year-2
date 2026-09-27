-- Create tutor_enrollments table for tutor-student relationships
CREATE TYPE tutor_enrollment_status AS ENUM ('pending', 'accepted', 'rejected', 'removed');

CREATE TABLE tutor_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status tutor_enrollment_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(tutor_id, learner_id)
);

-- Create index for faster queries
CREATE INDEX idx_tutor_enrollments_tutor_id ON tutor_enrollments(tutor_id);
CREATE INDEX idx_tutor_enrollments_learner_id ON tutor_enrollments(learner_id);
CREATE INDEX idx_tutor_enrollments_status ON tutor_enrollments(status);
