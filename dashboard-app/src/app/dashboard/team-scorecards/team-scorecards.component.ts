import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { FormsModule } from '@angular/forms';

interface TeamScore {
  teamName: string;
  metrics: {
    baseline: {
      frequency: number;
      rotation: number;
      assignment: number;
      efficiency: number;
      overall: number;
    };
    current: {
      frequency: number;
      rotation: number;
      assignment: number;
      efficiency: number;
      overall: number;
    };
    target: {
      frequency: number;
      rotation: number;
      assignment: number;
      efficiency: number;
      overall: number;
    };
  };
}

@Component({
  selector: 'app-team-scorecards',
  standalone: true,
  imports: [CommonModule, RouterModule, NgChartsModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header Section with Navigation Tabs -->
      <div class="bg-gray-50 border-b border-gray-200">
        <div class="container mx-auto">
          <!-- Navigation Tabs -->
          <div class="flex border-b border-gray-200">
            <a routerLink="/final-scorecard"
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
          
          <!-- Page Header -->
          <div class="py-2">
            <div class="flex justify-between items-center">
              <h1 class="text-xl font-bold text-gray-800">Teams Pairing Scorecards</h1>
            </div>
          </div>

          <!-- Filter and Sort Controls -->
          <div class="py-2 flex items-center gap-4">
            <div class="flex-1 max-w-md relative">
              <button
                (click)="toggleDropdown()"
                class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
              >
                <span>{{ selectedTeams.length === teamScores.length ? 'All Teams Selected' : 
                        selectedTeams.length === 0 ? 'Select Teams' : 
                        selectedTeams.length + ' Team' + (selectedTeams.length === 1 ? '' : 's') + ' Selected' }}</span>
                <svg
                  [class.rotate-180]="isDropdownOpen"
                  class="w-4 h-4 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
              <!-- Dropdown Menu -->
              <div
                *ngIf="isDropdownOpen"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
              >
                <div class="p-2 border-b border-gray-200">
                  <label class="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      [checked]="selectedTeams.length === teamScores.length"
                      (change)="toggleAllTeams()"
                      class="form-checkbox h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <span class="ml-2 text-sm text-gray-700">Select All</span>
                  </label>
                </div>
                <div class="max-h-60 overflow-y-auto">
                  <label
                    *ngFor="let team of teamScores"
                    class="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      [checked]="isTeamSelected(team)"
                      (change)="toggleTeam(team)"
                      class="form-checkbox h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <span class="ml-2 text-sm text-gray-700">{{team.teamName}}</span>
                  </label>
                </div>
              </div>
            </div>
            <button
              (click)="toggleSort()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center gap-2"
            >
              <span>Sort by Team Name</span>
              <svg
                [class.rotate-180]="sortDirection === 'desc'"
                class="w-4 h-4 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="container mx-auto flex-grow py-2 overflow-y-auto">
        <div *ngFor="let team of filteredTeams" class="mb-4">
          <!-- Individual Team Score Table -->
          <div class="bg-white rounded-lg shadow mb-3">
            <div class="overflow-x-auto">
              <table class="min-w-full border-collapse border border-gray-300">
                <thead class="bg-orange-500 text-white">
                  <tr>
                    <th class="px-4 py-2 text-center text-xs font-medium border border-orange-400 border-solid">Team</th>
                    <th class="px-4 py-2 text-left text-xs font-medium border border-orange-400 border-solid">Pairing Metrics</th>
                    <th class="px-4 py-2 text-center text-xs font-medium border border-orange-400 border-solid">Frequency Score</th>
                    <th class="px-4 py-2 text-center text-xs font-medium border border-orange-400 border-solid">Rotation Score</th>
                    <th class="px-4 py-2 text-center text-xs font-medium border border-orange-400 border-solid">Assignment Score</th>
                    <th class="px-4 py-2 text-center text-xs font-medium border border-orange-400 border-solid">Efficiency Score</th>
                    <th class="px-4 py-2 text-center text-xs font-medium border border-orange-400 border-solid">Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="bg-white">
                    <td class="px-4 py-2 text-xs font-medium border border-gray-300 border-solid bg-orange-50 text-center" rowspan="3">{{team.teamName}}</td>
                    <td class="px-4 py-2 text-xs border border-gray-300 border-solid">Baseline</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.baseline.frequency}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.baseline.rotation}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.baseline.assignment}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.baseline.efficiency}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.baseline.overall}}%</td>
                  </tr>
                  <tr class="bg-white">
                    <td class="px-4 py-2 text-xs border border-gray-300 border-solid">Current</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.current.frequency}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.current.rotation}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.current.assignment}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.current.efficiency}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.current.overall}}%</td>
                  </tr>
                  <tr class="bg-white">
                    <td class="px-4 py-2 text-xs border border-gray-300 border-solid">Target</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.target.frequency}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.target.rotation}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.target.assignment}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.target.efficiency}}%</td>
                    <td class="px-4 py-2 text-xs text-center border border-gray-300 border-solid">{{team.metrics.target.overall}}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Individual Team Chart -->
          <div class="bg-white rounded-lg shadow p-3">
            <h2 class="text-sm font-semibold mb-2">{{team.teamName}}</h2>
            <div class="h-48">
              <canvas baseChart
                [data]="getChartData(team)"
                [options]="teamChartOptions"
                [type]="'bar'">
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
    
    /* Navigation tab styles */
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

    /* Add styles for the checkbox dropdown */
    .form-checkbox {
      appearance: none;
      padding: 0;
      print-color-adjust: exact;
      display: inline-block;
      vertical-align: middle;
      background-origin: border-box;
      user-select: none;
      flex-shrink: 0;
      height: 1rem;
      width: 1rem;
      color: #f97316;
      background-color: #fff;
      border-color: #d1d5db;
      border-width: 1px;
      border-radius: 0.25rem;
    }

    .form-checkbox:checked {
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
      background-color: currentColor;
      background-size: 100% 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    .form-checkbox:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
    }
  `]
})
export class TeamScorecardsComponent implements OnInit {
  teamScores: TeamScore[] = [];
  filteredTeams: TeamScore[] = [];
  selectedTeams: TeamScore[] = [];
  sortDirection: 'asc' | 'desc' = 'asc';
  isDropdownOpen = false;

  teamChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: {
            size: 11
          },
          boxWidth: 12
        }
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
          stepSize: 20,
          font: {
            size: 10
          },
          callback: function(value) {
            return value + '%';
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    this.teamScores = [
      {
        teamName: 'AI/ML Enablement',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Platform Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Cloud Infrastructure',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Data Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'DevOps',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Security Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Frontend Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Backend Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Mobile Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'QA Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'UX/UI Design',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Product Management',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Business Analysis',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Data Science',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Infrastructure Operations',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Network Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'System Architecture',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Database Administration',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'API Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Integration Services',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Microservices Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Cloud Native Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'DevSecOps',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Site Reliability Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Performance Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Automation Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Release Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Technical Documentation',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Solution Architecture',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Enterprise Architecture',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Identity & Access Management',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Compliance Engineering',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Risk Management',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Blockchain Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'IoT Development',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Edge Computing',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Data Analytics',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Business Intelligence',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Data Visualization',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Machine Learning Ops',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Data Platform',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Data Governance',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'API Gateway',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Service Mesh',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Container Platform',
        metrics: this.getDefaultMetrics()
      },
      {
        teamName: 'Cloud Security',
        metrics: this.getDefaultMetrics()
      }
    ];
    
    // Initialize selected teams and apply filter
    this.selectedTeams = [...this.teamScores];
    this.applyFilter();
  }

  private getDefaultMetrics() {
    return {
      baseline: {
        frequency: 70,
        rotation: 70,
        assignment: 60,
        efficiency: 70,
        overall: 68
      },
      current: {
        frequency: 80,
        rotation: 75,
        assignment: 70,
        efficiency: 75,
        overall: 75
      },
      target: {
        frequency: 90,
        rotation: 90,
        assignment: 90,
        efficiency: 90,
        overall: 90
      }
    };
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleAllTeams() {
    if (this.selectedTeams.length === this.teamScores.length) {
      this.selectedTeams = [];
    } else {
      this.selectedTeams = [...this.teamScores];
    }
    this.applyFilter();
  }

  toggleTeam(team: TeamScore) {
    const index = this.selectedTeams.findIndex(t => t.teamName === team.teamName);
    if (index === -1) {
      this.selectedTeams = [...this.selectedTeams, team];
    } else {
      this.selectedTeams = this.selectedTeams.filter(t => t.teamName !== team.teamName);
    }
    this.applyFilter();
  }

  isTeamSelected(team: TeamScore): boolean {
    return this.selectedTeams.some(t => t.teamName === team.teamName);
  }

  applyFilter() {
    this.filteredTeams = [...this.selectedTeams]
      .sort((a, b) => {
        const comparison = a.teamName.localeCompare(b.teamName);
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
  }

  toggleSort() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilter();
  }

  getChartData(team: TeamScore): ChartData<'bar'> {
    return {
      labels: ['Overall Score', 'Efficiency Score', 'Assignment Score', 'Rotation Score', 'Frequency Score'],
      datasets: [
        {
          label: 'Target',
          data: [
            team.metrics.target.overall,
            team.metrics.target.efficiency,
            team.metrics.target.assignment,
            team.metrics.target.rotation,
            team.metrics.target.frequency
          ],
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgba(147, 51, 234, 1)',
          borderWidth: 1
        },
        {
          label: 'Current',
          data: [
            team.metrics.current.overall,
            team.metrics.current.efficiency,
            team.metrics.current.assignment,
            team.metrics.current.rotation,
            team.metrics.current.frequency
          ],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1
        },
        {
          label: 'Baseline',
          data: [
            team.metrics.baseline.overall,
            team.metrics.baseline.efficiency,
            team.metrics.baseline.assignment,
            team.metrics.baseline.rotation,
            team.metrics.baseline.frequency
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }
      ]
    };
  }
} 