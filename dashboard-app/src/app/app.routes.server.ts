import { Routes } from '@angular/router';
import { AssessmentComponent } from './dashboard/assessment/landing.component';

export const routes: Routes = [
  { path: '**', component: AssessmentComponent }
];
