// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TOKEN_NAME, verifyToken } from "../../utils";
import AdminUser from "@/lib/model/adminUser";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    await connectDB();
    const user = await AdminUser.findOne({
      _id: payload.id,
      "deviceLogs.sessionToken": token,  
    });

    if (!user) return null;  

    return payload;
  } catch {
    return null;
  }
}



export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token nai" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);


    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }
 
    const userIfo=await AdminUser.findById(payload.id)
    if(!userIfo) {
       return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }


    return NextResponse.json(
      {
        success: true,
        user: {
          userId: payload.id,
          phoneNumber: payload.phoneNumber,
          name:userIfo.name
          
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 401 }
    );
  }
}




