import type { NextFunction,Request,Response } from 'express';
import * as service from '../services/tutor.service.js'; import { listQuerySchema,tutorBodySchema } from '../validations/tutor.validation.js';
export async function list(req:Request,res:Response,next:NextFunction){try{const q=listQuerySchema.parse(req.query);res.json(await service.listTutors(q.search,q.page,q.pageSize,q.status));}catch(e){next(e)}}
export async function options(_req:Request,res:Response,next:NextFunction){try{res.json(await service.listTutorOptions())}catch(e){next(e)}}
export async function get(req:Request,res:Response,next:NextFunction){try{res.json(await service.getTutor(req.params.id))}catch(e){next(e)}}
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await service.createTutor(tutorBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function update(req:Request,res:Response,next:NextFunction){try{res.json(await service.updateTutor(req.params.id,tutorBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function deactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setTutorActive(req.params.id,false))}catch(e){next(e)}}
export async function reactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setTutorActive(req.params.id,true))}catch(e){next(e)}}
