import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { ChartConfiguration, ChartType } from 'chart.js';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-pairing',
  standalone: true,
  imports: [CommonModule, NgChartsModule, StatCardComponent, RecentActivityComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header Section with Upload Button -->
      <div class="bg-gray-50 border-b border-gray-200">
        <div class="container mx-auto py-3">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800">Pairing Dashboard</h1>
            <div class="relative">
              <input
                type="file"
                class="hidden"
                #fileInput
                (change)="onFileChange($event)"
                accept=".xlsx, .xls"
              >
              <button
                (click)="fileInput.click()"
                class="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center space-x-2"
                [class.opacity-50]="isLoading"
                [disabled]="isLoading"
              >
                <i class="fas" [class.fa-spinner]="isLoading" [class.fa-spin]="isLoading" [class.fa-file-excel]="!isLoading"></i>
                <span>{{ isLoading ? 'Loading...' : 'Load Excel Data' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      @if (errorMessage) {
        <div class="container mx-auto mt-2">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative" role="alert">
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline"> {{ errorMessage }}</span>
            <button class="absolute top-0 bottom-0 right-0 px-4" (click)="errorMessage = ''">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      }

      <!-- Success Message -->
      @if (showSuccess) {
        <div class="container mx-auto mt-2">
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative" role="alert">
            <strong class="font-bold">Success!</strong>
            <span class="block sm:inline"> Data loaded successfully.</span>
            <button class="absolute top-0 bottom-0 right-0 px-4" (click)="showSuccess = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      }

      <!-- Main Content -->
      <div class="container mx-auto flex-grow py-4">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <app-stat-card
            title="Total Pairs"
            [value]="totalPairs.toString()"
            iconClass="fas fa-user-friends"
            iconBgColor="bg-blue-500"
          ></app-stat-card>
          <app-stat-card
            title="Active Pairs"
            [value]="activePairs.toString()"
            iconClass="fas fa-users"
            iconBgColor="bg-green-500"
          ></app-stat-card>
          <app-stat-card
            title="Completed Pairs"
            [value]="completedPairs.toString()"
            iconClass="fas fa-check-circle"
            iconBgColor="bg-purple-500"
          ></app-stat-card>
          <app-stat-card
            title="Average Duration"
            [value]="averageDuration"
            iconClass="fas fa-clock"
            iconBgColor="bg-yellow-500"
          ></app-stat-card>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Pairing Duration Distribution</h2>
            <div class="h-64">
              <canvas baseChart
                [data]="durationChartData"
                [options]="durationChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Pairing Status</h2>
            <div class="h-64">
              <canvas baseChart
                [data]="statusChartData"
                [options]="statusChartOptions"
                [type]="'doughnut'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Additional Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Pairing Trends</h2>
            <div class="h-64">
              <canvas baseChart
                [data]="trendsChartData"
                [options]="trendsChartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Team Distribution</h2>
            <div class="h-64">
              <canvas baseChart
                [data]="teamChartData"
                [options]="teamChartOptions"
                [type]="'pie'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Feedback and Notes Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex flex-col h-full">
              <h2 class="text-lg font-semibold mb-2">Pairing Feedback</h2>
              <div class="flex-1 overflow-y-auto pr-2" style="max-height: 240px;">
                @if (feedback?.length) {
                  <div class="space-y-3">
                    @for (item of feedback; track item.text) {
                      <div class="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <div class="flex items-start">
                          <div class="flex-1">
                            <p class="text-sm text-gray-600">{{ item.text }}</p>
                            <div class="mt-1 flex items-center">
                              <span class="text-xs font-medium text-gray-500">{{ item.date }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center text-gray-500 py-3">
                    No feedback available. Please upload an Excel file with feedback data.
                  </div>
                }
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex flex-col h-full">
              <h2 class="text-lg font-semibold mb-2">Pairing Notes</h2>
              <div class="flex-1 overflow-y-auto pr-2" style="max-height: 240px;">
                @if (notes?.length) {
                  <div class="space-y-3">
                    @for (note of notes; track note.text) {
                      <div class="bg-gray-50 p-3 rounded-lg border-l-4 border-orange-500">
                        <div class="flex items-start">
                          <div class="flex-1">
                            <p class="text-sm text-gray-600">{{ note.text }}</p>
                            <div class="mt-1 flex items-center">
                              <span class="text-xs font-medium text-gray-500">{{ note.date }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center text-gray-500 py-3">
                    No notes available. Please upload an Excel file with notes data.
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
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
export class PairingComponent implements OnInit {
  // Stats
  totalPairs: number = 0;
  activePairs: number = 0;
  completedPairs: number = 0;
  averageDuration: string = '0h';

  // Chart data
  durationChartData: ChartConfiguration['data'] = {
    labels: ['0-2h', '2-4h', '4-6h', '6-8h', '>8h'],
    datasets: [{
      label: 'Number of Pairs',
      data: [0, 0, 0, 0, 0],
      backgroundColor: 'rgba(59, 130, 246, 0.6)'
    }]
  };

  durationChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Pairs'
        }
      }
    }
  };

  statusChartData: ChartConfiguration['data'] = {
    labels: ['Active', 'Completed', 'On Hold', 'Planned'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: [
        'rgba(16, 185, 129, 0.6)',  // Green
        'rgba(59, 130, 246, 0.6)',  // Blue
        'rgba(245, 158, 11, 0.6)',  // Yellow
        'rgba(139, 92, 246, 0.6)'   // Purple
      ]
    }]
  };

  statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  trendsChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Number of Active Pairs',
      data: [0, 0, 0, 0, 0, 0],
      borderColor: 'rgba(59, 130, 246, 0.8)',
      tension: 0.4
    }]
  };

  trendsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  teamChartData: ChartConfiguration['data'] = {
    labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(16, 185, 129, 0.6)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(139, 92, 246, 0.6)',
        'rgba(236, 72, 153, 0.6)'
      ]
    }]
  };

  teamChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  feedback: { text: string; date: string; }[] = [];
  notes: { text: string; date: string; }[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  showSuccess: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Initialize with sample data if needed
    this.cdr.detectChanges();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Implementation for file processing will go here
      // Similar to the QE Pairing Assessment page
    }
  }
} 