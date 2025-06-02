import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SuggestionCount {
  text: string;
  count: number;
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full">
      <h2 class="text-lg font-semibold mb-2">Suggestions for Improvement</h2>
      <div class="flex-1 overflow-y-auto pr-2" style="max-height: 240px;">
        @if (suggestions.length) {
          <div class="space-y-3">
            @for (suggestion of suggestions; track suggestion.text) {
              <div class="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                <div class="flex items-start">
                  <div class="flex-1">
                    <p class="text-sm text-gray-600">{{ suggestion.text }}</p>
                    <div class="mt-1 flex items-center">
                      <span class="text-xs font-medium text-gray-500">{{ suggestion.count }} similar response{{ suggestion.count > 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center text-gray-500 py-3">
            No suggestions reported. Please upload an Excel file with feedback data.
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* Custom scrollbar styles */
    .overflow-y-auto {
      scrollbar-width: thin;
      scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
    }
    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }
    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 3px;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.7);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentActivityComponent {
  @Input() suggestions: { text: string; count: number }[] = [];
} 