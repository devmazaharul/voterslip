import { connectDB } from '@/lib/db';
import VoterData from '@/lib/model/votersData';
import VoterStats from '@/lib/model/voterStats';
import { NextRequest, NextResponse } from 'next/server';

// ╔══════════════════════════════════════╗
// ║          CONSTANTS                   ║
// ╚══════════════════════════════════════╝

const EXTERNAL_URL = 'https://vapi.aesysit.com/api/Data/GetVoterInfoListByNameDOBWard';

const DEFAULT_ID = 'kFdQLyS4tZM6ZzrbP4qlpg==:cVnDB/htIYd0eMY6OExRyg==';
// ╔══════════════════════════════════════╗
// ║          TYPES                       ║
// ╚══════════════════════════════════════╝

interface ExternalVoter {
    Name: string | null;
    DOB_Bangla: string | null;
    Serial: string | number | null;
    Voter_No: string | number | null;
    Village: string | null;
    Mother: string | null;
    Husband_Father: string | null;
    CenterName: string | null;
}

interface ExternalAPIResponse {
    IsSuccess: boolean;
    Message?: string;
    Data?: {
        data?: ExternalVoter[];
    };
}

interface CleanedVoter {
    name: string;
    dateOfBirth: string;
    serialNumber: number;
    voterNumber: number;
    village: string;
    motherName: string;
    fatherOrHusbandName: string;
    pollingCenter: string;
}

interface DBStats {
    total: number;
    newSaved: number;
    existing: number;
}

// ╔══════════════════════════════════════╗
// ║       HELPER → API Response         ║
// ╚══════════════════════════════════════╝

function apiResponse(
    status: number,
    success: boolean,
    message: string,
    data: unknown[] = [],
    meta?: Record<string, unknown>,
) {
    return NextResponse.json(
        {
            success,
            message,
            data,
            ...(meta && { meta }),
        },
        { status },
    );
}

// ╔══════════════════════════════════════╗
// ║   HELPER → বাংলা সংখ্যা → ইংরেজি   ║
// ╚══════════════════════════════════════╝

function banglaToEnglishDigits(str: string): string {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let result = str;
    banglaDigits.forEach((bd, i) => {
        result = result.replace(new RegExp(bd, 'g'), String(i));
    });
    return result;
}

// ╔══════════════════════════════════════╗
// ║   HELPER → বাংলা DOB → Date Object  ║
// ║   "১৯৯০-০১-১৫" → Date              ║
// ╚══════════════════════════════════════╝

