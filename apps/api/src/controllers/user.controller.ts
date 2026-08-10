import type { NextFunction,Request,Response } from 'express';
import * as service from '../services/user.service.js';
import { userCreateSchema,userUpdateSchema } from '../validations/auth.validation.js';

export async function list(_req:Request,res:Response,next:NextFunction){try{res.json(await service.listUsers())}catch(e){next(e)}}
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await service.createUser(userCreateSchema.parse(req.body)))}catch(e){next(e)}}
export async function update(req:Request,res:Response,next:NextFunction){try{res.json(await service.updateUser(String(req.params.id),userUpdateSchema.parse(req.body)))}catch(e){next(e)}}
export async function deactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setUserActive(String(req.params.id),false,String((req as any).user?.id??''))}catch(e){next(e)}}
export async function reactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setUserActive(String(req.params.id),true,String((req as any).user?.id??''))}catch(e){next(e)}}
