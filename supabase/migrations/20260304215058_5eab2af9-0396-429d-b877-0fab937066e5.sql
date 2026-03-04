-- Admin can read all contractor_bestellungen
CREATE POLICY "Admin kann alle Bestellungen lesen"
ON thermocheck.contractor_bestellungen
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM iam.user_system_roles usr
    WHERE usr.user_id = auth.uid()
    AND usr.role IN ('superadmin', 'admin', 'manager')
  )
);