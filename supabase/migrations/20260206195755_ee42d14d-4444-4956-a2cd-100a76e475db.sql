UPDATE thermocheck.contractor_akademie_module
SET ist_aktiv = false, updated_at = now()
WHERE id IN (
  'c9715b06-9638-4dc4-8837-bebbc66be074',
  '68ea9e78-ab4f-4684-9c9e-1e497fce006a'
);