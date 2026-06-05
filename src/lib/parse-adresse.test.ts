import { describe, it, expect } from 'vitest';
import { parseStrasseHausnummer, joinStrasseHausnummer } from './parse-adresse';

describe('parseStrasseHausnummer', () => {
  it('trennt einfache Straße + Hausnummer', () => {
    expect(parseStrasseHausnummer('Musterstraße 12')).toEqual({
      strasse: 'Musterstraße',
      hausnummer: '12',
    });
  });

  it('erkennt Buchstaben-Zusatz (12a)', () => {
    expect(parseStrasseHausnummer('Musterstraße 12a')).toEqual({
      strasse: 'Musterstraße',
      hausnummer: '12a',
    });
  });

  it('erkennt Bereichs-Hausnummer mit Bindestrich (12-14)', () => {
    expect(parseStrasseHausnummer('Hauptstraße 12-14')).toEqual({
      strasse: 'Hauptstraße',
      hausnummer: '12-14',
    });
  });

  it('erkennt Hausnummer mit Schrägstrich (12/3)', () => {
    expect(parseStrasseHausnummer('Musterweg 12/3')).toEqual({
      strasse: 'Musterweg',
      hausnummer: '12/3',
    });
  });

  it('behandelt Straßennamen mit Zahl im Namen korrekt', () => {
    expect(parseStrasseHausnummer('Straße des 17. Juni 100')).toEqual({
      strasse: 'Straße des 17. Juni',
      hausnummer: '100',
    });
  });

  it('gibt bei fehlender Hausnummer nur die Straße zurück', () => {
    expect(parseStrasseHausnummer('Musterstraße')).toEqual({
      strasse: 'Musterstraße',
      hausnummer: '',
    });
  });

  it('trimmt führende/folgende Leerzeichen', () => {
    expect(parseStrasseHausnummer('  Allee 5  ')).toEqual({
      strasse: 'Allee',
      hausnummer: '5',
    });
  });

  it('verkraftet leeren / null / undefined Input', () => {
    expect(parseStrasseHausnummer('')).toEqual({ strasse: '', hausnummer: '' });
    expect(parseStrasseHausnummer(null)).toEqual({ strasse: '', hausnummer: '' });
    expect(parseStrasseHausnummer(undefined)).toEqual({ strasse: '', hausnummer: '' });
  });
});

describe('joinStrasseHausnummer (Roundtrip-Partner)', () => {
  it('fügt Straße + Hausnummer zusammen', () => {
    expect(joinStrasseHausnummer('Musterstraße', '12a')).toBe('Musterstraße 12a');
  });

  it('lässt die Hausnummer weg, wenn leer', () => {
    expect(joinStrasseHausnummer('Musterstraße', '')).toBe('Musterstraße');
  });

  it('ist roundtrip-stabil mit parseStrasseHausnummer', () => {
    for (const input of ['Hauptstraße 12-14', 'Musterweg 12/3', 'Straße des 17. Juni 100']) {
      const { strasse, hausnummer } = parseStrasseHausnummer(input);
      expect(joinStrasseHausnummer(strasse, hausnummer)).toBe(input);
    }
  });
});
