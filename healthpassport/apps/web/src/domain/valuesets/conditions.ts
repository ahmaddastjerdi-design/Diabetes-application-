import { SYSTEMS, type CodeableConcept } from '../primitives';

/**
 * Curated catalog of common chronic conditions, dual-coded with SNOMED CT and
 * ICD-10 so the record is interoperable with both clinical and billing systems.
 * Sources: SNOMED CT International, WHO ICD-10.
 */
export interface ConditionCatalogEntry {
  key: string;
  concept: CodeableConcept;
  /** Chronic-care module this condition unlocks, if any. */
  careModule?: 'diabetes' | 'hypertension';
}

function entry(
  key: string,
  text: string,
  snomed: [string, string],
  icd10: [string, string],
  careModule?: ConditionCatalogEntry['careModule'],
): ConditionCatalogEntry {
  return {
    key,
    concept: {
      text,
      coding: [
        { system: SYSTEMS.SNOMED, code: snomed[0], display: snomed[1] },
        { system: SYSTEMS.ICD10, code: icd10[0], display: icd10[1] },
      ],
    },
    ...(careModule ? { careModule } : {}),
  };
}

export const CONDITION_CATALOG: ConditionCatalogEntry[] = [
  entry(
    'type2-diabetes',
    'Type 2 diabetes mellitus',
    ['44054006', 'Type 2 diabetes mellitus'],
    ['E11', 'Type 2 diabetes mellitus'],
    'diabetes',
  ),
  entry(
    'type1-diabetes',
    'Type 1 diabetes mellitus',
    ['46635009', 'Type 1 diabetes mellitus'],
    ['E10', 'Type 1 diabetes mellitus'],
    'diabetes',
  ),
  entry(
    'hypertension',
    'Essential hypertension',
    ['59621000', 'Essential hypertension'],
    ['I10', 'Essential (primary) hypertension'],
    'hypertension',
  ),
  entry(
    'hyperlipidemia',
    'Hyperlipidemia',
    ['55822004', 'Hyperlipidemia'],
    ['E78.5', 'Hyperlipidemia, unspecified'],
  ),
  entry(
    'ckd',
    'Chronic kidney disease',
    ['709044004', 'Chronic kidney disease'],
    ['N18.9', 'Chronic kidney disease, unspecified'],
  ),
  entry(
    'asthma',
    'Asthma',
    ['195967001', 'Asthma'],
    ['J45.909', 'Unspecified asthma, uncomplicated'],
  ),
];

/** Which care modules a set of conditions activates. */
export function careModulesForConditions(
  conditionKeys: readonly string[],
): Array<'diabetes' | 'hypertension'> {
  const modules = new Set<'diabetes' | 'hypertension'>();
  for (const c of CONDITION_CATALOG) {
    if (c.careModule && conditionKeys.includes(c.key)) modules.add(c.careModule);
  }
  return [...modules];
}
