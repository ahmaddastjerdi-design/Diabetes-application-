/**
 * medications.ts — medication reference for type 2 diabetes and its common comorbidities.
 *
 * The antidiabetic section is sourced from darooyab.ir (Antidiabetics / DrugGroups/5):
 * 11 pharmacological classes, with Persian names (نام فارسی), form, available strengths,
 * and a typical adult REFERENCE dose. Comorbidity sections are added for the medicines
 * commonly used alongside diabetes.
 *
 * CLINICAL SAFETY — read carefully:
 *  - Doses shown are TYPICAL ADULT REFERENCE values for general orientation only — NOT a
 *    prescribing guide. Actual dosing must be individualized by a physician based on
 *    kidney/liver function, comorbidities and glucose targets.
 *  - Educational reference only — NOT a prescription, NOT medical advice, not a medical
 *    device. Available strengths, forms and brands in Iran may vary; confirm on darooyab.ir.
 */

export interface Drug {
  id: string;
  generic: string; // English generic name
  persian?: string; // نام فارسی
  form?: string;
  strengths?: string;
  /** Typical adult reference dose — general orientation only, never personal advice. */
  usualDose?: string;
  note: string;
}

export interface DrugCategory {
  id: string;
  title: string;
  subtitle: string;
  group: "diabetes" | "comorbidity";
  drugs: Drug[];
}

