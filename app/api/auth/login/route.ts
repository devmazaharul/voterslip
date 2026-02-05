import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminUser from '@/lib/model/adminUser';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body as { password?: string };

        if (!password) {
            return NextResponse.json({ message: 'Password প্রয়োজন।' }, { status: 400 });
        }

        await connectDB();

        // ফিক্সড username — চাইলে env থেকে পড়তে পারো
        const USERNAME = 'maza26';

        const user = await AdminUser.findOne({ username: USERNAME }).lean();

        if (!user) {
            return NextResponse.json(
                { message: 'Admin user পাওয়া যায়নি। আগে ডাটাবেজে তৈরি করুন।' },
                { status: 404 },
            );
        }

        // ডেমোর জন্য প্লেইন টেক্সট কম্পেয়ার
        if (password !== user.password) {
            return NextResponse.json({ message: 'পাসওয়ার্ড সঠিক নয়।' }, { status: 401 });
        }

        // ✅ লগইন সফল: কুকি সেট
        const res = NextResponse.json({ message: 'লগইন সফল হয়েছে।' }, { status: 200 });

        res.cookies.set('admin_logged_in', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 8, // ৮ ঘন্টা
        });

        return res;
    } catch (err: any) {
        console.error('POST /api/auth/login error:', err?.message || err);
        return NextResponse.json({ message: 'ইন্টারনাল সার্ভার এরর হয়েছে।' }, { status: 500 });
    }
}
