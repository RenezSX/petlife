import type { NextFunction,Request,Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

type TokenPayload={sub:string;name:string;email:string;role:string};

export function authRequired(req:Request,res:Response,next:NextFunction){
  const header=req.headers.authorization;
  const token=header?.startsWith('Bearer ')?header.slice(7):null;
  if(!token){res.status(401).json({message:'Autenticação necessária.'});return}
  try{
    const payload=jwt.verify(token,env.JWT_SECRET) as TokenPayload;
    (req as any).user={id:String(payload.sub),name:payload.name,email:payload.email,role:payload.role};
    next();
  }catch{
    res.status(401).json({message:'Sessão inválida ou expirada.'});
  }
}

export function requireRole(...roles:string[]){
  return (req:Request,res:Response,next:NextFunction)=>{
    const user=(req as any).user;
    if(!user||!roles.includes(user.role)){res.status(403).json({message:'Você não possui permissão para esta operação.'});return}
    next();
  };
}