export const MEDICATION_CATALOG: DrugCategory[] = [
  // ===== Antidiabetics (darooyab.ir) =====
  {
    id: "biguanide",
    title: "Biguanides (بیگوانیدها)",
    subtitle: "First-line glucose-lowering medicine",
    group: "diabetes",
    drugs: [
      { id: "metformin", generic: "Metformin", persian: "متفورمین", form: "Tablet / XR tablet", strengths: "500, 750 (XR), 1000 mg", usualDose: "500 mg twice daily with meals; titrate to 2000 mg/day (max ~2550)", note: "First-line for type 2 diabetes; weight-neutral." },
    ],
  },
  {
    id: "sulfonylurea",
    title: "Sulfonylureas (سولفونیل‌اوره‌ها)",
    subtitle: "Stimulate the pancreas to release insulin",
    group: "diabetes",
    drugs: [
      { id: "glibenclamide", generic: "Glibenclamide (Glyburide)", persian: "گلی‌بنکلامید", form: "Tablet", strengths: "2.5, 5 mg", usualDose: "Start 2.5–5 mg once daily; max 20 mg/day", note: "Second-generation; can cause lows/weight gain." },
      { id: "gliclazide", generic: "Gliclazide", persian: "گلی‌کلازید", form: "Tablet / MR tablet", strengths: "80; MR 30, 60 mg", usualDose: "80 mg/day → max 320 mg; MR 30–120 mg once daily", note: "Modified-release widely used; lower hypo risk." },
      { id: "glimepiride", generic: "Glimepiride", persian: "گلی‌مپیراید", form: "Tablet", strengths: "1, 2, 3, 4 mg", usualDose: "Start 1–2 mg once daily; max 8 mg/day", note: "Once-daily." },
      { id: "glipizide", generic: "Glipizide", persian: "گلی‌پیزاید", form: "Tablet", strengths: "5, 10 mg", usualDose: "Start 5 mg/day; max 40 mg/day (divided)", note: "Short-acting." },
      { id: "chlorpropamide", generic: "Chlorpropamide", persian: "کلرپروپامید", form: "Tablet", strengths: "250 mg", usualDose: "250 mg once daily; max 500 mg", note: "First-generation, long half-life." },
      { id: "tolazamide", generic: "Tolazamide", persian: "تولازاماید", form: "Tablet", strengths: "100, 250, 500 mg", usualDose: "100–250 mg once daily; max 1000 mg", note: "First-generation." },
      { id: "tolbutamide", generic: "Tolbutamide", persian: "تولبوتاماید", form: "Tablet", strengths: "500 mg", usualDose: "500–1000 mg; up to 2–3 g/day divided", note: "First-generation, short-acting." },
    ],
  },
  {
    id: "meglitinide",
    title: "Meglitinides / Glinides (مگلیتینیدها)",
    subtitle: "Quick, meal-time insulin release",
    group: "diabetes",
    drugs: [
      { id: "repaglinide", generic: "Repaglinide", persian: "رپاگلیناید", form: "Tablet", strengths: "0.5, 1, 2 mg", usualDose: "0.5–1 mg before each meal; max 16 mg/day", note: "Rapid prandial secretagogue." },
      { id: "nateglinide", generic: "Nateglinide", persian: "ناتگلیناید", form: "Tablet", strengths: "60, 120 mg", usualDose: "120 mg three times daily before meals", note: "Fast-onset, short-duration." },
    ],
  },
  {
    id: "tzd",
    title: "Thiazolidinediones / Glitazones (تیازولیدین‌دیون‌ها)",
    subtitle: "Improve the body's sensitivity to insulin",
    group: "diabetes",
    drugs: [
      { id: "pioglitazone", generic: "Pioglitazone", persian: "پیوگلیتازون", form: "Tablet", strengths: "15, 30, 45 mg", usualDose: "15–30 mg once daily; max 45 mg", note: "PPAR-γ agonist; watch fluid retention." },
      { id: "rosiglitazone", generic: "Rosiglitazone", persian: "روزیگلیتازون", form: "Tablet", strengths: "2, 4, 8 mg", usualDose: "4 mg once daily; max 8 mg", note: "PPAR-γ agonist." },
    ],
  },
  {
    id: "agi",
    title: "Alpha-glucosidase inhibitors (مهارکننده‌های آلفا-گلوکوزیداز)",
    subtitle: "Slow carbohydrate absorption after meals",
    group: "diabetes",
    drugs: [
      { id: "acarbose", generic: "Acarbose", persian: "آکاربوز", form: "Tablet", strengths: "50, 100 mg", usualDose: "50 mg three times daily with first bite; max 300 mg/day", note: "Lowers post-meal glucose; can cause gas/bloating." },
    ],
  },
  {
    id: "dpp4",
    title: "DPP-4 inhibitors / Gliptins (مهارکننده‌های DPP-4)",
    subtitle: "Boost the body's own incretin hormones",
    group: "diabetes",
    drugs: [
      { id: "sitagliptin", generic: "Sitagliptin", persian: "سیتاگلیپتین", form: "Tablet", strengths: "25, 50, 100 mg", usualDose: "100 mg once daily", note: "Renal dose reduction needed." },
      { id: "linagliptin", generic: "Linagliptin", persian: "لیناگلیپتین", form: "Tablet", strengths: "5 mg", usualDose: "5 mg once daily", note: "No renal adjustment." },
      { id: "vildagliptin", generic: "Vildagliptin", persian: "ویلداگلیپتین", form: "Tablet", strengths: "50 mg", usualDose: "50 mg once or twice daily (max 100 mg/day)", note: "Often twice daily." },
      { id: "saxagliptin", generic: "Saxagliptin", persian: "ساکساگلیپتین", form: "Tablet", strengths: "2.5, 5 mg", usualDose: "5 mg once daily", note: "Mostly used in combination." },
    ],
  },
  {
    id: "sglt2",
    title: "SGLT2 inhibitors / Gliflozins (مهارکننده‌های SGLT2)",
    subtitle: "Remove excess glucose via urine; heart & kidney benefits",
    group: "diabetes",
    drugs: [
      { id: "dapagliflozin", generic: "Dapagliflozin", persian: "داپاگلیفلوزین", form: "Tablet", strengths: "5, 10 mg", usualDose: "10 mg once daily", note: "Cardio-renal benefits." },
      { id: "empagliflozin", generic: "Empagliflozin", persian: "امپاگلیفلوزین", form: "Tablet", strengths: "10, 25 mg", usualDose: "10 mg once daily; max 25 mg", note: "Reduces cardiovascular risk." },
      { id: "canagliflozin", generic: "Canagliflozin", persian: "کاناگلیفلوزین", form: "Tablet", strengths: "100, 300 mg", usualDose: "100 mg once daily; max 300 mg", note: "Urinary glucose excretion." },
    ],
  },
  {
    id: "glp1",
    title: "GLP-1 receptor agonists (آگونیست‌های گیرنده GLP-1)",
    subtitle: "Lower glucose, reduce appetite & weight",
    group: "diabetes",
    drugs: [
      { id: "liraglutide", generic: "Liraglutide", persian: "لیراگلوتاید", form: "SC injection pen", strengths: "6 mg/mL (18 mg/3 mL pen)", usualDose: "Start 0.6 mg/day → 1.2–1.8 mg/day", note: "Daily; weight-loss benefit." },
      { id: "semaglutide", generic: "Semaglutide", persian: "سماگلوتاید", form: "SC pen / Oral tablet", strengths: "Inj 0.25–2 mg; Oral 3, 7, 14 mg", usualDose: "Inj 0.25 mg/week → 1–2 mg/week; Oral 3 → 7–14 mg daily", note: "Weekly injection or daily oral." },
      { id: "dulaglutide", generic: "Dulaglutide", persian: "دولاگلوتاید", form: "SC injection pen", strengths: "0.75, 1.5, 3, 4.5 mg", usualDose: "0.75–1.5 mg once weekly", note: "Once-weekly." },
      { id: "exenatide", generic: "Exenatide", persian: "اگزناتاید", form: "SC pen / ER pen", strengths: "5, 10 mcg; ER 2 mg", usualDose: "5 mcg twice daily → 10 mcg; ER 2 mg once weekly", note: "First GLP-1 agonist." },
    ],
  },
  {
    id: "dual",
    title: "Dual GIP / GLP-1 agonist (آگونیست دوگانه GIP/GLP-1)",
    subtitle: "Newer incretin combination",
    group: "diabetes",
    drugs: [
      { id: "tirzepatide", generic: "Tirzepatide", persian: "تیرزپاتاید", form: "SC injection pen", strengths: "2.5, 5, 7.5, 10, 12.5, 15 mg", usualDose: "Start 2.5 mg/week; titrate every 4 weeks (max 15 mg/week)", note: "Activates GIP + GLP-1; strong glucose & weight effect." },
    ],
  },
  {
    id: "insulin",
    title: "Insulins (انسولین‌ها)",
    subtitle: "Replace or supplement the body's insulin",
    group: "diabetes",
    drugs: [
      { id: "ins-rapid", generic: "Aspart / Lispro / Glulisine", persian: "آسپارت / لیسپرو / گلولایزین", form: "Vial / pen", strengths: "100 U/mL", usualDose: "Individualized mealtime bolus (units titrated)", note: "Rapid-acting." },
      { id: "ins-regular", generic: "Regular insulin", persian: "انسولین رگولار", form: "Vial / pen", strengths: "100 U/mL", usualDose: "Individualized; ~30 min before meals", note: "Short-acting." },
      { id: "ins-nph", generic: "NPH (Isophane)", persian: "ان‌پی‌اچ (ایزوفان)", form: "Vial / pen", strengths: "100 U/mL", usualDose: "Individualized basal (once–twice daily)", note: "Intermediate-acting." },
      { id: "ins-long", generic: "Glargine / Detemir / Degludec", persian: "گلارژین / دتمیر / دگلودک", form: "Vial / pen", strengths: "100 U/mL (glargine also 300)", usualDose: "Individualized once-daily basal", note: "Long-acting." },
      { id: "ins-premix", generic: "Premixed (70/30, 75/25)", persian: "مخلوط (۷۰/۳۰، ۷۵/۲۵)", form: "Vial / pen", strengths: "100 U/mL", usualDose: "Individualized; usually twice daily", note: "Basal + prandial in one pen." },
    ],
  },
  {
    id: "combo",
    title: "Fixed-dose combinations (داروهای ترکیبی)",
    subtitle: "Two or three agents in one tablet",
    group: "diabetes",
    drugs: [
      { id: "met-glib", generic: "Metformin + Glibenclamide", persian: "متفورمین + گلی‌بنکلامید", form: "Tablet", strengths: "500/2.5, 500/5", usualDose: "1 tablet 1–2× daily with meals (titrate)", note: "Biguanide + sulfonylurea." },
      { id: "met-pio", generic: "Metformin + Pioglitazone", persian: "متفورمین + پیوگلیتازون", form: "Tablet", strengths: "500/15", usualDose: "1 tablet 1–2× daily with meals", note: "Biguanide + TZD." },
      { id: "sita-met", generic: "Sitagliptin + Metformin", persian: "سیتاگلیپتین + متفورمین", form: "Tablet", strengths: "50/500, 50/1000", usualDose: "1 tablet twice daily with meals", note: "DPP-4i + biguanide." },
      { id: "dapa-met", generic: "Dapagliflozin + Metformin", persian: "داپاگلیفلوزین + متفورمین", form: "Tablet / XR", strengths: "5/500, 5/1000, 10/1000", usualDose: "Once–twice daily per components", note: "SGLT2i + biguanide." },
      { id: "dapa-saxa", generic: "Dapagliflozin + Saxagliptin", persian: "داپاگلیفلوزین + ساکساگلیپتین", form: "Tablet", strengths: "10/5", usualDose: "1 tablet once daily", note: "SGLT2i + DPP-4i." },
      { id: "empa-lina", generic: "Empagliflozin + Linagliptin", persian: "امپاگلیفلوزین + لیناگلیپتین", form: "Tablet", strengths: "10/5, 25/5", usualDose: "1 tablet once daily (morning)", note: "Glyxambi (SGLT2i + DPP-4i)." },
      { id: "empa-lina-met", generic: "Empagliflozin + Linagliptin + Metformin", persian: "امپاگلیفلوزین + لیناگلیپتین + متفورمین", form: "Tablet", strengths: "e.g. 5/2.5/500, 12.5/2.5/1000", usualDose: "1 tablet twice daily with meals", note: "Triple oral combination." },
    ],
  },

  // ===== Comorbidities (commonly used alongside diabetes) =====
  {
    id: "bp",
    title: "Blood pressure (فشار خون)",
    subtitle: "ACE/ARB are preferred in diabetes (also protect kidneys)",
    group: "comorbidity",
    drugs: [
      { id: "enalapril", generic: "Enalapril (ACE inhibitor)", persian: "انالاپریل", note: "Lowers BP; protects kidneys; ACE class can cause cough." },
      { id: "lisinopril", generic: "Lisinopril (ACE inhibitor)", persian: "لیزینوپریل", note: "Once-daily ACE inhibitor." },
      { id: "ramipril", generic: "Ramipril (ACE inhibitor)", persian: "رامیپریل", note: "Cardio/renal protective." },
      { id: "losartan", generic: "Losartan (ARB)", persian: "لوزارتان", note: "ACE alternative; kidney-protective; no cough." },
      { id: "valsartan", generic: "Valsartan (ARB)", persian: "والسارتان", note: "ARB for BP and heart." },
      { id: "amlodipine", generic: "Amlodipine (CCB)", persian: "آملودیپین", note: "Add-on BP control." },
      { id: "hctz", generic: "Hydrochlorothiazide (diuretic)", persian: "هیدروکلروتیازید", note: "Thiazide diuretic for BP." },
      { id: "bisoprolol", generic: "Bisoprolol (beta-blocker)", persian: "بیزوپرولول", note: "Used with heart disease." },
    ],
  },
  {
    id: "lipids",
    title: "Cholesterol / lipids (چربی خون)",
    subtitle: "Statins are recommended for most adults with diabetes",
    group: "comorbidity",
    drugs: [
      { id: "atorvastatin", generic: "Atorvastatin (statin)", persian: "آتورواستاتین", note: "Lowers LDL; cardiovascular protection." },
      { id: "rosuvastatin", generic: "Rosuvastatin (statin)", persian: "روزوواستاتین", note: "Potent LDL lowering." },
      { id: "simvastatin", generic: "Simvastatin (statin)", persian: "سیمواستاتین", note: "Taken at night." },
      { id: "ezetimibe", generic: "Ezetimibe", persian: "ازتیمایب", note: "Add-on to statin to lower LDL further." },
      { id: "fenofibrate", generic: "Fenofibrate (fibrate)", persian: "فنوفیبرات", note: "Mainly for high triglycerides." },
    ],
  },
  {
    id: "antiplatelet",
    title: "Heart protection / blood thinners (ضد پلاکت)",
    subtitle: "For established or high-risk heart disease",
    group: "comorbidity",
    drugs: [
      { id: "aspirin", generic: "Aspirin (low-dose)", persian: "آسپرین", note: "Antiplatelet for established heart disease." },
      { id: "clopidogrel", generic: "Clopidogrel", persian: "کلوپیدوگرل", note: "Antiplatelet, e.g. after stents." },
    ],
  },
  {
    id: "renal",
    title: "Kidney protection (محافظت کلیه)",
    subtitle: "Slow diabetic kidney disease",
    group: "comorbidity",
    drugs: [
      { id: "finerenone", generic: "Finerenone", persian: "فاینرنون", note: "Protects kidneys & heart in diabetic kidney disease." },
      { id: "acearb-renal", generic: "ACE inhibitor / ARB", persian: "مهارکننده ACE / ARB", note: "First-line to protect kidneys (see Blood pressure)." },
    ],
  },
  {
    id: "neuropathy",
    title: "Nerve pain / neuropathy (درد عصبی)",
    subtitle: "For painful diabetic nerve damage",
    group: "comorbidity",
    drugs: [
      { id: "pregabalin", generic: "Pregabalin", persian: "پرگابالین", note: "For neuropathic pain." },
      { id: "gabapentin", generic: "Gabapentin", persian: "گاباپنتین", note: "For neuropathic pain." },
      { id: "duloxetine", generic: "Duloxetine", persian: "دولوکستین", note: "Also used for nerve pain." },
      { id: "amitriptyline", generic: "Amitriptyline", persian: "آمی‌تریپتیلین", note: "Low-dose for nerve pain." },
    ],
  },
  {
    id: "supportive",
    title: "Related & supportive (سایر)",
    subtitle: "Common alongside diabetes",
    group: "comorbidity",
    drugs: [
      { id: "levothyroxine", generic: "Levothyroxine", persian: "لووتیروکسین", note: "For thyroid problems (common with diabetes)." },
      { id: "b12", generic: "Vitamin B12", persian: "ویتامین ب۱۲", note: "Long-term metformin can lower B12." },
      { id: "vitd", generic: "Vitamin D", persian: "ویتامین دی", note: "Often supplemented if deficient." },
      { id: "allopurinol", generic: "Allopurinol", persian: "آلوپورینول", note: "For gout, more common with diabetes." },
    ],
  },
];

/** Flat list of every drug with its category, for search/selection. */
export function allDrugs(): { categoryId: string; categoryTitle: string; drug: Drug }[] {
  return MEDICATION_CATALOG.flatMap((c) => c.drugs.map((drug) => ({ categoryId: c.id, categoryTitle: c.title, drug })));
}

export const MED_DISCLAIMER =
  "Doses shown are typical adult REFERENCE values for general orientation — not a prescribing guide. " +
  "Actual dosing must be individualized by a physician (kidney/liver function, comorbidities, glucose targets). " +
  "Educational reference only; not medical advice. Antidiabetics sourced from darooyab.ir; confirm strengths/brands there.";
