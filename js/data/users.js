import { api } from "../utils/api.js";

export async function getUser(id){
  const user = await api.get("/api/v1/login/"+id);
  if (!user){
    return null;
  }
  return user;
}

export async function getUserById(id) {
  return getUser(id);
}

// Exported user collection placeholder for views pending backend migration
export const users = [];