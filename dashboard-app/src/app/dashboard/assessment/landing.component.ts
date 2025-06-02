import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DashboardAssessmentService } from '../../services/dashboardAssessment.service';
import * as XLSX from 'xlsx';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartDataset,
  ChartTypeRegistry
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';


// Register Chart.js components
Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface SuggestionCount {
  text: string;
  count: number;
}

interface ChallengeCount {
  text: string;
  count: number;
}

// Add new interface for pair partner roles
interface PairPartnerRoleCount {
  category: string;
  count: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule, 
    NgChartsModule, 
    StatCardComponent, 
    RecentActivityComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header Section with Upload Button -->
      <div class="bg-gray-50 border-b border-gray-200">
        <div class="container mx-auto py-3">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800">QE Pairing Assessment Dashboard</h1>
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
            <span class="block sm:inline"> Data refreshed successfully.</span>
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
            title="Mentors"
            [value]="mentorsCount + '     (' + mentorsPct + '%)'"
            iconClass="fas fa-user-tie"
            iconBgColor="bg-green-500"
          ></app-stat-card>
          <app-stat-card
            title="Mentees"
            [value]="menteesCount + '     (' + menteesPct + '%)'"
            iconClass="fas fa-users"
            iconBgColor="bg-blue-500"
          ></app-stat-card>
          <app-stat-card
            title="N/A (Pair with other QE on team)"
            [value]="pairCount + '     (' + pairPct + '%)'"
            iconClass="fas fa-user-friends"
            iconBgColor="bg-purple-500"
          ></app-stat-card>
          <app-stat-card
            title="Total Response"
            [value]="totalResponse.toString()"
            iconClass="fas fa-reply-all"
            iconBgColor="bg-yellow-500"
          ></app-stat-card>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Pairing Hours</h2>
            <div class="h-64">
              <canvas #pairinghoursChart="base-chart" baseChart
                [data]="lineChartData"
                [options]="lineChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Pairing Effectiveness</h2>
            <div class="h-64">
              <canvas #effectivenessChart="base-chart" baseChart
                [data]="barChartData"
                [options]="barChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Pairing Feedback and Activities Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Pairing Activities</h2>
            <div class="h-64">
              <canvas #activityChart="base-chart" baseChart
                [data]="activityChartData"
                [options]="activityChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Pairing Feedback</h2>
            <div class="h-64">
                  <canvas #feedbackChart="base-chart" baseChart
                    [data]="barChartData"
                [options]="barChartOptions"
                [type]="'bar'">
                  </canvas>
            </div>
          </div>
        </div>

