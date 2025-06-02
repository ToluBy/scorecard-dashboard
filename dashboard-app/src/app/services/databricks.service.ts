// dashboard-app/src/app/services/databricks.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabricksService {
  private proxyUrl = 'http://localhost:3001/api/databricks/query';

  constructor(private http: HttpClient) {}

  // Execute SQL query via backend proxy
  executeQuery(query: string): Observable<any> {
    return this.http.post(this.proxyUrl, { statement: query });
  }

  // Get count of pair partner distribution data
  getPairPartnerRolesDistribution(): Observable<any> {
    const query = `
    select 
        \`What_is_your_pair_partner_role_for_this_quarter?\` as \`PairPartnerRole\`, 
        count(*) as \`NumberOfQEs\`,
        format_number(count(*) / sum(count(*)) over (), "0.0%") as \`PercentageOfQEs\`
      from \`learning\`.\`dbxinterestgrp\`.\`qepairingfeedbackq1\` 
      group by \`What_is_your_pair_partner_role_for_this_quarter?\`
  `;
    return this.executeQuery(query);
  }

  // Get pairing hours distribution data
  getPairingHoursDistribution(): Observable<any> {
    const query = `
      SELECT 
      \`PairingHours\`, 
      \`Title\`, 
      \`NumberOfQEs\`, 
      format_number((\`NumberOfQEs\` / SUM(\`NumberOfQEs\`) OVER ()), '0.0%') AS \`PercentageOfQEs\`
    FROM (
      SELECT DISTINCT 
        \`How_frequently_did_you_pair_with_your_pair_partner_this_quarter?\` AS \`PairingHours\`, 
        B.\`Title\`,
        COUNT(*) OVER (
          PARTITION BY B.\`Title\`, \`How_frequently_did_you_pair_with_your_pair_partner_this_quarter?\`
          ORDER BY B.\`Title\`
        ) AS \`NumberOfQEs\`
      FROM \`learning\`.\`dbxinterestgrp\`.\`qepairingfeedbackq1\` A
      LEFT JOIN \`learning\`.\`dbxinterestgrp\`.\`QEDetails\` B 
        ON (
          CASE 
            WHEN LOWER(A.\`Full_Name\`) = 'suriya ravisankar' THEN 'suriya ravi sankar'
            WHEN LOWER(A.\`Full_Name\`) = 'sumana sivannagari' THEN 'suma sivannagari'
            WHEN LOWER(A.\`Full_Name\`) = 'david isaac weidenbenner' THEN 'david weidenbenner'
            WHEN LOWER(A.\`Full_Name\`) = 'ravi kumar' THEN 'ravi kumar'
            WHEN LOWER(A.\`Full_Name\`) = 'mukta' THEN 'mukta khati'
            ELSE LOWER(A.\`Full_Name\`) 
          END
        ) = LOWER(B.\`Worker\`)
    ) aa
    ORDER BY 1
    `;
    return this.executeQuery(query);
  }

  // Get pairing activities distribution data
  getPairingActivitiesDistribution(): Observable<any> {
    const query = `
      select \`Activities\`,
       count(*) AS \`NumberOfResponses\`,
       format_number(count(*) / sum(count(*)) over (), "0.0%") as \`PercentageOfQEs\`
    from (
            select  
                case when (lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%automation%' 
                            or lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%automated%') THEN 'Automation'

                    when (lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%kt%' 
                            or lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%knowledge sharing%' 
                            or lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%knowledge transfer%') THEN 'KT'
                
                    when (lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%cypress%' 
                            or lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%playwright%' 
                            or lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%selenium%' 
                            or lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%jmeter%') THEN 'Tools'
                    
                    when (lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%debugging%' 
                            or lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%validation%') THEN 'Debugging & Validation' 

                    when lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%skill%' THEN 'Skills'
                    when lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%training%' THEN 'Training'
                    when lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%development%' THEN 'Development'
                    when lower(cast(\`What_types_of_tasks/activities_did_you_typically_handle_while_pair_programming_this_quarter?\` as string)) LIKE '%test case%' THEN 'Test Cases'               
                    else 'Other'
            end as \`Activities\`
            ,count(*) over () as \`Totals\`
            from \`learning\`.\`dbxinterestgrp\`.\`qepairingfeedbackq1\`
        )aa
    group by \`Activities\`
    `;
    return this.executeQuery(query);
  }

  // Get pairing challenges distribution data
  getPairingChallengesDistribution(): Observable<any> {
        const query = `
          SELECT 
            \`Challenges\`,
            COUNT(*) AS \`NumberOfResponses\`,
            format_number(COUNT(*) / SUM(COUNT(*)) OVER (), '0.0%') AS \`PercentageOfQEs\`
          FROM (
            SELECT 
              \`What_challenges_have_you_faced_during_pair_programming_sessions?\`,
              CASE 
                WHEN LOWER(\`What_challenges_have_you_faced_during_pair_programming_sessions?\`) LIKE '%n/a%' 
                  OR LOWER(\`What_challenges_have_you_faced_during_pair_programming_sessions?\`) LIKE 'na%' 
                  THEN 'N/A'
                WHEN LOWER(\`What_challenges_have_you_faced_during_pair_programming_sessions?\`) LIKE '%none%' 
                  OR LOWER(\`What_challenges_have_you_faced_during_pair_programming_sessions?\`) LIKE 'no challenge%' 
                  THEN 'None'
                WHEN LOWER(\`What_challenges_have_you_faced_during_pair_programming_sessions?\`) LIKE '%time%' 
                  THEN 'Time Management'
                ELSE \`What_challenges_have_you_faced_during_pair_programming_sessions?\`
              END AS \`Challenges\`,
              COUNT(*) AS \`NumberOfResponses\`
            FROM \`learning\`.\`dbxinterestgrp\`.\`qepairingfeedbackq1\`
            WHERE \`What_challenges_have_you_faced_during_pair_programming_sessions?\` != '-'
            GROUP BY \`What_challenges_have_you_faced_during_pair_programming_sessions?\`
            ORDER BY 1
          ) aa
          GROUP BY \`Challenges\`
        `;
        return this.executeQuery(query);
      }    

  // Get pairing improvements distribution data
  getPairingImprovementsDistribution(): Observable<any> {
  const query = `
    SELECT 
      \`Improvements\`,
      COUNT(*) AS \`NumberOfResponses\`,
      format_number(COUNT(*) / SUM(COUNT(*)) OVER (), '0.0%') AS \`PercentageOfQEs\`
    FROM (
      SELECT 
        \`What_improvements_or_suggestions_do_you_have_for_making_the_QE_pair_program_more_effective?\` AS \`Improvements\`,
        COUNT(*) AS \`NumberOfResponses\`
      FROM \`learning\`.\`dbxinterestgrp\`.\`qepairingfeedbackq1\`
      WHERE \`What_improvements_or_suggestions_do_you_have_for_making_the_QE_pair_program_more_effective?\` IS NOT NULL
        AND \`What_improvements_or_suggestions_do_you_have_for_making_the_QE_pair_program_more_effective?\` != 'N/A'
      GROUP BY \`What_improvements_or_suggestions_do_you_have_for_making_the_QE_pair_program_more_effective?\`
      ORDER BY 1
    ) aa
    GROUP BY \`Improvements\`
  `;
  return this.executeQuery(query);
}
  
  // Get pairing feedback distribution data
  getPairingFeedbackDistribution(): Observable<any> {
        const query = `
          SELECT * 
          FROM (
            SELECT 
              COUNT(*) AS \`NumberOfResponses\`,
              STACK(5, 
                'Improved overall testing skills', \`Pair_programming_has_improved_my_overall_testing_skills\`,
                'Efficient use of time', \`Pair_programming_sessions_are_an_efficient_use_of_time\`,
                'Learned new testing techniques', \`Pair_programming_has_helped_me_learn_new_testing_techniques_and_hacks\`,
                'Appropriate balance between solo work and pairing', \`The_balance_between_solo_work_and_pair_programming_is_appropriate\`,
                'More engaged and motivated when pairing', \`I_feel_more_engaged_and_motivated_when_working_in_a_pair\`
              ) AS (\`PairingFeedback\`, \`Ranking\`)
            FROM \`learning\`.\`dbxinterestgrp\`.\`qepairingfeedbackq1\`
            GROUP BY 
              \`Pair_programming_has_improved_my_overall_testing_skills\`, 
              \`Pair_programming_has_helped_me_learn_new_testing_techniques_and_hacks\`, 
              \`Pair_programming_sessions_are_an_efficient_use_of_time\`, 
              \`The_balance_between_solo_work_and_pair_programming_is_appropriate\`, 
              \`I_feel_more_engaged_and_motivated_when_working_in_a_pair\`
          ) AS toPivot
          PIVOT (
            SUM(\`NumberOfResponses\`) 
            FOR \`Ranking\` IN ('Agree', 'Strongly agree', 'Neither agree nor disagree', 'Disagree', 'Strongly disagree')
          ) 
          ORDER BY 1
        `;
        return this.executeQuery(query);
      }

    // Get pairing effectiveness distribution data
    getPairingEffectivenessDistribution(): Observable<any> {
        const query = `
          SELECT * 
          FROM (
            SELECT 
              COUNT(*) AS \`NumberOfResponses\`,
              STACK(5, 
                'Gained valuable insights and skills', \`I_gained_valuable_insights_and_skills_from_my_pairing_partner\`,
                'Efficiently helped tackle challenges', \`It_helped_me_tackle_challenges_more_efficiently\`,
                'Reinforced standardized practices across teams', \`It_reinforced_standard_practices_across_teams\`,
                'Aided professional development', \`It_contributed_to_my_professional_development\`,
                'Fostered collaborationa and knowledge sharing', \`Fostered_a_continuous_environment_of_knowledge-sharing_and_collaboration\`
              ) AS (\`PairingEffectiveness\`, \`Ranking\`)
            FROM \`learning\`.\`dbxinterestgrp\`.\`qepairingfeedbackq1\`
            GROUP BY 
              \`I_gained_valuable_insights_and_skills_from_my_pairing_partner\`, 
              \`It_helped_me_tackle_challenges_more_efficiently\`, 
              \`It_reinforced_standard_practices_across_teams\`, 
              \`It_contributed_to_my_professional_development\`, 
              \`Fostered_a_continuous_environment_of_knowledge-sharing_and_collaboration\`
          ) AS toPivot2
          PIVOT (
            SUM(\`NumberOfResponses\`) 
            FOR \`Ranking\` IN ('Agree', 'Strongly agree', 'Neither agree nor disagree', 'Disagree', 'Strongly disagree')
          ) 
          ORDER BY 1
        `;
        return this.executeQuery(query);
      }
}