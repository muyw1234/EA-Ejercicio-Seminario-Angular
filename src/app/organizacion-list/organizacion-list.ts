import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionService } from '../services/organizacion.service';
import { UsuarioService } from '../services/usuario.service';
import { Organizacion } from '../models/organizacion.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { Usuario } from '../models/usuario.model';


@Component({
  selector: 'app-organizacion-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './organizacion-list.html',
  styleUrls: ['./organizacion-list.css'],
})
export class OrganizacionList implements OnInit {
  organizaciones: Organizacion[] = [];
  organizacionesFiltradas: Organizacion[] = [];
  searchControl = new FormControl('');
  loading = true;
  errorMsg = '';
  mostrarForm = false;
  organizacionForm!: FormGroup;
  editando = false;
  organizacionEditId: string | null = null;
  expanded_name: { [key: string]: boolean } = {};
  expanded_form: { [key: string]: boolean } = {};
  expanded_vincular: { [key: string]: boolean } = {};
  limite = 10;
  mostrarTodasOrganizaciones = false;
  vincularForm!: FormGroup;
  
  constructor(private api: OrganizacionService, 
    private apiUsuario: UsuarioService, 
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef, 
    private dialog: MatDialog) {
    this.organizacionForm = this.fb.group({

      nombre: ['', Validators.required],

    });

    this.vincularForm = this.fb.group({
      usuario: ['', Validators.required]
    }); 
    this.searchControl = new FormControl('');
  }

  //Función: leer
  ngOnInit(): void {
    this.load();

    this.searchControl.valueChanges.subscribe(value => {
      const term = value?.toLowerCase() ?? '';
  
      this.organizacionesFiltradas = this.organizaciones.filter(org =>
        org.name.toLowerCase().includes(term)
      );
    });
    
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.api.getOrganizaciones().subscribe({
      next: (res) => {
        this.organizaciones = res;
        this.organizacionesFiltradas = [...this.organizaciones];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'No se han podido cargar las organizaciones.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  //Función: trackBy para optimizar el ngFor
  trackById(_index: number, org: Organizacion): string {
    return org._id;
  }

  //Función: mostrar formulario
  mostrarFormulario(): void {
  this.mostrarForm = true;
  }

  //Función: mostrar más organizaciones
  mostrarMas(): void {
  this.mostrarTodasOrganizaciones = true;
  } 

  get organizacionesVisibles(): Organizacion[] {
    if (this.mostrarTodasOrganizaciones) {
      return this.organizacionesFiltradas;
    }
    return this.organizacionesFiltradas.slice(0, this.limite);
  }

  //Función: editar organización
  editar(org: Organizacion): void {
    this.mostrarForm = true;
    this.editando = true;
    this.organizacionEditId = org._id;

    this.organizacionForm.patchValue({
      nombre: org.name
    });
  }

  //Función: guardar organización (crear o actualizar)
  guardar(): void {

    if (this.organizacionForm.invalid) return;

    const nombre = this.organizacionForm.value.nombre;

    if (this.editando && this.organizacionEditId) {

      // UPDATE
      this.api.updateOrganizacion(this.organizacionEditId, nombre)
        .subscribe({
          next: () => {
            this.resetForm();
            this.load();
          },
          error: () => {
            this.errorMsg = 'No se ha podido actualizar la organización.';
          }
        });

    } else {

      // CREATE
      this.api.createOrganizacion(nombre)
        .subscribe({
          next: () => {
            this.resetForm();
            this.load();
          },
          error: () => {
            this.errorMsg = 'No se ha podido crear la organización.';
          }
        });
    }
  }

  //estado de expansión para mostrar el nombre completo
  toggleExpand(id: string): void {
    this.expanded_name[id] = !this.expanded_name[id];
  }

  //estado de expansión para mostrar el formulario
  toggleExpandForm(id: string): void {
    this.expanded_form[id] = !this.expanded_form[id];
  }

  //Función: resetear formulario
  resetForm(): void {
    this.mostrarForm = false;
    this.editando = false;
    this.organizacionEditId = null;
    this.organizacionForm.reset();
  }

  //Update: editar nombre de la organización
  editOrganizacion(org: Organizacion) {

    const nuevoNombre = prompt('Nuevo nombre:', org.name);

    if (nuevoNombre && nuevoNombre.trim() !== '') {

      this.api.updateOrganizacion(org._id, nuevoNombre)
        .subscribe(() => {

          // actualizar vista sin recargar
          org.name = nuevoNombre;

        });
    }
  }

  //Función: confirmar eliminación
  confirmDelete(id: string, name?: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete(id);
      }
    });
  }

  //Función: eliminar organización
  delete(id: string): void {
    this.errorMsg = '';
    this.loading = true;

    this.api.deleteOrganizacion(id).subscribe({
      next: () => {
        this.load();
      },
      error: () => {
        this.errorMsg = 'Error delete';
        this.loading = false;
      }
    });
  }

  
  
  //Función: expandir fila para mostrar detalles de la organizacion y sus usuarios asociados
  toggleDetalle(org: Organizacion): void {

    // Alternamos el estado de expansión para esta organización
    this.expanded_form[org._id] = !this.expanded_form[org._id];

    // Si acabamos de expandir y no tenemos los usuarios cargados, los obtenemos de la API
    if (this.expanded_form[org._id] && (!org.usuarios || org.usuarios.length === 0)) {
      this.api.getUsuariosByOrganizacion(org._id).subscribe((usuarios: Usuario[]) => {
          org.usuarios = usuarios;
          this.cdr.detectChanges();
        });
    }
  }

  toggleVincular(id: string): void {
    this.expanded_vincular[id] = !this.expanded_vincular[id];
    if (this.expanded_vincular[id]) {
      this.vincularForm.reset();
    }
  }

  //Función: desvincular usuario de la organización
  desvincularUsuario(org: Organizacion, user: Usuario): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, { data: user.name });

