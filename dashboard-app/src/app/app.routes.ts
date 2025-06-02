import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AssessmentComponent } from './dashboard/assessment/landing.component';
import { TeamScorecardsComponent } from './dashboard/team-scorecards/team-scorecards.component';
import { FinalScorecardComponent } from './dashboard/final-scorecard/final-scorecard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'landing',
    component: AssessmentComponent
  },
  {
    path: 'team-scorecards',
    component: TeamScorecardsComponent
  },
  {
    path: 'final-scorecard',
    component: FinalScorecardComponent
  }
]; 