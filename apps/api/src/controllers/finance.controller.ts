import type {NextFunction,Request,Response} from 'express';import * as s from '../services/finance.service.js';import{financeBodySchema}from'../validations/finance.validation.js';
export async function list(req:Request,res:Response,next:NextFunction){try{res.json(await s.listFinance(req.query))}catch(e){next(e)}}
export async function stats(req:Request,res:Response,next:NextFunction){try{res.json(await s.financeStats(String(req.query.month??'')))}catch(e){next(e)}}
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await s.createFinance(financeBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function update(req:Request,res:Response,next:NextFunction){try{res.json(await s.updateFinance(String(req.params.id),financeBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function remove(req:Request,res:Response,next:NextFunction){try{res.json(await s.removeFinance(String(req.params.id)))}catch(e){next(e)}}
