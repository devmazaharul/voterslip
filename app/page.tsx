"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";


interface VoterInfo {
  Id: number;
  Serial: string;
  CenterName: string;
  Name: string;
  Voter_No: string;
  Husband_Father: string;
  Mother: string;
  DOB_Bangla: string;
  AreaName: string;
  Occupation: string | null;
  Address: string | null;
}

interface ApiResponse {
  Data: {
    draw: number;
    recordsFiltered: number;
    recordsTotal: number;
    data: VoterInfo[];
  };
  IsSuccess: boolean;
  Message: string;
}

interface FormData {
  dob: string;   
  union: string; 
}

const villages: string[] = [
  "নরেন্দ্রপুর",
  "বলরামপুর",
  "আন্দুলিয়া",
  "চিলুম্বরী",
  "জিরাত",
  "ঘিওরগাছা",
  "শ্রীপুড়ি",
  "রূপদিয়া",
  "হাটবিলা",
  "শাখারীগাতী",
  "চৌলিয়া",
  "গোপালপুর",
  "রামপুর",
  "চৌঘাটা",
  "ভাগবতীপুর"
];



const engDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const bangDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const toBanglaDigits = (value: string): string =>
  value.replace(/[0-9]/g, (d) => bangDigits[engDigits.indexOf(d)]);

const toEnglishDigits = (value: string): string =>
  value.replace(/[০-৯]/g, (d) => engDigits[bangDigits.indexOf(d)]);

const formatDobBangla = (raw: string): string => {

  let eng = toEnglishDigits(raw).replace(/\D/g, "");
  eng = eng.slice(0, 8); 

  let formatted = eng;

  if (eng.length <= 2) {
    formatted = eng; 
  } else if (eng.length <= 4) {

    formatted = eng.slice(0, 2) + "/" + eng.slice(2);
  } else {

    formatted =
      eng.slice(0, 2) + "/" + eng.slice(2, 4) + "/" + eng.slice(4);
  }

  return toBanglaDigits(formatted);
};

const VoterSearchForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    dob: "",
    union: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string>("");


  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatDobBangla(val);

    setFormData((prev) => ({
      ...prev,
      dob: formatted,
    }));
  };

  const handleUnionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      union: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setApiData(null);


    const dobEng = toEnglishDigits(formData.dob);
    const dobPattern = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!dobPattern.test(dobEng)) {
      setError(
        "জন্ম তারিখ অবশ্যই DD/MM/YYYY ফরম্যাটে দিতে হবে (যেমন: ০৫/১২/১৯৯৫)।"
      );
      return;
    }

    if (!formData.union) {
      setError("গ্রাম নির্বাচন করুন।");
      return;
    }

    setLoading(true);

    const apiUrl =
      "https://vapi.aesysit.com/api/Data/GetVoterInfoListByNameDOBWard";

    try {

      const dobForApi = formData.dob;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          DOB: dobForApi,     
          Ward: formData.union, 
          Identification:
            "kFdQLyS4tZM6ZzrbP4qlpg==:cVnDB/htIYd0eMY6OExRyg==",
        }),
      });

      if (!response.ok) {
        throw new Error(`সার্ভার এরর: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      setApiData(result);
    } catch (err) {
      console.error("API Error:", err);
      setError("তথ্য লোড করতে সমস্যা হয়েছে অথবা সার্ভার রেসপন্স করছে না।");
    } finally {
      setLoading(false);
    }
  };

  const isDobValid = /^\d{2}\/\d{2}\/\d{4}$/.test(
    toEnglishDigits(formData.dob || "")
  );
  const canSubmit = !loading && isDobValid && !!formData.union;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 text-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">

        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/80 overflow-hidden">

          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-100 via-white to-sky-100 px-6 py-5 md:px-8 md:py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-600 mb-1">
                  Jashore Sadar • Voter Lookup
                </p>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                  ভোটার তথ্য অনুসন্ধান
                </h1>
                <p className="text-[13px] md:text-sm text-slate-700 mt-1">
                  জন্ম তারিখ (DD/MM/YYYY) এবং গ্রাম নির্বাচন করে আপনার ভোটকেন্দ্রসহ অন্যান্য তথ্য দেখুন।
                </p>
              </div>
              <div className="hidden md:flex flex-col items-end text-right text-xs">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-300 font-semibold">
                  যশোর সদর • ১৪ নং ইউনিয়ন
                </span>
              
              </div>
            </div>
          </div>


          <div className="px-5 md:px-8 py-5 md:py-6 space-y-6">

            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 md:px-5 md:py-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  অনুসন্ধান তথ্য প্রদান করুন
                </h2>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  সিকিউর • এনক্রিপটেড
                </span>
              </div>

              <form
                onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_auto] gap-3 md:gap-4 items-start"

              >

                <div>
                  <label
                    htmlFor="dob"
                    className="block text-xs font-medium text-slate-800 mb-1.5"
                  >
                    জন্ম তারিখ (DD/MM/YYYY)
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="text"
                    value={formData.dob}
                    onChange={handleDobChange}
                    placeholder="উদাহরণ: ০৫/১২/১৯৯৫"
                    autoComplete="off"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    ফরম্যাট:{" "}
                    <span className="font-semibold text-emerald-700">
                      DD/MM/YYYY
                    </span>{" "}
                    (বাংলা সংখ্যা, যেমন: ০৫/১২/১৯৯৫)
                  </p>
                </div>


                <div>
                  <label
                    htmlFor="union"
                    className="block text-xs font-medium text-slate-800 mb-1.5"
                  >
                     ১৪ নং ইউনিয়ন - নরেন্দ্রপুর
                  </label>
                  <select
                    id="union"
                    name="union"
                    value={formData.union}
                    onChange={handleUnionChange}
                    required
                    className="w-full px-3 cursor-pointer py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  >
                    <option className="cursor-pointer" value="">-- গ্রাম নির্বাচন করুন --</option>
                    {villages.map((v) => (
                      <option  key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="md:pl-1">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full px-4 mt-4 cursor-pointer py-2.5 rounded-lg text-[13px] md:text-sm font-semibold tracking-wide shadow-md transition
                      ${
                        !canSubmit
                          ? "bg-emerald-200 text-emerald-800 cursor-not-allowed"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
                      }`}
                  >
                    {loading ? "অনুসন্ধান চলছে..." : "তথ্য খুঁজুন"}
                  </button>
                </div>
                
              </form>


              {error && (
                <div className="mt-3 text-[11px] rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2">
                  {error}
                </div>
              )}


              <p className="mt-2 text-[11px] text-slate-500">
                যেমন জন্ম তারিখ যদি হয় 5 December 1995, লিখুন{" "}
                <span className="font-semibold text-emerald-700">
                  ০৫/১২/১৯৯৫
                </span>
                ।
              </p>
            </div>


            {(formData.dob || formData.union) && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <span className="uppercase tracking-[0.2em] text-slate-400">
                  বর্তমান সিলেকশন
                </span>
                {formData.dob && (
                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-emerald-700">
                    DOB: <span className="font-semibold">{formData.dob}</span>
                  </span>
                )}
                {formData.union && (
                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-emerald-700">
                    গ্রাম:{" "}
                    <span className="font-semibold">{formData.union}</span>
                  </span>
                )}
              </div>
            )}


            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 md:px-5 md:py-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  অনুসন্ধানের ফলাফল
                </h2>
                {apiData && (
                  <span className="text-[11px] text-slate-600">
                    মোট রেকর্ড:{" "}
                    <span className="font-semibold text-emerald-700">
                      {apiData.Data.recordsFiltered}
                    </span>
                  </span>
                )}
              </div>

              {!apiData && !loading && (
                <div className="text-sm text-slate-500 text-center py-10">
                  ফর্ম পূরণ করে{" "}
                  <span className="font-semibold text-emerald-700">
                    “তথ্য খুঁজুন”
                  </span>{" "}
                  চাপলে এখানে ফলাফল দেখা যাবে।
                </div>
              )}

              {loading && (
                <div className="text-sm text-emerald-700 text-center py-10">
                  ডাটা লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
                </div>
              )}

              {apiData && !loading && (
                <>
                  {apiData.IsSuccess ? (
                    apiData.Data.data.length > 0 ? (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {apiData.Data.data.map((voter) => (
                          <div
                            key={voter.Id}
                            className="bg-white border border-emerald-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100 transition"
                          >
      
                            <div className="flex justify-between items-start border-b border-slate-200 pb-2.5 mb-3">
                              <div>
                                <h3 className="text-base md:text-lg font-bold text-emerald-800">
                                  {voter.Name}
                                </h3>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  সিরিয়াল নং:{" "}
                                  <span className="font-semibold">
                                    {voter.Serial}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="block text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                                  ভোটার নং
                                </span>
                                <span className="text-lg font-mono font-bold text-emerald-700">
                                  {voter.Voter_No}
                                </span>
                              </div>
                            </div>

    
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] text-slate-700">
                              <p>
                                <span className="font-semibold text-slate-900">
                                  পিতা/স্বামী:
                                </span>{" "}
                                {voter.Husband_Father}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-900">
                                  মাতা:
                                </span>{" "}
                                {voter.Mother}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-900">
                                  জন্ম তারিখ:
                                </span>{" "}
                                {voter.DOB_Bangla}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-900">
                                  এলাকা:
                                </span>{" "}
                                {voter.AreaName}
                              </p>
                            </div>


                            <div className="mt-3 pt-2.5 border-t border-slate-200 bg-emerald-50 -mx-4 -mb-4 px-4 py-2 rounded-b-xl text-[11px] text-slate-800">
                              <span className="font-semibold text-emerald-800">
                                ভোট কেন্দ্র:
                              </span>{" "}
                              {voter.CenterName}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-6 text-center">
                        দুঃখিত, প্রদত্ত জন্ম তারিখ ও গ্রাম অনুযায়ী কোনো ভোটার
                        খুঁজে পাওয়া যায়নি।
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-6 text-center">
                      {apiData.Message ||
                        "সার্ভার থেকে সঠিক রেসপন্স পাওয়া যায়নি।"}
                    </div>
                  )}
                </>
              )}
              
            </div>
            <small className="flex items-center gap-1">
  Developed by  
  <a
    href="https://www.mazaharul.site"
    target="_blank"
    rel="noopener noreferrer"
    className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline"
  >
     Mazaharul
  </a>
</small>

          </div>
        </div>
      </div>
   
    </div>
  );
};

export default VoterSearchForm;