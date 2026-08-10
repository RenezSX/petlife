import type { NextFunction,Request,Response } from 'express';
import * as service from '../services/animal.service.js'; import { animalBodySchema,animalListQuerySchema } from '../validations/animal.validation.js'; import { animalPhotoSchema } from '../validations/attachment.validation.js';
export async function list(req:Request,res:Response,next:NextFunction){try{const q=animalListQuerySchema.parse(req.query);res.json(await service.listAnimals(q.search,q.species,q.tutorId,q.page,q.pageSize,q.status));}catch(e){next(e)}}
export async function get(req:Request,res:Response,next:NextFunction){try{res.json(await service.getAnimal(req.params.id))}catch(e){next(e)}}
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await service.createAnimal(animalBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function update(req:Request,res:Response,next:NextFunction){try{res.json(await service.updateAnimal(req.params.id,animalBodySchema.parse(req.body)))}catch(e){next(e)}}
export async function deactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setAnimalActive(req.params.id,false))}catch(e){next(e)}}
export async function reactivate(req:Request,res:Response,next:NextFunction){try{res.json(await service.setAnimalActive(req.params.id,true))}catch(e){next(e)}}

export async function updatePhoto(req:Request,res:Response,next:NextFunction){try{const body=animalPhotoSchema.parse(req.body);res.json(await service.updateAnimalPhoto(req.params.id,body.dataUrl))}catch(e){next(e)}}
export async function removePhoto(req:Request,res:Response,next:NextFunction){try{res.json(await service.updateAnimalPhoto(req.params.id,null))}catch(e){next(e)}}

export async function identify(req:Request,res:Response,next:NextFunction){
  try{res.json(await service.identifyAnimal(String(req.params.code)))}catch(e){next(e)}
}