function banglaDOBToDate(dob: string): Date | null {
    try {
        const englishDOB = banglaToEnglishDigits(dob.trim());
        // Handle formats: "YYYY-MM-DD" or "DD/MM/YYYY" or "DD-MM-YYYY"
        let dateStr = englishDOB;

        if (englishDOB.includes('/')) {
            const parts = englishDOB.split('/');
            if (parts.length === 3) {
                dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date;
    } catch {
        return null;
    }
}

// ╔══════════════════════════════════════╗
// ║   HELPER → Safe Number Convert      ║
// ╚══════════════════════════════════════╝

function toSafeNumber(val: string | number | null | undefined): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const cleaned = banglaToEnglishDigits(String(val).trim());
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
}

// ╔══════════════════════════════════════╗
// ║   HELPER → Clean External Voter     ║
// ╚══════════════════════════════════════╝

function cleanVoter(raw: ExternalVoter): CleanedVoter {
    return {
        name: (raw.Name || 'অজানা').trim(),
        dateOfBirth: (raw.DOB_Bangla || '').trim(),
        serialNumber: toSafeNumber(raw.Serial),
        voterNumber: toSafeNumber(raw.Voter_No),
        village: (raw.Village || 'অজানা').trim(),
        motherName: (raw.Mother || 'Unknown').trim(),
        fatherOrHusbandName: (raw.Husband_Father || 'Unknown').trim(),
        pollingCenter: (raw.CenterName   || 'অজানা').trim(),
    };
}

// ╔══════════════════════════════════════════════╗
// ║            POST HANDLER                      ║
// ╚══════════════════════════════════════════════╝

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { DOB, Ward, Identification } = body;

        // ──────────────────────────
        //  Validation
        // ──────────────────────────

        if (!DOB || !Ward) {
            return apiResponse(
                400,
                false,
                'ভাই, DOB আর Ward না দিলে ভোটার কোথায় খুঁজবো? আকাশে? ☁️🤷‍♂️',
            );
        }

        const dobDate = banglaDOBToDate(DOB);

        if (!dobDate || isNaN(dobDate.getTime())) {
            return apiResponse(400, false, 'এটা কোন গ্রহের জন্মতারিখ ভাই? 🪐 ঠিকমতো DOB দাও!');
        }

        // ╔══════════════════════════════════════════════════╗
        // ║  STEP 1 → আগে ঘরে (DB) খোঁজো! 🏠              ║
        // ║  village = Ward (একই field)                     ║
        // ║  পাওয়া গেলে বাইরে যেতে হবে না                   ║
        // ╚══════════════════════════════════════════════════╝

        try {
            await connectDB();

            const dbVoters = await VoterData.find({
                dateOfBirth: dobDate,
                village: Ward,
            }).lean();

            if (dbVoters.length > 0) {
                trackSearch(Ward, 'db', dbVoters.length);

                console.log(`✅ DB  ${dbVoters.length} জন পাওয়া গেছে! API call বাঁচলো 💰`);

                return apiResponse(
                    200,
                    true,
                    `🎯 ${dbVoters.length} জন ভোটার ডাটাবেসেই ঘাপটি মেরে ছিল! External API ডাকতে হয়নি 😎`,
                    dbVoters,
                    {
                        source: 'database',
                        count: dbVoters.length,
                    },
                );
            }

            console.log('User not found in DB, calling external API...');
        } catch (dbCheckErr) {
            console.error('when checking DB for existing voters:', dbCheckErr);
            // DB fail হলেও API try করবো — থেমে যাবো না
        }

        // ╔══════════════════════════════════════════════╗
        // ║  STEP 2 → DB তে নেই, External API Call 🌐   ║
        // ╚══════════════════════════════════════════════╝

        if (!EXTERNAL_URL) {
            return apiResponse(500, false, 'External API URL সেট করা হয়নি! 🤦‍♂️ .env চেক করো ভাই');
        }

        let externalRes: Response;

        try {
            externalRes = await fetch(EXTERNAL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    DOB,
                    Ward,
                    Identification: Identification || DEFAULT_ID,
                }),
                signal: AbortSignal.timeout(15000),
            });
        } catch (fetchErr) {
            console.error('❌ External API ধরা যাচ্ছে না:', fetchErr);
            return apiResponse(
                502,
                false,
                'External API গভীর ঘুমে! 😴 জাগাতে পারছি না, ৫ মিনিট পর আবার চেষ্টা করো',
                [],
                { source: 'api_timeout' },
            );
        }

        if (!externalRes.ok) {
            return apiResponse(
                502,
                false,
                `External API মেজাজ খারাপ করেছে! 😤 বললো: ${externalRes.status} ${externalRes.statusText}`,
                [],
                { source: 'api_error' },
            );
        }

        let externalData: ExternalAPIResponse;

        try {
            externalData = await externalRes.json();
        } catch {
            return apiResponse(
                502,
                false,
                'External API অদ্ভুত ভাষায় কথা বলছে! 👽 JSON বোঝা যাচ্ছে না',
                [],
                { source: 'api_parse_error' },
            );
        }

        if (!externalData.IsSuccess) {
            return apiResponse(
                400,
                false,
                externalData.Message || "External API হাত তুলে বললো 'না!' 🙅‍♂️ কারণ জানায়নি",
                [],
                { source: 'api_failure' },
            );
        }

        const rawVoters: ExternalVoter[] = externalData.Data?.data ?? [];

        if (rawVoters.length === 0) {
            return apiResponse(
                200,
                true,
                'এই জন্মদিনে কোনো ভোটার খুঁজে পাওয়া যায়নি! 🎂🤔 তারিখ ঠিক আছে তো?',
                [],
                { source: 'api' },
            );
        }

        // ╔══════════════════════════════════════╗
        // ║  STEP 3 → Clean + Convert           ║
        // ╚══════════════════════════════════════╝

    

        const cleanedVoters = rawVoters.map(cleanVoter);

        // ╔══════════════════════════════════════════════════╗
        // ║  STEP 4 → DB তে নতুনদের সেভ করো 💾              ║
        // ║  village = Ward (একই field)                     ║
        // ╚══════════════════════════════════════════════════╝

        let dbStats: DBStats = { total: 0, newSaved: 0, existing: 0 };

        try {
            await connectDB();

            const voterDocs = cleanedVoters.map((cv) => ({
                name: cv.name,
                dateOfBirth: banglaDOBToDate(cv.dateOfBirth),
                serialNumber: cv.serialNumber,
                voterNumber: cv.voterNumber,
                village: Ward, // ← Ward কেই village হিসেবে সেভ করো
                motherName: cv.motherName,
                fatherOrHusbandName: cv.fatherOrHusbandName,
                pollingCenter: cv.pollingCenter,
                addedBy: 'system' as const,
            }));

            // ── voterNumber দিয়ে duplicate check ──
            const allVoterNumbers = voterDocs.map((d) => d.voterNumber);

            const existingVoters = await VoterData.find(
                { voterNumber: { $in: allVoterNumbers } },
                { voterNumber: 1 },
            ).lean();

            const existingSet = new Set(existingVoters.map((e) => e.voterNumber as number));

            const newVoters = voterDocs.filter((d) => !existingSet.has(d.voterNumber));

            if (newVoters.length > 0) {
                await VoterData.insertMany(newVoters, { ordered: false });
            }

            dbStats = {
                total: voterDocs.length,
                newSaved: newVoters.length,
                existing: existingSet.size,
            };

            console.log(
                `📊 মোট: ${dbStats.total} | নতুন সেভ: ${dbStats.newSaved} | আগেই ছিল: ${dbStats.existing}`,
            );
        } catch (dbErr: unknown) {
            if (
                dbErr instanceof Error &&
                'code' in dbErr &&
                (dbErr as { code: number }).code === 11000
            ) {
                console.log('ℹ️ কিছু ভোটার আগেই DB তে ছিল, skip! 🏃‍♂️');
            } else {
                console.error('⚠️ DB সেভ করতে গিয়ে পা পিছলে গেছে:', dbErr);
            }
        }

        // ╔══════════════════════════════════════╗
        // ║  STEP 5 → Final Response 🎉         ║
        // ╚══════════════════════════════════════╝

        const successMsg =
            dbStats.newSaved > 0
                ? `🎉 ${cleanedVoters.length} জন ভোটার ধরা পড়েছে! ${dbStats.newSaved} জন নতুন DB তে ঢুকলো 💾`
                : `🎉 ${cleanedVoters.length} জন ভোটার পাওয়া গেছে! সবাই আগেই DB তে ছিল 😏`;

        trackSearch(Ward, 'api', cleanedVoters.length);

        return apiResponse(200, true, successMsg, cleanedVoters, {
            source: 'external_api',
            db: dbStats,
        });
    } catch (error: unknown) {
        console.error('❌ সব কিছু উল্টে গেছে:', error);
        return apiResponse(
            500,
            false,
            'সার্ভারের মাথা গরম হয়ে গেছে! 🤕🔥 একটু ঠান্ডা হতে দাও, চা খেয়ে আবার আসো ☕',
        );
    }
}

async function trackSearch(village: string, source: 'db' | 'api', resultsCount: number) {
    try {
        await VoterStats.findOneAndUpdate(
            { village },
            {
                $inc: {
                    totalChecks: 1,
                    totalResultsServed: resultsCount,
                    ...(source === 'db' ? { fromDB: 1 } : { fromAPI: 1 }),
                },
                $set: { lastCheckedAt: new Date() },
            },
            { upsert: true }, // না থাকলে নতুন বানাবে
        );
    } catch (err) {
        console.error('📊 Stats update fail:', err);
        // Stats fail হলেও main response আটকাবে না
    }
}