        <!-- Suggestions and Challenges Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-2">Suggestions for Improvement</h2>
            <div class="flex-1 overflow-y-auto pr-2" style="max-height: 240px;">
              @if (suggestions.length) {
                <div class="space-y-3">
                  @for (suggestion of suggestions; track suggestion.text) {
                    <div class="bg-gray-50 p-3 rounded-lg">
                      <p class="text-sm text-gray-600">{{ suggestion.text }}</p>
                      <div class="mt-1">
                        <span class="text-xs font-medium text-gray-500">{{ suggestion.count }} similar response{{ suggestion.count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center text-gray-500 py-3">
                  No suggestions available. Please refresh the data.
                </div>
              }
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
              <h2 class="text-lg font-semibold mb-2">Challenges</h2>
              <div class="flex-1 overflow-y-auto pr-2" style="max-height: 240px;">
              @if (challenges.length) {
                  <div class="space-y-3">
                    @for (challenge of challenges; track challenge.text) {
                      <div class="bg-gray-50 p-3 rounded-lg border-l-4 border-orange-500">
                            <p class="text-sm text-gray-600">{{ challenge.text }}</p>
                      <div class="mt-1">
                              <span class="text-xs font-medium text-gray-500">{{ challenge.count }} similar response{{ challenge.count > 1 ? 's' : '' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center text-gray-500 py-3">
                    No challenges reported. Please refresh the data.
                  </div>
                }
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
  changeDetection: ChangeDetectionStrategy.Default
})
export class AssessmentComponent implements OnInit, AfterViewInit {
  @ViewChild('pairinghoursChart') pairinghoursChart?: BaseChartDirective;
  @ViewChild('effectivenessChart') effectivenessChart?: BaseChartDirective;
  @ViewChild('feedbackChart') feedbackChart?: BaseChartDirective;
  @ViewChild('activityChart') activityChart?: BaseChartDirective;
  
  currentYear = new Date().getFullYear();

  // Initialize counters
  mentorsCount: number = 0;
  menteesCount: number = 0;
  pairCount: number = 0;
  totalResponse: number = 0;
  mentorsPct: number = 0;
  menteesPct: number = 0;
  pairPct: number = 0;

  // Line Chart Configuration
  lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [0, 0, 0, 0],
        label: 'Number of QEs',
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',  // Blue
          'rgba(16, 185, 129, 0.6)',  // Green
          'rgba(245, 158, 11, 0.6)',  // Yellow
          'rgba(139, 92, 246, 0.6)',  // Purple
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
      }
    ],
    labels: ['0-1 hr weekly', '2 hrs weekly', '3 hrs weekly', '>3 hrs weekly']
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 5  // Reduce bottom padding
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const chartData = context.chart.data as any;
            const value = context.raw;
            const idx = context.dataIndex;
            const pct = chartData.percentages ? chartData.percentages[idx] : null;
            return pct !== null && pct !== undefined
              ? `Number of QEs: ${value} (${pct}%)`
              : `Number of QEs: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        title: {
          display: true,
          text: 'Number of QEs'
        }
      },
      x: {
        grid: {
          display: false
        },
        title: {
          display: true,
          text: 'Pairing Hours'
        }
      }
    }
  };

  // Bar Chart Configuration
  barChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        label: 'Agree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(16, 185, 129, 0.6)', // Green
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      },
      {
        label: 'Strongly Agree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Neither Agree nor Disagree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(245, 158, 11, 0.6)', // Yellow
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      },
      {
        label: 'Disagree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      },
      {
        label: 'Strongly Disagree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(139, 92, 246, 0.6)', // Purple
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1
      }
    ],
    labels: [
      'Gained valuable insights\nand skills',
      'Efficiently helped tackle challenges',
      'Reinforced standardized practices\nacross teams',
      'Aided professional\ndevelopment',
      'Fostered collaboration \nand knowledge-sharing'
    ]
  };

  barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',  // This makes it a horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 5  // Reduce bottom padding
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 10,  // Reduce padding between legend items
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} QEs`;
          }
        }
      }
    },
    scales: {
      x: {  // This was previously y
        beginAtZero: true,
        ticks: {
          stepSize: 5,
          font: {
            size: 10
          }
        },
        title: {
          display: true,
          text: 'Number of QEs',
          font: {
            size: 11
          }
        },
        stacked: true
      },
      y: {  // This was previously x
        grid: {
          display: false
        },
        title: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          // No need for callback here as the labels will display naturally
        },
        stacked: true
      }
    }
  };

  // Doughnut Chart Configuration (now a horizontal bar chart)
  doughnutChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        label: 'Agree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(16, 185, 129, 0.6)', // Green
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      },
      {
        label: 'Strongly Agree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Neither Agree nor Disagree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(245, 158, 11, 0.6)', // Yellow
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      },
      {
        label: 'Disagree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      },
      {
        label: 'Strongly Disagree',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(139, 92, 246, 0.6)', // Purple
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1
      }
    ],
    labels: [
      'Gained valuable insights\nand skills',
      'Efficiently helped tackle\nchallenges',
      'Reinforced standardized practices\nacross teams',
      'Aided professional\ndevelopment',
      'Fostered collaboration\nand knowledge-sharing'
    ]
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 5  // Reduce bottom padding
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 10,  // Reduce padding between legend items
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} QEs`;
          }
        }
      }
    },
    scales: {
      x: {  // This was previously y
        beginAtZero: true,
        ticks: {
          stepSize: 5,
          font: {
            size: 10
          }
        },
        title: {
          display: true,
          text: 'Number of QEs',
          font: {
            size: 11
          }
        },
        stacked: true
      },
      y: {  // This was previously x
        grid: {
          display: false
        },
        title: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        },
        stacked: true
      }
    }
  };

  // Activity Chart Configuration
  activityChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',  // Blue
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }]
  };

  activityChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const chartData = context.chart.data as any;
            const value = context.raw;
            const idx = context.dataIndex;
            const pct = chartData.percentages ? chartData.percentages[idx] : null;
            return pct !== null && pct !== undefined
              ? `${value} QEs (${pct}%)`
              : `${value} QEs`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        title: {
          display: true,
          text: 'Number of QEs'
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  suggestions: SuggestionCount[] = [];
  challenges: { text: string; count: number }[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  showSuccess: boolean = false;

  // Define chart type explicitly
  chartType: ChartType = 'doughnut';

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dashboardAssessmentService: DashboardAssessmentService
  ) {}

  ngAfterViewInit() {
    // Initialize charts after view is ready
    this.ngZone.run(() => {
    setTimeout(() => {
      this.initializeCharts();
        this.cdr.markForCheck();
      });
    });
  }

  ngOnInit() {
    // Subscribe to partner roles stats
    this.dashboardAssessmentService['statsSubject'].subscribe(stats => {
      if (stats) {
        this.mentorsCount = stats.mentors;
        this.mentorsPct = stats.mentorsPct;
        this.menteesCount = stats.mentees;
        this.menteesPct = stats.menteesPct;
        this.pairCount = stats.pair;
        this.pairPct = stats.pairPct;
        this.totalResponse = stats.total;
        this.cdr.detectChanges();
      }
    });
    // Initialize data
  this.dashboardAssessmentService.PairingActivitiesChartData$.subscribe(data => {
    console.log('PairingActivitiesChartData$ subscription received:', data);
    if (data) {
      this.activityChartData = data;
      this.cdr.detectChanges();
    }
  });
  this.dashboardAssessmentService.PairingEffectivenessChartData$.subscribe(data => {
    if (data) {
      this.barChartData = data;
      this.cdr.detectChanges();
    }
  });
  this.dashboardAssessmentService.PairingHoursChartData$.subscribe(data => {
    if (data) {
      this.lineChartData = data;
      this.cdr.detectChanges();
    }
  });
  this.dashboardAssessmentService.PairingFeedbackChartData$.subscribe(data => {
    if (data) {
      this.barChartData = data;
      this.cdr.detectChanges();
    }
  });
  // Subscribe to pairing challenges
  this.dashboardAssessmentService.PairingChallengesChartData$.subscribe(data => {
    if (data) {
      this.challenges = data;
      this.cdr.detectChanges();
    }
  });
  // Subscribe to pairing improvements
  this.dashboardAssessmentService.PairingImprovementsChartData$.subscribe(data => {
    if (data) {
      this.suggestions = data;
      this.cdr.detectChanges();
    }
  });
  }

  private initializeData() {
    // Initialize with default data
    this.activityChartData = {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',  // Blue
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    };
  }

  private initializeCharts() {
    console.log('Initializing charts...');
    if (this.feedbackChart?.chart) {
      this.feedbackChart.chart.update();
    }
    if (this.effectivenessChart?.chart) {
      this.effectivenessChart.chart.update();
    }
    if (this.pairinghoursChart?.chart) {
      this.pairinghoursChart.chart.update();
    }
    if (this.activityChart?.chart) {
      this.activityChart.chart.update();
    }
  }



  private updateChartData(
    frequencyData: Record<string, number>, 
    feedbackData: Record<string, number[]>,
    activityData: Record<string, number>
  ) {
    console.log('Starting updateChartData with:', {
      frequencyData,
      feedbackData,
      activityData
    });

    try {
      // Update frequency chart data
      if (this.lineChartData && this.lineChartData.datasets[0]) {
        const frequencyValues = [
          frequencyData['0-1 hr weekly'] || 0,
          frequencyData['2 hrs weekly'] || 0,
          frequencyData['3 hrs weekly'] || 0,
          frequencyData['>3 hrs weekly'] || 0
        ];
        console.log('Updating frequency chart with:', frequencyValues);
        this.lineChartData.datasets[0].data = frequencyValues;
      } else {
        console.warn('Frequency chart data structure is not properly initialized');
      }

      // Update efficiency chart data (barChartData)
      if (this.barChartData && this.barChartData.datasets) {
        const categories = ['Strongly Agree', 'Agree', 'Neither Agree nor Disagree', 'Disagree', 'Strongly Disagree'];
        categories.forEach((category, idx) => {
          if (this.barChartData.datasets[idx]) {
            console.log(`Updating efficiency chart category ${category} with:`, feedbackData[category]);
            this.barChartData.datasets[idx].data = feedbackData[category];
          }
        });
      } else {
        console.warn('Efficiency chart data structure is not properly initialized');
      }

      // Update feedback chart data (doughnutChartData)
      if (this.doughnutChartData && this.doughnutChartData.datasets) {
        const categories = ['Strongly Agree', 'Agree', 'Neither Agree nor Disagree', 'Disagree', 'Strongly Disagree'];
        categories.forEach((category, idx) => {
          if (this.doughnutChartData.datasets[idx]) {
            console.log(`Updating feedback chart category ${category} with:`, feedbackData[category]);
            this.doughnutChartData.datasets[idx].data = feedbackData[category];
          }
        });
      } else {
        console.warn('Feedback chart data structure is not properly initialized');
      }

      // Update activity chart data
      if (this.activityChartData && this.activityChartData.datasets[0]) {
        const sortedActivities = Object.entries(activityData)
          .filter(([_, count]) => count > 0)
          .sort(([_, a], [__, b]) => b - a);

        console.log('Sorted activities:', sortedActivities);

        this.activityChartData.labels = sortedActivities.map(([label]) => label);
        this.activityChartData.datasets[0].data = sortedActivities.map(([_, count]) => count);

        const numActivities = sortedActivities.length;
        this.activityChartData.datasets[0].backgroundColor = Array(numActivities)
          .fill(0)
          .map((_, i) => this.getBackgroundColor(i));
      } else {
        console.warn('Activity chart data structure is not properly initialized');
      }

      // Force chart updates
      console.log('Triggering chart updates...');
      this.updateCharts();

    } catch (error) {
      console.error('Error in updateChartData:', error);
      throw error;
    }
  }

  private updateCharts() {
    console.log('Updating charts...');
    console.log('Chart references:', {
      pairinghours: this.pairinghoursChart?.chart,
      effectiveness: this.effectivenessChart?.chart,
      feedback: this.feedbackChart?.chart,
      activity: this.activityChart?.chart
    });

    // Run chart updates inside NgZone to ensure proper change detection
    this.ngZone.run(() => {
      try {
        // Batch all chart updates together
        Promise.resolve().then(() => {
          if (this.pairinghoursChart?.chart) {
            this.pairinghoursChart.chart.update('none'); // Disable animations temporarily
            console.log('Frequency chart updated');
          }
          if (this.effectivenessChart?.chart) {
            this.effectivenessChart.chart.update('none');
            console.log('Efficiency chart updated');
          }
          if (this.feedbackChart?.chart) {
            this.feedbackChart.chart.update('none');
            console.log('Feedback chart updated');
          }
          if (this.activityChart?.chart) {
            this.activityChart.chart.update('none');
            console.log('Activity chart updated');
          }

          // Re-enable animations after updates
          if (this.pairinghoursChart?.chart) this.pairinghoursChart.chart.update();
          if (this.effectivenessChart?.chart) this.effectivenessChart.chart.update();
          if (this.feedbackChart?.chart) this.feedbackChart.chart.update();
          if (this.activityChart?.chart) this.activityChart.chart.update();

          // Mark for check instead of detectChanges to avoid ExpressionChangedAfterItHasBeenCheckedError
          this.cdr.markForCheck();
          console.log('Change detection triggered');
        });
      } catch (error) {
        console.error('Error updating charts:', error);
      }
    });
  }

  private getBackgroundColor(index: number): string {
    const colors = [
      'rgba(16, 185, 129, 0.6)',  // Green
      'rgba(59, 130, 246, 0.6)',  // Blue
      'rgba(245, 158, 11, 0.6)',  // Yellow
      'rgba(239, 68, 68, 0.6)',   // Red
      'rgba(139, 92, 246, 0.6)'   // Purple
    ];
    return colors[index % colors.length];
  }

  private getBorderColor(index: number): string {
    const colors = [
      'rgb(16, 185, 129)',   // Green
      'rgb(59, 130, 246)',   // Blue
      'rgb(245, 158, 11)',   // Yellow
      'rgb(239, 68, 68)',    // Red
      'rgb(139, 92, 246)'    // Purple
    ];
    return colors[index % colors.length];
  }
} 