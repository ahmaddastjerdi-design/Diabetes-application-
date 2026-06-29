/**
 * medications.ts — educational medication reference for type 2 diabetes and its common
 * comorbidities (blood pressure, cholesterol, heart/kidney protection, neuropathy, etc.).
 *
 * Scope: ALL major glucose-lowering drug CLASSES (not just metformin/insulin) plus the
 * medicines frequently used alongside diabetes. Generic (international) names are listed;
 * these correspond to what is dispensed in Iran via darooyab.ir, but BRAND NAMES and
 * AVAILABILITY should be confirmed there (the site could not be read automatically).
 *
 * CLINICAL SAFETY — read carefully:
 *  - This is EDUCATIONAL reference only. It is NOT a prescription, NOT a recommendation,
 *    and contains NO doses. Which medicine (if any) is right is decided ONLY by the
 *    patient's clinician.
 *  - Not a medical device; not clinically validated. Confirm against current local
 *    prescribing information and your physician.
 */

export interface Drug {
  id: string;
  generic: string;
  /** A couple of common brand examples (verify locally on darooyab.ir). */
  brands?: string;
  /** One-line, dose-free educational note on how the medicine generally helps. */
  note: string;
}

export interface DrugCategory {
  id: string;
  title: string;
  subtitle: string;
  /** "diabetes" = glucose-lowering; "comorbidity" = used alongside diabetes. */
  group: "diabetes" | "comorbidity";
  drugs: Drug[];
}

