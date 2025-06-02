// dashboard-app/src/app/services/dashboard.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DatabricksService } from './databricks.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardAssessmentService {
  private PartnerRolesChartDataSubject = new BehaviorSubject<any>(null);
  private PairingHoursChartDataSubject = new BehaviorSubject<any>(null);
  private PairingActivitiesChartDataSubject = new BehaviorSubject<any>(null);
  private PairingChallengesChartDataSubject = new BehaviorSubject<any>(null);
  private PairingImprovementsChartDataSubject = new BehaviorSubject<any>(null);
  private PairingFeedbackChartDataSubject = new BehaviorSubject<any>(null);
  private PairingEffectivenessChartDataSubject = new BehaviorSubject<any>(null);
  private statsSubject = new BehaviorSubject<any>(null);

  constructor(private databricksService: DatabricksService) {
    this.initializeData();
  }

  private initializeData(): void {

    // Load distribution data
    this.loadDistributionData();
  }

  private loadDistributionData(): void {

    // Load pairing hours distribution
    this.databricksService.getPairingHoursDistribution().subscribe(
      data => {
        this.updatePairingHoursChart(data);
      },
      error => {
        console.error('Error loading pairing hours distribution:', error);
      }
    );

    // Load pairing activities distribution
    this.databricksService.getPairingActivitiesDistribution().subscribe(
      data => {
        console.log('getPairingActivitiesDistribution received:', data);
        console.log('Raw Databricks data (activities):', data);
        console.log('Raw Databricks data (activities) - full:', JSON.stringify(data, null, 2));
        this.updatePairingActivitiesChart(data);
        console.log('updatePairingActivitiesChart called');
      },
      error => {
        console.error('Error loading pairing activities distribution:', error);
      }
    );

      // Load pairing feedback distribution
     this.databricksService.getPairingFeedbackDistribution().subscribe(
        data => {
          this.updatePairingFeedbackChart(data);
        },
        error => {
          console.error('Error loading pairing feedback distribution:', error);
        }
      );

      // Load pairing effectiveness distribution
     this.databricksService.getPairingEffectivenessDistribution().subscribe(
        data => {
          this.updatePairingEffectivenessChart(data);
        },
        error => {
          console.error('Error loading pairing effectiveness distribution:', error);
        }
      );

    // Load partner roles distribution
    this.databricksService.getPairPartnerRolesDistribution().subscribe(
      data => {
        // Convert to objects
        const objects = this.databricksTableToObjects(data);
        console.log('Partner roles objects:', objects);
        // Initialize counts
        let mentors = 0, mentees = 0, pair = 0, total = 0;
        objects.forEach(item => {
          const role = (item.PairPartnerRole || '').toLowerCase();
          const count = Number(item.NumberOfQEs) || 0;
          if (role.includes('mentor')) mentors += count;
          else if (role.includes('mentee')) mentees += count;
          else if (role.includes('pair')) pair += count;
          total += count;
        });
        // Emit stats with percentages
        const mentorsPct = total ? Math.round((mentors / total) * 100) : 0;
        const menteesPct = total ? Math.round((mentees / total) * 100) : 0;
        const pairPct = total ? Math.round((pair / total) * 100) : 0;
        this.statsSubject.next({ mentors, mentorsPct, mentees, menteesPct, pair, pairPct, total });
      },
      error => {
        console.error('Error loading partner roles distribution:', error);
      }
    );

    // Load pairing challenges distribution
    this.databricksService.getPairingChallengesDistribution().subscribe(
      data => {
        const objects = this.databricksTableToObjects(data);
        console.log('Pairing challenges objects:', objects);
        // Map to { text, count }
        const challenges = objects.map(item => ({
          text: item.Challenges,
          count: Number(item.NumberOfResponses) || 0
        })).filter(item => item.text && item.count > 0);
        this.PairingChallengesChartDataSubject.next(challenges);
      },
      error => {
        console.error('Error loading pairing challenges distribution:', error);
      }
    );

    // Load pairing improvements distribution
    this.databricksService.getPairingImprovementsDistribution().subscribe(
      data => {
        const objects = this.databricksTableToObjects(data);
        console.log('Pairing improvements objects:', objects);
        // Map to { text, count }
        const improvements = objects.map(item => ({
          text: item.Improvements,
          count: Number(item.NumberOfResponses) || 0
        })).filter(item => item.text && item.count > 0);
        this.PairingImprovementsChartDataSubject.next(improvements);
      },
      error => {
        console.error('Error loading pairing improvements distribution:', error);
      }
    );
  }

  // Helper method to transform Databricks table to array of objects
  private databricksTableToObjects(data: any): any[] {
    // Get columns from schema
    const columns = data?.manifest?.schema?.columns?.map((col: any) => col.name);
    const rows = data?.result?.data_array;
    if (!Array.isArray(columns) || !Array.isArray(rows)) return [];
    return rows.map((row: any[]) => {
      const obj: any = {};
      row.forEach((val, idx) => {
        obj[columns[idx]] = val;
      });
      return obj;
    });
  }

  // Add methods to update individual charts
  private updatePairingHoursChart(data: any): void {
    console.log('Raw Databricks data (hours):', data);
    const objects = this.databricksTableToObjects(data);

    // Aggregate NumberOfQEs by PairingHours
    const aggregation: Record<string, number> = {};
    let totalQEs = 0;
    objects.forEach(item => {
      const key = item.PairingHours;
      const value = Number(item.NumberOfQEs) || 0;
      aggregation[key] = (aggregation[key] || 0) + value;
      totalQEs += value;
    });

    const labels = Object.keys(aggregation);
    const values = labels.map(label => aggregation[label]);
    const percentages = values.map(val => totalQEs ? Math.round((val / totalQEs) * 100) : 0);

    const chartData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          'rgba(156, 163, 175, 0.9)',
          'rgba(59, 130, 246, 0.9)',
          'rgba(16, 185, 129, 0.9)',
          'rgba(245, 158, 11, 0.9)',
          'rgba(139, 92, 246, 0.9)'
        ]
      }],
      percentages // custom property for percentages
    };
    this.PairingHoursChartDataSubject.next(chartData);
  }

  private updatePairingActivitiesChart(data: any): void {
    console.log('Raw Databricks data (activities):', data);
    const objects = this.databricksTableToObjects(data);
    console.log('databricksTableToObjects result (activities):', objects);

    // Aggregate NumberOfResponses by Activities
    const aggregation: Record<string, number> = {};
    let totalQEs = 0;
    objects.forEach(item => {
      const key = item.Activities;
      const value = Number(item.NumberOfResponses) || 0;
      aggregation[key] = (aggregation[key] || 0) + value;
      totalQEs += value;
    });

    const labels = Object.keys(aggregation);
    const values = labels.map(label => aggregation[label]);
    const percentages = values.map(val => totalQEs ? Math.round((val / totalQEs) * 100) : 0);

    const chartData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          'rgba(156, 163, 175, 0.9)',
          'rgba(59, 130, 246, 0.9)',
          'rgba(16, 185, 129, 0.9)',
          'rgba(245, 158, 11, 0.9)',
          'rgba(139, 92, 246, 0.9)'
        ]
      }],
      percentages // custom property for percentages
    };
    this.PairingActivitiesChartDataSubject.next(chartData);
  }

  private updatePairingEffectivenessChart(data: any): void {
    console.log('Raw Databricks data (effectiveness):', data);
    const objects = this.databricksTableToObjects(data);
    const chartData = {
      labels: objects.map(item => item.PairingEffectiveness),
      datasets: [{
        data: objects.map(item => item.NumberOfResponses),
        backgroundColor: [
          'rgba(156, 163, 175, 0.9)',
          'rgba(59, 130, 246, 0.9)',
          'rgba(16, 185, 129, 0.9)',
          'rgba(245, 158, 11, 0.9)',
          'rgba(139, 92, 246, 0.9)'
        ]
      }]
    };
    this.PairingEffectivenessChartDataSubject.next(chartData);
  }

  private updatePairingFeedbackChart(data: any): void {
    console.log('Raw Databricks data (feedback):', data);
    const objects = this.databricksTableToObjects(data);
    // The expected chart format is:
    // labels: [feedback question 1, feedback question 2, ...]
    // datasets: [ { label: 'Agree', data: [...], ... }, ... ]
    const categories = [
      'Agree',
      'Strongly agree',
      'Neither agree nor disagree',
      'Disagree',
      'Strongly disagree'
    ];
    // Extract all unique feedback questions (labels)
    const labels = objects.map(obj => obj.PairingFeedback);
    // For each category, collect the values in order of labels
    const datasets = categories.map((cat, idx) => ({
      label: cat,
      data: objects.map(obj => obj[cat] ?? 0),
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)', // Blue
        'rgba(16, 185, 129, 0.6)', // Green
        'rgba(245, 158, 11, 0.6)', // Yellow
        'rgba(239, 68, 68, 0.6)', // Red
        'rgba(139, 92, 246, 0.6)' // Purple
      ][idx],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
        'rgb(139, 92, 246)'
      ][idx],
      borderWidth: 1
    }));
    const chartData = {
      labels,
      datasets
    };
    this.PairingFeedbackChartDataSubject.next(chartData);
  }

  // Expose observables for components
  public get PartnerRolesChartData$(): Observable<any> {
    return this.PartnerRolesChartDataSubject.asObservable();
  }

  public get PairingChallengesChartData$(): Observable<any> {
    return this.PairingChallengesChartDataSubject.asObservable();
  }

  public get PairingImprovementsChartData$(): Observable<any> {
    return this.PairingImprovementsChartDataSubject.asObservable();
  }

  public get PairingHoursChartData$(): Observable<any> {
    return this.PairingHoursChartDataSubject.asObservable();
  }

  public get PairingActivitiesChartData$(): Observable<any> {
    return this.PairingActivitiesChartDataSubject.asObservable();
  }

  public get PairingFeedbackChartData$(): Observable<any> {
    return this.PairingFeedbackChartDataSubject.asObservable();
  }

  public get PairingEffectivenessChartData$(): Observable<any> {
    return this.PairingEffectivenessChartDataSubject.asObservable();
  }
}