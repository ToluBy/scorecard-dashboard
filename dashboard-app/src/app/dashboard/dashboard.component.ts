import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentComponent } from './assessment/landing.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AssessmentComponent],
  template: `
    <div class="min-h-screen bg-gray-100 p-6">
      <app-landing></app-landing>
    </div>
  `,
  styles: []
})
export class DashboardComponent { }
