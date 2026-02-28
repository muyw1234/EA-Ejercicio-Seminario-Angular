import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../posts/api.service';
import { Organizacion } from '../models/organizacion.model';

@Component({
  selector: 'app-organizacion-list',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './organizacion-list.html',
  styleUrl: './organizacion-list.css',
})

export class OrganizacionList implements OnInit {

  organizaciones: Organizacion[] = [];

  constructor(private api: ApiService) {}
editOrganizacion(org: Organizacion) {
  const nuevoNombre = prompt('Nuevo nombre:', org.name);

  if (nuevoNombre && nuevoNombre.trim() !== '') {
    this.api.updateOrganizacion(org._id, nuevoNombre)
      .subscribe(() => {
        org.name = nuevoNombre; // actualizar vista
      });
  }
}
  ngOnInit(): void {
    this.api.getOrganizaciones().subscribe(data => {
      this.organizaciones = data.organizaciones;
    });
  }
}