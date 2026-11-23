import {account,handle,isAdmin,result} from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){return handle(async()=>{const user=await account();return result({userId:user.userId,isAdmin:isAdmin(user),displayName:user.displayName});});}
