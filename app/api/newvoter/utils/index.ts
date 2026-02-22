// ═══════════════════════════════════════════
//  বাংলা → ইংরেজি ডিজিট ম্যাপ
// ═══════════════════════════════════════════

const BANGLA_DIGIT_MAP: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

// ═══════════════════════════════════════════
//  বাংলা ডিজিট → ইংরেজি স্ট্রিং
//  "১২৩" → "123"
// ═══════════════════════════════════════════
export function banglaToEnglishDigits(str: string): string {
  if (!str) return str;
  return str.replace(/[০-৯]/g, (d) => BANGLA_DIGIT_MAP[d] || d);
}

// ═══════════════════════════════════════════
//  বাংলা সিরিয়াল → Number
//  "১২৩" → 123
// ═══════════════════════════════════════════
export function banglaSerialToNumber(serial: string): number {
  const eng = banglaToEnglishDigits(serial).replace(/[^0-9]/g, "");
  return parseInt(eng, 10) || 0;
}

// ═══════════════════════════════════════════
//  বাংলা ভোটার নম্বর → Number
//  "০১২৩৪৫৬৭৮৯" → 123456789
// ═══════════════════════════════════════════
export function banglaVoterNoToNumber(voterNo: string): number {
  const eng = banglaToEnglishDigits(voterNo).replace(/[^0-9]/g, "");
  return parseInt(eng, 10) || 0;
}

// ═══════════════════════════════════════════
//  বাংলা DOB → Date object
//  "০১/০১/১৯৯০" → Date(1990-01-01)
//  "01/01/1990"  → Date(1990-01-01)
// ═══════════════════════════════════════════
export function banglaDOBToDate(dob: string): Date {
  const eng = banglaToEnglishDigits(dob);

  // ফরম্যাট: DD/MM/YYYY বা DD-MM-YYYY
  const parts = eng.split(/[\/\-\.]/);

  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS month 0-indexed
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // fallback: direct parse
  const fallback = new Date(eng);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}


export interface VillageOption {
  id: string;
  name: string;
}

export const VILLAGES_NAME_NEW: string[] = [

  "বলরামপুর",
  "রামপুর",
  "চৌঘাটা",
  "ভগবতীতলা",
  "আন্দুলিয়া",
  "ছিলুমবাড়িয়া",
  "জিরাট",
  "ঘোড়াগাছা",
  "শ্রীপদ্দী",
  "রুপদিয়া",
  "হাটবিলা",
  "শাখারী গাতী",
  "চাউলিয়া",
  "গোপালপুর",
  "নরেন্দ্রপুর (১নং ওয়ার্ড অংশ)",
  "নরেন্দ্রপুর (২নং ওয়ার্ড অংশ)",
  "নরেন্দ্রপুর (৩নং ওয়ার্ড অংশ)"
  ,"নরেন্দ্রপুর"
];

// VILLAGES_NAME থেকে VillageOption[] তৈরি
// id = name (গ্রামের নামই Ward হিসেবে API তে যাবে)
export const VILLAGES_NEW: VillageOption[] = VILLAGES_NAME_NEW.map((name) => ({
  id: name,
  name: name,
}));