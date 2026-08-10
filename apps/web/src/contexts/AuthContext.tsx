import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

type AuthContextValue={
  user:User|null;
  loading:boolean;
  login:(email:string,password:string)=>Promise<void>;
  logout:()=>void;
};

const AuthContext=createContext<AuthContextValue|null>(null);
const TOKEN_KEY='petlife_token';

export function AuthProvider({children}:{children:ReactNode}){
  const[user,setUser]=useState<User|null>(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    const token=localStorage.getItem(TOKEN_KEY);
    if(!token){setLoading(false);return}
    api.get<User>('/auth/me')
      .then(response=>setUser(response.data))
      .catch(()=>{localStorage.removeItem(TOKEN_KEY);setUser(null)})
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const handler=()=>{localStorage.removeItem(TOKEN_KEY);setUser(null)};
    window.addEventListener('petlife:unauthorized',handler);
    return()=>window.removeEventListener('petlife:unauthorized',handler);
  },[]);

  async function login(email:string,password:string){
    const response=await api.post<{token:string;user:User}>('/auth/login',{email,password});
    localStorage.setItem(TOKEN_KEY,response.data.token);
    setUser(response.data.user);
  }

  function logout(){
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  const value=useMemo(()=>({user,loading,login,logout}),[user,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const context=useContext(AuthContext);
  if(!context)throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
