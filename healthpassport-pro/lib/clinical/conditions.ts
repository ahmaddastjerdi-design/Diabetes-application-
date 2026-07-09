/**
 * Curated chronic-condition catalog, dual-coded with SNOMED CT and ICD-10 so the
 * problem list is interoperable (docs/FHIR_MAPPING.md). `careModule` links a
 * condition to the chronic-care tracking it unlocks in later phases.
 */
export interface ConditionCatalogEntry {
  key: string;
  display: string;
  snomed: string;
  icd10: string;
  careModule?: 'diabetes' | 'hypertension' | 'ckd' | 'dyslipidemia' | 'obesity';
}

export const CONDITION_CATALOG: ConditionCatalogEntry[] = [
  { key: 'type2-diabetes', display: 'Type 2 diabetes mellitus', snomed: '44054006', icd10: 'E11', careModule: 'diabetes' },
  { key: 'type1-diabetes', display: 'Type 1 diabetes mellitus', snomed: '46635009', icd10: 'E10', careModule: 'diabetes' },
  { key: 'prediabetes', display: 'Prediabetes', snomed: '714628002', icd10: 'R73.03' },
  { key: 'hypertension', display: 'Essential hypertension', snomed: '59621000', icd10: 'I10', careModule: 'hypertension' },
  { key: 'hyperlipidemia', display: 'Hyperlipidemia', snomed: '55822004', icd10: 'E78.5', careModule: 'dyslipidemia' },
  { key: 'ckd', display: 'Chronic kidney disease', snomed: '709044004', icd10: 'N18.9', careModule: 'ckd' },
  { key: 'obesity', display: 'Obesity', snomed: '414916001', icd10: 'E66.9', careModule: 'obesity' },
  { key: 'metabolic-syndrome', display: 'Metabolic syndrome', snomed: '237602007', icd10: 'E88.81' },
  { key: 'cad', display: 'Coronary artery disease', snomed: '53741008', icd10: 'I25.10' },
  { key: 'heart-failure', display: 'Heart failure', snomed: '84114007', icd10: 'I50.9' },
  { key: 'asthma', display: 'Asthma', snomed: '195967001', icd10: 'J45.909' },
  { key: 'copd', display: 'COPD', snomed: '13645005', icd10: 'J44.9' },
  { key: 'hypothyroidism', display: 'Hypothyroidism', snomed: '40930008', icd10: 'E03.9' },
];

export function findCondition(key: string): ConditionCatalogEntry | undefined {
  return CONDITION_CATALOG.find((c) => c.key === key);
}

export type CareModule = NonNullable<ConditionCatalogEntry['careModule']>;

const SNOMED_TO_MODULE = new Map<string, CareModule>();
for (const c of CONDITION_CATALOG) {
  if (c.careModule) SNOMED_TO_MODULE.set(c.snomed, c.careModule);
}

/** Active care modules inferred from stored conditions (matched by SNOMED code). */
export function careModulesFromConditions(
  conditions: ReadonlyArray<{ code: string }>,
): CareModule[] {
  const modules = new Set<CareModule>();
  for (const c of conditions) {
    const m = SNOMED_TO_MODULE.get(c.code);
    if (m) modules.add(m);
  }
  return [...modules];
}
