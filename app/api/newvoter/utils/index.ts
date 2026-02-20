const banglaDigitMap: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const englishDigitMap: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
};

// বাংলা → ইংরেজি: "০৫/১২/১৯৯৫" → "05/12/1995"
export function banglaToEnglishDigits(bangla: string): string {
  return bangla.replace(/[০-৯]/g, (m) => banglaDigitMap[m] || m);
}

// ইংরেজি → বাংলা: "05/12/1995" → "০৫/১২/১৯৯৫"
export function englishToBanglaDigits(english: string): string {
  return english.replace(/[0-9]/g, (m) => englishDigitMap[m] || m);
}

// বাংলা তারিখ "০১/০১/২০০১" → Date object
export function banglaDOBToDate(banglaDOB: string): Date {
  const eng = banglaToEnglishDigits(banglaDOB);
  const [dd, mm, yyyy] = eng.split("/");
  return new Date(`${yyyy}-${mm}-${dd}`);
}

// বাংলা সিরিয়াল "০৯১২" → 912
export function banglaSerialToNumber(banglaSerial: string): number {
  return parseInt(banglaToEnglishDigits(banglaSerial), 10);
}


export interface VillageOption {
  id: string;
  name: string;
}

export const VILLAGES_NAME_NEW: string[] = [
  "নরেন্দ্রপুর",
  "বলরামপুর",
  "রামপুর",
  "চৌঘাটা",
  "ভগবতীতলা",
  "আন্দুলিয়া",
  "ছিলুমবাড়ীয়া",
  "জিরাট",
  "ঘেড়াগাছা",
  "শ্রীপদ্দি",
  "রুপদিয়া",
  "হাটবিলা",
  "শাখারী গাতী",
  "চাউলিয়া",
  "গোপালপুর",
  "নরেন্দ্রপুর (১নং ওয়ার্ড অংশ)",
  "নরেন্দ্রপুর (২নং ওয়ার্ড অংশ)",
  "নরেন্দ্রপুর (৩নং ওয়ার্ড অংশ)"
];

// VILLAGES_NAME থেকে VillageOption[] তৈরি
// id = name (গ্রামের নামই Ward হিসেবে API তে যাবে)
export const VILLAGES_NEW: VillageOption[] = VILLAGES_NAME_NEW.map((name) => ({
  id: name,
  name: name,
}));