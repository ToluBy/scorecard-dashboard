import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChartConfiguration, ChartData } from 'chart.js';

export interface DashboardStats {
  vizTechScore?: number;
  vizTechScorePercentage?: number;
  pairingRotationVizTechScore?: number;
  pairingRotationVizTechScorePercentage?: number;
  pairingAssignmentVizTechScore?: number;
  pairingAssignmentVizTechScorePercentage?: number;
  pairingFrequencyVizTechScore?: number;
  pairingFrequencyVizTechScorePercentage?: number;
  overallVizTechScorePercentage?: number;
  overallBaselineScore?: number;
  pairingEfficiencyBaselineScore?: number;
  pairingRotationBaselineScore?: number;
  pairingAssignmentBaselineScore?: number;
  pairingFrequencyBaselineScore?: number;
  totalTeams?: number;
}

export interface BaselineData {
  overallScore: number;
  targetScore: number;
  frequencyDistribution: number[];
  rotationDistribution: number[];
  assignmentDistribution: number[];
  efficiencyDistribution: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly STORAGE_KEY = 'dashboard_data';

  // BehaviorSubjects
  private baselineDataSubject = new BehaviorSubject<BaselineData[]>([]);
  private isBaselineLoadedSubject = new BehaviorSubject<boolean>(false);
  private scoreChartDataSubject = new BehaviorSubject<ChartData<'pie'> | null>(null);
  private activityChartDataSubject = new BehaviorSubject<ChartData<'bar'> | null>(null);
  private frequencyChartDataSubject = new BehaviorSubject<ChartData<'pie'> | null>(null);
  private rotationChartDataSubject = new BehaviorSubject<ChartData<'pie'> | null>(null);
  private assignmentChartDataSubject = new BehaviorSubject<ChartData<'pie'> | null>(null);
  private efficiencyChartDataSubject = new BehaviorSubject<ChartData<'pie'> | null>(null);
  private statsSubject = new BehaviorSubject<DashboardStats | null>(null);
  private isCurrentScoresLoadedSubject = new BehaviorSubject<boolean>(false);

  // Observables
  baselineData$ = this.baselineDataSubject.asObservable();
  isBaselineLoaded$ = this.isBaselineLoadedSubject.asObservable();
  scoreChartData$ = this.scoreChartDataSubject.asObservable();
  activityChartData$ = this.activityChartDataSubject.asObservable();
  frequencyChartData$ = this.frequencyChartDataSubject.asObservable();
  rotationChartData$ = this.rotationChartDataSubject.asObservable();
  assignmentChartData$ = this.assignmentChartDataSubject.asObservable();
  efficiencyChartData$ = this.efficiencyChartDataSubject.asObservable();
  stats$ = this.statsSubject.asObservable();
  isCurrentScoresLoaded$ = this.isCurrentScoresLoadedSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  updateChartData(
    scoreChartData: ChartData<'pie'>,
    activityChartData: ChartData<'bar'>,
    frequencyChartData: ChartData<'pie'>,
    rotationChartData: ChartData<'pie'>,
    assignmentChartData: ChartData<'pie'>,
    efficiencyChartData: ChartData<'pie'>
  ): void {
    this.scoreChartDataSubject.next(scoreChartData);
    this.activityChartDataSubject.next(activityChartData);
    this.frequencyChartDataSubject.next(frequencyChartData);
    this.rotationChartDataSubject.next(rotationChartData);
    this.assignmentChartDataSubject.next(assignmentChartData);
    this.efficiencyChartDataSubject.next(efficiencyChartData);

    this.saveToStorage();
  }

  updateStats(stats: DashboardStats): void {
    const currentStats = this.statsSubject.value || {};
    this.statsSubject.next({ ...currentStats, ...stats });
    this.saveToStorage();
  }

  setCurrentScoresLoaded(isLoaded: boolean): void {
    this.isCurrentScoresLoadedSubject.next(isLoaded);
    this.saveToStorage();
  }

  clearData(): void {
    this.scoreChartDataSubject.next(null);
    this.activityChartDataSubject.next(null);
    this.frequencyChartDataSubject.next(null);
    this.rotationChartDataSubject.next(null);
    this.assignmentChartDataSubject.next(null);
    this.efficiencyChartDataSubject.next(null);
    this.statsSubject.next(null);
    this.isCurrentScoresLoadedSubject.next(false);

    localStorage.removeItem(this.STORAGE_KEY);
  }

  setBaselineData(data: BaselineData[]) {
    this.baselineDataSubject.next(data);
    this.isBaselineLoadedSubject.next(true);
    this.saveToStorage();
  }

  setBaselineLoaded(isLoaded: boolean): void {
    this.isBaselineLoadedSubject.next(isLoaded);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    const dataToStore = {
      scoreChartData: this.scoreChartDataSubject.value,
      activityChartData: this.activityChartDataSubject.value,
      frequencyChartData: this.frequencyChartDataSubject.value,
      rotationChartData: this.rotationChartDataSubject.value,
      assignmentChartData: this.assignmentChartDataSubject.value,
      efficiencyChartData: this.efficiencyChartDataSubject.value,
      stats: this.statsSubject.value,
      isCurrentScoresLoaded: this.isCurrentScoresLoadedSubject.value,
      baselineData: this.baselineDataSubject.value
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
  }

  private loadFromStorage(): void {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      this.scoreChartDataSubject.next(parsedData.scoreChartData);
      this.activityChartDataSubject.next(parsedData.activityChartData);
      this.frequencyChartDataSubject.next(parsedData.frequencyChartData);
      this.rotationChartDataSubject.next(parsedData.rotationChartData);
      this.assignmentChartDataSubject.next(parsedData.assignmentChartData);
      this.efficiencyChartDataSubject.next(parsedData.efficiencyChartData);
      this.statsSubject.next(parsedData.stats);
      this.isCurrentScoresLoadedSubject.next(parsedData.isCurrentScoresLoaded);

      if (parsedData.baselineData) {
        this.baselineDataSubject.next(parsedData.baselineData);
        this.isBaselineLoadedSubject.next(true);
      }
    }
  }
} 