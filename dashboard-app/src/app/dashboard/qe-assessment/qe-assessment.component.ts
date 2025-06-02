import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qe-assessment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">QE Pairing Assessment Dashboard</h1>
        </div>
        <!-- Add your QE Assessment specific content here -->
      </div>
    </div>
  `,
  styles: []
})
export class QEAssessmentComponent {} 