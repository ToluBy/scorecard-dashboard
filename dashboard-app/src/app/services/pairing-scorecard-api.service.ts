import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the response interface
interface ApiResponse {
  data: any[]; // Adjust the type as needed based on the actual response structure
}

@Injectable({
  providedIn: 'root'
})
export class PairingScorecardApiService {
  private apiUrl = 'http://localhost:3002/api/PairingScorecard';

  constructor(private http: HttpClient) {}

  // Get scores for the Final Scorecard dashboard
  getFinalScorecards(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('/api/PairingScorecard/FinalScores');
  }

  // Get scores for the Team scorecards dashboard
  getTeamScorecards() {
    return this.http.get('/api/PairingScorecard/TeamScores');
  }

  // Get baseline scores
  getBaselineScores() {
    return this.http.get<any>('/api/PairingScorecard/BaselineScores');
  }
}