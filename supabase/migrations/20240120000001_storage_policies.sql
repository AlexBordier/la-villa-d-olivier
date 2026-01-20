-- Autoriser l'accès public en lecture
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'vacances');

-- Autoriser l'insertion pour tout le monde (Public)
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vacances');

-- Autoriser la mise à jour et suppression (Optionnel mais utile pour le ménage)
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'vacances');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'vacances');
