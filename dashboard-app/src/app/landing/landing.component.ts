import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgChartsModule, CommonModule]
})
export class LandingComponent {
  // Line Chart Configuration
  lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40, 65, 59, 80, 81, 56],
        label: 'Series A',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
        fill: 'origin',
      }
    ],
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  lineChartOptions: ChartConfiguration['options'] = {
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
        grid: {
          display: true
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Bar Chart Configuration
  barChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        label: 'Revenue',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }
    ],
    labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022']
  };

  barChartOptions: ChartConfiguration['options'] = {
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
        grid: {
          display: true
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Doughnut Chart Configuration
  doughnutChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [35, 25, 20, 20],
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 0
      }
    ],
    labels: ['Sales', 'Marketing', 'Development', 'Support']
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };

  // Pairing Efficiency Chart Configuration
  pairingEfficiencyData: ChartConfiguration['data'] = {
    labels: [
      'Gained valuable insights and skills',
      'Helped tackle challenges efficiently',
      'Reinforced standard practices across teams',
      'Contributed to professional development',
      'Fostered knowledge-sharing and collaboration'
    ],
    datasets: [
      {
        label: 'Number of QEs',
        data: [1, 1, 1, 1, 1],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  pairingEfficiencyOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 1,
        grid: {
          display: true
        },
        title: {
          display: true,
          text: 'Number of QEs',
          align: 'center'
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // Pairing Activities Chart
  pairingActivitiesData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [18.9, 15.1, 13.2, 11.3, 9.4, 7.5, 7.5, 5.7, 5.7, 3.8, 1.9],
        backgroundColor: [
          'rgb(96, 165, 250)',   // Automation
          'rgb(52, 211, 153)',   // Test Case
          'rgb(251, 146, 60)',   // Testing Strategies
          'rgb(249, 115, 22)',   // Knowledge Sharing
          'rgb(168, 85, 247)',   // Testing Scenarios
          'rgb(236, 72, 153)',   // Test Validation
          'rgb(75, 85, 99)',     // Test Plan
          'rgb(14, 165, 233)',   // Functional Testing
          'rgb(147, 51, 234)',   // Cypress
          'rgb(234, 179, 8)',    // Selenium
          'rgb(239, 68, 68)'     // Playwright
        ],
        borderWidth: 0
      }
    ],
    labels: [
      'Automation (18.9%)',
      'Test Case (15.1%)',
      'Testing Strategies (13.2%)',
      'Knowledge Sharing (11.3%)',
      'Testing Scenarios (9.4%)',
      'Test Validation (7.5%)',
      'Test Plan (7.5%)',
      'Functional Testing (5.7%)',
      'Cypress (5.7%)',
      'Selenium (3.8%)',
      'Playwright (1.9%)'
    ]
  };

  pairingActivitiesOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };

  // Challenges data
  hasChallengesData: boolean = false;
  challengesMessage: string = 'No challenges reported. Please upload an Excel file with feedback data.';
} 