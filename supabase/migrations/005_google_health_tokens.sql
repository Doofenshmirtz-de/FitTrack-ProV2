-- Create table for storing Google API tokens securely
CREATE TABLE public.google_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own tokens"
    ON public.google_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.google_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
    ON public.google_tokens FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
    ON public.google_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_google_tokens_updated_at
    BEFORE UPDATE ON public.google_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
