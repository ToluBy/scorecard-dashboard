import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { ChartConfiguration, ChartType, Plugin, ChartData, ChartDataset } from 'chart.js';
import { PieController, ArcElement, Tooltip, Legend, CategoryScale } from 'chart.js';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { BASELINE_DATA } from './baseline-data';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { read, utils } from 'xlsx';
import { PairingScorecardApiService } from '../../services/pairing-scorecard-api.service';

// Register Chart.js components
Chart.register(PieController, ArcElement, Tooltip, Legend, CategoryScale);

// Define and register custom plugin for enhanced 3D effects
const enhancedEffectsPlugin: Plugin = {
  id: 'enhancedEffects',
  beforeDraw: (chart) => {
    const ctx = chart.ctx;
    ctx.save();
    
    // Add shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Add halo effect
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((element: any) => {
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        element.draw(ctx);
        ctx.restore();
      });
    });

    ctx.restore();
  }
};

// Add pie chart percentage plugin
const pieChartPercentagePlugin = {
  id: 'pieChartPercentage',
  afterDraw: function(chart: any) {
    if (chart.config.type === 'pie') {
      const width = chart.width;
      const height = chart.height;
      const ctx = chart.ctx;
      ctx.restore();
      const fontSize = (height / 200).toFixed(2);
      ctx.font = fontSize + "em sans-serif";
      ctx.textBaseline = "middle";
      
      // Calculate total
      const total = chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
      
      // Get the chart's metadata
      const meta = chart.getDatasetMeta(0);
      
      // Draw percentage for each segment
      meta.data.forEach((element: any, index: number) => {
        const value = chart.data.datasets[0].data[index];
        const percentage = Math.round((value / total) * 100);
        
        // Skip if the percentage is 0
        if (percentage === 0) {
          return;
        }
        
        // Calculate the angle of the segment
        const angle = element.startAngle + (element.endAngle - element.startAngle) / 2;
        
        // Calculate the position for the text
        const distance = element.outerRadius * 0.7;
        const textX = element.x + Math.cos(angle) * distance;
        const textY = element.y + Math.sin(angle) * distance;
        
        const text = percentage + "%";
        
        // Calculate text width for alignment
        const textWidth = ctx.measureText(text).width;
        
        // Adjust text position to prevent overlap
        const adjustedX = textX - (textWidth / 2);
        const adjustedY = textY;
        
        // Draw text with shadow for visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Use white text for better contrast
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, adjustedX, adjustedY);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });
      
      ctx.save();
    }
  }
};

// Register the plugins
Chart.register(enhancedEffectsPlugin, pieChartPercentagePlugin);

// Define interfaces
interface AssignmentData {
  'Selected Descriptor': string;
  'Team Name'?: string;
  [key: string]: string | undefined;
}

// Add interface for Sheet1 row type
interface Sheet1Row {
  Team: string;
  'Baseline Overall score': string | number;
  [key: string]: any;
}

interface ActivityChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  hoverBorderWidth: number;
  barPercentage: number;
  categoryPercentage: number;
}

// Define the response interface
interface ApiResponse {
  data: any[]; // Adjust the type as needed based on the actual response structure
}

