import { api } from "../utils/api";

export async function getUser(id){
  const user = await api.get("/api/v1/login/"+id); // Imagine having millions of account. This website has to fetch whole database for whether that user exist in that database or not. You have index=True enabled in users table. will that help? consider it.
  if (!user){
    return;
  }
  return user;
}