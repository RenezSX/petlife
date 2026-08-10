import type { NextFunction,Request,Response } from 'express';
import * as service from '../services/inventory.service.js';
import { inventoryItemSchema,inventoryMovementSchema } from '../validations/inventory.validation.js';

export async function list(req:Request,res:Response,next:NextFunction){try{res.json(await service.listInventory(req.query))}catch(e){next(e)}}
export async function stats(_req:Request,res:Response,next:NextFunction){try{res.json(await service.inventoryStats())}catch(e){next(e)}}
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await service.createInventoryItem(inventoryItemSchema.parse(req.body)))}catch(e){next(e)}}
export async function update(req:Request,res:Response,next:NextFunction){try{res.json(await service.updateInventoryItem(String(req.params.id),inventoryItemSchema.parse(req.body)))}catch(e){next(e)}}
export async function deactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setInventoryActive(String(req.params.id),false))}catch(e){next(e)}}
export async function reactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setInventoryActive(String(req.params.id),true))}catch(e){next(e)}}
export async function movement(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await service.createMovement(String(req.params.id),inventoryMovementSchema.parse(req.body)))}catch(e){next(e)}}
export async function movements(req:Request,res:Response,next:NextFunction){try{res.json(await service.listMovements(String(req.params.id)))}catch(e){next(e)}}

export async function options(_req:Request,res:Response,next:NextFunction){try{res.json(await service.inventoryOptions())}catch(e){next(e)}}