@Component({
  selector: 'app-final-scorecard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, StatCardComponent, RecentActivityComponent, RouterModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header Section with Navigation Tabs -->
      <div class="bg-gray-50 border-b border-gray-200">
        <div class="container mx-auto">
          <!-- Navigation Tabs -->
          <div class="flex border-b border-gray-200">
            <a routerLink="/dashboard" 
               routerLinkActive="border-orange-500 text-orange-600"
               [routerLinkActiveOptions]="{exact: true}"
               class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-orange-600 hover:border-orange-500 nav-tab">
              Final Scorecard
            </a>
            <a routerLink="/team-scorecards" 
               routerLinkActive="border-orange-500 text-orange-600"
               [routerLinkActiveOptions]="{exact: true}"
               class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-orange-600 hover:border-orange-500 nav-tab">
              Team Scorecards
            </a>
          </div>
          
          <!-- Dashboard Header -->
          <div class="py-3">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold text-gray-800">VizTech Pairing Scorecard</h1>
              <div class="flex space-x-2">
                <button
                  (click)="loadCurrentScores()"
                  class="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center space-x-2"
                  [class.opacity-50]="isLoading || isCurrentScoresLoaded"
                  [disabled]="isLoading || isCurrentScoresLoaded"
                >
                  <i class="fas" [class.fa-spinner]="isLoading" [class.fa-spin]="isLoading" [class.fa-chart-bar]="!isLoading"></i>
                  <span>{{ isLoading ? 'Loading...' : (isCurrentScoresLoaded ? 'Current Scores Loaded' : 'Load Current Scores') }}</span>
                </button>
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
                    <span>{{ isLoading ? 'Loading...' : 'Load Target Data' }}</span>
                  </button>
                </div>
              </div>
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
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6">
          <!-- Stacked Target and Teams Cards -->
          <div class="flex flex-col gap-2">
            <!-- On Target Metrics -->
            <div class="bg-gray-300 rounded-lg shadow p-2 w-36">
              <div class="grid grid-cols-2 gap-1">
                <div class="text-center">
                  <div class="text-[8px] font-bold text-gray-800">On Target</div>
                  <div class="text-[8px] font-medium text-gray-800">{{onTarget}}</div>
                </div>
                <div class="text-center">
                  <div class="text-[8px] font-bold text-gray-800">On Target (%)</div>
                  <div class="text-[8px] font-medium text-gray-800">{{onTargetPercentage}}%</div>
                </div>
              </div>
            </div>

            <!-- Total Teams -->
            <div class="bg-gray-300 rounded-lg shadow p-1 w-36">
              <div class="text-center">
                <div class="text-[10px] font-bold text-orange-600">Total Teams</div>
                <div class="text-[10px] font-medium text-orange-600">{{totalTeams}}</div>
              </div>
            </div>
          </div>

          <!-- Current Pairing Efficiency -->
          <div class="bg-white rounded-lg shadow p-3">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-xs font-semibold text-orange-600">Current Pairing Efficiency</h3>
              <span class="text-blue-500">
                <i class="fas fa-chart-line"></i>
              </span>
            </div>
            <div class="space-y-0.5">
              <!-- <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score</span>
                <span class="text-xs font-medium">{{vizTechScore}}</span>
              </div> -->
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score (%)</span>
                <span class="text-xs font-medium">{{vizTechScorePercentage}}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Baseline Score (%)</span>
                <span class="text-xs font-medium">{{pairingEfficiencyBaselineScore}}%</span>
              </div>
            </div>
          </div>

          <!-- Current Pairing Rotation -->
          <div class="bg-white rounded-lg shadow p-3">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-xs font-semibold text-orange-600">Current Pairing Rotation</h3>
              <span class="text-green-500">
                <i class="fas fa-users"></i>
              </span>
            </div>
            <div class="space-y-0.5">
              <!-- <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score</span>
                <span class="text-xs font-medium">{{pairingRotationVizTechScore}}</span>
              </div> -->
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score (%)</span>
                <span class="text-xs font-medium">{{pairingRotationVizTechScorePercentage}}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Baseline Score (%)</span>
                <span class="text-xs font-medium">{{pairingRotationBaselineScore}}%</span>
              </div>
            </div>
          </div>

          <!-- Current Pairing Assignment -->
          <div class="bg-white rounded-lg shadow p-3">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-xs font-semibold text-orange-600">Current Pairing Assignment</h3>
              <span class="text-purple-500">
                <i class="fas fa-check-circle"></i>
              </span>
            </div>
            <div class="space-y-0.5">
              <!-- <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score</span>
                <span class="text-xs font-medium">{{pairingAssignmentVizTechScore}}</span>
              </div> -->
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score (%)</span>
                <span class="text-xs font-medium">{{pairingAssignmentVizTechScorePercentage}}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Baseline Score (%)</span>
                <span class="text-xs font-medium">{{pairingAssignmentBaselineScore}}%</span>
              </div>
            </div>
          </div>

          <!-- Current Pairing Frequency -->
          <div class="bg-white rounded-lg shadow p-3">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-xs font-semibold text-orange-600">Current Pairing Frequency</h3>
              <span class="text-yellow-500">
                <i class="fas fa-star"></i>
              </span>
            </div>
            <div class="space-y-0.5">
              <!-- <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score</span>
                <span class="text-xs font-medium">{{pairingFrequencyVizTechScore}}</span>
              </div> -->
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">VizTech Score (%)</span>
                <span class="text-xs font-medium">{{pairingFrequencyVizTechScorePercentage}}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Baseline Score (%)</span>
                <span class="text-xs font-medium">{{pairingFrequencyBaselineScore}}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div class="bg-white rounded-lg shadow p-4 chart-container">
            <h2 class="text-lg font-semibold mb-2">VizTech Pairing Overall Score</h2>
            <div class="h-64">
              <canvas baseChart
                [data]="scoreChartData"
                [options]="scoreChartOptions"
                [type]="'pie'">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 chart-container">
            <h2 class="text-lg font-semibold mb-2">VizTech Metric Scores</h2>
            <div class="h-64">
              <canvas baseChart
                #activityChart
                [data]="activityChartData"
                [options]="activityChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Feedback Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white rounded-lg shadow p-4 chart-container">
            <h2 class="text-lg font-semibold mb-2">Pairing Frequency</h2>
            <div class="h-64 flex justify-center items-center">
              <canvas baseChart
                [data]="frequencyChartData"
                [options]="frequencyChartOptions"
                [type]="'pie'"
                width="400"
                height="400">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 chart-container">
            <h2 class="text-lg font-semibold mb-2">Pairing Rotation</h2>
            <div class="h-64 flex justify-center items-center">
              <canvas baseChart
                [data]="rotationChartData"
                [options]="rotationChartOptions"
                [type]="'pie'"
                width="400"
                height="400">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 chart-container">
            <h2 class="text-lg font-semibold mb-2">Pairing Assignment</h2>
            <div class="h-64 flex justify-center items-center">
              <canvas baseChart
                [data]="assignmentChartData"
                [options]="assignmentChartOptions"
                [type]="'pie'"
                width="400"
                height="400">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 chart-container">
            <h2 class="text-lg font-semibold mb-2">Pairing Efficiency</h2>
            <div class="h-64 flex justify-center items-center">
              <canvas baseChart
                [data]="efficiencyChartData"
                [options]="efficiencyChartOptions"
                [type]="'pie'"
                width="400"
                height="400">
              </canvas>
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
    
    /* Enhanced chart container styles */
    .chart-container {
      position: relative;
      background: linear-gradient(145deg, #ffffff, #f3f4f6);
      border-radius: 15px;
      box-shadow: 
        0 10px 20px rgba(0, 0, 0, 0.1),
        inset 0 -2px 5px rgba(255, 255, 255, 0.8),
        inset 0 2px 5px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin: 10px;
    }
    
    /* Chart canvas styles */
    canvas {
      border-radius: 10px;
      backdrop-filter: blur(5px);
      transition: transform 0.3s ease;
    }
    
    canvas:hover {
      transform: scale(1.02);
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

    /* Enhanced Navigation tab styles */
    .nav-tab {
      position: relative;
      transition: all 0.3s ease;
      transform-style: preserve-3d;
      perspective: 1000px;
      background: linear-gradient(145deg, #ffffff, #f3f4f6);
      border-radius: 8px 8px 0 0;
      margin: 0 2px;
      padding: 12px 24px;
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .nav-tab::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(145deg, #ffffff, #f3f4f6);
      border-radius: 8px 8px 0 0;
      transform: translateZ(-1px);
      box-shadow: 
        inset 0 2px 4px rgba(255, 255, 255, 0.8),
        inset 0 -2px 4px rgba(0, 0, 0, 0.1);
    }

    .nav-tab::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: transparent;
      transition: all 0.3s ease;
      transform: translateZ(1px);
    }

    .nav-tab:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 6px 12px rgba(234, 88, 12, 0.2),
        0 4px 8px rgba(234, 88, 12, 0.1);
    }

    .nav-tab:hover::after {
      background: rgba(234, 88, 12, 0.3);
      box-shadow: 0 0 15px rgba(234, 88, 12, 0.5);
    }

    .nav-tab.router-link-active {
      transform: translateY(-2px);
      background: linear-gradient(145deg, #ffffff, #f3f4f6);
      box-shadow: 
        0 6px 12px rgba(234, 88, 12, 0.3),
        0 4px 8px rgba(234, 88, 12, 0.2);
    }

    .nav-tab.router-link-active::after {
      background: #ea580c;
      box-shadow: 0 0 15px rgba(234, 88, 12, 0.5);
    }

    /* Navigation container styles */
    .flex.border-b {
      background: linear-gradient(145deg, #ffffff, #f3f4f6);
      padding: 8px 0;
      border-radius: 8px;
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.06);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinalScorecardComponent implements OnInit {
  // Stats
  vizTechScore = 0;
  vizTechScorePercentage = 0;
  baselineScorePercentage = 0;
  
  // Active Pairs Stats
  activePairs = 0;
  activeRate = 0;
  weeklyActiveChange = 0;
  
  // Completed Pairs Stats
  completedPairs = 0;
  completionRate = 0;
  monthlyCompletionChange = 0;
  
  // Average Score Stats
  averageScore = 0;
  targetScore = 0;
  scoreGap = 0;

  // On Target Stats
  onTarget = 0;
  onTargetPercentage = 0;

  // Total Teams
  totalTeams = 0;

  // Pairing Rotation Card Stats
  pairingRotationVizTechScore = 0;
  pairingRotationVizTechScorePercentage = 0;
  pairingRotationBaselineScore = 0;

  // Pairing Assignment Card Stats
  pairingAssignmentVizTechScore = 0;
  pairingAssignmentVizTechScorePercentage = 0;
  pairingAssignmentBaselineScore = 0;

  // Add properties for Pairing Frequency card
  pairingFrequencyVizTechScore = 0;
  pairingFrequencyVizTechScorePercentage = 0;

  // Add property for Pairing Efficiency percentage
  pairingEfficiencyVizTechScorePercentage = 0;

  // Add property for Overall Score
  overallVizTechScorePercentage = 0;

  // Add property for Overall Score baseline
  overallBaselineScore = 0;

  // Chart data
  scoreChartData: ChartConfiguration['data'] = {
    labels: ['Overall Score', 'Opportunities'],
    datasets: [{
      data: [75, 25],
      backgroundColor: [
        'rgba(16, 185, 129, 0.9)',  // Green for Overall Score
        'rgba(245, 158, 11, 0.9)'   // Yellow for Opportunities
      ],
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 15,
      offset: 10
    }]
  };

  // Common function to create 3D gradient
  private create3DGradient(color: string): any {
    return {
      type: 'linear',
      start: [0, 0],
      end: [0, 1],
      colorStops: [
        { offset: 0, color: this.adjustColor(color, 20) },
        { offset: 1, color: this.adjustColor(color, -20) }
      ]
    };
  }

  // Helper function to adjust color brightness
  private adjustColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const r = (num >> 16) + percent;
    const g = ((num >> 8) & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    return `rgba(${Math.min(255, Math.max(0, r))}, ${Math.min(255, Math.max(0, g))}, ${Math.min(255, Math.max(0, b))}, 0.8)`;
  }

  scoreChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 8,
          font: {
            size: 9
          },
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
            labels.forEach(label => {
              label.fillStyle = (label.fillStyle as string).replace('0.9', '1');
            });
            return labels;
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number || 0;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => (a || 0) + (b || 0), 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}%`;
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 8,
        boxPadding: 4,
        cornerRadius: 4
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderRadius: 5,
        hoverBorderWidth: 3,
        hoverOffset: 8
      }
    }
  };

  activityChartData: ChartConfiguration['data'] = {
    labels: ['Overall Score', 'Pairing Efficiency', 'Pairing Assignment', 'Pairing Rotation', 'Pairing Frequency'],
    datasets: [
      {
        label: 'Baseline',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(156, 163, 175, 0.9)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 2,
        borderRadius: 5,
        hoverBorderWidth: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      },
      {
        label: 'Current',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(234, 88, 12, 0.9)',
        borderColor: 'rgba(234, 88, 12, 1)',
        borderWidth: 2,
        borderRadius: 5,
        hoverBorderWidth: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }
    ]
  };

  activityChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          drawBorder: true,
          borderDash: [5, 5],
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return value + '%';
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: false
        }
      }
    },
    animation: {
      duration: 500
    },
    elements: {
      bar: {
        borderWidth: 2,
        borderRadius: 5,
        borderSkipped: false
      }
    }
  };

  frequencyChartData: ChartConfiguration['data'] = {
    labels: ['Rarely', 'Weekly', 'Several Times a Week', 'Daily Few Times', 'Continuous'],
    datasets: [{
      data: [
        BASELINE_DATA.frequencyDistribution.rarely,
        BASELINE_DATA.frequencyDistribution.weekly,
        BASELINE_DATA.frequencyDistribution.severalTimesWeek,
        BASELINE_DATA.frequencyDistribution.dailyFewTimes,
        BASELINE_DATA.frequencyDistribution.continuous
      ],
      backgroundColor: [
        'rgba(156, 163, 175, 0.9)',  // Gray for Rarely
        'rgba(59, 130, 246, 0.9)',   // Blue for Weekly
        'rgba(16, 185, 129, 0.9)',   // Green for Several Times
        'rgba(245, 158, 11, 0.9)',   // Yellow for Daily Few Times
        'rgba(139, 92, 246, 0.9)'    // Purple for Continuous
      ],
      borderColor: [
        'rgba(156, 163, 175, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(139, 92, 246, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 15,
      offset: 10
    }]
  };

  frequencyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 8,
          font: {
            size: 9
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number || 0;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => (a || 0) + (b || 0), 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}%`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderRadius: 5
      }
    }
  };

  rotationChartData: ChartConfiguration['data'] = {
    labels: ['Daily', 'Per Story', 'Ad Hoc', 'Per Sprint', 'Weekly'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(139, 92, 246, 0.9)',   // Purple for Daily
        'rgba(245, 158, 11, 0.9)',   // Yellow for Per Story
        'rgba(156, 163, 175, 0.9)',  // Gray for Ad Hoc
        'rgba(59, 130, 246, 0.9)',   // Blue for Per Sprint
        'rgba(16, 185, 129, 0.9)'    // Green for Weekly
      ],
      borderColor: [
        'rgba(139, 92, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(156, 163, 175, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 10,
      offset: 5
    }]
  };

  rotationChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 8,
          font: {
            size: 9
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number || 0;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => (a || 0) + (b || 0), 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}%`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderRadius: 5
      }
    }
  };

  assignmentChartData: ChartConfiguration['data'] = {
    labels: ['Missing', 'Assigned by PO/Scrum Master', 'Anchor/Lead-Assigned/Based on Expertise', 'Manually Formed', 'Randomized via Tool'],
    datasets: [{
      data: [
        BASELINE_DATA.assignmentDistribution.missing,
        BASELINE_DATA.assignmentDistribution.poScrumMaster,
        BASELINE_DATA.assignmentDistribution.anchorLead,
        BASELINE_DATA.assignmentDistribution.manuallyFormed,
        BASELINE_DATA.assignmentDistribution.randomized
      ],
      backgroundColor: [
        'rgba(156, 163, 175, 0.9)',  // Gray for Missing
        'rgba(59, 130, 246, 0.9)',   // Blue for PO/Scrum Master
        'rgba(16, 185, 129, 0.9)',   // Green for Anchor/Lead
        'rgba(245, 158, 11, 0.9)',   // Yellow for Manually Formed
        'rgba(139, 92, 246, 0.9)'    // Purple for Randomized
      ],
      borderColor: [
        'rgba(156, 163, 175, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(139, 92, 246, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 10,
      offset: 5
    }]
  };

  assignmentChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 8,
          font: {
            size: 9
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number || 0;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => (a || 0) + (b || 0), 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}%`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderRadius: 5
      }
    }
  };

  efficiencyChartData: ChartConfiguration['data'] = {
    labels: ['Missing', 'Inefficient', 'Marginal', 'Adequate', 'Effective', 'Optimal'],
    datasets: [{
      data: [
        BASELINE_DATA.efficiencyDistribution.missing,
        BASELINE_DATA.efficiencyDistribution.inefficient,
        BASELINE_DATA.efficiencyDistribution.marginal,
        BASELINE_DATA.efficiencyDistribution.adequate,
        BASELINE_DATA.efficiencyDistribution.effective,
        BASELINE_DATA.efficiencyDistribution.optimal
      ],
      backgroundColor: [
        'rgba(156, 163, 175, 0.9)',  // Gray for Missing
        'rgba(239, 68, 68, 0.9)',    // Red for Inefficient
        'rgba(245, 158, 11, 0.9)',   // Yellow for Marginal
        'rgba(59, 130, 246, 0.9)',   // Blue for Adequate
        'rgba(16, 185, 129, 0.9)',   // Green for Effective
        'rgba(139, 92, 246, 0.9)'    // Purple for Optimal
      ],
      borderColor: [
        'rgba(156, 163, 175, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 10,
      offset: 5
    }]
  };

  efficiencyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 8,
          font: {
            size: 9
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number || 0;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => (a || 0) + (b || 0), 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}%`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderRadius: 5
      }
    }
  };

  suggestions: { text: string; count: number; }[] = [];
  challenges: { text: string; count: number; }[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  showSuccess: boolean = false;

  // Add new property to track if baseline is loaded
  isBaselineLoaded: boolean = false;

  // Add property to store pairing efficiency baseline score separately
  pairingEfficiencyBaselineScore: number = 0;
  // Add property to store pairing frequency baseline score separately
  pairingFrequencyBaselineScore: number = 0;


  // Add new property to track if current scores are loaded
  isCurrentScoresLoaded: boolean = false;

  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  @ViewChild('activityChart') activityChart!: BaseChartDirective;

  constructor(
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService,
    private pairingScorecardApiService: PairingScorecardApiService
  ) {
    // Subscribe to all chart data observables
    this.dashboardService.scoreChartData$.subscribe(data => {
      if (data) {
        this.scoreChartData = data;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.activityChartData$.subscribe(data => {
      if (data) {
        this.activityChartData = data;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.frequencyChartData$.subscribe(data => {
      if (data) {
        this.frequencyChartData = data;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.rotationChartData$.subscribe(data => {
      if (data) {
        this.rotationChartData = data;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.assignmentChartData$.subscribe(data => {
      if (data) {
        this.assignmentChartData = data;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.efficiencyChartData$.subscribe(data => {
      if (data) {
        this.efficiencyChartData = data;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.stats$.subscribe(stats => {
      if (stats) {
        this.vizTechScore = stats.vizTechScore ?? 0;
        this.vizTechScorePercentage = stats.vizTechScorePercentage ?? 0;
        this.pairingRotationVizTechScore = stats.pairingRotationVizTechScore ?? 0;
        this.pairingRotationVizTechScorePercentage = stats.pairingRotationVizTechScorePercentage ?? 0;
        this.pairingAssignmentVizTechScore = stats.pairingAssignmentVizTechScore ?? 0;
        this.pairingAssignmentVizTechScorePercentage = stats.pairingAssignmentVizTechScorePercentage ?? 0;
        this.pairingFrequencyVizTechScore = stats.pairingFrequencyVizTechScore ?? 0;
        this.pairingFrequencyVizTechScorePercentage = stats.pairingFrequencyVizTechScorePercentage ?? 0;
        this.overallVizTechScorePercentage = stats.overallVizTechScorePercentage ?? 0;
        this.overallBaselineScore = stats.overallBaselineScore ?? 0;
        this.pairingEfficiencyBaselineScore = stats.pairingEfficiencyBaselineScore ?? 0;
        this.pairingRotationBaselineScore = stats.pairingRotationBaselineScore ?? 0;
        this.pairingAssignmentBaselineScore = stats.pairingAssignmentBaselineScore ?? 0;
        this.pairingFrequencyBaselineScore = stats.pairingFrequencyBaselineScore ?? 0;
        this.totalTeams = stats.totalTeams ?? 0;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit() {
    localStorage.removeItem('baselineData'); // Purge baseline data from localStorage
    this.pairingScorecardApiService.getBaselineScores().subscribe(scores => {
      console.log('Baseline scores from API:', scores);
      this.pairingEfficiencyBaselineScore = scores.efficiency ?? 0;
      this.pairingRotationBaselineScore = scores.rotation ?? 0;
      this.pairingAssignmentBaselineScore = scores.assignment ?? 0;
      this.pairingFrequencyBaselineScore = scores.frequency ?? 0;
      this.updateChartData();
      this.cdr.detectChanges();
    });
  }

  // Method to load baseline data
  loadBaselineData() {
    this.pairingScorecardApiService.getFinalScorecards().subscribe(
      (response: any) => {
        const baseline = Array.isArray(response) ? response[0] : (response.data ? response.data[0] : response);

        this.overallBaselineScore = baseline.overallBaselineScore ?? 0;
        this.pairingEfficiencyBaselineScore = baseline.pairingEfficiencyBaselineScore ?? 0;
        this.pairingAssignmentBaselineScore = baseline.pairingAssignmentBaselineScore ?? 0;
        this.pairingRotationBaselineScore = baseline.pairingRotationBaselineScore ?? 0;
        this.pairingFrequencyBaselineScore = baseline.pairingFrequencyBaselineScore ?? 0;

        localStorage.setItem('baselineData', JSON.stringify(baseline));
        this.updateChartData();
        this.cdr.detectChanges();
      },
      (error: any) => {
        // Fallback to localStorage if API fails
        const storedBaselineData = localStorage.getItem('baselineData');
        if (storedBaselineData) {
          try {
            const baselineData = JSON.parse(storedBaselineData);
            this.overallBaselineScore = baselineData.overallBaselineScore;
            this.pairingEfficiencyBaselineScore = baselineData.pairingEfficiencyBaselineScore;
            this.pairingRotationBaselineScore = baselineData.pairingRotationBaselineScore;
            this.pairingAssignmentBaselineScore = baselineData.pairingAssignmentBaselineScore;
            this.pairingFrequencyBaselineScore = baselineData.pairingFrequencyBaselineScore;
            this.updateChartData();
            this.cdr.detectChanges();
          } catch (e) {
            console.error('Error loading stored baseline data:', e);
          }
        }
        console.error('Error loading baseline data from API:', error);
      }
    );
  }

  // Method to clear stored baseline data
  clearBaselineData() {
    localStorage.removeItem('baselineData');
    this.isBaselineLoaded = false;
    this.overallBaselineScore = 0;
    this.pairingEfficiencyBaselineScore = 0;
    this.pairingRotationBaselineScore = 0;
    this.pairingAssignmentBaselineScore = 0;
    this.pairingFrequencyBaselineScore = 0;
    this.updateChartData();
    this.cdr.detectChanges();
  }

  // Helper method to parse percentage values
  private parsePercentageValue(value: any): number {
    if (typeof value === 'number') {
      return value <= 1 ? value * 100 : value;
    }
    if (typeof value === 'string') {
      const cleanValue = value.replace(/[^0-9.-]/g, '');
      const number = parseFloat(cleanValue);
      return !isNaN(number) ? (number <= 1 ? number * 100 : number) : 0;
    }
    return 0;
  }

  // Method to initialize charts
  private initializeCharts(): void {
    // Initialize chart configurations
      this.activityChartData = {
        labels: ['Overall Score', 'Pairing Efficiency', 'Pairing Assignment', 'Pairing Rotation', 'Pairing Frequency'],
        datasets: [
          {
            label: 'Baseline',
            data: [
              this.overallBaselineScore,
              this.pairingEfficiencyBaselineScore,
              this.pairingAssignmentBaselineScore,
              this.pairingRotationBaselineScore,
              this.pairingFrequencyBaselineScore
            ],
            backgroundColor: 'rgba(156, 163, 175, 0.9)',
            borderColor: 'rgba(156, 163, 175, 1)',
            borderWidth: 2,
            borderRadius: 5,
          hoverBorderWidth: 3,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'Current',
          data: [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(234, 88, 12, 0.9)',
          borderColor: 'rgba(234, 88, 12, 1)',
          borderWidth: 2,
          borderRadius: 5,
          hoverBorderWidth: 3,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }
      ]
    };
  }

  // Method to process baseline data
  private processBaselineData(data: any[]): void {
    try {
      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data format');
      }

      console.log('Full data array:', data);
      console.log('First row sample:', data[0]);
      console.log('Available columns in first row:', Object.keys(data[0] || {}));

      // Try different possible column names for Team Name
      const possibleTeamColumns = ['Team Name', 'Team', 'TeamName', 'Name'];
      let teamNameColumn = possibleTeamColumns.find(col => data[0]?.hasOwnProperty(col)) || 'Team Name';

      // Find the VizTech Score row with more flexible matching
      const vizTechScoreRow = data.find(row => {
        const teamName = String(row[teamNameColumn] || '').toLowerCase().trim();
        console.log('Checking team name:', teamName);
        return teamName.includes('viztech') || teamName.includes('viz tech');
      });

      if (!vizTechScoreRow) {
        console.error('Could not find VizTech Score row. Available rows:', 
          data.map(row => row[teamNameColumn]).filter(Boolean));
        this.errorMessage = 'Could not find VizTech Score row. Please check the file format.';
        return;
      }

      console.log('Found VizTech Score row:', vizTechScoreRow);

      // Log all available columns in the found row
      console.log('Available columns in VizTech Score row:', Object.keys(vizTechScoreRow));

      // Extract baseline scores with more robust parsing
      const baselineScores = {
        pairingEfficiency: this.parsePercentageValue(
          vizTechScoreRow['Baseline PairingEfficiency Score(%)'] ||
          vizTechScoreRow['Baseline Pairing Efficiency Score(%)'] ||
          vizTechScoreRow['Baseline Efficiency Score(%)'] ||
          vizTechScoreRow['Baseline Efficiency'] ||
          vizTechScoreRow['Pairing Efficiency Baseline'] ||
          0
        ),
        pairingRotation: this.parsePercentageValue(
          vizTechScoreRow['Baseline Pairing Rotation Score(%)'] ||
          vizTechScoreRow['Baseline Rotation Score(%)'] ||
          vizTechScoreRow['Baseline Rotation'] ||
          vizTechScoreRow['Pairing Rotation Baseline'] ||
          0
        ),
        pairingAssignment: this.parsePercentageValue(
          vizTechScoreRow['Baseline Pairing Assignment Score(%)'] ||
          vizTechScoreRow['Baseline Assignment Score(%)'] ||
          vizTechScoreRow['Baseline Assignment'] ||
          vizTechScoreRow['Pairing Assignment Baseline'] ||
          0
        ),
        pairingFrequency: this.parsePercentageValue(
          vizTechScoreRow['Baseline PairingFrequency Score(%)'] ||
          vizTechScoreRow['Baseline Frequency Score(%)'] ||
          vizTechScoreRow['Baseline Frequency'] ||
          vizTechScoreRow['Pairing Frequency Baseline'] ||
          0
        )
      };

      console.log('Extracted baseline scores:', baselineScores);

      // Calculate overall baseline score (average of all scores)
      const overallBaselineScore = Math.round(
        (baselineScores.pairingEfficiency + 
         baselineScores.pairingRotation + 
         baselineScores.pairingAssignment + 
         baselineScores.pairingFrequency) / 4
      );

      // Update component properties
      this.overallBaselineScore = overallBaselineScore;
      this.pairingEfficiencyBaselineScore = Math.round(baselineScores.pairingEfficiency);
      this.pairingRotationBaselineScore = Math.round(baselineScores.pairingRotation);
      this.pairingAssignmentBaselineScore = Math.round(baselineScores.pairingAssignment);
      this.pairingFrequencyBaselineScore = Math.round(baselineScores.pairingFrequency);

      // Store baseline data in localStorage
      const baselineDataToStore = {
        overallBaselineScore: this.overallBaselineScore,
        pairingEfficiencyBaselineScore: this.pairingEfficiencyBaselineScore,
        pairingRotationBaselineScore: this.pairingRotationBaselineScore,
        pairingAssignmentBaselineScore: this.pairingAssignmentBaselineScore,
        pairingFrequencyBaselineScore: this.pairingFrequencyBaselineScore,
        timestamp: new Date().getTime()
      };

      localStorage.setItem('baselineData', JSON.stringify(baselineDataToStore));
      console.log('Stored baseline data:', baselineDataToStore);

      // Update service with new data
      this.dashboardService.setBaselineLoaded(true);
      this.isBaselineLoaded = true;
      this.showSuccess = true;

      // Update charts
      this.updateChartData();
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error processing baseline data:', error);
      this.errorMessage = 'Error processing baseline data. Please check the file format and try again.';
    }
  }

  onFileChange(event: Event): void {
    if (!this.fileInput) {
      this.errorMessage = 'File input not initialized';
      return;
    }

    const input = this.fileInput.nativeElement as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      this.errorMessage = 'No file selected';
      return;
    }
    
      this.isLoading = true;
      this.errorMessage = '';

      const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file');
        }
        this.processExcelData(e.target.result as ArrayBuffer);
        } catch (error) {
        this.errorMessage = 'Error processing file: ' + (error instanceof Error ? error.message : 'Unknown error');
          this.isLoading = false;
        }
      };

      reader.onerror = () => {
      this.errorMessage = 'Error reading file';
        this.isLoading = false;
    };

    reader.readAsArrayBuffer(files[0]);
  }

  private processExcelData(data: ArrayBuffer): void {
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet1 = workbook.Sheets['Sheet1'];
      if (!sheet1) {
        throw new Error('Sheet1 not found in Excel file');
      }
      
      const sheet1Data = XLSX.utils.sheet_to_json(sheet1) as Sheet1Row[];
      if (!sheet1Data || sheet1Data.length === 0) {
        throw new Error('No data found in Sheet1');
      }

      // Process your data here
      this.updateChartData();
      this.isLoading = false;
          } catch (error) {
      this.errorMessage = 'Error processing Excel data: ' + (error instanceof Error ? error.message : 'Unknown error');
            this.isLoading = false;
    }
  }

  // Add new method to load current scores
  loadCurrentScores(event?: any): void {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (fileEvent: any) => {
      const file = fileEvent.target.files[0];
      if (file) {
        this.isLoading = true;
        this.errorMessage = '';
        this.showSuccess = false;

        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const arrayBuffer = new Uint8Array(e.target.result);
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            // Get and process Total Scores sheet
            const totalScoresSheet = workbook.Sheets['Total Scores'];
            if (totalScoresSheet) {
              const totalScoresData = XLSX.utils.sheet_to_json(totalScoresSheet);
              console.log('Loaded data from Total Scores sheet:', totalScoresData);
              this.processCurrentScores(totalScoresData);
              this.isCurrentScoresLoaded = true;
            } else {
              console.error('Total Scores sheet not found');
            }
            
            // Get and process Rotation Frequency sheet
            const rotationFrequencySheet = workbook.Sheets['Rotation Frequency'];
            if (rotationFrequencySheet) {
              const rotationFrequencyData = XLSX.utils.sheet_to_json(rotationFrequencySheet);
              const totalRows = rotationFrequencyData.length;
              
              if (totalRows > 0) {
                console.log('Processing Rotation Frequency data:', rotationFrequencyData);
                
                const ROTATION_LABELS = ['Daily', 'Per Story', 'Ad Hoc', 'Per Sprint', 'Weekly'];
                type RotationDescriptor = typeof ROTATION_LABELS[number];
                
                // Initialize counters for each category
                const counts: Record<RotationDescriptor, number> = {
                  'Daily': 0,
                  'Per Story': 0,
                  'Ad Hoc': 0,
                  'Per Sprint': 0,
                  'Weekly': 0
                };
                
                // Count occurrences of each descriptor
                rotationFrequencyData.forEach((row: any) => {
                  const rawDescriptor = row['Selected Descriptor'];
                  if (typeof rawDescriptor === 'string' && ROTATION_LABELS.includes(rawDescriptor as RotationDescriptor)) {
                    counts[rawDescriptor as RotationDescriptor]++;
                  }
                });

                // Calculate percentages
                const percentages = Object.entries(counts).map(([_, count]) => 
                  Math.round((count / totalRows) * 100)
                );

                console.log('Rotation counts:', counts);
                console.log('Total rows:', totalRows);
                console.log('Calculated percentages:', percentages);

                // Update rotation chart data with all percentages
                this.rotationChartData = {
                  labels: ROTATION_LABELS,
                  datasets: [{
                    data: percentages,
                    backgroundColor: [
                      'rgba(139, 92, 246, 0.9)',   // Purple for Daily
                      'rgba(245, 158, 11, 0.9)',   // Yellow for Per Story
                      'rgba(156, 163, 175, 0.9)',  // Gray for Ad Hoc
                      'rgba(59, 130, 246, 0.9)',   // Blue for Per Sprint
                      'rgba(16, 185, 129, 0.9)'    // Green for Weekly
                    ],
                    borderColor: [
                      'rgba(139, 92, 246, 1)',
                      'rgba(245, 158, 11, 1)',
                      'rgba(156, 163, 175, 1)',
                      'rgba(59, 130, 246, 1)',
                      'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10,
                    offset: 5
                  }]
                };
              }
            } else {
              console.error('Rotation Frequency sheet not found');
            }

            // Define the constants and types at class level
            const ASSIGNMENT_LABELS = [
              'Missing',
              'Assigned by PO/Scrum Master',
              'Anchor/Lead-Assigned/Based on Expertise',
              'Manually Formed',
              'Randomized Via Tool'
            ] as const;

            type AssignmentDescriptor = (typeof ASSIGNMENT_LABELS)[number];

            // Inside loadCurrentScores method, update the Pairing Assignment processing section
            // Get and process Pairing Assignment sheet
            const pairingAssignmentSheet = workbook.Sheets['Pairing Assignment'];
            if (pairingAssignmentSheet) {
              const pairingAssignmentData = XLSX.utils.sheet_to_json(pairingAssignmentSheet) as Array<{ 'Selected Descriptor': string }>;
              const totalRows = pairingAssignmentData.length;
              
              if (totalRows > 0) {
                console.log('Processing Pairing Assignment data:', pairingAssignmentData);
                
                // Initialize counters for each category
                const counts: Record<string, number> = {
                  'Missing': 0,
                  'Assigned by PO/Scrum Master': 0,
                  'Anchor/Lead-Assigned/Based on Expertise': 0,
                  'Manually Formed': 0,
                  'Randomized Via Tool': 0
                };

                // Map Excel descriptors to our categories
                const descriptorMapping: Record<string, string> = {
                  'Formed Ad Hoc Manually': 'Manually Formed',
                  'Anchor/Lead Assigned/Based on Expertise': 'Anchor/Lead-Assigned/Based on Expertise',
                  'Randomized Via Tool': 'Randomized Via Tool'
                };
                
                // Count occurrences of each descriptor
                pairingAssignmentData.forEach(row => {
                  const descriptor = row['Selected Descriptor'];
                  console.log('Processing descriptor:', descriptor);
                  
                  if (typeof descriptor === 'string') {
                    // Map the descriptor if it exists in our mapping, otherwise use as is
                    const mappedDescriptor = descriptorMapping[descriptor] || descriptor;
                    console.log('Mapped descriptor:', mappedDescriptor);
                    
                    if (counts.hasOwnProperty(mappedDescriptor)) {
                      counts[mappedDescriptor]++;
                    } else {
                      console.log('Unmatched descriptor:', descriptor, 'Mapped to:', mappedDescriptor);
                    }
                  }
                });

                // Log the final counts
                console.log('Final counts:', JSON.stringify(counts, null, 2));

                // Calculate total (excluding 'Missing' category)
                const totalAssignments = Object.entries(counts)
                  .filter(([category]) => category !== 'Missing')
                  .reduce((sum, [_, count]) => sum + count, 0);

                console.log('Total assignments (excluding Missing):', totalAssignments);

                // Calculate percentages based on non-missing total
                const percentages = Object.entries(counts).map(([category, count]) => {
                  if (totalAssignments === 0) return 0;
                  return Math.round((count / totalAssignments) * 100);
                });

                console.log('Calculated percentages:', percentages);

                // Update assignment chart data with all percentages
                this.assignmentChartData = {
                  labels: [
                    'Missing',
                    'Assigned by PO/Scrum Master',
                    'Anchor/Lead-Assigned/Based on Expertise',
                    'Manually Formed',
                    'Randomized Via Tool'
                  ],
                  datasets: [{
                    data: percentages,
                    backgroundColor: [
                      'rgba(156, 163, 175, 0.9)',  // Gray for Missing
                      'rgba(59, 130, 246, 0.9)',   // Blue for PO/Scrum Master
                      'rgba(16, 185, 129, 0.9)',   // Green for Anchor/Lead
                      'rgba(245, 158, 11, 0.9)',   // Yellow for Manually Formed
                      'rgba(139, 92, 246, 0.9)'    // Purple for Randomized
                    ],
                    borderColor: [
                      'rgba(156, 163, 175, 1)',
                      'rgba(59, 130, 246, 1)',
                      'rgba(16, 185, 129, 1)',
                      'rgba(245, 158, 11, 1)',
                      'rgba(139, 92, 246, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10,
                    offset: 5
                  }]
                };
              }
            } else {
              console.error('Pairing Assignment sheet not found');
            }

            // Get and process Pairing Efficiency sheet
            const pairingEfficiencySheet = workbook.Sheets['Pairing Efficiency'];
            if (pairingEfficiencySheet) {
              const pairingEfficiencyData = XLSX.utils.sheet_to_json(pairingEfficiencySheet) as Array<{ 'Selected Descriptor': string }>;
              const totalRows = pairingEfficiencyData.length;
              
              if (totalRows > 0) {
                console.log('Processing Pairing Efficiency data:', pairingEfficiencyData);
                
                // Initialize counters for each category
                const counts: Record<string, number> = {
                  'Missing': 0,
                  'Inefficient': 0,
                  'Marginal': 0,
                  'Adequate': 0,
                  'Effective': 0,
                  'Optimal': 0
                };
                
                // Count occurrences of each descriptor
                pairingEfficiencyData.forEach((row: { 'Selected Descriptor': string }) => {
                  const descriptor = row['Selected Descriptor'];
                  console.log('Processing efficiency descriptor:', descriptor);
                  
                  if (descriptor && counts.hasOwnProperty(descriptor)) {
                    counts[descriptor]++;
                  } else {
                    console.log('Unmatched descriptor:', descriptor);
                  }
                });

                // Log the final counts
                console.log('Efficiency counts:', JSON.stringify(counts, null, 2));
                console.log('Total efficiency rows:', totalRows);

                // Calculate total (excluding 'Missing' category)
                const totalNonMissing = Object.entries(counts)
                  .filter(([category]) => category !== 'Missing')
                  .reduce((sum, [_, count]) => sum + count, 0);

                console.log('Total non-missing rows:', totalNonMissing);

                // Calculate percentages based on non-missing total
                const percentages = Object.entries(counts).map(([category, count]) => {
                  const percentage = totalNonMissing > 0 ? Math.round((count / totalNonMissing) * 100) : 0;
                  console.log(`${category} percentage:`, percentage);
                  return percentage;
                });

                console.log('Final percentages:', percentages);

                // Update efficiency chart data with all percentages
                this.efficiencyChartData = {
                  labels: [
                    'Missing',
                    'Inefficient',
                    'Marginal',
                    'Adequate',
                    'Effective',
                    'Optimal'
                  ],
                  datasets: [{
                    data: percentages,
                    backgroundColor: [
                      'rgba(156, 163, 175, 0.9)',  // Gray for Missing
                      'rgba(239, 68, 68, 0.9)',    // Red for Inefficient
                      'rgba(245, 158, 11, 0.9)',   // Yellow for Marginal
                      'rgba(59, 130, 246, 0.9)',   // Blue for Adequate
                      'rgba(16, 185, 129, 0.9)',   // Green for Effective
                      'rgba(139, 92, 246, 0.9)'    // Purple for Optimal
                    ],
                    borderColor: [
                      'rgba(156, 163, 175, 1)',
                      'rgba(239, 68, 68, 1)',
                      'rgba(245, 158, 11, 1)',
                      'rgba(59, 130, 246, 1)',
                      'rgba(16, 185, 129, 1)',
                      'rgba(139, 92, 246, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10,
                    offset: 5
                  }]
                };

                // Force chart update
                this.cdr.detectChanges();
                setTimeout(() => this.cdr.detectChanges(), 0);
                setTimeout(() => this.cdr.detectChanges(), 100);
              }
            }

            this.showSuccess = true;
          } catch (error) {
            console.error('Error processing file:', error);
            this.errorMessage = 'Error processing the Excel file. Please check the format and try again.';
          } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
            setTimeout(() => this.cdr.detectChanges(), 0);
            setTimeout(() => this.cdr.detectChanges(), 100);
          }
        };

        reader.onerror = () => {
          this.isLoading = false;
          this.errorMessage = 'Error reading the file. Please try again.';
          this.cdr.detectChanges();
        };

        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  }

  // Add method to process current scores
  private processCurrentScores(data: any[]): void {
    try {
      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data format');
      }

      console.log('Processing current scores from Total Scores sheet:', data);

      // Find the VizTech Score(%) row
      const vizTechScorePercentageRow = data.find(row => row['Team Name'] === 'VizTech Score(%)');
      if (!vizTechScorePercentageRow) {
        console.error('VizTech Score(%) row not found:', data);
        this.errorMessage = 'Could not find VizTech Score(%) row in Total Scores sheet.';
      return;
    }

      console.log('Found VizTech Score(%) row:', vizTechScorePercentageRow);

      // Extract VizTech Score (%) for each card from their corresponding columns
      const efficiencyScore = this.parseNumericValue(vizTechScorePercentageRow['Numeric Input -Pairing Efficiency']);
      const assignmentScore = this.parseNumericValue(vizTechScorePercentageRow['Numeric Input -Pairing Assignment']);
      const rotationScore = this.parseNumericValue(vizTechScorePercentageRow['Numeric Input -Pairing Rotation']);
      const frequencyScore = this.parseNumericValue(vizTechScorePercentageRow['Numeric Input -Pairing Frequency']);

      // Update the VizTech Score (%) for each card
      this.vizTechScorePercentage = Math.round(efficiencyScore);  // Current Pairing Efficiency
      this.pairingAssignmentVizTechScorePercentage = Math.round(assignmentScore);  // Current Pairing Assignment
      this.pairingRotationVizTechScorePercentage = Math.round(rotationScore);  // Current Pairing Rotation
      this.pairingFrequencyVizTechScorePercentage = Math.round(frequencyScore);  // Current Pairing Frequency

      console.log('Updated VizTech Score (%) for each card:', {
        efficiency: this.vizTechScorePercentage,
        assignment: this.pairingAssignmentVizTechScorePercentage,
        rotation: this.pairingRotationVizTechScorePercentage,
        frequency: this.pairingFrequencyVizTechScorePercentage
      });

      // Set current scores as loaded and show success
      this.isCurrentScoresLoaded = true;
      this.showSuccess = true;

      // Trigger change detection
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error processing current scores:', error);
      this.errorMessage = 'Error processing score data. Please check the file format.';
    }
  }

  // Helper method to parse numeric values
  private parseNumericValue(value: any): number {
    if (typeof value === 'number') {
      return value <= 1 ? value * 100 : value;
    }
    if (typeof value === 'string') {
      const cleanValue = value.replace(/[^0-9.-]/g, '');
      const number = parseFloat(cleanValue);
      return !isNaN(number) ? (number <= 1 ? number * 100 : number) : 0;
    }
    return 0;
  }

  private updateStats(): void {
    // Update active pairs stats
    this.activePairs = Number((this.totalTeams * (this.activeRate / 100)).toFixed(2));
    this.weeklyActiveChange = Number(((this.activeRate - this.baselineScorePercentage) * 100) / 100);

    // Update completion stats
    this.completedPairs = Number((this.totalTeams * (this.completionRate / 100)).toFixed(2));
    this.monthlyCompletionChange = Number(((this.completionRate - this.baselineScorePercentage) * 100) / 100);

    // Update score stats
    this.scoreGap = Number((this.targetScore - this.averageScore).toFixed(2));
    this.onTargetPercentage = Number(((this.onTarget / this.totalTeams) * 100).toFixed(2));

    // Update rotation scores
    this.pairingRotationVizTechScorePercentage = Number(this.pairingRotationVizTechScore.toFixed(2));

    // Update assignment scores
    this.pairingAssignmentVizTechScorePercentage = Number(this.pairingAssignmentVizTechScore.toFixed(2));

    // Update frequency scores
    this.pairingFrequencyVizTechScorePercentage = Number(this.pairingFrequencyVizTechScore.toFixed(2));
  }

  private updateAllChartData(): void {
    const ensureNumberArray = (data: any[]): number[] => {
      return data.map(value => typeof value === 'number' ? value : 0);
    };

    const createPieDataset = (dataset: any): ChartDataset<'pie', number[]> => ({
      data: ensureNumberArray(dataset.data),
      backgroundColor: dataset.backgroundColor || [],
      hoverBackgroundColor: dataset.hoverBackgroundColor || [],
      borderWidth: 0
    });

    const createBarDataset = (dataset: any): ChartDataset<'bar', number[]> => ({
      data: ensureNumberArray(dataset.data),
      backgroundColor: dataset.backgroundColor || [],
      borderColor: dataset.borderColor || [],
      borderWidth: dataset.borderWidth || 0,
      borderRadius: dataset.borderRadius || 0,
      barThickness: dataset.barThickness || 20
    });

    // Update score chart
    if (this.scoreChartData.datasets) {
      this.scoreChartData.datasets = this.scoreChartData.datasets.map(createPieDataset);
    }

    // Update activity chart
    if (this.activityChartData.datasets) {
      this.activityChartData.datasets = this.activityChartData.datasets.map(createBarDataset);
    }

    // Update frequency chart
    if (this.frequencyChartData.datasets) {
      this.frequencyChartData.datasets = this.frequencyChartData.datasets.map(createPieDataset);
    }

    // Update rotation chart
    if (this.rotationChartData.datasets) {
      this.rotationChartData.datasets = this.rotationChartData.datasets.map(createPieDataset);
    }

    // Update assignment chart
    if (this.assignmentChartData.datasets) {
      this.assignmentChartData.datasets = this.assignmentChartData.datasets.map(createPieDataset);
    }

    // Update efficiency chart
    if (this.efficiencyChartData.datasets) {
      this.efficiencyChartData.datasets = this.efficiencyChartData.datasets.map(createBarDataset);
    }

    // Trigger change detection
    this.cdr.detectChanges();
  }

  private updateChartData(): void {
    if (this.activityChartData && this.activityChartData.datasets) {
      // Update baseline dataset
      this.activityChartData.datasets[0].data = [
        this.overallBaselineScore,
        this.pairingEfficiencyBaselineScore,
        this.pairingAssignmentBaselineScore,
        this.pairingRotationBaselineScore,
        this.pairingFrequencyBaselineScore
      ];

      // Force chart update
      this.cdr.detectChanges();
    }
  }
} 