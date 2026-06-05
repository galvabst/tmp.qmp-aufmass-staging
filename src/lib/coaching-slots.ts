import { CoachingSlot } from '@/types/onboarding';
import type { DbCoachingRide } from '@/hooks/useCoachingSlots';

// Aufschlag auf den Trainer-Coaching-Preis (Marge), den der Techniker zahlt.
export const COACHING_PREIS_AUFSCHLAG = 1.3;

// Ein DB-Ride → UI-CoachingSlot. gebucht=true für den bereits gebuchten Ride.
function rideToSlot(ride: DbCoachingRide, gebucht: boolean): CoachingSlot {
  return {
    id: ride.auftrag_id,
    coachName: `${ride.trainer_vorname || ''} ${ride.trainer_nachname || ''}`.trim() || 'Trainer',
    coachAvatarUrl: ride.trainer_avatar_url,
    coachVideoUrl: ride.trainer_video_url,
    coachBio: ride.trainer_bio,
    coachTelefon: ride.trainer_telefon,
    coachEmail: ride.trainer_email,
    coachOrt: ride.trainer_ort,
    termine: ride.termine.map(t => ({
      datum: t.datum,
      ganztaegig: t.ganztaegig,
      zeitVon: t.zeit_von,
      zeitBis: t.zeit_bis,
    })),
    ort: ride.region,
    region: ride.region,
    gebucht,
    preis: Math.round((ride.trainer_coaching_preis ?? 0) * COACHING_PREIS_AUFSCHLAG),
  };
}

/**
 * Baut die CoachingSlot-Liste für den Coaching-Schritt: der bereits gebuchte
 * Ride zuerst (gebucht=true), danach die verfügbaren Rides (gebucht=false).
 */
export function mapRidesToSlots(
  myBookedRide: DbCoachingRide | null | undefined,
  dbCoachingRides: DbCoachingRide[],
): CoachingSlot[] {
  const slots: CoachingSlot[] = [];
  if (myBookedRide) slots.push(rideToSlot(myBookedRide, true));
  for (const ride of dbCoachingRides) slots.push(rideToSlot(ride, false));
  return slots;
}
