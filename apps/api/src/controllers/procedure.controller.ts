import type {NextFunction,Request,Response} from 'express';
import * as service from '../services/procedure.service.js';
import {procedureBodySchema,procedureStatusSchema} from '../validations/procedure.validation.js';
export async function list(req:Request,res:Response,next:NextFunction){try{res.json(await service.listProcedures(req.query))}catch(e){next(e)}}
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await service.createProcedure(procedureBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function update(req:Request,res:Response,next:NextFunction){try{res.json(await service.updateProcedure(String(req.params.id),procedureBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function changeStatus(req:Request,res:Response,next:NextFunction){try{res.json(await service.changeProcedureStatus(String(req.params.id),procedureStatusSchema.parse(req.body)))}catch(e){next(e)}}
export async function stats(_req:Request,res:Response,next:NextFunction){try{res.json(await service.procedureStats())}catch(e){next(e)}}

export async function options(_req:Request,res:Response,next:NextFunction){try{res.json(await service.procedureOptions())}catch(e){next(e)}}
