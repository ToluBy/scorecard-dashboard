import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-orange-800 border-t border-orange-700">
      <div class="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
          <div class="text-orange-200 text-sm">
            &copy; {{ currentYear }} Dashboard App. All rights reserved.
          </div>
          <div class="flex space-x-6">
            <a href="#" class="text-orange-300 hover:text-white">
              <i class="fab fa-twitter"></i>
            </a>
            <a href="#" class="text-orange-300 hover:text-white">
              <i class="fab fa-facebook"></i>
            </a>
            <a href="#" class="text-orange-300 hover:text-white">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="#" class="text-orange-300 hover:text-white">
              <i class="fab fa-github"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
} 