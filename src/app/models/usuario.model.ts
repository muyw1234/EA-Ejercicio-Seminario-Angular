export interface Usuario {
  _id: string;
  name: string;
  organizacion: Usuario | string;
  createdAt?: string;
  updatedAt?: string;
}