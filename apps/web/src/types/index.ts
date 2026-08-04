export type User={id:string;name:string;email:string;role:'ADMIN'|'VETERINARIAN'|'ASSISTANT'|'RECEPTIONIST'};
export type RecentHospitalization={id:string;animal:string;species:string;tutor:string;bed:string;status:string;priority:string;admittedAt:string};
export type DashboardData={metrics:{hospitalized:number;critical:number;pendingProcedures:number;pendingMedications:number};recent:RecentHospitalization[]};
export type Pagination={page:number;pageSize:number;total:number;totalPages:number};
export type Tutor={id:string;name:string;cpf:string|null;phone:string;whatsapp:string|null;email:string|null;address:string|null;notes:string|null;active:boolean;createdAt:string;updatedAt:string;_count?:{animals:number};animals?:Animal[]};
export type TutorOption={id:string;name:string;phone:string};
export type Animal={id:string;name:string;species:string;breed:string|null;sex:string|null;birthDate:string|null;approximateAge:string|null;weight:number|null;color:string|null;microchip:string|null;neutered:boolean;allergies:string|null;previousDiseases:string|null;continuousMedications:string|null;notes:string|null;photoUrl:string|null;active:boolean;tutorId:string;tutor:{id:string;name:string;phone:string};createdAt:string;updatedAt:string};
export type Paginated<T>={items:T[];pagination:Pagination};
