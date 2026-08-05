import type {NextFunction,Request,Response} from 'express';
import * as service from '../services/medication.service.js';
import {administrationBodySchema,prescriptionBodySchema} from '../validations/medication.validation.js';
export async function listPrescriptions(req:Request,res:Response,next:NextFunction){try{res.json(await service.listPrescriptions(req.query))}catch(e){next(e)}}
export async function listDoses(req:Request,res:Response,next:NextFunction){try{res.json(await service.listDoses(req.query))}catch(e){next(e)}}
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await service.createPrescription(prescriptionBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function activate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setPrescriptionActive(String(req.params.id),true))}catch(e){next(e)}}
export async function suspend(req:Request,res:Response,next:NextFunction){try{res.json(await service.setPrescriptionActive(String(req.params.id),false))}catch(e){next(e)}}
export async function administer(req:Request,res:Response,next:NextFunction){try{res.json(await service.administerDose(String(req.params.id),administrationBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function stats(_req:Request,res:Response,next:NextFunction){try{res.json(await service.medicationStats())}catch(e){next(e)}}
