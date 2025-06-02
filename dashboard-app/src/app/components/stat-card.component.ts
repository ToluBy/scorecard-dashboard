import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow p-3">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-semibold text-orange-600">{{ title }}</h3>
        <span [class]="'text-' + color + '-500'">
          <i class="fas fa-{{ icon }}"></i>
        </span>
      </div>
      <div class="space-y-0.5">
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-600">VizTech Score</span>
          <span class="text-xs font-medium">{{ Math.ceil(toNumber(score)) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-600">VizTech Score (%)</span>
          <span class="text-xs font-medium">{{ Math.ceil(toNumber(scorePercentage)) }}%</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-600">Baseline Score (%)</span>
          <span class="text-xs font-medium">{{ Math.ceil(toNumber(baselineScore)) }}%</span>
        </div>
      </div>
    </div>
  `
})
export class StatCardComponent {
  protected Math = Math;
  @Input() title: string = '';
  @Input() score: string = '';
  @Input() scorePercentage: string = '';
  @Input() baselineScore: string = '';
  @Input() icon: string = '';
  @Input() color: string = 'blue';
} 