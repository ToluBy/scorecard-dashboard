import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabricksService } from './services/databricks.service';
import { DashboardAssessmentService } from './services/dashboardAssessment.service';
import { DashboardService } from './services/dashboard.service';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DashboardModule
  ],
  providers: [
    DatabricksService,
    DashboardAssessmentService, DashboardService
  ]
})
export class AppModule { }
