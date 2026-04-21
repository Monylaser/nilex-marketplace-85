-- Realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Storage bucket for chat images (public read, auth write to own folder)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

CREATE POLICY "chat_images_user_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "chat_images_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);