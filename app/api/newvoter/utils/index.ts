import crypto from "crypto";

const banglaDigitMap: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const englishDigitMap: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
};

export function banglaToEnglishDigits(bangla: string): string {
  return bangla.replace(/[০-৯]/g, (m) => banglaDigitMap[m] || m);
}

export function englishToBanglaDigits(english: string): string {
  return english.replace(/[0-9]/g, (m) => englishDigitMap[m] || m);
}

// "০১/০১/২০০১" → Date
export function banglaDOBToDate(banglaDOB: string): Date {
  const eng = banglaToEnglishDigits(banglaDOB);
  const [dd, mm, yyyy] = eng.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
}

// "০৯১২" → 912
export function banglaSerialToNumber(banglaSerial: string): number {
  return parseInt(banglaToEnglishDigits(banglaSerial), 10);
}

// ╔══════════════════════════════════════════════════╗
// ║ userId = MD5 hash of "serialNumber::village"     ║
// ║ দ্রুত single voter lookup এর জন্য               ║
// ╚══════════════════════════════════════════════════╝
export function generateUserId(
  serialNumber: number,
  village: string
): string {
  const raw = `${serialNumber}::${village.trim()}`;
  return crypto.createHash("md5").update(raw).digest("hex");
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
  "আন্দুলিয়া",
  "ছিলুমবাড়ীয়া",
  "জিরাট",
  "ঘোড়াগাছা",
  "শ্রীপদ্দি",
  "রুপদিয়া",
  "হাটবিলা",
  "শাখারী গাতী",
  "চাউলিয়া",
  "গোপালপুর",
  "নরেন্দ্রপুর (১নং ওয়ার্ড অংশ)",
  "নরেন্দ্রপুর (২নং ওয়ার্ড অংশ)",
  "নরেন্দ্রপুর (৩নং ওয়ার্ড অংশ)",
    "নরেন্দ্রপুর",
];

// VILLAGES_NAME থেকে VillageOption[] তৈরি
// id = name (গ্রামের নামই Ward হিসেবে API তে যাবে)
export const VILLAGES_NEW: VillageOption[] = VILLAGES_NAME_NEW.map((name) => ({
  id: name,
  name: name,
}));