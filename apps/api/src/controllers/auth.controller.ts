import type { NextFunction,Request,Response } from 'express';
import * as service from '../services/auth.service.js';
import { loginSchema } from '../validations/auth.validation.js';

export async function login(req:Request,res:Response,next:NextFunction){
  try{const body=loginSchema.parse(req.body);res.json(await service.login(body.email,body.password))}catch(e){next(e)}
}
export async function me(req:Request,res:Response,next:NextFunction){
  try{res.json(await service.getAuthenticatedUser(String((req as any).user?.id??'')))}catch(e){next(e)}
}
