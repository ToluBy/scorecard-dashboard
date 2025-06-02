import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 rounded-full" [ngClass]="iconBgColor">
          <i [class]="iconClass" class="text-white text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-gray-500 text-sm">{{ title }}</p>
          <p class="text-2xl font-semibold">{{ value }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() iconClass: string = '';
  @Input() iconBgColor: string = '';
} 