  dialogRef.afterClosed().subscribe(result => {
    if (!result) return;

    // Actualizamos el usuario para quitarle la organización (vinculamos a una organización "vacía")
    this.apiUsuario.updateUsuario(
      user._id,
      user.name,
      user.email,
      user.password || '',
      '' // ID de organización vacío para desvincular
    ).subscribe({
      next: (updatedUser) => {
        // Actualizamos la lista de usuarios de la organización en la vista sin recargar
        org.usuarios = org.usuarios?.filter(u => u._id !== user._id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se ha podido desvincular al usuario.';
        this.cdr.detectChanges();
      }
    });
  });
}

  // Función: vincular usuario a la organización
vincularUsuario(org: Organizacion): void {
  if (this.vincularForm.invalid) return;

  const { usuario } = this.vincularForm.value; // ID del usuario

  // Obtenemos los datos actuales del usuario para no perder información al actualizar solo la organización  
  this.apiUsuario.getUsuarioById(usuario).subscribe({
    next: (user) => {
      // Actualizamos el usuario para vincularlo a la organización seleccionada
      this.apiUsuario.updateUsuario(
        user._id,           
        user.name,          
        user.email || '',   
        user.password || '',
        org._id            
      ).subscribe({
        next: (updatedUser) => {
          // Actualizamos la lista de usuarios de la organización en la vista sin recargar
          if (!org.usuarios) org.usuarios = [];

          const exists = org.usuarios.some(u => u._id === updatedUser._id);
          if (!exists) {
            org.usuarios.push(updatedUser);
          }

          this.expanded_vincular[org._id] = false;
          this.vincularForm.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido actualizar la organización del usuario.';
        }
      });
    },
    error: () => {
      this.errorMsg = 'No se ha encontrado el usuario con ese ID.';
    }
  });
}
}
