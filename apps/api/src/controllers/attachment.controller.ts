import type { NextFunction,Request,Response } from 'express';
import * as service from '../services/attachment.service.js';
import { attachmentBodySchema } from '../validations/attachment.validation.js';

export async function list(req:Request,res:Response,next:NextFunction){
  try{res.json(await service.listHospitalizationAttachments(String(req.params.id)))}catch(error){next(error)}
}
export async function create(req:Request,res:Response,next:NextFunction){
  try{res.status(201).json(await service.createHospitalizationAttachment(String(req.params.id),attachmentBodySchema.parse(req.body)))}catch(error){next(error)}
}
export async function remove(req:Request,res:Response,next:NextFunction){
  try{res.json(await service.deleteHospitalizationAttachment(String(req.params.id),String(req.params.attachmentId)))}catch(error){next(error)}
}
