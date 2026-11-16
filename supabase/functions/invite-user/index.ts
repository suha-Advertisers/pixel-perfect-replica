import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const authHeader=req.headers.get("Authorization")??"";const token=authHeader.replace(/^Bearer\s+/i,"");if(!token)return json({error:"Unauthorized"},401);
 const caller=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:userError}=await caller.auth.getUser(token);if(userError||!user)return json({error:"Unauthorized"},401);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:profile}=await admin.from("profiles").select("role_id,is_active").eq("id",user.id).maybeSingle();
 if(!profile?.is_active)return json({error:"Account inactive"},403);
 const {data:grants}=await admin.from("role_permissions").select("permission_key").eq("role_id",profile.role_id);
 if(!(grants??[]).some((x)=>x.permission_key==="users.manage"))return json({error:"Forbidden"},403);
 let body:{email?:string;role_id?:string};try{body=await req.json()}catch{return json({error:"Invalid JSON"},400)}
 const email=String(body.email??"").trim().toLowerCase();const roleId=String(body.role_id??"");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!roleId)return json({error:"أدخل بريداً إلكترونياً صحيحاً ودوراً."},400);
 const {data:role,error:roleError}=await admin.from("roles").select("id,key,name_ar").eq("id",roleId).maybeSingle();if(roleError||!role)return json({error:"الدور غير موجود"},400);
 const {data:actorRole}=await admin.from("roles").select("key").eq("id",profile.role_id).maybeSingle();
 if(role.key==="admin"&&actorRole?.key!=="admin")return json({error:"Only a system admin can invite an administrator"},403);
 const {data:existing}=await admin.from("invitations").select("id").eq("email",email).is("accepted_at",null).gt("expires_at",new Date().toISOString()).limit(1);
 if(existing?.length)return json({error:"توجد دعوة سارية لهذا البريد بالفعل."},409);
 const {data:invite,error:insertError}=await admin.from("invitations").insert({email,role_id:roleId,invited_by:user.id}).select("id").single();if(insertError)return json({error:insertError.message},400);
 const {error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:req.headers.get("origin")??undefined});
 if(inviteError){await admin.from("invitations").delete().eq("id",invite.id);return json({error:inviteError.message},400)}
 return json({success:true,message:"تم إرسال الدعوة بنجاح."});
});
