import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-orange-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Empty space on the left -->
          <div class="w-72"></div>

          <!-- Logo centered -->
          <div class="flex-1 flex items-center justify-center">
            <a routerLink="/home" class="flex items-center">
              <span class="text-3xl font-bold text-white">Dashboard Portal</span>
            </a>
          </div>

          <!-- Search and icons on the right -->
          <div class="flex items-center justify-end w-72">
            <div class="max-w-lg w-full lg:max-w-xs">
              <div class="relative">
                <input type="text" 
                       class="block w-full pl-10 pr-3 py-2 border border-orange-700 rounded-md leading-5 bg-orange-900 text-white placeholder-orange-300 focus:outline-none focus:placeholder-orange-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" 
                       placeholder="Search">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-search text-orange-300"></i>
                </div>
              </div>
            </div>

            <!-- Home Button -->
            <a routerLink="/home" 
               class="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
              <i class="fas fa-home mr-2"></i>
              Home
            </a>

            <!-- Notifications -->
            <button class="ml-4 p-1 rounded-full text-orange-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
              <span class="sr-only">View notifications</span>
              <i class="fas fa-bell"></i>
            </button>

            <!-- Profile dropdown -->
            <div class="ml-3 relative">
              <div>
                <button type="button" 
                        class="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500" 
                        id="user-menu-button">
                  <span class="sr-only">Open user menu</span>
                  <div class="h-8 w-8 rounded-full bg-orange-700 flex items-center justify-center">
                    <i class="fas fa-user text-orange-200"></i>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {} 