export type PraxistestKomponente = 'scan' | 'video';

export interface PraxistestFeedbackBild {
  id: string;
  storagePath: string;
  signedUrl?: string;
  position: number;
}

export interface PraxistestFeedbackEntry {
  id: string;
  onboardingId: string;
  runde: number;
  komponente: PraxistestKomponente;
  kommentar: string;
  pruefer_profile_id: string | null;
  pruefer_rolle: 'trainer' | 'admin';
  erstelltAm: string;
  bilder: PraxistestFeedbackBild[];
}

export interface RejectComponentPayload {
  komponente: PraxistestKomponente;
  kommentar: string;
  bildBlobs: Blob[];
}

export const KOMPONENTE_LABEL: Record<PraxistestKomponente, string> = {
  scan: '3D-Scan / Autarc-Projekt',
  video: 'Drohnenvideo',
};
