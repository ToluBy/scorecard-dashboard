import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-8">Welcome to the Dashboard Portal</h1>
          <p class="text-xl text-gray-600 mb-12">Select a dashboard to view:</p>
        </div>

        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <!-- QE Pairing Assessment Dashboard Card -->
          <div class="bg-white overflow-hidden shadow rounded-lg p-6">
            <div class="flex items-start mb-4">
              <div class="flex-shrink-0">
                <div class="bg-orange-500 rounded p-3 inline-block">
                  <i class="fas fa-clipboard-list text-white text-2xl"></i>
                </div>
              </div>
              <div class="ml-4 flex-1">
                <h3 class="text-xl font-semibold text-gray-900">QE Pairing Assessment Dashboard</h3>
                <p class="mt-1 text-gray-500">View and analyze QE pairing assessment data</p>
              </div>
            </div>
            <div class="mt-4">
              <a routerLink="/landing" 
                 class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 w-full justify-center">
                View Dashboard
              </a>
            </div>
          </div>

          <!-- Pairing Scorecards Card -->
          <div class="bg-white overflow-hidden shadow rounded-lg p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="bg-orange-500 rounded p-3">
                  <i class="fas fa-chart-bar text-white text-2xl"></i>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-xl font-semibold text-gray-900">Pairing Scorecards</h3>
                <p class="mt-1 text-gray-500">View and analyze pairing scores and metrics</p>
              </div>
            </div>
            <div class="mt-4">
              <a routerLink="/final-scorecard" 
                 class="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                View Scorecard
              </a>
            </div>
          </div>

          <!-- Placeholder Card for Future Dashboards -->
          <div class="bg-white overflow-hidden shadow rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="bg-gray-200 rounded p-3">
                  <i class="fas fa-plus text-gray-400 text-2xl"></i>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-xl font-semibold text-gray-400">Future Dashboard</h3>
                <p class="mt-1 text-gray-400">Additional dashboard coming soon</p>
              </div>
            </div>
            <div class="mt-4">
              <button disabled
                 class="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-400 bg-gray-50 cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class HomeComponent {} 