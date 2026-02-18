import { SignJWT, jwtVerify } from "jose";
export interface VillageOption {
  id: string;
  name: string;
  centerId:string
}
export const VILLAGES: VillageOption[] = [
  { id: '6948', name: 'নরেন্দ্রপুর', centerId: '84081' },
   { id: '6956', name: 'বলরামপুর', centerId: '84089' },
     { id: '6960', name: 'রামপুর', centerId: '84093' },
  { id: '6961', name: 'চৌঘাটা', centerId: '84094' },
  { id: '6962', name: 'ভাগবতিপুর', centerId: '84095' },
  { id: '6949', name: 'আন্দুলিয়া', centerId: '84082' },
  { id: '6950', name: 'ছিলুমবাড়ীয়া', centerId: '84083' },
  { id: '6951', name: 'জিরাট', centerId: '84084' },
  { id: '6952', name: 'ঘেড়াগাছা', centerId: '84085' },
  { id: '6953', name: 'শ্রীপদ্দি', centerId: '84086' },
  { id: '6954', name: 'রুপদিয়া', centerId: '84087' },
  { id: '6955', name: 'হাটবিলা', centerId: '84088' },
  { id: '6957', name: 'শাখারীগাতী', centerId: '84090' },
  { id: '6958', name: 'চাউলিয়া', centerId: '84091' },
  { id: '6959', name: 'গোপালপুর', centerId: '84092' },

];

export const VILLAGES_NAME = [
  "নরেন্দ্রপুর",
  "বলরামপুর",
  "রামপুর",
  "চৌঘাটা",
  "ভাগবতিপুর",
  "আন্দুলিয়া",
  "ছিলুমবাড়ীয়া",
  "জিরাট",
  "ঘেড়াগাছা",
  "শ্রীপদ্দি",
  "রুপদিয়া",
  "হাটবিলা",
  "শাখারীগাতী",
  "চাউলিয়া",
  "গোপালপুর",
];




const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Token create koro
export async function createToken(payload: any): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 din porjonto valid
    .sign(secret);

  return token;
}

// Token verify koro
export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export const TOKEN_NAME="admin-token"
export const MAX_ADMINS_ALLOW=5