export const MEDICATION_CATALOG: DrugCategory[] = [
  // ---------- Glucose-lowering (type 2 diabetes) ----------
  {
    id: "biguanide",
    title: "Biguanide",
    subtitle: "Usually the first-line glucose-lowering medicine",
    group: "diabetes",
    drugs: [{ id: "metformin", generic: "Metformin", brands: "Glucophage", note: "Lowers glucose the liver makes; weight-neutral; first-line for most." }],
  },
  {
    id: "sulfonylurea",
    title: "Sulfonylureas",
    subtitle: "Stimulate the pancreas to release more insulin",
    group: "diabetes",
    drugs: [
      { id: "glibenclamide", generic: "Glibenclamide (Glyburide)", note: "Increases insulin release; can cause lows and weight gain." },
      { id: "gliclazide", generic: "Gliclazide", note: "Increases insulin release; lower hypo risk than glibenclamide." },
      { id: "glimepiride", generic: "Glimepiride", note: "Once-daily sulfonylurea." },
      { id: "glipizide", generic: "Glipizide", note: "Short-acting sulfonylurea." },
    ],
  },
  {
    id: "meglitinide",
    title: "Meglitinides (glinides)",
    subtitle: "Quick, meal-time insulin release",
    group: "diabetes",
    drugs: [
      { id: "repaglinide", generic: "Repaglinide", note: "Taken with meals to blunt after-meal spikes." },
      { id: "nateglinide", generic: "Nateglinide", note: "Rapid, short-acting meal-time agent." },
    ],
  },
  {
    id: "tzd",
    title: "Thiazolidinedione (TZD)",
    subtitle: "Improve the body's sensitivity to insulin",
    group: "diabetes",
    drugs: [{ id: "pioglitazone", generic: "Pioglitazone", note: "Improves insulin sensitivity; watch fluid retention/weight." }],
  },
  {
    id: "dpp4",
    title: "DPP-4 inhibitors (gliptins)",
    subtitle: "Boost the body's own incretin hormones",
    group: "diabetes",
    drugs: [
      { id: "sitagliptin", generic: "Sitagliptin", brands: "Januvia", note: "Weight-neutral; low hypo risk." },
      { id: "linagliptin", generic: "Linagliptin", note: "Usable in kidney impairment without dose change." },
      { id: "vildagliptin", generic: "Vildagliptin", note: "Often twice daily." },
      { id: "saxagliptin", generic: "Saxagliptin", note: "Once daily." },
    ],
  },
  {
    id: "sglt2",
    title: "SGLT2 inhibitors (flozins)",
    subtitle: "Remove excess glucose via the urine; heart & kidney benefits",
    group: "diabetes",
    drugs: [
      { id: "empagliflozin", generic: "Empagliflozin", brands: "Jardiance", note: "Proven heart-failure and kidney benefits." },
      { id: "dapagliflozin", generic: "Dapagliflozin", brands: "Forxiga", note: "Heart and kidney protection." },
      { id: "canagliflozin", generic: "Canagliflozin", note: "Cardiorenal benefits." },
    ],
  },
  {
    id: "glp1",
    title: "GLP-1 receptor agonists",
    subtitle: "Lower glucose, reduce appetite & weight; heart benefits",
    group: "diabetes",
    drugs: [
      { id: "semaglutide", generic: "Semaglutide", brands: "Ozempic / Rybelsus", note: "Weekly injection or daily tablet; strong weight loss." },
      { id: "liraglutide", generic: "Liraglutide", brands: "Victoza", note: "Daily injection; cardiovascular benefit." },
      { id: "dulaglutide", generic: "Dulaglutide", brands: "Trulicity", note: "Weekly injection." },
      { id: "exenatide", generic: "Exenatide", note: "Daily or weekly injection." },
    ],
  },
  {
    id: "agi",
    title: "Alpha-glucosidase inhibitor",
    subtitle: "Slow carbohydrate absorption after meals",
    group: "diabetes",
    drugs: [{ id: "acarbose", generic: "Acarbose", note: "Reduces after-meal spikes; can cause gas/bloating." }],
  },
  {
    id: "insulin",
    title: "Insulins",
    subtitle: "Replace or supplement the body's insulin",
    group: "diabetes",
    drugs: [
      { id: "ins-rapid", generic: "Rapid-acting: Aspart, Lispro, Glulisine", note: "Taken at meals to cover food." },
      { id: "ins-regular", generic: "Short-acting: Regular insulin", note: "Meal-time insulin; slower onset than rapid." },
      { id: "ins-nph", generic: "Intermediate: NPH", note: "Background coverage; twice daily common." },
      { id: "ins-long", generic: "Long-acting: Glargine, Detemir, Degludec", note: "Steady background insulin, usually once daily." },
      { id: "ins-premix", generic: "Premixed (e.g. 70/30)", note: "Combines background + meal-time in one pen." },
    ],
  },

  // ---------- Comorbidities ----------
  {
    id: "bp",
    title: "Blood pressure",
    subtitle: "ACE/ARB are preferred in diabetes (also protect kidneys)",
    group: "comorbidity",
    drugs: [
      { id: "enalapril", generic: "Enalapril (ACE inhibitor)", note: "Lowers BP; protects kidneys; ACE class can cause cough." },
      { id: "lisinopril", generic: "Lisinopril (ACE inhibitor)", note: "Once-daily ACE inhibitor." },
      { id: "ramipril", generic: "Ramipril (ACE inhibitor)", note: "Cardio/renal protective." },
      { id: "losartan", generic: "Losartan (ARB)", note: "ACE alternative; kidney-protective; no cough." },
      { id: "valsartan", generic: "Valsartan (ARB)", note: "ARB for BP and heart." },
      { id: "telmisartan", generic: "Telmisartan (ARB)", note: "Long-acting ARB." },
      { id: "amlodipine", generic: "Amlodipine (calcium channel blocker)", note: "Add-on BP control." },
      { id: "hctz", generic: "Hydrochlorothiazide (diuretic)", note: "Thiazide diuretic for BP." },
      { id: "indapamide", generic: "Indapamide (diuretic)", note: "Thiazide-like diuretic." },
      { id: "bisoprolol", generic: "Bisoprolol (beta-blocker)", note: "Used with heart disease." },
      { id: "spironolactone", generic: "Spironolactone", note: "For resistant BP / heart failure." },
    ],
  },
  {
    id: "lipids",
    title: "Cholesterol (lipids)",
    subtitle: "Statins are recommended for most adults with diabetes",
    group: "comorbidity",
    drugs: [
      { id: "atorvastatin", generic: "Atorvastatin (statin)", brands: "Lipitor", note: "Lowers LDL; cardiovascular protection." },
      { id: "rosuvastatin", generic: "Rosuvastatin (statin)", note: "Potent LDL lowering." },
      { id: "simvastatin", generic: "Simvastatin (statin)", note: "Common statin; taken at night." },
      { id: "ezetimibe", generic: "Ezetimibe", note: "Add-on to statin to lower LDL further." },
      { id: "fenofibrate", generic: "Fenofibrate (fibrate)", note: "Mainly for high triglycerides." },
      { id: "omega3", generic: "Omega-3 (fish oil)", note: "For high triglycerides." },
    ],
  },
  {
    id: "antiplatelet",
    title: "Heart protection / blood thinners",
    subtitle: "For those with, or at high risk of, heart disease",
    group: "comorbidity",
    drugs: [
      { id: "aspirin", generic: "Aspirin (low-dose)", note: "Antiplatelet for established heart disease." },
      { id: "clopidogrel", generic: "Clopidogrel", note: "Antiplatelet, e.g. after stents." },
    ],
  },
  {
    id: "renal",
    title: "Kidney protection",
    subtitle: "Slow diabetic kidney disease",
    group: "comorbidity",
    drugs: [
      { id: "acearb-renal", generic: "ACE inhibitor / ARB", note: "First-line to protect kidneys (see Blood pressure)." },
      { id: "finerenone", generic: "Finerenone", note: "Newer agent that protects kidneys & heart in diabetic kidney disease." },
      { id: "sglt2-renal", generic: "SGLT2 inhibitor", note: "Also slows kidney disease (see diabetes section)." },
    ],
  },
  {
    id: "neuropathy",
    title: "Nerve pain (neuropathy)",
    subtitle: "For painful diabetic nerve damage",
    group: "comorbidity",
    drugs: [
      { id: "pregabalin", generic: "Pregabalin", note: "For neuropathic pain." },
      { id: "gabapentin", generic: "Gabapentin", note: "For neuropathic pain." },
      { id: "duloxetine", generic: "Duloxetine", note: "Antidepressant also used for nerve pain." },
      { id: "amitriptyline", generic: "Amitriptyline", note: "Low-dose for nerve pain." },
    ],
  },
  {
    id: "supportive",
    title: "Related & supportive",
    subtitle: "Common alongside diabetes",
    group: "comorbidity",
    drugs: [
      { id: "levothyroxine", generic: "Levothyroxine", note: "For thyroid problems (common with diabetes)." },
      { id: "b12", generic: "Vitamin B12", note: "Long-term metformin can lower B12 — sometimes supplemented." },
      { id: "vitd", generic: "Vitamin D", note: "Often supplemented if deficient." },
      { id: "allopurinol", generic: "Allopurinol", note: "For gout, which is more common with diabetes." },
    ],
  },
];

/** Flat list of every drug with its category, for search/selection. */
export function allDrugs(): { categoryId: string; categoryTitle: string; drug: Drug }[] {
  return MEDICATION_CATALOG.flatMap((c) => c.drugs.map((drug) => ({ categoryId: c.id, categoryTitle: c.title, drug })));
}

export const MED_DISCLAIMER =
  "Educational reference only — not a prescription and not medical advice, and no doses are shown. " +
  "Which medicines are right for you is decided only by your clinician. Brand names and availability " +
  "should be confirmed on darooyab.ir.";
