import type { NextFunction, Request, Response } from 'express';
import * as service from '../services/document.service.js';
export async function options(_req:Request,res:Response,next:NextFunction){try{res.json(await service.documentOptions())}catch(e){next(e)}}
export async function get(req:Request,res:Response,next:NextFunction){try{res.json(await service.getDocumentData(String(req.params.id)))}catch(e){next(e)}}
