import { Usuario } from './usuario.model';

export interface Organizacion {
  _id: string;
  name: string;
  // Lista de usuarios asociados a esta organización
  usuarios: Usuario[]; 
}