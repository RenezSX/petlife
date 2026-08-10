import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type Input = {
  fileName:string;
  mimeType:string;
  sizeBytes:number;
  dataUrl:string;
  description?:string;
  category?:string;
  professionalId?:string;
};

const clean=(value?:string)=>value?.trim()||null;

export async function listHospitalizationAttachments(hospitalizationId:string) {
  const hospitalization = await prisma.hospitalization.findUnique({ where:{ id:hospitalizationId } });
  if (!hospitalization) throw new AppError(404,'Internação não encontrada.');

  return prisma.clinicalAttachment.findMany({
    where:{ hospitalizationId },
    select:{
      id:true, animalId:true, hospitalizationId:true, professionalId:true, professionalName:true,
      fileName:true, mimeType:true, sizeBytes:true, dataUrl:true, description:true, category:true, createdAt:true,
    },
    orderBy:{ createdAt:'desc' },
  });
}

export async function createHospitalizationAttachment(hospitalizationId:string,data:Input) {
  const hospitalization = await prisma.hospitalization.findUnique({
    where:{ id:hospitalizationId },
    select:{ id:true, animalId:true },
  });
  if (!hospitalization) throw new AppError(404,'Internação não encontrada.');

  let professionalId:string|null = null;
  let professionalName:string|null = null;
  if (data.professionalId) {
    const professional = await prisma.professional.findUnique({ where:{ id:data.professionalId } });
    if (!professional || !professional.active) throw new AppError(400,'Selecione um profissional ativo.');
    professionalId = professional.id;
    professionalName = professional.name;
  }

  return prisma.clinicalAttachment.create({
    data:{
      animalId:hospitalization.animalId,
      hospitalizationId,
      professionalId,
      professionalName,
      fileName:data.fileName.trim(),
      mimeType:data.mimeType.trim(),
      sizeBytes:data.sizeBytes,
      dataUrl:data.dataUrl,
      description:clean(data.description),
      category:data.category ?? 'OTHER',
    },
  });
}

export async function deleteHospitalizationAttachment(hospitalizationId:string,attachmentId:string) {
  const attachment = await prisma.clinicalAttachment.findFirst({
    where:{ id:attachmentId, hospitalizationId },
  });
  if (!attachment) throw new AppError(404,'Anexo não encontrado.');
  await prisma.clinicalAttachment.delete({ where:{ id:attachmentId } });
  return { message:'Anexo removido com sucesso.' };
}
